local Cfg = Config.Roulette
local Game

local nets = function(t, number)
	local list, loss = {}, 0
	for _, bet in ipairs(t.bets) do
		local net = RoulettePayout(bet.bet, bet.amount, number) - bet.amount
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
	TableGameSync(g, id)
	TableGameSpeak(g, id, 'MINIGAME_DEALER_PLACE_CHIPS')
	TableGameUntil(g, function()
		return os.time() >= t.deadline or not next(t.seats)
	end)
	t.deadline = nil

	local placed = {}
	for _, bet in ipairs(t.bets) do
		placed[bet.seat] = true
	end
	TableGameIdle(g, t, function(seat)
		return placed[seat] == true
	end)

	if #t.bets == 0 then
		t.phase = 'idle'
		TableGameSync(g, id)
		Wait(1000)
		return
	end

	t.phase = 'spinning'
	t.tick = math.random(#Roulette.Wheel)
	local ids = {}
	for _, bet in ipairs(t.bets) do
		ids[bet.id] = true
	end
	local wants = RigWants('roulette', ids)
	if wants then
		t.tick = RigPick('roulette', wants, t.tick, function()
			return math.random(#Roulette.Wheel)
		end, function(tick)
			return (nets(t, Roulette.Wheel[tick]))
		end)
	else
		local _, loss = nets(t, Roulette.Wheel[t.tick])
		if PoolProtect(loss) then
			t.tick = math.random(#Roulette.Wheel)
		end
	end
	TableGameSync(g, id)
	TableGameSpeak(g, id, 'MINIGAME_DEALER_CLOSED_BETS')
	Wait(Cfg.SpinTime)

	t.number = Roulette.Wheel[t.tick]
	table.insert(t.history, 1, t.number)
	t.history[11] = nil
	TableGameSpeak(g, id, 'MINIGAME_ROULETTE_BALL_' .. t.number)

	for _, bet in ipairs(t.bets) do
		bet.payout = RoulettePayout(bet.bet, bet.amount, t.number)
		TableGameSettle(g, bet.id, bet.amount, bet.payout)
	end

	t.phase = 'result'
	TableGameSync(g, id)
	Wait(Cfg.ResultTime * 1000)
end

local Init = function(_, t)
	t.bets, t.history = {}, {}
end

local Public = function(g, t)
	local bets = {}
	for i, bet in ipairs(t.bets) do
		bets[i] = { src = bet.src, seat = bet.seat, bet = bet.bet, amount = bet.amount, payout = bet.payout }
	end
	return {
		ped = t.ped,
		seats = t.seats,
		bets = bets,
		phase = t.phase,
		tick = t.tick,
		number = t.number,
		history = t.history,
		max = TableGameMaxBet(g, t),
		timeLeft = TableGameTimeLeft(g, t),
	}
end

local Left = function(g, t, src)
	local refunded = 0
	if t.phase ~= 'betting' then
		return refunded
	end
	for i = #t.bets, 1, -1 do
		local bet = t.bets[i]
		if bet.src == src and TableGameRefund(g, bet.id, bet.amount) then
			refunded = refunded + bet.amount
			table.remove(t.bets, i)
		end
	end
	return refunded
end

local Refund = function(g, t)
	for _, bet in ipairs(t.bets) do
		if not bet.payout and TableGameRefund(g, bet.id, bet.amount) then
			bet.payout = bet.amount
		end
	end
end

local Reset = function(_, t)
	t.bets, t.tick, t.number = {}, nil, nil
end

Game = TableGameNew({
	name = 'roulette',
	config = Cfg,
	greet = 'MINIGAME_DEALER_GREET',
	bye = 'MINIGAME_DEALER_LEAVE_NEUTRAL_GAME',

	init = Init,
	public = Public,
	play = play,
	left = Left,
	refund = Refund,
	reset = Reset,
})

RpcRegister('roulette:bet', function(src, betId, amount)
	local at = Game.Seated[src]
	if not at then
		return false
	end
	local t = Game.Tables[at.id]
	local def = type(betId) == 'string' and Roulette.Bets[betId]
	amount = UtilInteger(amount, 1)
	if t.phase ~= 'betting' or not def or not amount then
		return false
	end

	local id = PlayersId(src)
	if not id then
		return false
	end

	local existing, count = nil, 0
	for _, bet in ipairs(t.bets) do
		if bet.id == id then
			count = count + 1
			if bet.bet == betId then
				existing = bet
			end
		end
	end
	if not existing and count >= Cfg.MaxBets then
		return L('roulette.max_bets', { count = Cfg.MaxBets })
	end

	local max = RouletteMaxBet(betId, TableGameMaxBet(Game, t))
	local total = amount + (existing and existing.amount or 0)
	if max < t.cfg.min then
		return L('roulette.bet_closed')
	end
	if amount < t.cfg.min or total > max then
		return L('roulette.bet_max', { bet = RouletteLabel(betId), amount = FormatChips(max) })
	end
	if not TableGameTake(Game, src, amount) then
		return L('error.not_enough_chips')
	end

	if existing then
		existing.amount, existing.seat, existing.src = total, at.seat, src
	else
		t.bets[#t.bets + 1] = { src = src, id = id, seat = at.seat, bet = betId, amount = amount }
	end
	TableGameSync(Game, at.id)
	return true
end, 8)
