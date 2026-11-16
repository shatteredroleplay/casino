-- The lucky wheel: one free spin per character every Cooldown seconds.
-- Prize types:
--   chips : amount chips            money : amount cash
--   item  : name, amount (make sure the item exists in your inventory)
--   car   : the car below, stored in the player's garage
-- weight is how likely a prize is compared to the others. label overrides the generated name, color the segment colour.
local Car = {
	Model = 'zentorno',
	Label = 'Pegassi Zentorno',
	Value = 700000, -- the car can only be won once the car fund (house profit) has reached this
	Garage = 'casino', -- the garage the car is stored in (name as your garage resource knows it)
	Coords = vec4(963.34, 47.94, 74.97, 275.82), -- the show car on the podium
	Speed = 8.0, -- degrees per second the podium turns
	RenderDistance = 60.0,
	Chance = { Min = 0.0005, Max = 0.005, Ramp = 3 }, -- car chance grows from Min to Max as the fund goes from Value to Value * (1 + Ramp)
}

Config.Wheel = {
	Car = Car,
	Coords = vec4(978.01, 50.35, 73.68, 327.99),
	Center = vec3(0.0, 0.15, 1.51),
	Radius = 1.2,
	Offset = -0.3,
	Cost = 0, -- chips per spin, 0 = free
	Cooldown = 24 * 60 * 60,
	SpinTime = 15000,
	Turns = 10,
	RenderDistance = 30.0,

	Prizes = {
		{ type = 'chips', amount = 50, weight = 22 },
		{ type = 'item', name = 'gold_ring', amount = 1, weight = 8 },
		{ type = 'chips', amount = 70, weight = 18 },
		{ type = 'money', amount = 1000, weight = 4 },
		{ type = 'item', name = 'repair_kit', amount = 1, weight = 14 },
		{ type = 'chips', amount = 250, weight = 1.5 },
		{ type = 'chips', amount = 150, weight = 12 },
		{ type = 'item', name = 'diamond_ring', amount = 1, weight = 3 },
		{ type = 'money', amount = 500, weight = 10 },
		{ type = 'chips', amount = 4000, weight = 0.5, color = '#7a1f2b' },
		{ type = 'chips', amount = 100, weight = 6 },
		{ type = 'item', name = 'diamond_necklace', amount = 1, weight = 1 },
		{ type = 'car', weight = 0, color = '#1f3f7a' },
	},
}
