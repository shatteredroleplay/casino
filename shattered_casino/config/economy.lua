-- The house bankroll, in chips. Every bet goes into it and every win is paid from it.
--   Start      : the pool on the very first start
--   Cap        : the pool never grows past this
--   MaxBetPct  : the most a single bet may be, as a part of the pool (0.015 = 1.5%). Table maximums are lowered to it
--   Protection : the house quietly steers some outcomes when a win would hurt the pool.
--                Bias.Max is the highest chance (0.3 = 30%) used when a win is as big as the max bet, Curve makes small wins
--                much less likely to be steered. A loss of HighRoller.Loss chips or more is steered with HighRoller.Chance.
--                Set Bias.Max and HighRoller.Chance to 0 to turn it off. Can be changed live in the admin panel.
Config.Pool = {
	Start = 500000,
	Cap = 5000000,
	MaxBetPct = 0.015,
	Protection = {
		Bias = { Max = 0.3, Curve = 2 },
		HighRoller = { Loss = 5000, Chance = 0.25 },
	},
}

-- Buying and selling chips at the cashier. Account is where the money is taken from and paid to: 'cash' or 'bank'.
Config.Cashier = {
	MaxExchange = 100000,
	Account = 'cash',
}

-- A part of the casino's takings is paid to the society account set in Config.Bridge.Society.
--   Mode    : 'none', 'turnover' (Percent of every bet) or 'profit' (Percent of what the house wins, losses are carried over)
--   Percent : 0.1 = 10%
Config.HouseIncome = {
	Mode = 'none',
	Percent = 0.1,
}

-- Rigging from the admin panel.
--   Tries : how many alternative outcomes are rolled to find one that matches a rig
--   Feed  : how many steered outcomes the live feed remembers
Config.Rig = {
	Tries = 100,
	Feed = 50,
}

-- Statistics for the admin panel.
--   Flush         : seconds between database writes
--   RetentionDays : how long single rounds are kept for player history (totals are kept forever)
--   BigWin        : a win (in money) this large is logged and shown in the live feed
Config.Stats = {
	Flush = 15,
	RetentionDays = 14,
	BigWin = 50000,
}
