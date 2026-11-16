Wallet = {}

local Cfg = Config.Chips
local EVENT = UtilEvent('wallet')
local Balances = {}

local stored = function(id)
	local balance = Balances[id]
	if balance then
		return balance
	end
	DbAwait()
	balance = MySQL.scalar.await('SELECT `wallet` FROM `casino_players` WHERE `identifier` = ?', { id }) or 0
	Balances[id] = Balances[id] or balance
	return Balances[id]
end

local ItemGet = function(src)
	return BridgeInventoryCount(src, Cfg.Item) or 0
end

local ItemAdd = function(src, amount)
	return BridgeInventoryAdd(src, Cfg.Item, amount) == true
end

local ItemRemove = function(src, amount)
	return BridgeInventoryRemove(src, Cfg.Item, amount) == true
end

local ItemCanAdd = function(src, amount)
	return BridgeInventoryCanCarry(src, Cfg.Item, amount) ~= false
end

local GetStoredChips = function(_, id)
	return stored(id)
end

local AddStoredChips = function(_, amount, id)
	stored(id)
	Balances[id] = Balances[id] + amount
	MySQL.prepare(
		'INSERT INTO `casino_players` (`identifier`, `wallet`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `wallet` = `wallet` + ?',
		{ id, amount, amount }
	)
	return true
end

local RemoveStoredChips = function(_, amount, id)
	if stored(id) < amount then
		return false
	end
	Balances[id] = Balances[id] - amount
	local changed = MySQL.update.await(
		'UPDATE `casino_players` SET `wallet` = `wallet` - ? WHERE `identifier` = ? AND `wallet` >= ?',
		{ amount, id, amount }
	)
	if changed == 0 then
		Balances[id] = nil
		return false
	end
	return true
end

local CanAddStoredChips = function()
	return true
end

local CashGet = function(src)
	return math.floor((BridgeFrameworkGetMoney(src, 'cash') or 0) / Cfg.Rate)
end

local CashAdd = function(src, amount)
	return BridgeFrameworkAddMoney(src, 'cash', amount * Cfg.Rate, 'casino') == true
end

local CashRemove = function(src, amount)
	return BridgeFrameworkRemoveMoney(src, 'cash', amount * Cfg.Rate, 'casino') == true
end

local CashCanAdd = function()
	return true
end

local GetChips, AddChips, RemoveChips, CanAddChips = ItemGet, ItemAdd, ItemRemove, ItemCanAdd
Wallet.Mode = Cfg.Mode

if Cfg.Mode == 'wallet' then
	GetChips, AddChips, RemoveChips, CanAddChips = GetStoredChips, AddStoredChips, RemoveStoredChips, CanAddStoredChips
elseif Cfg.Mode == 'cash' then
	GetChips, AddChips, RemoveChips, CanAddChips = CashGet, CashAdd, CashRemove, CashCanAdd
elseif Cfg.Mode ~= 'item' then
	UtilPrint('error', 'Config.Chips.Mode "%s" does not exist, using "item"', tostring(Cfg.Mode))
	Wallet.Mode = 'item'
end

Wallet.HasCashier = Wallet.Mode ~= 'cash'

local push = function(src, id)
	TriggerClientEvent(EVENT, src, GetChips(src, id))
end

WalletGet = function(src)
	local id = PlayersId(src)
	if not id then
		return 0
	end
	return GetChips(src, id)
end

WalletAdd = function(src, amount)
	local id, n = PlayersId(src), UtilInteger(amount, 1)
	if not id or not n then
		return false
	end
	if not AddChips(src, n, id) then
		return false
	end
	push(src, id)
	return true
end

WalletRemove = function(src, amount)
	local id, n = PlayersId(src), UtilInteger(amount, 1)
	if not id or not n then
		return false
	end
	if GetChips(src, id) < n or not RemoveChips(src, n, id) then
		return false
	end
	push(src, id)
	return true
end

WalletCanAdd = function(src, amount)
	local id, n = PlayersId(src), UtilInteger(amount, 1)
	return id ~= nil and n ~= nil and CanAddChips(src, n, id)
end

WalletPush = function(src)
	local id = PlayersId(src)
	if id then
		push(src, id)
	end
end

local owe = function(id, amount)
	UtilPrint('warn', '%s chips owed to %s, paid when they are back', amount, id)
	MySQL.prepare(
		'INSERT INTO `casino_players` (`identifier`, `owed`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `owed` = `owed` + ?',
		{ id, amount, amount }
	)
end

WalletGive = function(id, amount, src)
	local n = UtilInteger(amount, 1)
	if not n or not id then
		return false
	end
	id = tostring(id)
	src = src or PlayersSource(id)
	if src and PlayersId(src) == id and WalletAdd(src, n) then
		return true
	end
	owe(id, n)
	return false
end

WalletCollect = function(src)
	local id = PlayersId(src)
	if not id then
		return 0
	end
	DbAwait()
	local owed = tonumber(MySQL.scalar.await('SELECT `owed` FROM `casino_players` WHERE `identifier` = ?', { id })) or 0
	if owed < 1 or not WalletCanAdd(src, owed) then
		return 0
	end
	if
		MySQL.update.await(
			'UPDATE `casino_players` SET `owed` = `owed` - ? WHERE `identifier` = ? AND `owed` >= ?',
			{ owed, id, owed }
		) == 0
	then
		return 0
	end
	if not WalletAdd(src, owed) then
		owe(id, owed)
		return 0
	end
	Notify(src, L('wallet.owed_paid', { chips = FormatChips(owed) }), 'success')
	return owed
end

AddEventHandler(UtilEvent('player:loaded'), function(src)
	WalletPush(src)
	WalletCollect(src)
end)

AddEventHandler(UtilEvent('player:unloaded'), function(_, id)
	Balances[id] = nil
end)

RpcRegister('wallet:get', function(src)
	return WalletGet(src)
end)
