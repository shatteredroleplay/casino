local player = function(src)
	return exports.ND_Core:getPlayer(src)
end

local GetIdentifier = function(src)
	local p = player(src)
	return p and p.id and tostring(p.id)
end

local GetSource = function(identifier)
	for _, p in pairs(exports.ND_Core:getPlayers() or {}) do
		if tostring(p.id) == tostring(identifier) then
			return p.source
		end
	end
end

local GetName = function(src)
	local p = player(src)
	if not p then
		return GetPlayerName(src)
	end
	return p.fullname or ('%s %s'):format(p.firstname or '', p.lastname or '')
end

local GetMoney = function(src, account)
	local p = player(src)
	return p and p[account] or 0
end

local AddMoney = function(src, account, amount, reason)
	local p = player(src)
	return p ~= nil and p.addMoney(account, amount, reason) ~= false
end

local RemoveMoney = function(src, account, amount, reason)
	local p = player(src)
	return p ~= nil and p.deductMoney(account, amount, reason) == true
end

local HasGroup = function(src, group)
	if IsPlayerAceAllowed(src, 'group.' .. group) then
		return true
	end
	local p = player(src)
	return p ~= nil and p.getGroup(group) ~= nil
end

local OnLoad = function(cb)
	AddEventHandler('ND:characterLoaded', function(character)
		cb(character.source)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('ND:characterUnloaded', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local p = player(src)
	if not p then
		return nil
	end
	local plate = BridgePlate(function(plate)
		return MySQL.scalar.await('SELECT 1 FROM `nd_vehicles` WHERE `plate` = ?', { plate }) ~= nil
	end)
	if not plate then
		return nil
	end
	local props = vehicle.props or {}
	props.model, props.plate = joaat(vehicle.model), plate
	local id = exports.ND_Core:setVehicleOwned(p.id, props, true)
	return id and plate or nil
end

BridgeAdd('framework', 'nd', {
	resource = 'ND_Core',

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
