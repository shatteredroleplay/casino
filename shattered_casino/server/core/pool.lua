Pool = {}

local Cfg = Config.Pool
local Rate = Config.Chips.Rate
local Income = Config.HouseIncome
local ROUND = Util.Event('hud:round')

Pool.Balance = function()
    return State.Get('pool', Cfg.Start)
end

Pool.Set = function(amount)
    State.Set('pool', math.max(0, math.min(math.floor(amount), Cfg.Cap)))
end

Pool.Add = function(amount)
    Pool.Set(Pool.Balance() + amount)
end

Pool.Fund = function()
    return State.Get('carfund', 0)
end

Pool.SetFund = function(money)
    State.Set('carfund', math.max(0, math.floor(money)))
end

Pool.Feed = function(money)
    Pool.SetFund(Pool.Fund() + money)
end

Pool.Protection = function()
    return State.Get('protection', Cfg.Protection)
end

Pool.SetProtection = function(protection)
    State.Set('protection', protection)
end

Pool.MaxBet = function(tableMax)
    return math.min(tableMax, math.floor(Pool.Balance() * Cfg.MaxBetPct))
end

Pool.Protect = function(loss)
    if loss <= 0 then return false end
    local p = Pool.Protection()
    if loss >= p.HighRoller.Loss and math.random() < p.HighRoller.Chance then return true end
    local risk = math.min(1, loss / math.max(1, Pool.Balance() * Cfg.MaxBetPct))
    return math.random() < p.Bias.Max * risk ^ p.Bias.Curve
end

local Takings = {
    none = function() return 0 end,
    turnover = function(bet) return bet * Rate * Income.Percent end,
    profit = function(bet, payout) return (bet - payout) * Rate * Income.Percent end,
}
local takings = Takings[Income.Mode] or Takings.none

Pool.Settle = function(id, game, bet, payout, delay, meta)
    Pool.Add(-payout)
    Pool.Feed((bet - payout) * Rate)
    Stats.Record(id, game, bet * Rate, payout * Rate, meta)
    Rig.Track(id, bet, payout)

    local owed = takings(bet, payout)
    if owed ~= 0 then State.Set('income', State.Get('income', 0) + owed) end

    Pool.Report(id, payout - bet, game, delay)
end

Pool.Report = function(id, delta, game, delay)
    local src = id and Players.Source(id)
    if not src then return end
    SetTimeout(delay or 0, function() TriggerClientEvent(ROUND, src, delta, game) end)
end

Pool.Rake = function(chips)
    if chips <= 0 then return end
    Pool.Add(chips)
    Pool.Feed(chips * Rate)
    local owed = Income.Mode ~= 'none' and chips * Rate * Income.Percent or 0
    if owed ~= 0 then State.Set('income', State.Get('income', 0) + owed) end
end

CreateThread(function()
    Db.Await()
    while true do
        Wait(Config.Stats.Flush * 1000)
        local pending = State.Get('income', 0)
        if pending >= 1 then
            local amount = math.floor(pending)
            State.Set('income', pending - amount)
            local ok, paid = pcall(Bridge.Society.Deposit, amount, 'casino')
            if not ok or paid == false then
                State.Set('income', State.Get('income', 0) + amount)
                Util.Debug('house income of %s could not be paid', amount)
            end
        end
    end
end)

RegisterCommand('casinopool', function(src, args)
    if src ~= 0 then return end
    local pool, fund = tonumber(args[1]), tonumber(args[2])
    if pool then Pool.Set(pool) end
    if fund then Pool.SetFund(fund) end
    Util.Print('info', 'pool: %s (%s) · max bet: %s · car fund: %s',
        Format.Chips(Pool.Balance()), Format.Money(Pool.Balance() * Rate), Format.Chips(Pool.MaxBet(math.huge)), Format.Money(Pool.Fund()))
end, true)
