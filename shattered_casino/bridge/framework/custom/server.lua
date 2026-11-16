-- Template for a framework that is not supported out of the box.
-- Set Config.Bridge.Framework = 'custom' and fill in every function. Keep the names and return values.

local GetIdentifier = function(src)
	return nil
end

local GetSource = function(identifier)
	return nil
end

local GetName = function(src)
	return GetPlayerName(src)
end

local GetMoney = function(src, account)
	return 0
end

local AddMoney = function(src, account, amount, reason)
	return false
end

local RemoveMoney = function(src, account, amount, reason)
	return false
end

local HasGroup = function(src, group)
	return IsPlayerAceAllowed(src, 'group.' .. group)
end

local OnLoad = function(cb) end

local OnUnload = function(cb) end

local GiveVehicle = function(src, vehicle)
	return nil
end

BridgeAdd('framework', 'custom', {
	-- the resource that must be running, used only by 'auto' (custom is never picked by auto)
	resource = nil,

	-- a stable id for the character the player is playing (citizenid, identifier, charId ...), as a string.
	-- nil while no character is loaded
	GetIdentifier = GetIdentifier,

	-- the server id of the player playing that character, or nil when offline
	GetSource = GetSource,

	-- the character's name, shown in the admin panel and in logs
	GetName = GetName,

	-- account is 'cash' or 'bank'. Returns a number
	GetMoney = GetMoney,

	-- returns true when the money was added
	AddMoney = AddMoney,

	-- returns true only when the player had enough and it was removed
	RemoveMoney = RemoveMoney,

	-- true when the player is in the group or has the rank (used by Config.Admin.Groups)
	HasGroup = HasGroup,

	-- call cb(src) when a character has been loaded
	OnLoad = OnLoad,

	-- call cb(src) when a character is unloaded / the player logs out (disconnects are handled already)
	OnUnload = OnUnload,

	-- give the player an owned vehicle, stored in `vehicle.garage`.
	-- vehicle = { model = 'fmj2', label = 'FMJ', garage = 'casino', props = {} }. Returns the plate, or nil
	GiveVehicle = GiveVehicle,
})
