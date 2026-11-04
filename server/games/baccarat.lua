local Cfg = Config.Baccarat
local Sides = { player = 1, bank = 1 - Cfg.Commission, tie = Cfg.Tie }
local Game

local staked = function(bet)
    return (bet.player or 0) + (bet.bank or 0) + (bet.tie or 0)
end

local winnerOf = function(player, bank)
    local p, b = Cards.Points(player), Cards.Points(bank)
    return p > b and 'player' or b > p and 'bank' or 'tie'
end

local payoutOf = function(bet, winner)
    local back = 0
    for side, rate in pairs(Sides) do
        local amount = bet[side] or 0
        if side == winner then
            back = back + amount + math.floor(amount * rate)
        elseif winner == 'tie' then
            back = back + amount
        end
    end
    return back
end

local netsFor = function(t, player, bank)
    local nets, loss, winner = {}, 0, winnerOf(player, bank)
    for _, bet in pairs(t.bets) do
        local net = payoutOf(bet, winner) - staked(bet)
        nets[bet.id] = (nets[bet.id] or 0) + net
        loss = loss + net
    end
    return nets, loss
end

local play = function(g, t)
    local id = t.id
    t.bets, t.player, t.bank, t.winner = {}, {}, {}, nil
    t.phase = 'betting'
    t.deadline = os.time() + Cfg.BetTime
    g.Sync(id)
    g.Until(function() return os.time() >= t.deadline or not next(t.seats) end)
    t.deadline = nil

    g.Idle(t, function(seat) return t.bets[seat] ~= nil end)

    if not next(t.bets) then
        t.phase = 'idle'
        g.Sync(id)
        Wait(1000)
        return
    end

    local deck = Cards.NewDeck(8)
    local player, bank = Cards.Baccarat(deck)
    local ids = {}
    for _, bet in pairs(t.bets) do ids[bet.id] = true end
    local wants = Rig.Wants('baccarat', ids)
    if wants then
        local hands = Rig.Pick('baccarat', wants, { player, bank }, function()
            if #deck < 6 then deck = Cards.NewDeck(8) end
            return { Cards.Baccarat(deck) }
        end, function(h) return (netsFor(t, h[1], h[2])) end)
        player, bank = hands[1], hands[2]
    else
        local _, loss = netsFor(t, player, bank)
        if Pool.Protect(loss) then player, bank = Cards.Baccarat(deck) end
    end

    t.phase = 'dealing'
    g.Sync(id)
    Wait(1500)
    for i = 1, 3 do
        for _, hand in ipairs({ { t.player, player }, { t.bank, bank } }) do
            if hand[2][i] then
                hand[1][i] = hand[2][i]
                g.Sync(id)
                Wait(Cfg.DealTime)
            end
        end
    end

    t.winner = winnerOf(player, bank)
    for _, bet in pairs(t.bets) do
        bet.payout = payoutOf(bet, t.winner)
        g.Settle(bet.id, staked(bet), bet.payout)
    end

    t.phase = 'result'
    g.Sync(id)
    Wait(Cfg.ResultTime * 1000)
end

Game = TableGame.New({
    name = 'baccarat',
    config = Cfg,

    init = function(_, t)
        t.bets, t.player, t.bank = {}, {}, {}
    end,

    public = function(g, t)
        local bets = {}
        for seat, bet in pairs(t.bets) do
            bets[seat] = { src = bet.src, player = bet.player, bank = bet.bank, tie = bet.tie, payout = bet.payout }
        end
        return {
            ped = t.ped, seats = t.seats, bets = bets, player = t.player, bank = t.bank, phase = t.phase, winner = t.winner,
            max = g.MaxBet(t), timeLeft = g.TimeLeft(t),
        }
    end,

    play = play,

    refund = function(g, t)
        for _, bet in pairs(t.bets) do
            if not bet.payout and g.Refund(bet.id, staked(bet)) then bet.payout = staked(bet) end
        end
    end,

    reset = function(_, t)
        t.bets, t.player, t.bank, t.winner = {}, {}, {}, nil
    end,
})

Rpc.Register('baccarat:bet', function(src, side, amount)
    local at = Game.Seated[src]
    if not at or not Sides[side] then return false end
    local t = Game.Tables[at.id]
    amount = Util.Integer(amount)
    if t.phase ~= 'betting' or not amount then return false end

    local bet = t.bets[at.seat]
    local max = Game.MaxBet(t)
    if max < t.cfg.min then return L('table.closed') end
    if amount < t.cfg.min or amount + (bet and staked(bet) or 0) > max then return L('table.max_bet', { amount = Format.Chips(max) }) end
    local id = Players.Id(src)
    if not id then return false end
    if not Game.Take(src, amount) then return L('error.not_enough_chips') end

    bet = bet or { src = src, id = id }
    bet[side] = (bet[side] or 0) + amount
    t.bets[at.seat] = bet
    Game.Sync(at.id)
    return true
end, 6)
