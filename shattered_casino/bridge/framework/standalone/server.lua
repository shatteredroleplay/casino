-- No framework: players are known by their license and there is no money system.
-- Use Config.Chips.Mode = 'wallet' and hand out chips from the admin panel, or write a custom adapter.
local license = function(src)
	return GetPlayerIdentifierByType(src, 'license')
end

local GetIdentifier = function(src)
	return license(src)
end

local GetSource = function(identifier)
	for _, id in ipairs(GetPlayers()) do
		if license(id) == identifier then
			return tonumber(id)
		end
	end
end

local GetName = function(src)
	return GetPlayerName(src)
end

local GetMoney = function()
	return 0
end

local AddMoney = function()
	return false
end

local RemoveMoney = function()
	return false
end

local HasGroup = function(src, group)
	return IsPlayerAceAllowed(src, 'group.' .. group)
end

local OnLoad = function(cb)
	AddEventHandler('playerJoining', function()
		cb(source)
	end)
end

local OnUnload = function() end

local GiveVehicle = function()
	return nil
end

BridgeAdd('framework', 'standalone', {
	GetIdentifier = GetIdentifier,
	GetSource = GetSource,
	GetName = GetName,
	GetMoney = GetMoney,
	AddMoney = AddMoney,
	RemoveMoney = RemoveMoney,
	HasGroup = HasGroup,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
	GiveVehicle = GiveVehicle,
})
