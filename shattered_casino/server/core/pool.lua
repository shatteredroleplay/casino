Pool = {}

local Cfg = Config.Pool
local Rate = Config.Chips.Rate
local Income = Config.HouseIncome
local ROUND = UtilEvent('hud:round')

PoolBalance = function()
	return StateGet('pool', Cfg.Start)
end

PoolSet = function(amount)
	StateSet('pool', math.max(0, math.min(math.floor(amount), Cfg.Cap)))
end

PoolAdd = function(amount)
	PoolSet(PoolBalance() + amount)
end

PoolFund = function()
	return StateGet('carfund', 0)
end

PoolSetFund = function(money)
	StateSet('carfund', math.max(0, math.floor(money)))
end

PoolFeed = function(money)
	PoolSetFund(PoolFund() + money)
end

PoolProtection = function()
	return StateGet('protection', Cfg.Protection)
end

PoolSetProtection = function(protection)
	StateSet('protection', protection)
end

PoolMaxBet = function(tableMax)
	return math.min(tableMax, math.floor(PoolBalance() * Cfg.MaxBetPct))
end

PoolProtect = function(loss)
	if loss <= 0 then
		return false
	end
	local p = PoolProtection()
	if loss >= p.HighRoller.Loss and math.random() < p.HighRoller.Chance then
		return true
	end
	local risk = math.min(1, loss / math.max(1, PoolBalance() * Cfg.MaxBetPct))
	return math.random() < p.Bias.Max * risk ^ p.Bias.Curve
end

local None = function()
	return 0
end

local Turnover = function(bet)
	return bet * Rate * Income.Percent
end

local Profit = function(bet, payout)
	return (bet - payout) * Rate * Income.Percent
end

local Takings = {
	none = None,
	turnover = Turnover,
	profit = Profit,
}
local takings = Takings[Income.Mode] or Takings.none

PoolSettle = function(id, game, bet, payout, delay, meta)
	PoolAdd(-payout)
	PoolFeed((bet - payout) * Rate)
	StatsRecord(id, game, bet * Rate, payout * Rate, meta)
	RigTrack(id, bet, payout)

	local owed = takings(bet, payout)
	if owed ~= 0 then
		StateSet('income', StateGet('income', 0) + owed)
	end

	PoolReport(id, payout - bet, game, delay)
end

PoolReport = function(id, delta, game, delay)
	local src = id and PlayersSource(id)
	if not src then
		return
	end
	SetTimeout(delay or 0, function()
		TriggerClientEvent(ROUND, src, delta, game)
	end)
end

PoolRake = function(chips)
	if chips <= 0 then
		return
	end
	PoolAdd(chips)
	PoolFeed(chips * Rate)
	local owed = Income.Mode ~= 'none' and chips * Rate * Income.Percent or 0
	if owed ~= 0 then
		StateSet('income', StateGet('income', 0) + owed)
	end
end

CreateThread(function()
	DbAwait()
	while true do
		Wait(Config.Stats.Flush * 1000)
		local pending = StateGet('income', 0)
		if pending >= 1 then
			local amount = math.floor(pending)
			StateSet('income', pending - amount)
			local ok, paid = pcall(BridgeSocietyDeposit, amount, 'casino')
			if not ok or paid == false then
				StateSet('income', StateGet('income', 0) + amount)
				UtilDebug('house income of %s could not be paid', amount)
			end
		end
	end
end)

RegisterCommand('casinopool', function(src, args)
	if src ~= 0 then
		return
	end
	local pool, fund = tonumber(args[1]), tonumber(args[2])
	if pool then
		PoolSet(pool)
	end
	if fund then
		PoolSetFund(fund)
	end
	UtilPrint(
		'info',
		'pool: %s (%s) · max bet: %s · car fund: %s',
		FormatChips(PoolBalance()),
		FormatMoney(PoolBalance() * Rate),
		FormatChips(PoolMaxBet(math.huge)),
		FormatMoney(PoolFund())
	)
end, true)
