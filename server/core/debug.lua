RegisterCommand('casinobridge', function(src)
    if src ~= 0 then return end
    Util.Print('info', Bridge.Summary)
    Util.Print('info', 'chips: %s · locale: %s · database: %s', Wallet.Mode, Locale.Code, Db.Ready and 'ready' or 'not ready')
end, true)

local check = function(results, ok, label, detail)
    results[#results + 1] = { ok = ok, text = detail and ('%s (%s)'):format(label, tostring(detail)) or label }
    return ok
end

local selftest = function(target)
    local r = {}
    check(r, Db.Ready, 'database ready')
    check(r, Db.Version == Db.Latest, 'database schema up to date', ('%s of %s'):format(tostring(Db.Version), Db.Latest))
    for kind, def in pairs(Bridge.Kinds) do
        local adapter = Bridge[def.field]
        if def.server then check(r, adapter ~= nil and not adapter.broken, kind .. ' adapter usable', adapter and adapter.name) end
    end
    check(r, Bridge.Framework.name ~= 'standalone' or Wallet.Mode == 'wallet', 'chip mode fits the framework', Wallet.Mode)
    check(r, Wallet.Mode ~= 'item' or Bridge.Inventory.name ~= 'none', 'item mode has an inventory', Bridge.Inventory.name)

    if target then
        local id = Players.Id(target)
        if check(r, id ~= nil, 'player identifier', id) then
            check(r, Players.Source(id) == target, 'identifier maps back to the player')
            check(r, type(Players.Name(target)) == 'string', 'player name', Players.Name(target))
            check(r, type(Bridge.Framework.GetMoney(target, 'cash')) == 'number', 'cash balance', Bridge.Framework.GetMoney(target, 'cash'))
            check(r, type(Bridge.Framework.GetMoney(target, 'bank')) == 'number', 'bank balance', Bridge.Framework.GetMoney(target, 'bank'))
            local before = Wallet.Get(target)
            check(r, type(before) == 'number', 'chip balance', before)
            if check(r, Wallet.CanAdd(target, 1), 'can receive a chip') then
                local added = Wallet.Add(target, 1)
                check(r, added and Wallet.Get(target) == before + 1, 'add 1 chip', Config.Chips.Item)
                if added then check(r, Wallet.Remove(target, 1) and Wallet.Get(target) == before, 'remove 1 chip') end
            end
            check(r, not Players.Banned(target), 'not banned from the casino')
            local perms = Perms.List(target)
            check(r, true, 'admin permissions', #perms > 0 and table.concat(perms, ', ') or 'none')
        end
    end

    local closed = {}
    for game, off in pairs(Settings.Get().disabled or {}) do if off then closed[#closed + 1] = game end end
    check(r, true, 'closed games', #closed > 0 and table.concat(closed, ', ') or 'none')
    return r
end

RegisterCommand('casinoqa', function(src, args)
    if src ~= 0 then return end
    local target = tonumber(args[1])
    if args[1] and (not target or not GetPlayerName(target)) then return Util.Print('warn', 'usage: casinoqa [server id of an online player]') end
    CreateThread(function()
        local failed = 0
        for _, line in ipairs(selftest(target)) do
            if not line.ok then failed = failed + 1 end
            Util.Print(line.ok and 'ok' or 'error', '%s %s', line.ok and 'PASS' or 'FAIL', line.text)
        end
        Util.Print(failed == 0 and 'ok' or 'error', failed == 0 and 'self test passed' or '%d check(s) failed, see docs/testing.md', failed)
    end)
end, true)

if not Config.Debug then return end

Rpc.Register('debug:self', function(src)
    return {
        id = Players.Id(src),
        name = Players.Name(src),
        chips = Wallet.Get(src),
        cash = Bridge.Framework.GetMoney(src, 'cash'),
        perms = Perms.List(src),
        bridge = Bridge.Summary,
        mode = Wallet.Mode,
    }
end)

RegisterCommand('casinochips', function(src, args)
    if src ~= 0 and not Perms.Has(src, 'economy') then return end
    local target, amount = tonumber(args[1]), Util.Integer(args[2])
    if not target or not amount or amount == 0 then
        return Util.Print('warn', 'usage: casinochips <server id> <amount, negative to take>')
    end
    local ok = amount > 0 and Wallet.Add(target, amount) or Wallet.Remove(target, -amount)
    Util.Print(ok and 'ok' or 'error', '%s %d chips for %s', ok and 'moved' or 'could not move', amount, target)
end, false)
