local ESX
local Accounts = { cash = 'money', bank = 'bank' }
local Parking

local core = function()
	ESX = ESX or exports.es_extended:getSharedObject()
	return ESX
end

local player = function(src)
	return core().GetPlayerFromId(src)
end

local GetIdentifier = function(src)
	local p = player(src)
	return p and p.identifier
end

local GetSource = function(identifier)
	local p = core().GetPlayerFromIdentifier(identifier)
	return p and p.source
end

local GetName = function(src)
	local p = player(src)
	return p and p.getName() or GetPlayerName(src)
end

local GetMoney = function(src, account)
	local p = player(src)
	local a = p and p.getAccount(Accounts[account])
	return a and a.money or 0
end

local AddMoney = function(src, account, amount, reason)
	local p = player(src)
	if not p then
		return false
	end
	p.addAccountMoney(Accounts[account], amount, reason)
	return true
end

local RemoveMoney = function(src, account, amount, reason)
	local p = player(src)
	local a = p and p.getAccount(Accounts[account])
	if not a or a.money < amount then
		return false
	end
	p.removeAccountMoney(Accounts[account], amount, reason)
	return true
end

local HasGroup = function(src, group)
	local p = player(src)
	return p ~= nil and p.getGroup() == group
end

local OnLoad = function(cb)
	AddEventHandler('esx:playerLoaded', function(src)
		cb(src)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('esx:playerLogout', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local p = player(src)
	if not p then
		return nil
	end
	local plate = BridgePlate(function(plate)
		return MySQL.scalar.await('SELECT 1 FROM `owned_vehicles` WHERE `plate` = ?', { plate }) ~= nil
	end)
	if not plate then
		return nil
	end
	local props = vehicle.props or {}
	props.model, props.plate = joaat(vehicle.model), plate
	local ok = MySQL.insert.await(
		'INSERT INTO `owned_vehicles` (`owner`, `plate`, `vehicle`, `type`, `stored`) VALUES (?, ?, ?, ?, ?)',
		{
			p.identifier,
			plate,
			json.encode(props),
			'car',
			1,
		}
	)
	if ok == nil then
		return nil
	end
	if Parking == nil then
		Parking = MySQL.scalar.await(
			"SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'owned_vehicles' AND COLUMN_NAME = 'parking'"
		) ~= nil
	end
	if Parking and vehicle.garage then
		MySQL.update.await('UPDATE `owned_vehicles` SET `parking` = ? WHERE `plate` = ?', { vehicle.garage, plate })
	end
	return plate
end

BridgeAdd('framework', 'esx', {
	resource = 'es_extended',

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
