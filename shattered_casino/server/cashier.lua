local Cfg = Config.Cashier
local Rate = Config.Chips.Rate
local RANGE = 5.0
local Busy = {}

local near = function(src)
	local pos = GetEntityCoords(GetPlayerPed(src))
	for _, c in ipairs(Config.Locations.Cashiers) do
		if #(pos - c.xyz) <= RANGE then
			return true
		end
	end
	return false
end

local info = function(src, ok, message)
	return {
		ok = ok,
		message = message,
		chips = WalletGet(src),
		money = BridgeFrameworkGetMoney(src, Cfg.Account) or 0,
		account = Cfg.Account,
		rate = Rate,
		max = Cfg.MaxExchange,
	}
end

local buy = function(src, n)
	local price = n * Rate
	if (BridgeFrameworkGetMoney(src, Cfg.Account) or 0) < price then
		return false, L('cashier.cost', { price = FormatMoney(price) })
	end
	if not WalletCanAdd(src, n) then
		return false, L('error.cannot_carry')
	end
	if not BridgeFrameworkRemoveMoney(src, Cfg.Account, price, 'casino-chips') then
		return false, L('error.not_enough_money')
	end
	if not WalletAdd(src, n) then
		BridgeFrameworkAddMoney(src, Cfg.Account, price, 'casino-refund')
		return false, L('error.cannot_carry')
	end
	return true, L('cashier.bought', { chips = FormatChips(n), price = FormatMoney(price) })
end

local sell = function(src, n)
	local price = n * Rate
	if not WalletRemove(src, n) then
		return false, L('error.not_enough_chips')
	end
	if not BridgeFrameworkAddMoney(src, Cfg.Account, price, 'casino-chips') then
		WalletAdd(src, n)
		return false, L('cashier.payout_failed')
	end
	return true, L('cashier.sold', { chips = FormatChips(n), price = FormatMoney(price) })
end

local exchange = function(src, amount, fn)
	if not Wallet.HasCashier or not PlayersId(src) then
		return info(src, false, L('error.not_loaded'))
	end
	if not near(src) then
		return info(src, false, L('cashier.too_far'))
	end
	if PlayersBanned(src) then
		return info(src, false, L('admin.banned_notice'))
	end
	if amount == 'all' then
		amount = math.min(WalletGet(src), Cfg.MaxExchange)
		if amount < 1 then
			return info(src, false, L('cashier.no_chips'))
		end
	end
	local n = UtilInteger(amount, 1, Cfg.MaxExchange)
	if not n then
		return info(src, false, L('cashier.limit', { max = FormatNumber(Cfg.MaxExchange) }))
	end
	if Busy[src] then
		return info(src, false, L('error.busy'))
	end

	Busy[src] = true
	local ok, done, message = pcall(fn, src, n)
	Busy[src] = nil
	if not ok then
		UtilPrint('error', 'cashier exchange failed: %s', tostring(done))
		return info(src, false, L('error.generic'))
	end
	return info(src, done, message)
end

RpcRegister('cashier:info', function(src)
	if not Wallet.HasCashier or not near(src) then
		return nil
	end
	WalletCollect(src)
	return info(src)
end)

RpcRegister('cashier:buy', function(src, amount)
	return exchange(src, amount, buy)
end, 4)

RpcRegister('cashier:sell', function(src, amount)
	return exchange(src, amount, sell)
end, 4)

AddEventHandler('playerDropped', function()
	Busy[source] = nil
end)
