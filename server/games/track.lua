local Cfg = Config.Track
local STATE = Util.Event('track:state')
local HORSES, STYLES = 6, 8
local Sessions = {}
local Round = { id = 0, phase = 'idle', horses = {}, bets = {}, ends = 0 }

local terminals = function()
    local list = {}
    for _, c in ipairs(Cfg.Terminals) do list[#list + 1] = { x = c.x, y = c.y, z = c.z, w = c.w } end
    return list
end

local unique = function(count, max)
    local picked, list = {}, {}
    while #list < count do
        local n = math.random(max)
        if not picked[n] then
            picked[n] = true
            list[#list + 1] = n
        end
    end
    return list
end

local newHorses = function()
    local weights, total, top
    repeat
        weights, total, top = {}, 0, 0
        for i = 1, HORSES do
            weights[i] = 1 + math.random() ^ 2 * 9
            total = total + weights[i]
        end
        for i = 1, HORSES do top = math.max(top, weights[i] / total) end
    until top <= 0.45

    local names, styles, horses = unique(HORSES, math.max(HORSES, #Track.Names)), unique(HORSES, STYLES), {}
    for i = 1, HORSES do
        local chance = weights[i] / total
        horses[i] = {
            name = names[i],
            style = styles[i],
            chance = chance,
            odds = math.max(1, math.floor(((1 - Cfg.Edge) / chance - 1) * 2) / 2),
        }
    end
    return horses
end

local finish = function(horses)
    local left, order = {}, {}
    for i, h in ipairs(horses) do left[i] = { id = i, chance = h.chance } end
    while #left > 0 do
        local total = 0
        for _, h in ipairs(left) do total = total + h.chance end
        local r, pick = math.random() * total, #left
        for i, h in ipairs(left) do
            r = r - h.chance
            if r <= 0 then
                pick = i
                break
            end
        end
        order[#order + 1] = table.remove(left, pick).id
    end
    return order
end

local publicState = function()
    local horses = {}
    for i, h in ipairs(Round.horses) do horses[i] = { name = h.name, style = h.style, odds = h.odds } end
    return {
        id = Round.id, phase = Round.phase, horses = horses, order = Round.order,
        timeLeft = math.max(0, Round.ends - GetGameTimer()), min = Cfg.Min, max = Pool.MaxBet(Cfg.Max),
    }
end

local personalState = function(src)
    local s = publicState()
    local id = Players.Id(src)
    s.bets = {}
    for horse = 1, HORSES do
        local bet = id and Round.bets[id .. ':' .. horse]
        s.bets[horse] = bet and bet.amount or 0
    end
    s.balance = Wallet.Get(src)
    return s
end

local setPhase = function(phase, duration)
    Round.phase = phase
    Round.ends = GetGameTimer() + duration
    Broadcast(STATE, publicState())
    Wait(duration)
end

local refund = function()
    for _, bet in pairs(Round.bets) do
        if not bet.settled then
            bet.settled = true
            Pool.Add(-bet.amount)
            Wallet.Give(bet.id, bet.amount)
        end
    end
end

local payoutOf = function(bet, first)
    return bet.horse == first and Track.Payout(bet.amount, Round.horses[bet.horse].odds) or 0
end

local playRound = function()
    Round = { id = Round.id + 1, horses = newHorses(), bets = {} }
    setPhase('betting', Cfg.BetTime * 1000)

    local order = finish(Round.horses)
    local nets = function(o)
        local list = {}
        for _, bet in pairs(Round.bets) do list[bet.id] = (list[bet.id] or 0) + payoutOf(bet, o[1]) - bet.amount end
        return list
    end
    local ids = {}
    for _, bet in pairs(Round.bets) do ids[bet.id] = true end
    local wants = Rig.Wants('track', ids)
    if wants then
        order = Rig.Pick('track', wants, order, function() return finish(Round.horses) end, nets)
    else
        local loss = 0
        for _, net in pairs(nets(order)) do loss = loss + net end
        if Pool.Protect(loss) then order = finish(Round.horses) end
    end
    Round.order = order
    setPhase('racing', Cfg.RaceTime)

    for _, bet in pairs(Round.bets) do
        local payout = payoutOf(bet, order[1])
        bet.settled = true
        Pool.Settle(bet.id, 'track', bet.amount, payout)
        if payout > 0 then Wallet.Give(bet.id, payout) end
    end
    setPhase('result', Cfg.ResultTime * 1000)
end

CreateThread(function()
    Wait(1000)
    while true do
        local ok, err = pcall(playRound)
        if not ok then
            Util.Print('error', 'horse racing: %s', tostring(err))
            refund()
            Wait(5000)
        end
    end
end)

local near = function(src, pos)
    return #(GetEntityCoords(GetPlayerPed(src)) - pos) <= 4.0
end

local allowed = function(pos)
    if #(pos - Cfg.Center) <= Cfg.Radius then return true end
    for _, c in ipairs(terminals()) do
        if #(pos - vec3(c.x, c.y, c.z)) <= 3.0 then return true end
    end
    return false
end

Track.Seated = function()
    local n = 0
    for _ in pairs(Sessions) do n = n + 1 end
    return n
end

Rpc.Register('track:terminals', function()
    return terminals()
end)

Rpc.Register('track:state', function(src)
    return personalState(src)
end)

Rpc.Register('track:open', function(src, pos)
    if type(pos) ~= 'vector3' or not allowed(pos) then return L('track.outside') end
    if not near(src, pos) then return L('track.too_far') end
    if not Players.Id(src) then return L('error.not_loaded') end
    local refused = Settings.Refuse(src, 'track')
    if refused then return refused end
    for other, taken in pairs(Sessions) do
        if other ~= src and #(taken - pos) < 0.5 then return L('track.taken') end
    end
    Sessions[src] = pos
    return personalState(src)
end, 4)

Rpc.Register('track:leave', function(src)
    Sessions[src] = nil
    return true
end)

Rpc.Register('track:bet', function(src, id, horse, amount)
    local pos = Sessions[src]
    if not pos or not near(src, pos) then return false end
    if Round.phase ~= 'betting' or id ~= Round.id then return L('track.closed_race') end
    horse, amount = Util.Integer(horse), Util.Integer(amount, 1)
    local h = horse and Round.horses[horse]
    if not h or not amount then return false end

    local player = Players.Id(src)
    if not player then return false end

    local key = player .. ':' .. horse
    local existing = Round.bets[key]
    local max = Track.MaxBet(h.odds, Pool.MaxBet(Cfg.Max))
    if max < Cfg.Min then return L('track.horse_closed') end
    if amount < Cfg.Min or amount + (existing and existing.amount or 0) > max then
        return L('track.max_bet', { amount = Format.Chips(max) })
    end
    if not Wallet.Remove(src, amount) then return L('error.not_enough_chips') end
    Pool.Add(amount)

    if existing then
        existing.amount = existing.amount + amount
    else
        Round.bets[key] = { id = player, horse = horse, amount = amount }
    end
    return true
end, 6)

AddEventHandler('playerDropped', function()
    Sessions[source] = nil
end)

AddEventHandler(Util.Event('player:unloaded'), function(src)
    Sessions[src] = nil
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource then refund() end
end)
