-- American roulette (0 and 00). Players click the felt to bet, scroll to change the amount.
Config.Roulette = {
	BetTime = 25,
	SpinTime = 15500, -- ms the wheel spins
	ResultTime = 8,
	IdleRounds = 3,
	MaxBets = 10, -- different bets one player may have in a round
	RenderDistance = 30.0,
	SitDistance = 1.6,
	ChipLift = 0.0,
	PickRadius = 30, -- pixels around a bet spot the cursor picks it

	Camera = { offset = vec3(0.0, 0.0, 2.0), fov = 80.0, wheel = { offset = vec3(0.0, -0.6, 0.75), fov = 50.0 } },
	Board = {
		Distance = 5.0,
		Width = 0.9,
		Lift = 0.6,
		Screen = { x = 0.5, y = 0.86, height = 0.24 },
		Bet = { Width = 0.12, Lift = 0.03, Shift = 0.04 },
	},

	-- a single number may take max / 35
	Tables = {
		{ coords = vec4(1032.16, 60.02, 71.48, 13.30), model = 'vw_prop_casino_roulette_01', min = 25, max = 5000 },
		{ coords = vec4(1031.20, 64.16, 71.48, 193.30), model = 'vw_prop_casino_roulette_01', min = 25, max = 5000 },
		{ coords = vec4(1016.78, 69.57, 72.28, 282.99), model = 'vw_prop_casino_roulette_01b', min = 200, max = 10000 },
		{ coords = vec4(1010.81, 68.19, 72.28, 103.30), model = 'vw_prop_casino_roulette_01b', min = 200, max = 10000 },
	},
}
