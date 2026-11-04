local Cfg = Config.Baccarat
local PLAYER = 'anim_casino_b@amb@casino@games@blackjack@player'
local DEALER = 'anim_casino_b@amb@casino@games@blackjack@dealer'
local SIDES = { 'player', 'bank', 'tie' }
local Game

local HandX = { player = { -0.230, -0.155, -0.080 }, bank = { 0.080, 0.155, 0.230 } }
local Zones = {
    { tie = vec2(-0.6472, 0.1932), bank = vec2(-0.6888, 0.1753), player = vec2(-0.7305, 0.1575), heading = -66.8 },
    { tie = vec2(-0.2633, -0.1797), bank = vec2(-0.2798, -0.2220), player = vec2(-0.2962, -0.2642), heading = -21.2 },
    { tie = vec2(0.2631, -0.1796), bank = vec2(0.2795, -0.2219), player = vec2(0.2958, -0.2642), heading = 21.2 },
    { tie = vec2(0.6468, 0.2121), bank = vec2(0.6884, 0.1942), player = vec2(0.7301, 0.1764), heading = 66.8 },
}

for _, zones in ipairs(Zones) do
    local a = math.rad(zones.heading)
    local along = vec2(math.cos(a), math.sin(a)) * 0.02
    zones.spots = {}
    for _, side in ipairs(SIDES) do
        zones.spots[side] = { { zones[side] - along, zones.heading }, { zones[side] + along, zones.heading } }
    end
end

local Keys = { player = { 'E', 38 }, bank = { 'G', 47 }, tie = { 'H', 74 } }

local syncCards = function(g, t, hand, cards)
    local list = t.cards[hand] or {}
    t.cards[hand] = list
    for i = #list, #cards + 1, -1 do
        DeleteObject(list[i])
        list[i] = nil
    end
    for i = #list + 1, #cards do
        local model = Casino.LoadModel('vw_prop_cas_card_' .. cards[i])
        if not model then break end
        local c = t.coords
        local pos = GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, HandX[hand][i], 0.262, 0.950)
        local obj = CreateObjectNoOffset(model, pos.x, pos.y, pos.z, false, false, false)
        SetEntityCollision(obj, false, false)
        FreezeEntityPosition(obj, true)
        SetEntityRotation(obj, 0.0, 0.0, c.w, 2, true)
        list[i] = obj
        if t.animate then g.DealerScene(t, DEALER, 'female_deal_card_self', false) end
    end
end

local myBet = function(g, s)
    local bet = g.Sitting and s and s.bets[g.Sitting.seat]
    return bet and bet.src == Casino.Me() and bet or nil
end

local staked = function(bet)
    return (bet.player or 0) + (bet.bank or 0) + (bet.tie or 0)
end

local bet = function(g, side)
    if not g.Sitting then return end
    local tcfg, s = Cfg.Tables[g.Sitting.id], g.States[g.Sitting.id]
    local mine = myBet(g, s)
    local chips = g.Chips()
    local max = math.min(s.max - (mine and staked(mine) or 0), chips)
    if max < tcfg.min then
        return g.Notify(chips < tcfg.min and L('table.need_chips', { amount = Format.Chips(tcfg.min) }) or L('bacc.no_more'))
    end
    local amount = g.Ask(L('table.bet_title', { game = L('bacc.' .. side), min = Format.Number(tcfg.min), max = Format.Number(max) }), L('table.bet'), tcfg.min, max)
    if not amount or not g.Sitting then return end
    local res = g.Rpc('bet', side, amount)
    if res == true then
        g.Gesture(PLAYER, 'place_bet_small')
    else
        g.Notify(type(res) == 'string' and res or L('table.bet_failed'))
    end
end

Game = TableGame.New({
    name = 'baccarat',
    config = Cfg,
    models = { 'vw_prop_casino_baccarat_01', 'vw_prop_casino_baccarat_01b' },
    board = { page = 'baccarat', width = 1024, height = 384, prefixes = { 'bacc.', 'table.' } },

    render = function(g, t, s)
        syncCards(g, t, 'player', s.player)
        syncCards(g, t, 'bank', s.bank)
        for seat = 1, 4 do
            local b = s.bets[seat]
            for _, side in ipairs(SIDES) do
                local lost = s.phase == 'result' and side ~= s.winner and s.winner ~= 'tie'
                g.SyncChips(t, seat .. side, b and not lost and b[side] or 0, Zones[seat].spots[side])
            end
        end
    end,

    message = function(g, id, s)
        local mine = g.Sitting and g.Sitting.id == id
        local b = mine and myBet(g, s)
        return {
            phase = s.phase, winner = s.winner,
            player = #s.player > 0 and Cards.Points(s.player) or nil, bank = #s.bank > 0 and Cards.Points(s.bank) or nil,
            bets = b and { player = b.player, bank = b.bank, tie = b.tie, payout = b.payout } or nil,
            keys = mine and g.Keys or {},
            timer = mine and s.phase == 'betting' and s.deadline and math.max(0, (s.deadline - GetGameTimer()) / 1000) or nil,
            total = Cfg.BetTime,
        }
    end,

    draw = function(g, id, t, s)
        if not g.Visible(t) then return end
        local c = t.coords
        local w = Cfg.Board.Width
        local h = w * 3 / 32
        for i, hand in ipairs({ 'player', 'bank' }) do
            local n = #s[hand]
            if n > 0 then
                local x = 0.0
                for k = 1, n do x = x + HandX[hand][k] end
                Draw.Standing(g.Txd, GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, x / n, 0.262, Cfg.Board.Z), w / 8, h, (i - 1) / 8, i / 8, 0.75, 1.0)
            end
        end
        Draw.Standing(g.Txd, GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, 0.0, 0.262, Cfg.Board.Z + h), w, h, 0.0, 1.0, 0.0, 0.25)
        if not g.Sitting or g.Sitting.id ~= id then return end
        local ped, p = PlayerPedId(), Cfg.Board.Prompt
        local me, fwd = GetEntityCoords(ped), GetEntityForwardVector(ped)
        Draw.Standing(g.Txd, vec3(me.x + fwd.x * p.Forward, me.y + fwd.y * p.Forward, c.z + p.Z), p.Width, p.Width * 3 / 16, 0.0, 1.0, 0.25, 0.75)
    end,

    update = function(g, _, s)
        local b = myBet(g, s)
        if s.phase ~= 'result' then g.Notified = false end
        if b and s.phase == 'result' and not g.Notified and b.payout then
            g.Notified = true
            Casino.Result('baccarat', staked(b), b.payout)
        end
    end,

    tick = function(g, s)
        local canBet = s.phase == 'betting' and not g.Busy
        local canLeave = not g.Busy and (not myBet(g, s) or s.phase == 'result' or s.phase == 'idle')

        local keys = {}
        if canBet then
            for _, side in ipairs(SIDES) do keys[#keys + 1] = { Keys[side][1], L('bacc.' .. side), side } end
        end
        if canLeave then keys[#keys + 1] = { 'X', L('table.leave') } end
        g.SetKeys(keys)

        if canBet then
            for _, side in ipairs(SIDES) do
                if g.Pressed(Keys[side][2]) then
                    g.Busy = true
                    CreateThread(function()
                        bet(g, side)
                        g.Busy = false
                    end)
                    return
                end
            end
        end
        if canLeave and g.Pressed(73) then g.StandUp() end
    end,
})
