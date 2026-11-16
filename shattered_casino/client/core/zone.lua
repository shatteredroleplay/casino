local Loc = Config.Locations
local ACTIVE = UtilEvent('active')

Casino.Inside, Casino.Active = false, false

local inZone = function(pos)
	if pos.z < Loc.MinZ or pos.z > Loc.MaxZ then
		return false
	end
	local zone, inside = Loc.Zone, false
	local j = #zone
	for i = 1, #zone do
		local a, b = zone[i], zone[j]
		if a.y > pos.y ~= (b.y > pos.y) and pos.x < (b.x - a.x) * (pos.y - a.y) / (b.y - a.y) + a.x then
			inside = not inside
		end
		j = i
	end
	return inside
end

local anchors = function()
	local list = {}
	for _, c in ipairs(Loc.Cashiers) do
		list[#list + 1] = c
	end
	for _, cfg in ipairs({ Config.Roulette, Config.Blackjack, Config.Baccarat, Config.Poker }) do
		if cfg and cfg.Tables[1] then
			list[#list + 1] = cfg.Tables[1].coords
		end
	end
	return list
end

local inInterior = function(ped)
	local interior = GetInteriorFromEntity(ped)
	if interior == 0 then
		return false
	end
	for _, c in ipairs(anchors()) do
		if GetInteriorAtCoords(c.x, c.y, c.z) == interior then
			return true
		end
	end
	return false
end

CreateThread(function()
	local activeUntil = 0
	while true do
		local ped = PlayerPedId()
		local pos = GetEntityCoords(ped)
		local far = #(pos - Loc.Center) >= Loc.Range
		local inside = false
		if not far then
			inside = #Loc.Zone >= 3 and inZone(pos) or #Loc.Zone < 3 and inInterior(ped)
		end
		Casino.Inside = inside

		local now = GetGameTimer()
		if inside then
			activeUntil = now + Loc.Grace * 1000
		end
		local active = inside or now < activeUntil
		if active ~= Casino.Active then
			Casino.Active = active
			LocalPlayer.state:set('casinoInside', active, true)
			TriggerEvent(ACTIVE, active)
		end
		Wait(far and not active and 2000 or 500)
	end
end)
