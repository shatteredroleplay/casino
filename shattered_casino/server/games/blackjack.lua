local Cfg = Config.Blackjack
local Game

local draw = function(t)
    return table.remove(t.deck)
end

local speakHand = function(id, cards, bust, delay)
    local value = Cards.Value(cards)
    if Cards.IsBlackjack(cards) then
        Game.Speak(id, 'MINIGAME_BJACK_DEALER_BLACKJACK', delay)
    elseif value > 21 then
        Game.Speak(id, bust, delay)
    else
        Game.Speak(id, 'MINIGAME_BJACK_DEALER_' .. value, delay)
    end
end

local drawFor = function(t, id, cards)
    local want = t.wants and t.wants[id]
    if not want then return draw(t) end

    local deck, pick, best = t.deck, nil, nil
    for i = #deck, math.max(1, #deck - 12), -1 do
        local v = Cards.Value({ deck[i], table.unpack(cards) })
        local s
        if want > 0 then
            s = v <= 21 and v or -v
        else
            s = v > 21 and 100 or -v
        end
        if not best or s > best then pick, best = i, s end
    end
    return table.remove(deck, pick)
end

local rigDeal = function(t)
    local seats = {}
    for seat = 4, 1, -1 do
        if t.hands[seat] then seats[#seats + 1] = seat end
    end

    t.deck = Rig.Pick('blackjack', t.wants, t.deck, function() return Rig.Shuffle(t.deck) end, function(deck)
        local n, dealer, cards = #deck, {}, {}
        for _ = 1, 2 do
            dealer[#dealer + 1] = deck[n]
            n = n - 1
            for _, seat in ipairs(seats) do
                cards[seat] = cards[seat] or {}
                table.insert(cards[seat], deck[n])
                n = n - 1
            end
        end

        local nets, dbj, dv = {}, Cards.IsBlackjack(dealer), Cards.Value(dealer)
        for _, seat in ipairs(seats) do
            local hand, v, q = t.hands[seat], Cards.Value(cards[seat]), 0
            if Cards.IsBlackjack(cards[seat]) then
                q = dbj and 0 or 1.5
            elseif dbj then
                q = -1
            elseif dv >= 17 then
                q = v > dv and 1 or v < dv and -1 or 0
            else
                q = (t.wants[hand.id] or 0) * 0.5
            end
            nets[hand.id] = (nets[hand.id] or 0) + q * hand.bet
        end
        return nets
    end)
end

local rigDealer = function(t)
    t.deck = Rig.Pick('blackjack', t.wants, t.deck, function() return Rig.Shuffle(t.deck) end, function(deck)
        local dealer, n = { table.unpack(t.dealer) }, #deck
        while Cards.Value(dealer) < 17 do
            dealer[#dealer + 1] = deck[n]
            n = n - 1
        end
        local nets = {}
        for _, hand in pairs(t.hands) do
            for _, part in ipairs({ hand, hand.split }) do
                nets[hand.id] = (nets[hand.id] or 0) + Cards.Payout(part, dealer, hand.split) - part.bet
            end
        end
        return nets
    end)
end

local allBet = function(t)
    for seat in pairs(t.seats) do
        if not t.hands[seat] then return false end
    end
    return true
end

local play = function(g, t)
    local id = t.id
    t.hands, t.dealer, t.turn, t.hidden, t.wants = {}, {}, nil, true, nil
    t.deck = Cards.NewDeck(6)
    t.phase = 'betting'
    t.deadline = os.time() + Cfg.BetTime
    g.Sync(id)
    g.Speak(id, 'MINIGAME_DEALER_PLACE_CHIPS')
    g.Until(function() return os.time() >= t.deadline or allBet(t) or not next(t.seats) end)
    t.deadline = nil

    g.Idle(t, function(seat) return t.hands[seat] ~= nil end)

    if not next(t.hands) then
        t.phase = 'idle'
        g.Sync(id)
        Wait(1000)
        return
    end

    local ids = {}
    for _, hand in pairs(t.hands) do ids[hand.id] = true end
    t.wants = Rig.Wants('blackjack', ids)
    if t.wants then rigDeal(t) end

    t.phase = 'dealing'
    g.Speak(id, 'MINIGAME_DEALER_CLOSED_BETS')
    Wait(1500)
    for _ = 1, 2 do
        table.insert(t.dealer, draw(t))
        g.Sync(id)
        Wait(Cfg.DealTime)
        for seat = 4, 1, -1 do
            if t.hands[seat] then
                table.insert(t.hands[seat].cards, draw(t))
                g.Sync(id)
                Wait(Cfg.DealTime)
            end
        end
    end

    g.Speak(id, 'MINIGAME_BJACK_DEALER_' .. Cards.Value({ t.dealer[2] }))
    Wait(1500)

    t.phase = 'playing'
    if not Cards.IsBlackjack(t.dealer) then
        for seat = 4, 1, -1 do
            local hand = t.hands[seat]
            if hand then
                if Cards.IsBlackjack(hand.cards) then
                    hand.status = 'blackjack'
                    g.Speak(id, 'MINIGAME_BJACK_DEALER_BLACKJACK')
                    Wait(1500)
                else
                    t.turn = seat
                    local part = hand
                    while part do
                        if not part.status then speakHand(id, part.cards) end
                        t.deadline = os.time() + Cfg.TurnTime
                        g.Sync(id)
                        g.Until(function()
                            local at = g.Seated[hand.src]
                            return part.status or os.time() >= t.deadline or not at or at.id ~= id or at.seat ~= seat
                        end)
                        part.status = part.status or 'stand'
                        g.Until(function() return GetGameTimer() >= (t.busyUntil or 0) end)
                        part = part ~= hand.split and hand.split or nil
                    end
                end
            end
        end
    end
    t.turn, t.deadline = nil, nil

    local standing = 0
    for _, hand in pairs(t.hands) do
        for _, part in ipairs({ hand, hand.split }) do
            if part.status == 'stand' then standing = standing + part.bet end
        end
    end

    t.phase = 'dealer'
    t.hidden = false
    g.Sync(id)
    Wait(Cfg.RevealTime)

    if t.wants and standing > 0 then rigDealer(t) end
    while standing > 0 and Cards.Value(t.dealer) < 17 do
        table.insert(t.dealer, draw(t))
        if not t.wants and Cards.Value(t.dealer) > 21 and Pool.Protect(standing) then
            table.insert(t.deck, 1, table.remove(t.dealer))
            table.insert(t.dealer, draw(t))
        end
        g.Sync(id)
        Wait(Cfg.DealTime)
    end
    speakHand(id, t.dealer, 'MINIGAME_DEALER_BUSTS')

    for _, hand in pairs(t.hands) do
        for _, part in ipairs({ hand, hand.split }) do
            part.payout = Cards.Payout(part, t.dealer, hand.split)
            g.Settle(hand.id, part.bet, part.payout)
        end
    end

    t.phase = 'result'
    g.Sync(id)
    Wait(Cfg.ResultTime * 1000)
end

Game = TableGame.New({
    name = 'blackjack',
    config = Cfg,
    greet = 'MINIGAME_DEALER_GREET',
    bye = 'MINIGAME_DEALER_LEAVE_NEUTRAL_GAME',

    init = function(_, t)
        t.hands, t.dealer = {}, {}
    end,

    public = function(g, t)
        local dealer = {}
        for i, card in ipairs(t.dealer) do
            dealer[i] = (i == 1 and t.hidden) and 'back' or card
        end
        local hands = {}
        for seat, hand in pairs(t.hands) do
            hands[seat] = { src = hand.src, cards = hand.cards, bet = hand.bet, status = hand.status, payout = hand.payout, split = hand.split }
        end
        return {
            ped = t.ped, seats = t.seats, hands = hands, dealer = dealer, phase = t.phase, turn = t.turn,
            max = g.MaxBet(t), timeLeft = g.TimeLeft(t),
        }
    end,

    play = play,

    refund = function(g, t)
        for _, hand in pairs(t.hands) do
            for _, part in ipairs({ hand, hand.split }) do
                if not part.payout and g.Refund(hand.id, part.bet) then part.payout = part.bet end
            end
        end
    end,

    reset = function(_, t)
        t.hands, t.dealer, t.turn = {}, {}, nil
    end,
})

Rpc.Register('blackjack:bet', function(src, amount)
    local at = Game.Seated[src]
    if not at then return false end
    local t = Game.Tables[at.id]
    amount = Util.Integer(amount)

    if t.phase ~= 'betting' or t.hands[at.seat] or not amount then return false end
    local max = Game.MaxBet(t)
    if max < t.cfg.min then return L('table.closed') end
    if amount < t.cfg.min or amount > max then return L('table.max_bet', { amount = Format.Chips(max) }) end
    local id = Players.Id(src)
    if not id then return false end
    if not Game.Take(src, amount) then return L('error.not_enough_chips') end

    t.hands[at.seat] = { src = src, id = id, cards = {}, bet = amount }
    Game.Sync(at.id)
    return true
end, 4)

local Actions = {
    split = function(t, src, main, hand)
        if main.split or #hand.cards ~= 2 or Cards.Value({ hand.cards[1] }) ~= Cards.Value({ hand.cards[2] }) then return false end
        if not Game.Take(src, hand.bet) then return L('error.not_enough_chips') end
        local moved = table.remove(hand.cards)
        hand.split = { cards = { moved, drawFor(t, main.id, { moved }) }, bet = hand.bet }
        table.insert(hand.cards, drawFor(t, main.id, hand.cards))
        for _, part in ipairs({ hand, hand.split }) do
            if Cards.Value(part.cards) == 21 then part.status = 'stand' end
        end
        t.deadline = os.time() + Cfg.TurnTime
        t.busyUntil = GetGameTimer() + Cfg.HitTime
        return true
    end,

    double = function(t, src, main, hand)
        if #hand.cards ~= 2 then return false end
        if not Game.Take(src, hand.bet) then return L('error.not_enough_chips') end
        hand.bet = hand.bet * 2
        table.insert(hand.cards, drawFor(t, main.id, hand.cards))
        hand.status = Cards.Value(hand.cards) > 21 and 'bust' or 'stand'
        t.busyUntil = GetGameTimer() + Cfg.HitTime
        speakHand(t.id, hand.cards, 'MINIGAME_BJACK_DEALER_PLAYER_BUST', Cfg.CardInHand)
        return true
    end,

    hit = function(t, _, main, hand)
        table.insert(hand.cards, drawFor(t, main.id, hand.cards))
        t.busyUntil = GetGameTimer() + Cfg.HitTime
        local value = Cards.Value(hand.cards)
        speakHand(t.id, hand.cards, 'MINIGAME_BJACK_DEALER_PLAYER_BUST', Cfg.CardInHand)
        if value > 21 then
            hand.status = 'bust'
        elseif value == 21 then
            hand.status = 'stand'
        end
        return true
    end,

    stand = function(t, _, _, hand)
        hand.status = 'stand'
        t.busyUntil = GetGameTimer() + 1000
        return true
    end,
}

Rpc.Register('blackjack:action', function(src, action)
    local at = Game.Seated[src]
    local fn = type(action) == 'string' and Actions[action]
    if not at or not fn then return false end
    local t = Game.Tables[at.id]
    local main = t.hands[at.seat]

    if t.phase ~= 'playing' or t.turn ~= at.seat or not main or main.src ~= src then return false end
    if GetGameTimer() < (t.busyUntil or 0) then return false end
    local hand = main.status and main.split or main
    if not hand or hand.status then return false end

    local res = fn(t, src, main, hand)
    if res == true then Game.Sync(at.id) end
    return res
end)
