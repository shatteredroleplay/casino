local Cfg = Config.Poker
local DEALER = 'anim_casino_b@amb@casino@games@blackjack@dealer'
local Mine = {}
local Game

local BoardSpot = function(i) return { vec3((i - 3) * 0.0845, 0.1635, 0.950), 0.0 } end
local PotSpots = { { vec2(-0.066, 0.27), 0.0 }, { vec2(-0.022, 0.27), 0.0 }, { vec2(0.022, 0.27), 0.0 }, { vec2(0.066, 0.27), 0.0 } }
local Seats = {
    { cards = vec2(-0.6840, 0.2182), bet = vec2(-0.5600, 0.2703), heading = -67.2 },
    { cards = vec2(-0.3059, -0.1893), bet = vec2(-0.2660, -0.0608), heading = -17.2 },
    { cards = vec2(0.2797, -0.2008), bet = vec2(0.2277, -0.0767), heading = 22.8 },
    { cards = vec2(0.6738, 0.1756), bet = vec2(0.5454, 0.2155), heading = 72.8 },
}

for _, seat in ipairs(Seats) do
    local a = math.rad(seat.heading)
    local right, up = vec2(math.cos(a), math.sin(a)), vec2(-math.sin(a), math.cos(a))
    seat.spots = {
        { vec3(seat.cards.x - right.x * 0.018, seat.cards.y - right.y * 0.018, 0.950), seat.heading },
        { vec3(seat.cards.x + right.x * 0.018, seat.cards.y + right.y * 0.018, 0.9506), seat.heading + 6.0 },
    }
    seat.chips = {}
    for i, o in ipairs({ { -1, -1 }, { 1, -1 }, { -1, 1 }, { 1, 1 } }) do
        seat.chips[i] = { seat.bet + right * (o[1] * 0.018) + up * (o[2] * 0.018), seat.heading }
    end
end

local placeCard = function(t, obj, spot, code)
    local c = t.coords
    local pos = GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, spot[1].x, spot[1].y, spot[1].z)
    DetachEntity(obj, false, false)
    FreezeEntityPosition(obj, true)
    SetEntityCoordsNoOffset(obj, pos.x, pos.y, pos.z, false, false, false)
    SetEntityRotation(obj, code == 'back' and 180.0 or 0.0, 0.0, c.w + spot[2], 2, true)
end

local spawnCard = function(t, spot, code, inHand)
    local model = Casino.LoadModel('vw_prop_cas_card_' .. (code == 'back' and 'spd_ace' or code))
    if not model then return 0 end
    local c = t.coords
    local obj = CreateObjectNoOffset(model, c.x, c.y, c.z, false, false, false)
    SetEntityCollision(obj, false, false)
    if inHand then
        AttachEntityToEntity(obj, t.dealer, GetPedBoneIndex(t.dealer, 28422), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, false, false, false, true, 2, true)
    else
        placeCard(t, obj, spot, code)
    end
    return obj
end

local syncCards = function(t, key, cards, spot)
    local list = t.cards[key] or {}
    t.cards[key] = list
    for i = math.max(#list, #cards), 1, -1 do
        local card = list[i]
        if card and card.code ~= cards[i] then
            DeleteObject(card.obj)
            list[i] = nil
        end
        if cards[i] and not list[i] then list[i] = { code = cards[i], obj = spawnCard(t, spot(i), cards[i]) } end
    end
end

Casino.PokerChips = function()
    local state = Game.Sitting and Game.States[Game.Sitting.id]
    local seat = state and state.seats[Game.Sitting.seat]
    return seat and seat.src == Casino.Me() and seat.stack + (seat.bet or 0) or 0
end

local seatCards = function(id, seat)
    local s = Game.States[id].seats[seat]
    if not s or not s.cards then return {} end
    if type(s.cards) == 'table' then return s.cards end
    if s.src == Casino.Me() and Mine[id] then return Mine[id] end
    return { 'back', 'back' }
end

local deal = function(g, id)
    local t = g.Spawned[id]
    local token = {}
    t.dealing = token
    for seat = 1, 4 do syncCards(t, seat, {}) end

    CreateThread(function()
        local dealing = function() return g.Spawned[id] == t and t.dealing == token end
        for i = 1, 2 do
            for n = 1, 4 do
                local seat = (g.States[id].button + n - 1) % 4 + 1
                local at = g.States[id].seats[seat]
                if at and at.cards and not at.folded then
                    local code = seatCards(id, seat)[i]
                    local card = { code = code, obj = spawnCard(t, nil, code, true) }
                    t.cards[seat][i] = card
                    g.DealerScene(t, DEALER, 'female_deal_card_player_0' .. (5 - seat), false, Cfg.DealRate)
                    local inHand = math.floor(Cfg.CardInHand / Cfg.DealRate)
                    Wait(inHand)
                    if g.Spawned[id] ~= t then return end
                    if t.cards[seat][i] == card and card.obj ~= 0 then placeCard(t, card.obj, Seats[seat].spots[i], code) end
                    if not dealing() then return end
                    Wait(math.max(0, Cfg.DealCard - inHand))
                    if not dealing() then return end
                end
            end
        end
        t.dealing, t.dirty = nil, true
    end)
end

local Did = {
    check = 'poker.did_check', call = 'poker.did_call', raise = 'poker.did_raise', bet = 'poker.did_bet',
    small = 'poker.did_small', big = 'poker.did_big',
}

local act = function(g, action, amount)
    Rpc.Async('poker:action', function(res)
        if type(res) == 'string' then g.Notify(res) end
    end, action, amount)
end

local raise = function(g)
    local s = g.States[g.Sitting.id]
    local at = s.seats[g.Sitting.seat]
    local most = at.bet + at.stack
    local least = math.min(s.bet + s.raise, most)
    local amount = most
    if least < most then amount = g.Ask(L('poker.raise_title'), L('poker.raise_to'), least, most) end
    if amount and g.Sitting then act(g, 'raise', amount) end
end

local rebuy = function(g)
    local tcfg = Cfg.Tables[g.Sitting.id]
    local at = g.States[g.Sitting.id].seats[g.Sitting.seat]
    local most = math.min(tcfg.max - at.stack, g.Chips())
    if most < 1 then return g.Notify(L('poker.no_rebuy_chips')) end
    local amount = g.Ask(L('poker.rebuy_title'), L('poker.rebuy_label'), math.min(tcfg.big, most), most)
    if not amount or not g.Sitting then return end
    local res = g.Rpc('rebuy', amount)
    if res ~= true then g.Notify(type(res) == 'string' and res or L('poker.rebuy_failed')) end
end

Game = TableGame.New({
    name = 'poker',
    config = Cfg,
    models = { 'vw_prop_casino_3cardpoker_01', 'vw_prop_casino_3cardpoker_01b' },
    board = { page = 'poker', width = 1024, height = 832, prefixes = { 'poker.' } },

    render = function(g, t, s, id)
        if #s.board > #(t.cards.board or {}) then g.DealerScene(t, DEALER, 'female_deal_card_self', false) end
        syncCards(t, 'board', s.board, BoardSpot)

        if s.phase ~= 'preflop' then
            t.dealt, t.dealing = false, nil
        elseif not t.dealt then
            t.dealt = true
            if t.seen and not s.turn then deal(g, id) end
        end
        t.seen = true

        local pot = s.pot
        for seat = 1, 4 do
            local at = s.seats[seat]
            if not t.dealing then syncCards(t, seat, at and not at.folded and seatCards(id, seat) or {}, function(i) return Seats[seat].spots[i] end) end
            local amount = at and (s.phase == 'showdown' and at.won or s.phase ~= 'showdown' and at.bet) or 0
            g.SyncChips(t, seat, amount or 0, Seats[seat].chips)
            pot = pot - (at and s.phase ~= 'showdown' and at.bet or 0)
        end
        g.SyncChips(t, 'pot', s.phase == 'showdown' and 0 or math.max(pot, 0), PotSpots)
    end,

    message = function(g, id, s)
        local seats, mine = {}, nil
        for seat = 1, 4 do
            local at = s.seats[seat]
            if at then
                local own = at.src == Casino.Me()
                local entry = {
                    seat = seat, stack = at.stack, bet = at.bet, won = at.won, name = at.name, own = own, last = at.last,
                    folded = at.folded, allin = at.allin, turn = s.turn == seat, button = s.button == seat and at.cards ~= nil,
                    cards = type(at.cards) == 'table' and at.cards or nil, playing = at.cards ~= nil,
                }
                if own and at.cards and not at.folded and not g.Spawned[id].dealing then
                    mine = seatCards(id, seat)
                    local all = { table.unpack(mine) }
                    for _, card in ipairs(s.board) do all[#all + 1] = card end
                    if not entry.name and mine[1] ~= 'back' and #all >= 5 then entry.name = Cards.HandName(select(2, Cards.Poker(all))) end
                end
                entry.did = at.won and L('poker.did_wins', { amount = Format.Number(at.won) })
                    or at.folded and L('poker.did_folded')
                    or at.allin and (L('poker.did_allin') .. ((at.bet or 0) > 0 and ' ' .. Format.Number(at.bet) or ''))
                    or Did[at.last] and L(Did[at.last], { amount = Format.Number(at.bet) })
                    or (s.turn == seat and L('poker.did_thinking'))
                    or nil
                seats[#seats + 1] = entry
            end
        end
        return {
            phase = s.phase, pot = s.pot, bet = s.bet, board = s.board, seats = seats, mine = mine,
            keys = g.Sitting and g.Sitting.id == id and g.Keys or {},
            timer = s.deadline and s.turn and math.max(0, (s.deadline - GetGameTimer()) / 1000) or nil,
            total = Cfg.TurnTime,
        }
    end,

    draw = function(g, id, t, s)
        if not g.Visible(t) then return end
        local b = Cfg.Board
        local c = t.coords
        local piece = function(pos, width, x, y, w, h)
            Draw.Standing(g.Txd, pos, width, width * h / w, x / 1024, (x + w) / 1024, y / 832, (y + h) / 832)
        end
        local mine = g.Sitting and g.Sitting.id == id and g.Sitting.seat
        piece(GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, 0.0, 0.1635, b.Table.Z), b.Table.Width, 0, 0, 640, 256)
        for seat = 1, 4 do
            if s.seats[seat] and seat ~= mine then
                local chair = Casino.Chair(t.obj, seat)
                piece(vec3(chair.x, chair.y, c.z + b.Seat.Z), b.Seat.Width, (seat - 1) * 256, 256, 256, 256)
            end
        end
        if not mine then return end
        local cards = Seats[mine].cards
        piece(GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, cards.x, cards.y, b.Own.Z), b.Own.Width, 0, 512, 768, 320)
    end,

    sitArgs = function(g, id)
        local tcfg = Cfg.Tables[id]
        local chips = g.Chips()
        if chips < tcfg.min then
            g.Notify(L('poker.need_chips', { amount = Format.Chips(tcfg.min) }))
            return nil
        end
        return g.Ask(L('poker.title', { small = Format.Number(tcfg.small), big = Format.Number(tcfg.big) }), L('poker.buyin_label'), tcfg.min, math.min(tcfg.max, chips))
    end,

    onStand = function(_, id)
        Mine[id] = nil
    end,

    update = function(g, _, s)
        local at = s.seats[g.Sitting.seat]
        if s.phase ~= 'showdown' then g.Notified = false end
        if at and s.phase == 'showdown' and not g.Notified then
            g.Notified = true
            if at.won then g.Notify(L('table.won', { amount = Format.Chips(at.won) }), 'success') end
        end
    end,

    tick = function(g, s)
        local tcfg = Cfg.Tables[g.Sitting.id]
        local at = s.seats[g.Sitting.seat]
        local inHand = at and at.cards and not at.folded and s.phase ~= 'showdown'
        local myTurn = inHand and s.turn == g.Sitting.seat and not g.Busy
        local owe = myTurn and math.min(s.bet - at.bet, at.stack) or 0
        local canRaise = myTurn and at.stack > owe
        local canRebuy = at and not inHand and not g.Busy and at.stack < tcfg.max

        local keys = {}
        if myTurn then
            keys[#keys + 1] = { 'E', owe > 0 and L('poker.call', { amount = Format.Number(owe) }) or L('poker.check') }
            if canRaise then
                keys[#keys + 1] = { 'H', L(s.bet > 0 and 'poker.raise' or 'poker.bet') }
                keys[#keys + 1] = { 'F', L('poker.allin') }
            end
            keys[#keys + 1] = { 'G', L('poker.fold') }
        end
        if canRebuy then keys[#keys + 1] = { 'R', L('poker.rebuy') } end
        if not g.Busy then keys[#keys + 1] = { 'X', L(inHand and 'poker.fold_leave' or 'table.leave') } end
        g.SetKeys(keys)

        if myTurn and g.Pressed(38) then
            act(g, 'call')
        elseif canRaise and g.Pressed(74) then
            CreateThread(function() raise(g) end)
        elseif canRaise and g.Pressed(23) then
            act(g, 'raise', at.bet + at.stack)
        elseif myTurn and g.Pressed(47) then
            act(g, 'fold')
        elseif canRebuy and g.Pressed(45) then
            CreateThread(function() rebuy(g) end)
        elseif not g.Busy and g.Pressed(73) then
            g.StandUp()
        end
    end,
})

RegisterNetEvent(Util.Event('poker:cards'), function(id, cards)
    Mine[id] = cards
    if Game.Spawned[id] then Game.Spawned[id].dirty = true end
end)
