local QBCore

local core = function()
	QBCore = QBCore or exports['qb-core']:GetCoreObject()
	return QBCore
end

local player = function(src)
	return core().Functions.GetPlayer(src)
end

local GetIdentifier = function(src)
	local p = player(src)
	return p and p.PlayerData.citizenid
end

local GetSource = function(identifier)
	local p = core().Functions.GetPlayerByCitizenId(identifier)
	return p and p.PlayerData.source
end

local GetName = function(src)
	local p = player(src)
	if not p then
		return GetPlayerName(src)
	end
	local info = p.PlayerData.charinfo
	return ('%s %s'):format(info.firstname, info.lastname)
end

local GetMoney = function(src, account)
	local p = player(src)
	return p and p.Functions.GetMoney(account) or 0
end

local AddMoney = function(src, account, amount, reason)
	local p = player(src)
	return p ~= nil and p.Functions.AddMoney(account, amount, reason) ~= false
end

local RemoveMoney = function(src, account, amount, reason)
	local p = player(src)
	return p ~= nil and p.Functions.RemoveMoney(account, amount, reason) == true
end

local HasGroup = function(src, group)
	return IsPlayerAceAllowed(src, 'group.' .. group) or core().Functions.HasPermission(src, group) == true
end

local OnLoad = function(cb)
	AddEventHandler('QBCore:Server:PlayerLoaded', function(p)
		cb(p.PlayerData.source)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('QBCore:Server:OnPlayerUnload', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local p = player(src)
	if not p then
		return nil
	end
	local plate = BridgePlate(function(plate)
		return MySQL.scalar.await('SELECT 1 FROM `player_vehicles` WHERE `plate` = ?', { plate }) ~= nil
	end)
	if not plate then
		return nil
	end
	local props = vehicle.props or {}
	props.model, props.plate = joaat(vehicle.model), plate
	local id = MySQL.insert.await(
		'INSERT INTO `player_vehicles` (`license`, `citizenid`, `vehicle`, `hash`, `mods`, `plate`, `garage`, `state`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
		{
			p.PlayerData.license,
			p.PlayerData.citizenid,
			vehicle.model,
			joaat(vehicle.model),
			json.encode(props),
			plate,
			vehicle.garage,
			1,
		}
	)
	return id and plate or nil
end

BridgeAdd('framework', 'qb', {
	resource = 'qb-core',

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
