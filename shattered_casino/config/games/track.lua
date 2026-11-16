-- Horse racing at the betting terminals. One race runs for the whole casino; players bet on the winner.
-- Horse names are in the locales (track.horses). Times in seconds unless the name ends in Time (ms).
Config.Track = {
	Center = vec3(1000.0, 55.0, 72.0),
	Radius = 90.0, -- terminals further than this from Center can't be used
	RenderDistance = 40.0,
	Model = 'vw_prop_casino_track_chair_01',
	Min = 25,
	Max = 5000, -- lowered to what the house pool allows, and divided by the odds per horse
	Edge = 0.06, -- the house edge built into the odds
	BetTime = 30,
	RaceTime = 20000,
	ResultTime = 12,

	-- sitting at a terminal: offsets relative to the chair prop (x = right, y = forward, z = up)
	Seat = { offset = vec3(0.0, 0.0, 0.5), heading = 0.0 },
	Console = { offset = vec3(0.0, 0.78, 1.03), width = 0.45, height = 0.28, tilt = 10.0, yaw = 180.0, Width = 1024 },
	Camera = { distance = 0.6, fov = 50.0 },

	-- the race shown on the big betting screen of the casino interior
	Screen = {
		Enabled = true,
		Width = 1920,
		Height = 1080,
		Target = 'casinoscreen_02',
		Model = 'vw_vwint01_betting_screen',
		Distance = 35.0,
	},

	-- extra terminals placed by the casino: vec4(x, y, z, heading). The chairs already in the interior work without this
	Terminals = {},
}
