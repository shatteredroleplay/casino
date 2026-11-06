TableGame = { All = {} }

TableGame.New = function(def)
    local name, cfg = def.name, def.config
    local g = { Tables = {}, Seated = {}, Config = cfg, Name = name }
    TableGame.All[name] = g
    local STATE, SPEECH = Util.Event(name .. ':state'), Util.Event(name .. ':speech')

    for id, tcfg in ipairs(cfg.Tables) do
        local t = { id = id, cfg = tcfg, seats = {}, phase = 'idle', ped = { variation = math.random(14) } }
        if def.init then def.init(g, t) end
        g.Tables[id] = t
    end

    g.Sync = function(id)
        Broadcast(STATE, id, def.public(g, g.Tables[id]))
    end

    g.Speak = function(id, line, delay)
        SetTimeout(delay or 0, function() Broadcast(SPEECH, id, line) end)
    end

    g.Until = function(cond)
        while not cond() do Wait(250) end
    end

    g.MaxBet = function(t)
        return Pool.MaxBet(t.cfg.max)
    end

    g.TimeLeft = function(t)
        return t.deadline and math.max(0, t.deadline - os.time()) or nil
    end

    g.Take = function(src, amount)
        if not Wallet.Remove(src, amount) then return false end
        Pool.Add(amount)
        return true
    end

    g.Online = function(id)
        return Players.Source(id)
    end

    g.Settle = function(id, bet, payout)
        local src = Players.Source(id)
        Pool.Settle(id, name, bet, payout)
        if payout > 0 then Wallet.Give(id, payout, src) end
        return src
    end

    g.Refund = function(id, amount)
        if amount <= 0 then return false end
        Pool.Add(-amount)
        Wallet.Give(id, amount)
        return true
    end

    g.Leave = function(src)
        local at = g.Seated[src]
        if not at then return end
        g.Seated[src] = nil
        local t = g.Tables[at.id]
        local occupant = t.seats[at.seat]
        t.seats[at.seat] = nil
        local result = def.left and def.left(g, t, src, at, occupant)
        if def.bye then g.Speak(at.id, def.bye) end
        g.Sync(at.id)
        return result
    end

    g.Idle = function(t, played)
        for seat, occupant in pairs(t.seats) do
            local src = type(occupant) == 'table' and occupant.src or occupant
            local at = g.Seated[src]
            if at then
                if played(seat) then
                    at.idle = 0
                else
                    at.idle = at.idle + 1
                    if at.idle >= cfg.IdleRounds then g.Leave(src) end
                end
            end
        end
    end

    g.Start = function(id)
        local t = g.Tables[id]
        if t.running then return end
        t.running = true
        CreateThread(function()
            while next(t.seats) do
                local ok, err = pcall(def.play, g, t)
                if not ok then
                    Util.Print('error', '%s table %s: %s', name, id, tostring(err))
                    if def.refund then def.refund(g, t) end
                    Wait(5000)
                end
            end
            t.running = false
            if def.reset then def.reset(g, t) end
            t.phase, t.deadline = 'idle', nil
            g.Sync(id)
        end)
    end

    Rpc.Register(name .. ':state', function(_, id)
        local t = g.Tables[id]
        return t and def.public(g, t)
    end)

    Rpc.Register(name .. ':sit', function(src, id, seat, ...)
        local t = g.Tables[id]
        if not t or math.type(seat) ~= 'integer' or seat < 1 or seat > 4 then return false end
        if t.seats[seat] or g.Seated[src] then return false end
        if #(GetEntityCoords(GetPlayerPed(src)) - t.cfg.coords.xyz) > 4.0 then return false end
        if not Players.Id(src) then return L('error.not_loaded') end
        local refused = Settings.Refuse(src, name)
        if refused then return refused end

        local occupant = src
        if def.seat then
            local value, err = def.seat(g, t, src, seat, ...)
            if not value then return err or false end
            occupant = value
        end
        t.seats[seat] = occupant
        g.Seated[src] = { id = id, seat = seat, idle = 0 }
        if def.greet then g.Speak(id, def.greet) end
        g.Sync(id)
        g.Start(id)
        return true
    end, 4)

    Rpc.Register(name .. ':leave', function(src)
        local result = g.Leave(src)
        if result == nil then return true end
        return result
    end)

    AddEventHandler(Util.Event('player:unloaded'), function(src)
        g.Leave(src)
    end)

    AddEventHandler('playerDropped', function()
        g.Leave(source)
    end)

    AddEventHandler('onResourceStop', function(resource)
        if resource ~= Util.Resource then return end
        for _, t in ipairs(g.Tables) do
            if def.refund then def.refund(g, t) end
            if def.stop then def.stop(g, t) end
        end
    end)

    return g
end
