local Cfg = Config.Baccarat
local Sides = { player = 1, bank = 1 - Cfg.Commission, tie = Cfg.Tie }
local Game

local staked = function(bet)
	return (bet.player or 0) + (bet.bank or 0) + (bet.tie or 0)
end

local winnerOf = function(player, bank)
	local p, b = CardsPoints(player), CardsPoints(bank)
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
	TableGameSync(g, id)
	TableGameUntil(g, function()
		return os.time() >= t.deadline or not next(t.seats)
	end)
	t.deadline = nil

	TableGameIdle(g, t, function(seat)
		return t.bets[seat] ~= nil
	end)

	if not next(t.bets) then
		t.phase = 'idle'
		TableGameSync(g, id)
		Wait(1000)
		return
	end

	local deck = CardsNewDeck(8)
	local player, bank = CardsBaccarat(deck)
	local ids = {}
	for _, bet in pairs(t.bets) do
		ids[bet.id] = true
	end
	local wants = RigWants('baccarat', ids)
	if wants then
		local hands = RigPick('baccarat', wants, { player, bank }, function()
			if #deck < 6 then
				deck = CardsNewDeck(8)
			end
			return { CardsBaccarat(deck) }
		end, function(h)
			return (netsFor(t, h[1], h[2]))
		end)
		player, bank = hands[1], hands[2]
	else
		local _, loss = netsFor(t, player, bank)
		if PoolProtect(loss) then
			player, bank = CardsBaccarat(deck)
		end
	end

	t.phase = 'dealing'
	TableGameSync(g, id)
	Wait(1500)
	for i = 1, 3 do
		for _, hand in ipairs({ { t.player, player }, { t.bank, bank } }) do
			if hand[2][i] then
				hand[1][i] = hand[2][i]
				TableGameSync(g, id)
				Wait(Cfg.DealTime)
			end
		end
	end

	t.winner = winnerOf(player, bank)
	for _, bet in pairs(t.bets) do
		bet.payout = payoutOf(bet, t.winner)
		TableGameSettle(g, bet.id, staked(bet), bet.payout)
	end

	t.phase = 'result'
	TableGameSync(g, id)
	Wait(Cfg.ResultTime * 1000)
end

local Init = function(_, t)
	t.bets, t.player, t.bank = {}, {}, {}
end

local Public = function(g, t)
	local bets = {}
	for seat, bet in pairs(t.bets) do
		bets[seat] = { src = bet.src, player = bet.player, bank = bet.bank, tie = bet.tie, payout = bet.payout }
	end
	return {
		ped = t.ped,
		seats = t.seats,
		bets = bets,
		player = t.player,
		bank = t.bank,
		phase = t.phase,
		winner = t.winner,
		max = TableGameMaxBet(g, t),
		timeLeft = TableGameTimeLeft(g, t),
	}
end

local Refund = function(g, t)
	for _, bet in pairs(t.bets) do
		if not bet.payout and TableGameRefund(g, bet.id, staked(bet)) then
			bet.payout = staked(bet)
		end
	end
end

local Reset = function(_, t)
	t.bets, t.player, t.bank, t.winner = {}, {}, {}, nil
end

Game = TableGameNew({
	name = 'baccarat',
	config = Cfg,
	init = Init,
	public = Public,
	play = play,
	refund = Refund,
	reset = Reset,
})

RpcRegister('baccarat:bet', function(src, side, amount)
	local at = Game.Seated[src]
	if not at or not Sides[side] then
		return false
	end
	local t = Game.Tables[at.id]
	amount = UtilInteger(amount)
	if t.phase ~= 'betting' or not amount then
		return false
	end

	local bet = t.bets[at.seat]
	local max = TableGameMaxBet(Game, t)
	if max < t.cfg.min then
		return L('table.closed')
	end
	if amount < t.cfg.min or amount + (bet and staked(bet) or 0) > max then
		return L('table.max_bet', { amount = FormatChips(max) })
	end
	local id = PlayersId(src)
	if not id then
		return false
	end
	if not TableGameTake(Game, src, amount) then
		return L('error.not_enough_chips')
	end

	bet = bet or { src = src, id = id }
	bet[side] = (bet[side] or 0) + amount
	t.bets[at.seat] = bet
	TableGameSync(Game, at.id)
	return true
end, 6)
