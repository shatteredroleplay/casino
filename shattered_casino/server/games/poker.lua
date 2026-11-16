local Cfg = Config.Poker
local CARDS = UtilEvent('poker:cards')
local Game

local put = function(s, amount)
	amount = math.min(amount, s.stack)
	s.stack, s.bet, s.total = s.stack - amount, s.bet + amount, s.total + amount
	if s.stack == 0 then
		s.allin = true
	end
end

local nextSeat = function(t, from, test)
	for i = 1, 4 do
		local n = (from + i - 1) % 4 + 1
		if test(t.seats[n]) then
			return n
		end
	end
end

local alive = function(t)
	local list = {}
	for _, p in ipairs(t.hand) do
		if not p.folded then
			list[#list + 1] = p
		end
	end
	return list
end

local pending = function(t)
	local able, owes, fresh = 0, false, false
	for _, p in ipairs(t.hand) do
		if not p.folded and not p.allin then
			able = able + 1
			if p.bet < t.bet then
				owes = true
			end
			if not p.acted then
				fresh = true
			end
		end
	end
	return owes or able > 1 and fresh
end

local bettingRound = function(g, t, seat)
	for _, p in ipairs(t.hand) do
		p.acted = false
	end
	while #alive(t) > 1 and pending(t) do
		local s = t.seats[seat]
		if s and s.cards and not s.folded and not s.allin and (not s.acted or s.bet < t.bet) then
			t.turn, t.deadline, s.done = seat, os.time() + Cfg.TurnTime, nil
			TableGameSync(g, t.id)
			TableGameUntil(g, function()
				return s.done or os.time() >= t.deadline
			end)
			if not s.done then
				if s.bet < t.bet then
					s.folded = true
				end
				s.acted, s.last = true, s.folded and 'fold' or 'check'
			end
		end
		seat = seat % 4 + 1
	end
	t.turn, t.deadline = nil, nil
end

local settle = function(t)
	local live, pot = alive(t), 0
	for _, p in ipairs(t.hand) do
		pot = pot + p.total
	end
	if #live > 1 then
		t.show = true
		for _, p in ipairs(live) do
			local cards = { table.unpack(p.cards) }
			for _, card in ipairs(t.board) do
				cards[#cards + 1] = card
			end
			local score, kind = CardsPoker(cards)
			p.score, p.name = score, CardsHandName(kind)
		end
	end

	local levels, seen = {}, {}
	for _, p in ipairs(live) do
		if not seen[p.total] then
			seen[p.total] = true
			levels[#levels + 1] = p.total
		end
	end
	table.sort(levels)

	local rake = #t.board >= 3 and math.min(math.floor(pot * Cfg.Rake), Cfg.RakeCap) or 0
	PoolRake(rake)

	local prev = 0
	for i, level in ipairs(levels) do
		local top = i == #levels and math.huge or level
		local amount, best, winners = 0, -1, {}
		for _, p in ipairs(t.hand) do
			amount = amount + math.min(p.total, top) - math.min(p.total, prev)
		end
		for _, p in ipairs(live) do
			local score = p.score or 0
			if p.total >= level and score >= best then
				if score > best then
					best, winners = score, {}
				end
				winners[#winners + 1] = p
			end
		end
		local take = math.min(rake, amount)
		rake, amount = rake - take, amount - take
		for n, p in ipairs(winners) do
			p.won = (p.won or 0) + amount // #winners + (n <= amount % #winners and 1 or 0)
		end
		prev = level
	end

	local rate = Config.Chips.Rate
	for _, p in ipairs(t.hand) do
		p.stack = p.stack + (p.won or 0)
		StatsRecord(p.id, 'poker', p.total * rate, (p.won or 0) * rate)
		PoolReport(p.id, (p.won or 0) - p.total, 'poker')
	end
	t.live = false
end

local play = function(g, t)
	local id, cfg = t.id, t.cfg
	local dealt = function(s)
		return s and s.stack >= cfg.big
	end
	t.hand, t.board, t.show, t.turn, t.bet, t.raise = {}, {}, false, nil, 0, 0

	local players = 0
	for n = 1, 4 do
		local s = t.seats[n]
		if s then
			s.cards, s.bet, s.total, s.folded, s.allin, s.won, s.name, s.score, s.last =
				nil, 0, 0, false, false, nil, nil, nil, nil
			if dealt(s) then
				players = players + 1
			end
		end
	end
	if players < 2 then
		t.phase = 'waiting'
		TableGameSync(g, id)
		Wait(2000)
		return
	end

	for n = 1, 4 do
		local s = t.seats[n]
		if s then
			s.idle = dealt(s) and 0 or s.idle + 1
			if s.idle >= Cfg.IdleRounds then
				TableGameLeave(g, s.src)
			end
		end
	end

	t.deck = CardsNewDeck(1)
	t.button = nextSeat(t, t.button, dealt) or 1
	t.live = true
	for n = 1, 4 do
		local s = t.seats[n]
		if dealt(s) then
			s.cards = { table.remove(t.deck), table.remove(t.deck) }
			t.hand[#t.hand + 1] = s
			TriggerClientEvent(CARDS, s.src, id, s.cards)
		end
	end
	if #t.hand < 2 then
		t.live = false
		return
	end

	local inHand = function(s)
		return s and s.cards and not s.folded
	end
	local small = #t.hand == 2 and t.button or nextSeat(t, t.button, inHand)
	local big = nextSeat(t, small, inHand)
	put(t.seats[small], cfg.small)
	put(t.seats[big], cfg.big)
	t.seats[small].last, t.seats[big].last = 'small', 'big'
	t.bet, t.raise = cfg.big, cfg.big
	t.phase = 'preflop'
	TableGameSync(g, id)
	Wait(#t.hand * 2 * Cfg.DealCard + 500)
	bettingRound(g, t, nextSeat(t, big, inHand))

	for _, street in ipairs({ { 'flop', 3 }, { 'turn', 1 }, { 'river', 1 } }) do
		if #alive(t) < 2 then
			break
		end
		for _, p in ipairs(t.hand) do
			p.bet, p.last = 0, nil
		end
		t.bet, t.raise = 0, cfg.big
		for _ = 1, street[2] do
			table.insert(t.board, table.remove(t.deck))
		end
		t.phase = street[1]
		TableGameSync(g, id)
		Wait(Cfg.DealTime)
		bettingRound(g, t, nextSeat(t, t.button, inHand) or 1)
	end

	settle(t)
	t.phase = 'showdown'
	TableGameSync(g, id)
	Wait(Cfg.ResultTime * 1000)
end

local Init = function(_, t)
	t.hand, t.board, t.button = {}, {}, 0
end

local Public = function(_, t)
	local seats, pot = {}, 0
	for _, p in ipairs(t.hand) do
		pot = pot + p.total
	end
	for n, s in pairs(t.seats) do
		seats[n] = {
			src = s.src,
			stack = s.stack,
			bet = s.bet,
			folded = s.folded,
			allin = s.allin,
			won = s.won,
			name = s.name,
			last = s.last,
			cards = s.cards and (t.show and not s.folded and s.cards or #s.cards) or nil,
		}
	end
	return {
		ped = t.ped,
		seats = seats,
		board = t.board,
		pot = pot,
		phase = t.phase,
		turn = t.turn,
		button = t.button,
		bet = t.bet or 0,
		raise = t.raise or 0,
		timeLeft = t.deadline and math.max(0, t.deadline - os.time()) or nil,
	}
end

local Seat = function(_, t, src, _, amount)
	amount = UtilInteger(amount)
	if not amount or amount < t.cfg.min or amount > t.cfg.max then
		return nil
	end
	local id = PlayersId(src)
	if not id then
		return nil
	end
	if not WalletRemove(src, amount) then
		return nil, L('error.not_enough_chips')
	end
	return { src = src, id = id, stack = amount, bet = 0, total = 0, idle = 0 }
end

local Left = function(g, t, src, _, s)
	if not s then
		return
	end
	s.folded, s.done = true, true
	if s.stack > 0 then
		WalletGive(s.id, s.stack, src)
	end
	s.stack = 0
end

local Refund = function(_, t)
	if not t.live then
		return
	end
	t.live = false
	for _, p in ipairs(t.hand) do
		p.stack, p.total = p.stack + p.total, 0
	end
end

local Stop = function(_, t)
	for _, s in pairs(t.seats) do
		if s.stack > 0 then
			WalletGive(s.id, s.stack, s.src)
		end
		s.stack = 0
	end
end

local Reset = function(_, t)
	t.hand, t.board, t.turn = {}, {}, nil
end

Game = TableGameNew({
	name = 'poker',
	config = Cfg,
	init = Init,
	public = Public,
	play = play,
	seat = Seat,
	left = Left,
	refund = Refund,
	stop = Stop,
	reset = Reset,
})

RpcRegister('poker:rebuy', function(src, amount)
	local at = Game.Seated[src]
	if not at then
		return false
	end
	local t = Game.Tables[at.id]
	local s = t.seats[at.seat]
	amount = UtilInteger(amount, 1)
	if s.cards and not s.folded and t.phase ~= 'showdown' then
		return false
	end
	if not amount or s.stack + amount > t.cfg.max then
		return false
	end
	if not WalletRemove(src, amount) then
		return L('error.not_enough_chips')
	end
	s.stack = s.stack + amount
	TableGameSync(Game, at.id)
	return true
end, 4)

local Fold = function(_, s)
	s.folded, s.last = true, 'fold'
	return true
end

local Call = function(t, s)
	s.last = t.bet > s.bet and 'call' or 'check'
	put(s, t.bet - s.bet)
	return true
end

local Raise = function(t, s, amount)
	amount = UtilInteger(amount)
	local most = s.bet + s.stack
	if not amount or amount > most or amount <= t.bet then
		return false
	end
	if amount - t.bet < t.raise and amount < most then
		return L('poker.min_raise', { amount = FormatNumber(t.bet + t.raise) })
	end
	if amount - t.bet >= t.raise then
		t.raise = amount - t.bet
		for _, p in ipairs(t.hand) do
			p.acted = false
		end
	end
	s.last = t.bet > 0 and 'raise' or 'bet'
	put(s, amount - s.bet)
	t.bet = amount
	return true
end

local Actions = {
	fold = Fold,
	call = Call,
	raise = Raise,
}

RpcRegister('poker:action', function(src, action, amount)
	local at = Game.Seated[src]
	local fn = type(action) == 'string' and Actions[action]
	if not at or not fn then
		return false
	end
	local t = Game.Tables[at.id]
	local s = t.seats[at.seat]
	if t.turn ~= at.seat or s.done or not s.cards or s.folded then
		return false
	end

	local res = fn(t, s, amount)
	if res ~= true then
		return res
	end
	s.acted, s.done = true, true
	TableGameSync(Game, at.id)
	return true
end)
