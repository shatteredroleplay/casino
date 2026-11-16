local Cfg = Config.Blackjack
local Game

local draw = function(t)
	return table.remove(t.deck)
end

local speakHand = function(id, cards, bust, delay)
	local value = CardsValue(cards)
	if CardsIsBlackjack(cards) then
		TableGameSpeak(Game, id, 'MINIGAME_BJACK_DEALER_BLACKJACK', delay)
	elseif value > 21 then
		TableGameSpeak(Game, id, bust, delay)
	else
		TableGameSpeak(Game, id, 'MINIGAME_BJACK_DEALER_' .. value, delay)
	end
end

local drawFor = function(t, id, cards)
	local want = t.wants and t.wants[id]
	if not want then
		return draw(t)
	end

	local deck, pick, best = t.deck, nil, nil
	for i = #deck, math.max(1, #deck - 12), -1 do
		local v = CardsValue({ deck[i], table.unpack(cards) })
		local s
		if want > 0 then
			s = v <= 21 and v or -v
		else
			s = v > 21 and 100 or -v
		end
		if not best or s > best then
			pick, best = i, s
		end
	end
	return table.remove(deck, pick)
end

local rigDeal = function(t)
	local seats = {}
	for seat = 4, 1, -1 do
		if t.hands[seat] then
			seats[#seats + 1] = seat
		end
	end

	t.deck = RigPick('blackjack', t.wants, t.deck, function()
		return RigShuffle(t.deck)
	end, function(deck)
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

		local nets, dbj, dv = {}, CardsIsBlackjack(dealer), CardsValue(dealer)
		for _, seat in ipairs(seats) do
			local hand, v, q = t.hands[seat], CardsValue(cards[seat]), 0
			if CardsIsBlackjack(cards[seat]) then
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
	t.deck = RigPick('blackjack', t.wants, t.deck, function()
		return RigShuffle(t.deck)
	end, function(deck)
		local dealer, n = { table.unpack(t.dealer) }, #deck
		while CardsValue(dealer) < 17 do
			dealer[#dealer + 1] = deck[n]
			n = n - 1
		end
		local nets = {}
		for _, hand in pairs(t.hands) do
			for _, part in ipairs({ hand, hand.split }) do
				nets[hand.id] = (nets[hand.id] or 0) + CardsPayout(part, dealer, hand.split) - part.bet
			end
		end
		return nets
	end)
end

local allBet = function(t)
	for seat in pairs(t.seats) do
		if not t.hands[seat] then
			return false
		end
	end
	return true
end

local play = function(g, t)
	local id = t.id
	t.hands, t.dealer, t.turn, t.hidden, t.wants = {}, {}, nil, true, nil
	t.deck = CardsNewDeck(6)
	t.phase = 'betting'
	t.deadline = os.time() + Cfg.BetTime
	TableGameSync(g, id)
	TableGameSpeak(g, id, 'MINIGAME_DEALER_PLACE_CHIPS')
	TableGameUntil(g, function()
		return os.time() >= t.deadline or allBet(t) or not next(t.seats)
	end)
	t.deadline = nil

	TableGameIdle(g, t, function(seat)
		return t.hands[seat] ~= nil
	end)

	if not next(t.hands) then
		t.phase = 'idle'
		TableGameSync(g, id)
		Wait(1000)
		return
	end

	local ids = {}
	for _, hand in pairs(t.hands) do
		ids[hand.id] = true
	end
	t.wants = RigWants('blackjack', ids)
	if t.wants then
		rigDeal(t)
	end

	t.phase = 'dealing'
	TableGameSpeak(g, id, 'MINIGAME_DEALER_CLOSED_BETS')
	Wait(1500)
	for _ = 1, 2 do
		table.insert(t.dealer, draw(t))
		TableGameSync(g, id)
		Wait(Cfg.DealTime)
		for seat = 4, 1, -1 do
			if t.hands[seat] then
				table.insert(t.hands[seat].cards, draw(t))
				TableGameSync(g, id)
				Wait(Cfg.DealTime)
			end
		end
	end

	TableGameSpeak(g, id, 'MINIGAME_BJACK_DEALER_' .. CardsValue({ t.dealer[2] }))
	Wait(1500)

	t.phase = 'playing'
	if not CardsIsBlackjack(t.dealer) then
		for seat = 4, 1, -1 do
			local hand = t.hands[seat]
			if hand then
				if CardsIsBlackjack(hand.cards) then
					hand.status = 'blackjack'
					TableGameSpeak(g, id, 'MINIGAME_BJACK_DEALER_BLACKJACK')
					Wait(1500)
				else
					t.turn = seat
					local part = hand
					while part do
						if not part.status then
							speakHand(id, part.cards)
						end
						t.deadline = os.time() + Cfg.TurnTime
						TableGameSync(g, id)
						TableGameUntil(g, function()
							local at = g.Seated[hand.src]
							return part.status or os.time() >= t.deadline or not at or at.id ~= id or at.seat ~= seat
						end)
						part.status = part.status or 'stand'
						TableGameUntil(g, function()
							return GetGameTimer() >= (t.busyUntil or 0)
						end)
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
			if part.status == 'stand' then
				standing = standing + part.bet
			end
		end
	end

	t.phase = 'dealer'
	t.hidden = false
	TableGameSync(g, id)
	Wait(Cfg.RevealTime)

	if t.wants and standing > 0 then
		rigDealer(t)
	end
	while standing > 0 and CardsValue(t.dealer) < 17 do
		table.insert(t.dealer, draw(t))
		if not t.wants and CardsValue(t.dealer) > 21 and PoolProtect(standing) then
			table.insert(t.deck, 1, table.remove(t.dealer))
			table.insert(t.dealer, draw(t))
		end
		TableGameSync(g, id)
		Wait(Cfg.DealTime)
	end
	speakHand(id, t.dealer, 'MINIGAME_DEALER_BUSTS')

	for _, hand in pairs(t.hands) do
		for _, part in ipairs({ hand, hand.split }) do
			part.payout = CardsPayout(part, t.dealer, hand.split)
			TableGameSettle(g, hand.id, part.bet, part.payout)
		end
	end

	t.phase = 'result'
	TableGameSync(g, id)
	Wait(Cfg.ResultTime * 1000)
end

local Init = function(_, t)
	t.hands, t.dealer = {}, {}
end

local Public = function(g, t)
	local dealer = {}
	for i, card in ipairs(t.dealer) do
		dealer[i] = i == 1 and t.hidden and 'back' or card
	end
	local hands = {}
	for seat, hand in pairs(t.hands) do
		hands[seat] = {
			src = hand.src,
			cards = hand.cards,
			bet = hand.bet,
			status = hand.status,
			payout = hand.payout,
			split = hand.split,
		}
	end
	return {
		ped = t.ped,
		seats = t.seats,
		hands = hands,
		dealer = dealer,
		phase = t.phase,
		turn = t.turn,
		max = TableGameMaxBet(g, t),
		timeLeft = TableGameTimeLeft(g, t),
	}
end

local Refund = function(g, t)
	for _, hand in pairs(t.hands) do
		for _, part in ipairs({ hand, hand.split }) do
			if not part.payout and TableGameRefund(g, hand.id, part.bet) then
				part.payout = part.bet
			end
		end
	end
end

local Reset = function(_, t)
	t.hands, t.dealer, t.turn = {}, {}, nil
end

Game = TableGameNew({
	name = 'blackjack',
	config = Cfg,
	greet = 'MINIGAME_DEALER_GREET',
	bye = 'MINIGAME_DEALER_LEAVE_NEUTRAL_GAME',

	init = Init,
	public = Public,
	play = play,
	refund = Refund,
	reset = Reset,
})

RpcRegister('blackjack:bet', function(src, amount)
	local at = Game.Seated[src]
	if not at then
		return false
	end
	local t = Game.Tables[at.id]
	amount = UtilInteger(amount)

	if t.phase ~= 'betting' or t.hands[at.seat] or not amount then
		return false
	end
	local max = TableGameMaxBet(Game, t)
	if max < t.cfg.min then
		return L('table.closed')
	end
	if amount < t.cfg.min or amount > max then
		return L('table.max_bet', { amount = FormatChips(max) })
	end
	local id = PlayersId(src)
	if not id then
		return false
	end
	if not TableGameTake(Game, src, amount) then
		return L('error.not_enough_chips')
	end

	t.hands[at.seat] = { src = src, id = id, cards = {}, bet = amount }
	TableGameSync(Game, at.id)
	return true
end, 4)

local Split = function(t, src, main, hand)
	if main.split or #hand.cards ~= 2 or CardsValue({ hand.cards[1] }) ~= CardsValue({ hand.cards[2] }) then
		return false
	end
	if not TableGameTake(Game, src, hand.bet) then
		return L('error.not_enough_chips')
	end
	local moved = table.remove(hand.cards)
	hand.split = { cards = { moved, drawFor(t, main.id, { moved }) }, bet = hand.bet }
	table.insert(hand.cards, drawFor(t, main.id, hand.cards))
	for _, part in ipairs({ hand, hand.split }) do
		if CardsValue(part.cards) == 21 then
			part.status = 'stand'
		end
	end
	t.deadline = os.time() + Cfg.TurnTime
	t.busyUntil = GetGameTimer() + Cfg.HitTime
	return true
end

local Double = function(t, src, main, hand)
	if #hand.cards ~= 2 then
		return false
	end
	if not TableGameTake(Game, src, hand.bet) then
		return L('error.not_enough_chips')
	end
	hand.bet = hand.bet * 2
	table.insert(hand.cards, drawFor(t, main.id, hand.cards))
	hand.status = CardsValue(hand.cards) > 21 and 'bust' or 'stand'
	t.busyUntil = GetGameTimer() + Cfg.HitTime
	speakHand(t.id, hand.cards, 'MINIGAME_BJACK_DEALER_PLAYER_BUST', Cfg.CardInHand)
	return true
end

local Hit = function(t, _, main, hand)
	table.insert(hand.cards, drawFor(t, main.id, hand.cards))
	t.busyUntil = GetGameTimer() + Cfg.HitTime
	local value = CardsValue(hand.cards)
	speakHand(t.id, hand.cards, 'MINIGAME_BJACK_DEALER_PLAYER_BUST', Cfg.CardInHand)
	if value > 21 then
		hand.status = 'bust'
	elseif value == 21 then
		hand.status = 'stand'
	end
	return true
end

local Stand = function(t, _, _, hand)
	hand.status = 'stand'
	t.busyUntil = GetGameTimer() + 1000
	return true
end

local Actions = {
	split = Split,
	double = Double,
	hit = Hit,
	stand = Stand,
}

RpcRegister('blackjack:action', function(src, action)
	local at = Game.Seated[src]
	local fn = type(action) == 'string' and Actions[action]
	if not at or not fn then
		return false
	end
	local t = Game.Tables[at.id]
	local main = t.hands[at.seat]

	if t.phase ~= 'playing' or t.turn ~= at.seat or not main or main.src ~= src then
		return false
	end
	if GetGameTimer() < (t.busyUntil or 0) then
		return false
	end
	local hand = main.status and main.split or main
	if not hand or hand.status then
		return false
	end

	local res = fn(t, src, main, hand)
	if res == true then
		TableGameSync(Game, at.id)
	end
	return res
end)
