local Cfg = Config.Blackjack
local SHARED = TableGame.Shared
local PLAYER = 'anim_casino_b@amb@casino@games@blackjack@player'
local DEALER = 'anim_casino_b@amb@casino@games@blackjack@dealer'
local HANDS = { 'dealer', 1, 2, 3, 4, 5, 6, 7, 8 }
local Game, OnHand, Ready

local Keys = {
	{ 'bet', 'E', 'table.bet' },
	{ 'hit', 'E', 'bj.hit' },
	{ 'stand', 'G', 'bj.stand' },
	{ 'double', 'H', 'bj.double' },
	{ 'split', 'F', 'bj.split' },
	{ 'leave', 'X', 'table.leave' },
}

local dealAnim = function(key, i)
	if key == 'dealer' then
		return i == 2 and 'female_deal_card_self_second_card' or 'female_deal_card_self'
	end
	return (i <= 2 and 'female_deal_card_player_0' or 'female_hit_card_player_0') .. (4 - (key - 1) % 4)
end

local placeCard = function(t, key, i, card)
	local slots = key == 'dealer' and CardOffsets.dealer or CardOffsets[5 - key]
	local slot = slots[math.min(i, #slots)]
	local c = t.coords
	local pos = GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, slot[1].x, slot[1].y, slot[1].z + Cfg.CardLift)
	DetachEntity(card.obj, false, false)
	FreezeEntityPosition(card.obj, true)
	SetEntityCoordsNoOffset(card.obj, pos.x, pos.y, pos.z, false, false, false)
	SetEntityRotation(card.obj, card.code == 'back' and 180.0 or 0.0, 0.0, c.w + slot[2], 2, true)
end

local spawnCard = function(t, key, i, code, animate)
	local model = CasinoLoadModel('vw_prop_cas_card_' .. (code == 'back' and 'spd_ace' or code))
	if not model then
		return
	end
	local c = t.coords
	local card = { code = code, obj = CreateObjectNoOffset(model, c.x, c.y, c.z, false, false, false) }
	SetEntityCollision(card.obj, false, false)

	if not animate then
		placeCard(t, key, i, card)
		return card
	end

	AttachEntityToEntity(
		card.obj,
		t.dealer,
		GetPedBoneIndex(t.dealer, 28422),
		0.0,
		0.0,
		0.0,
		0.0,
		0.0,
		0.0,
		false,
		false,
		false,
		true,
		2,
		true
	)
	CreateThread(function()
		Wait(Cfg.CardInHand)
		if DoesEntityExist(card.obj) then
			placeCard(t, key, i, card)
		end
	end)
	return card
end

local syncCards = function(t, key, cards, animate)
	local list = t.cards[key] or {}
	t.cards[key] = list

	for i, card in ipairs(list) do
		if card.code == 'back' and cards[i] and cards[i] ~= 'back' then
			local code = cards[i]
			card.code = code
			if animate then
				TableGameDealerScene(Game, t, DEALER, 'female_turn_card', false)
			end
			CreateThread(function()
				if animate then
					Wait(Cfg.FlipDelay)
				end
				if list[i] ~= card or not DoesEntityExist(card.obj) then
					return
				end
				DeleteObject(card.obj)
				list[i] = spawnCard(t, key, i, code, false) or { code = code, obj = 0 }
			end)
		end
	end

	local keep = 1
	while list[keep] and list[keep].code == cards[keep] do
		keep = keep + 1
	end
	for i = #list, keep, -1 do
		DeleteObject(list[i].obj)
		list[i] = nil
	end

	for i = #list + 1, #cards do
		local card = spawnCard(t, key, i, cards[i], animate)
		if not card then
			break
		end
		list[i] = card
		if animate then
			TableGameDealerScene(Game, t, DEALER, dealAnim(key, i), false)
		end
	end
end

local myHand = function(g, s)
	local hand = s and s.hands[g.Sitting.seat]
	return hand and hand.src == CasinoMe() and hand or nil
end

local activeHand = function(hand)
	return hand and hand.status and hand.split or hand
end

local handCards = function(s, key)
	if key == 'dealer' then
		return s.dealer
	end
	local hand = s.hands[(key - 1) % 4 + 1]
	if not hand then
		return {}
	end
	if key > 4 then
		return hand.split and hand.split.cards or {}, true
	end
	return hand.cards, hand.split
end

local timeLeft = function(g, id, s)
	if not g.Sitting or g.Sitting.id ~= id or not s.deadline then
		return
	end
	local hand = activeHand(s.hands[g.Sitting.seat])
	local myTurn = s.turn == g.Sitting.seat and hand and #hand.cards == 2 and not hand.status
	if (s.phase ~= 'betting' or not Ready) and not myTurn then
		return
	end
	return math.max(0, (s.deadline - GetGameTimer()) / 1000)
end

local tableClear = function(g, id)
	for _, list in pairs(g.Spawned[id] and g.Spawned[id].cards or {}) do
		if #list > 0 then
			return false
		end
	end
	return true
end

local bet = function(g)
	if not g.Sitting then
		return
	end
	local tcfg = Cfg.Tables[g.Sitting.id]
	local max = g.States[g.Sitting.id] and g.States[g.Sitting.id].max or tcfg.max
	if max < tcfg.min then
		return TableGameNotify(g, L('table.closed'))
	end
	local chips = TableGameChips(g)
	if chips < tcfg.min then
		return TableGameNotify(g, L('table.need_chips', { amount = FormatChips(tcfg.min) }))
	end
	max = math.min(max, chips)

	local amount = TableGameAsk(
		g,
		L('table.bet_title', { game = g.Title, min = FormatNumber(tcfg.min), max = FormatNumber(max) }),
		L('table.bet'),
		tcfg.min,
		max
	)
	if not amount or not g.Sitting then
		return
	end
	local res = TableGameRpc(g, 'bet', amount)
	if res == true then
		TableGameGesture(g, PLAYER, 'place_bet_small')
	else
		TableGameNotify(g, type(res) == 'string' and res or L('table.bet_failed'))
	end
end

local act = function(g, action, anim)
	RpcAsync('blackjack:action', function(res)
		if res == true then
			TableGameGesture(g, PLAYER, anim)
		elseif type(res) == 'string' then
			TableGameNotify(g, res)
		end
	end, action)
end

local Render = function(g, t, s)
	syncCards(t, 'dealer', s.dealer or {}, t.animate)
	for seat = 1, 4 do
		local hand = s.hands[seat]
		local split = hand and hand.split
		syncCards(t, seat, hand and hand.cards or {}, t.animate)
		syncCards(t, seat + 4, split and split.cards or {}, t.animate)
		local amount = 0
		for _, part in ipairs({ hand, split }) do
			amount = amount + (s.phase == 'result' and (part.payout or 0) or part.bet)
		end
		TableGameSyncChips(g, t, seat, amount, ChipOffsets[5 - seat], ChipHeight, Cfg.CardLift)
	end
end

local Message = function(g, id, s)
	local nums = {}
	for i, key in ipairs(HANDS) do
		local cards, split = handCards(s, key)
		nums[i] = { value = CardsValue(cards), blackjack = not split and CardsIsBlackjack(cards) }
	end
	local keys = {}
	for _, k in ipairs(g.Keys) do
		keys[#keys + 1] = { k[1], k[2] }
	end
	return {
		nums = nums,
		keys = keys,
		left = OnHand,
		timer = timeLeft(g, id, s),
		total = s.phase == 'betting' and Cfg.BetTime or Cfg.TurnTime,
	}
end

local Draw = function(g, id, t, s)
	if not TableGameVisible(g, t) then
		return
	end
	local c = t.coords
	local cam = GetFinalRenderedCamCoord()
	local size = Cfg.Board.Number / 2
	local mine = g.Sitting and g.Sitting.id == id and g.Sitting.seat
	local hand = mine and s.hands[mine]
	if hand and hand.status and hand.split then
		mine = mine + 4
	end
	local handPos
	for i, key in ipairs(HANDS) do
		local cards = handCards(s, key)
		if #cards > 0 then
			local slots = key == 'dealer' and CardOffsets.dealer or CardOffsets[5 - key]
			local sum = vec3(0.0, 0.0, 0.0)
			for n = 1, math.min(#cards, #slots) do
				sum = sum + slots[n][1]
			end
			local o = sum / math.min(#cards, #slots)
			local pos = GetObjectOffsetFromCoords(c.x, c.y, c.z, c.w, o.x, o.y, o.z + Cfg.Board.NumberLift)
			local d = cam - pos
			local r = norm(vec3(-d.y, d.x, 0.0)) * size
			DrawQuad(g.Txd, pos, r, vec3(0.0, 0.0, size / 2), (i - 1) / 9, 0.0, i / 9, 0.2)
			if key == mine then
				handPos = pos
			end
		end
	end

	if not mine or #g.Keys == 0 and not timeLeft(g, id, s) then
		return
	end
	local pos = handPos
	if not (OnHand and handPos) then
		local ped = PlayerPedId()
		local me, fwd = GetEntityCoords(ped), GetEntityForwardVector(ped)
		pos = vec3(
			me.x + fwd.x * Cfg.Board.PromptForward,
			me.y + fwd.y * Cfg.Board.PromptForward,
			c.z + Cfg.Board.PromptZ
		)
	end
	local d = cam - pos
	local right = norm(vec3(-d.y, d.x, 0.0))
	local w = size * 5
	if OnHand and handPos then
		pos = pos + right * (size + Cfg.Board.PromptGap + w)
	end
	DrawQuad(g.Txd, pos, right * w, vec3(0.0, 0.0, w * 0.4), 0.0, 0.2, 5 / 9, 1.0)
end

local OnSit = function(g)
	Ready, g.ReadyAt = false, GetGameTimer()
end

local Update = function(g, _, s)
	local hand = myHand(g, s)
	if s.phase ~= 'result' then
		g.Notified = false
	end
	if hand and s.phase == 'result' and not g.Notified and hand.payout then
		g.Notified = true
		local staked, payout = hand.bet, hand.payout
		if hand.split then
			staked, payout = staked + hand.split.bet, payout + (hand.split.payout or 0)
		end
		CasinoResult('blackjack', staked, payout)
	end
end

local Tick = function(g, s, t)
	local id = g.Sitting.id
	local hand = myHand(g, s)
	if not tableClear(g, id) then
		g.ReadyAt = nil
	elseif not g.ReadyAt then
		g.ReadyAt = GetGameTimer() + Cfg.PromptDelay
	end
	Ready = g.ReadyAt and GetGameTimer() >= g.ReadyAt
	local canBet = Ready and s.phase == 'betting' and not s.hands[g.Sitting.seat] and not g.Busy
	local active = activeHand(hand)
	local myTurn = s.phase == 'playing' and s.turn == g.Sitting.seat and active and not active.status
	local canDouble = myTurn and #active.cards == 2
	local canSplit = canDouble and not hand.split and CardsValue({ active.cards[1] }) == CardsValue({ active.cards[2] })
	local canLeave = Ready and (not hand or s.phase == 'betting' or s.phase == 'result' or s.phase == 'idle')

	local allowed =
		{ bet = canBet, hit = myTurn, stand = myTurn, double = canDouble, split = canSplit, leave = canLeave }
	local keys = {}
	for _, k in ipairs(Keys) do
		if allowed[k[1]] then
			keys[#keys + 1] = { k[2], L(k[3]) }
		end
	end
	OnHand = myTurn
	TableGameSetKeys(g, keys)

	if TableGamePressed(g, 38) then
		if canBet then
			g.Busy = true
			CreateThread(function()
				bet(g)
				g.Busy = false
			end)
		elseif myTurn then
			act(g, 'hit', 'request_card')
		end
	elseif myTurn and TableGamePressed(g, 47) then
		act(g, 'stand', 'decline_card_001')
	elseif canDouble and TableGamePressed(g, 74) then
		act(g, 'double', 'place_bet_double_down')
	elseif canSplit and TableGamePressed(g, 23) then
		act(g, 'split', 'place_bet_double_down')
	elseif canLeave and TableGamePressed(g, 73) then
		TableGameStandUp(g)
	end
end

Game = TableGameNew({
	name = 'blackjack',
	config = Cfg,
	models = { 'vw_prop_casino_blckjack_01', 'vw_prop_casino_blckjack_01b' },
	board = { page = 'blackjack', width = 1152, height = 320, prefixes = { 'table.', 'bj.' } },

	render = Render,
	message = Message,
	draw = Draw,
	onSit = OnSit,
	update = Update,
	tick = Tick,
})
