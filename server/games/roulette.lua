local Cfg = Config.Roulette
local Game

local nets = function(t, number)
    local list, loss = {}, 0
    for _, bet in ipairs(t.bets) do
        local net = Roulette.Payout(bet.bet, bet.amount, number) - bet.amount
        list[bet.id] = (list[bet.id] or 0) + net
        loss = loss + net
    end
    return list, loss
end

local play = function(g, t)
    local id = t.id
    t.bets, t.tick, t.number = {}, nil, nil
    t.phase = 'betting'
    t.deadline = os.time() + Cfg.BetTime
    g.Sync(id)
    g.Speak(id, 'MINIGAME_DEALER_PLACE_CHIPS')
    g.Until(function() return os.time() >= t.deadline or not next(t.seats) end)
    t.deadline = nil

    local placed = {}
    for _, bet in ipairs(t.bets) do placed[bet.seat] = true end
    g.Idle(t, function(seat) return placed[seat] == true end)

    if #t.bets == 0 then
        t.phase = 'idle'
        g.Sync(id)
        Wait(1000)
        return
    end

    t.phase = 'spinning'
    t.tick = math.random(#Roulette.Wheel)
    local ids = {}
    for _, bet in ipairs(t.bets) do ids[bet.id] = true end
    local wants = Rig.Wants('roulette', ids)
    if wants then
        t.tick = Rig.Pick('roulette', wants, t.tick, function() return math.random(#Roulette.Wheel) end, function(tick)
            return (nets(t, Roulette.Wheel[tick]))
        end)
    else
        local _, loss = nets(t, Roulette.Wheel[t.tick])
        if Pool.Protect(loss) then t.tick = math.random(#Roulette.Wheel) end
    end
    g.Sync(id)
    g.Speak(id, 'MINIGAME_DEALER_CLOSED_BETS')
    Wait(Cfg.SpinTime)

    t.number = Roulette.Wheel[t.tick]
    table.insert(t.history, 1, t.number)
    t.history[11] = nil
    g.Speak(id, 'MINIGAME_ROULETTE_BALL_' .. t.number)

    for _, bet in ipairs(t.bets) do
        bet.payout = Roulette.Payout(bet.bet, bet.amount, t.number)
        g.Settle(bet.id, bet.amount, bet.payout)
    end

    t.phase = 'result'
    g.Sync(id)
    Wait(Cfg.ResultTime * 1000)
end

Game = TableGame.New({
    name = 'roulette',
    config = Cfg,
    greet = 'MINIGAME_DEALER_GREET',
    bye = 'MINIGAME_DEALER_LEAVE_NEUTRAL_GAME',

    init = function(_, t)
        t.bets, t.history = {}, {}
    end,

    public = function(g, t)
        local bets = {}
        for i, bet in ipairs(t.bets) do
            bets[i] = { src = bet.src, seat = bet.seat, bet = bet.bet, amount = bet.amount, payout = bet.payout }
        end
        return {
            ped = t.ped, seats = t.seats, bets = bets, phase = t.phase, tick = t.tick, number = t.number, history = t.history,
            max = g.MaxBet(t), timeLeft = g.TimeLeft(t),
        }
    end,

    play = play,

    left = function(g, t, src)
        local refunded = 0
        if t.phase ~= 'betting' then return refunded end
        for i = #t.bets, 1, -1 do
            local bet = t.bets[i]
            if bet.src == src and g.Refund(bet.id, bet.amount) then
                refunded = refunded + bet.amount
                table.remove(t.bets, i)
            end
        end
        return refunded
    end,

    refund = function(g, t)
        for _, bet in ipairs(t.bets) do
            if not bet.payout and g.Refund(bet.id, bet.amount) then bet.payout = bet.amount end
        end
    end,

    reset = function(_, t)
        t.bets, t.tick, t.number = {}, nil, nil
    end,
})

Rpc.Register('roulette:bet', function(src, betId, amount)
    local at = Game.Seated[src]
    if not at then return false end
    local t = Game.Tables[at.id]
    local def = type(betId) == 'string' and Roulette.Bets[betId]
    amount = Util.Integer(amount, 1)
    if t.phase ~= 'betting' or not def or not amount then return false end

    local id = Players.Id(src)
    if not id then return false end

    local existing, count = nil, 0
    for _, bet in ipairs(t.bets) do
        if bet.id == id then
            count = count + 1
            if bet.bet == betId then existing = bet end
        end
    end
    if not existing and count >= Cfg.MaxBets then return L('roulette.max_bets', { count = Cfg.MaxBets }) end

    local max = Roulette.MaxBet(betId, Game.MaxBet(t))
    local total = amount + (existing and existing.amount or 0)
    if max < t.cfg.min then return L('roulette.bet_closed') end
    if amount < t.cfg.min or total > max then return L('roulette.bet_max', { bet = Roulette.Label(betId), amount = Format.Chips(max) }) end
    if not Game.Take(src, amount) then return L('error.not_enough_chips') end

    if existing then
        existing.amount, existing.seat, existing.src = total, at.seat, src
    else
        t.bets[#t.bets + 1] = { src = src, id = id, seat = at.seat, bet = betId, amount = amount }
    end
    Game.Sync(at.id)
    return true
end, 8)
