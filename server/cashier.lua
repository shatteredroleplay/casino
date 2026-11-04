local Cfg = Config.Cashier
local Rate = Config.Chips.Rate
local RANGE = 5.0
local Busy = {}

local near = function(src)
    local pos = GetEntityCoords(GetPlayerPed(src))
    for _, c in ipairs(Config.Locations.Cashiers) do
        if #(pos - c.xyz) <= RANGE then return true end
    end
    return false
end

local info = function(src, ok, message)
    return {
        ok = ok,
        message = message,
        chips = Wallet.Get(src),
        money = Bridge.Framework.GetMoney(src, Cfg.Account) or 0,
        account = Cfg.Account,
        rate = Rate,
        max = Cfg.MaxExchange,
    }
end

local buy = function(src, n)
    local price = n * Rate
    if (Bridge.Framework.GetMoney(src, Cfg.Account) or 0) < price then return false, L('cashier.cost', { price = Format.Money(price) }) end
    if not Wallet.CanAdd(src, n) then return false, L('error.cannot_carry') end
    if not Bridge.Framework.RemoveMoney(src, Cfg.Account, price, 'casino-chips') then return false, L('error.not_enough_money') end
    if not Wallet.Add(src, n) then
        Bridge.Framework.AddMoney(src, Cfg.Account, price, 'casino-refund')
        return false, L('error.cannot_carry')
    end
    return true, L('cashier.bought', { chips = Format.Chips(n), price = Format.Money(price) })
end

local sell = function(src, n)
    local price = n * Rate
    if not Wallet.Remove(src, n) then return false, L('error.not_enough_chips') end
    if not Bridge.Framework.AddMoney(src, Cfg.Account, price, 'casino-chips') then
        Wallet.Add(src, n)
        return false, L('cashier.payout_failed')
    end
    return true, L('cashier.sold', { chips = Format.Chips(n), price = Format.Money(price) })
end

local exchange = function(src, amount, fn)
    if not Wallet.HasCashier or not Players.Id(src) then return info(src, false, L('error.not_loaded')) end
    if not near(src) then return info(src, false, L('cashier.too_far')) end
    if Players.Banned(src) then return info(src, false, L('admin.banned_notice')) end
    if amount == 'all' then
        amount = math.min(Wallet.Get(src), Cfg.MaxExchange)
        if amount < 1 then return info(src, false, L('cashier.no_chips')) end
    end
    local n = Util.Integer(amount, 1, Cfg.MaxExchange)
    if not n then return info(src, false, L('cashier.limit', { max = Format.Number(Cfg.MaxExchange) })) end
    if Busy[src] then return info(src, false, L('error.busy')) end

    Busy[src] = true
    local ok, done, message = pcall(fn, src, n)
    Busy[src] = nil
    if not ok then
        Util.Print('error', 'cashier exchange failed: %s', tostring(done))
        return info(src, false, L('error.generic'))
    end
    return info(src, done, message)
end

Rpc.Register('cashier:info', function(src)
    if not Wallet.HasCashier or not near(src) then return nil end
    Wallet.Collect(src)
    return info(src)
end)

Rpc.Register('cashier:buy', function(src, amount)
    return exchange(src, amount, buy)
end, 4)

Rpc.Register('cashier:sell', function(src, amount)
    return exchange(src, amount, sell)
end, 4)

AddEventHandler('playerDropped', function()
    Busy[source] = nil
end)
