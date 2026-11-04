Wallet = {}

local Cfg = Config.Chips
local EVENT = Util.Event('wallet')
local Balances = {}

local stored = function(id)
    local balance = Balances[id]
    if balance then return balance end
    Db.Await()
    balance = MySQL.scalar.await('SELECT `wallet` FROM `casino_players` WHERE `identifier` = ?', { id }) or 0
    Balances[id] = Balances[id] or balance
    return Balances[id]
end

local Modes = {
    item = {
        cashier = true,
        Get = function(src)
            return Bridge.Inventory.Count(src, Cfg.Item) or 0
        end,
        Add = function(src, amount)
            return Bridge.Inventory.Add(src, Cfg.Item, amount) == true
        end,
        Remove = function(src, amount)
            return Bridge.Inventory.Remove(src, Cfg.Item, amount) == true
        end,
        CanAdd = function(src, amount)
            return Bridge.Inventory.CanCarry(src, Cfg.Item, amount) ~= false
        end,
    },

    wallet = {
        cashier = true,
        Get = function(_, id)
            return stored(id)
        end,
        Add = function(_, amount, id)
            stored(id)
            Balances[id] = Balances[id] + amount
            MySQL.prepare('INSERT INTO `casino_players` (`identifier`, `wallet`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `wallet` = `wallet` + ?', { id, amount, amount })
            return true
        end,
        Remove = function(_, amount, id)
            if stored(id) < amount then return false end
            Balances[id] = Balances[id] - amount
            local changed = MySQL.update.await('UPDATE `casino_players` SET `wallet` = `wallet` - ? WHERE `identifier` = ? AND `wallet` >= ?', { amount, id, amount })
            if changed == 0 then
                Balances[id] = nil
                return false
            end
            return true
        end,
        CanAdd = function()
            return true
        end,
    },

    cash = {
        cashier = false,
        Get = function(src)
            return math.floor((Bridge.Framework.GetMoney(src, 'cash') or 0) / Cfg.Rate)
        end,
        Add = function(src, amount)
            return Bridge.Framework.AddMoney(src, 'cash', amount * Cfg.Rate, 'casino') == true
        end,
        Remove = function(src, amount)
            return Bridge.Framework.RemoveMoney(src, 'cash', amount * Cfg.Rate, 'casino') == true
        end,
        CanAdd = function()
            return true
        end,
    },
}

local mode = Modes[Cfg.Mode]
if not mode then
    Util.Print('error', 'Config.Chips.Mode "%s" does not exist, using "item"', tostring(Cfg.Mode))
    mode = Modes.item
end

Wallet.Mode = Modes[Cfg.Mode] and Cfg.Mode or 'item'
Wallet.HasCashier = mode.cashier

local push = function(src, id)
    TriggerClientEvent(EVENT, src, mode.Get(src, id))
end

Wallet.Get = function(src)
    local id = Players.Id(src)
    if not id then return 0 end
    return mode.Get(src, id)
end

Wallet.Add = function(src, amount)
    local id, n = Players.Id(src), Util.Integer(amount, 1)
    if not id or not n then return false end
    if not mode.Add(src, n, id) then return false end
    push(src, id)
    return true
end

Wallet.Remove = function(src, amount)
    local id, n = Players.Id(src), Util.Integer(amount, 1)
    if not id or not n then return false end
    if mode.Get(src, id) < n or not mode.Remove(src, n, id) then return false end
    push(src, id)
    return true
end

Wallet.CanAdd = function(src, amount)
    local id, n = Players.Id(src), Util.Integer(amount, 1)
    return id ~= nil and n ~= nil and mode.CanAdd(src, n, id)
end

Wallet.Push = function(src)
    local id = Players.Id(src)
    if id then push(src, id) end
end

local owe = function(id, amount)
    Util.Print('warn', '%s chips owed to %s, paid when they are back', amount, id)
    MySQL.prepare('INSERT INTO `casino_players` (`identifier`, `owed`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `owed` = `owed` + ?', { id, amount, amount })
end

Wallet.Give = function(id, amount, src)
    local n = Util.Integer(amount, 1)
    if not n or not id then return false end
    id = tostring(id)
    src = src or Players.Source(id)
    if src and Players.Id(src) == id and Wallet.Add(src, n) then return true end
    owe(id, n)
    return false
end

Wallet.Collect = function(src)
    local id = Players.Id(src)
    if not id then return 0 end
    Db.Await()
    local owed = tonumber(MySQL.scalar.await('SELECT `owed` FROM `casino_players` WHERE `identifier` = ?', { id })) or 0
    if owed < 1 or not Wallet.CanAdd(src, owed) then return 0 end
    if MySQL.update.await('UPDATE `casino_players` SET `owed` = `owed` - ? WHERE `identifier` = ? AND `owed` >= ?', { owed, id, owed }) == 0 then return 0 end
    if not Wallet.Add(src, owed) then
        owe(id, owed)
        return 0
    end
    Notify(src, L('wallet.owed_paid', { chips = Format.Chips(owed) }), 'success')
    return owed
end

AddEventHandler(Util.Event('player:loaded'), function(src)
    Wallet.Push(src)
    Wallet.Collect(src)
end)

AddEventHandler(Util.Event('player:unloaded'), function(_, id)
    Balances[id] = nil
end)

Rpc.Register('wallet:get', function(src)
    return Wallet.Get(src)
end)
