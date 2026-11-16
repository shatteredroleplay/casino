local player = function(src)
	return exports.qbx_core:GetPlayer(src)
end

local GetIdentifier = function(src)
	local p = player(src)
	return p and p.PlayerData.citizenid
end

local GetSource = function(identifier)
	local p = exports.qbx_core:GetPlayerByCitizenId(identifier)
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
	return p ~= nil and p.Functions.AddMoney(account, amount, reason) == true
end

local RemoveMoney = function(src, account, amount, reason)
	local p = player(src)
	return p ~= nil and p.Functions.RemoveMoney(account, amount, reason) == true
end

local HasGroup = function(src, group)
	return IsPlayerAceAllowed(src, 'group.' .. group)
end

local OnLoad = function(cb)
	AddEventHandler('QBCore:Server:PlayerLoaded', function(p)
		cb(p.PlayerData.source)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('qbx_core:server:playerLoggedOut', function(src)
		cb(src)
	end)
	AddEventHandler('QBCore:Server:OnPlayerUnload', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local p = player(src)
	if not p then
		return nil
	end
	if not UtilRunning('qbx_vehicles') then
		UtilPrint('error', 'qbx_vehicles is not running, the wheel car could not be stored')
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
	local id = exports.qbx_vehicles:CreatePlayerVehicle({
		model = vehicle.model,
		citizenid = p.PlayerData.citizenid,
		garage = vehicle.garage,
		props = props,
	})
	return id and plate or nil
end

BridgeAdd('framework', 'qbx', {
	resource = 'qbx_core',

	GetIdentifier = GetIdentifier,
	GetSource = GetSource,
	GetName = GetName,
	GetMoney = GetMoney,
	AddMoney = AddMoney,
	RemoveMoney = RemoveMoney,

	-- Qbox permissions are ACE groups (add_principal identifier.x group.admin)
	HasGroup = HasGroup,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
	GiveVehicle = GiveVehicle,
})
