local Base

local core = function()
	Base = Base or exports.shattered:Object()
	return Base
end

local GetIdentifier = function(src)
	return core().GetActiveCharacter(src)
end

local GetSource = function(identifier)
	return core().GetPlayerFromCid(identifier) or nil
end

local GetName = function(src)
	local cid = core().GetActiveCharacter(src)
	local char = cid and core().GetCharacterFromCid(cid)
	return char and ('%s %s'):format(char.firstname, char.lastname) or GetPlayerName(src)
end

local GetMoney = function(src, account)
	if account ~= 'cash' then
		return 0
	end
	return exports.inv:GetMoney(src) or 0
end

local AddMoney = function(src, account, amount)
	if account ~= 'cash' then
		return false
	end
	return exports.inv:AddMoney(src, amount) ~= nil
end

local RemoveMoney = function(src, account, amount)
	if account ~= 'cash' or (exports.inv:GetMoney(src) or 0) < amount then
		return false
	end
	return exports.inv:RemoveMoney(src, amount) and true or false
end

local HasGroup = function(src, group)
	return core().IsAdmin(src, tonumber(group) or 999) == true
end

local OnLoad = function(cb)
	AddEventHandler('base:playerLoaded', function(src)
		cb(src)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('base:playerUnloaded', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local cid = core().GetActiveCharacter(src)
	local plate = exports.vehicles:generatePlate()
	if not cid or not plate then
		return nil
	end
	local model = joaat(vehicle.model)
	local props = vehicle.props or {}
	props.model, props.plate = model, plate
	props.fuelLevel, props.engineHealth, props.bodyHealth =
		props.fuelLevel or 100.0, props.engineHealth or 1000.0, props.bodyHealth or 1000.0
	local added = exports.vehicles:AddVehicle({
		plate = plate,
		owner = cid,
		model = model,
		label = vehicle.label,
		garage = vehicle.garage,
		stored = true,
		fuel = 100,
		props = props,
	})
	return added and plate or nil
end

BridgeAdd('framework', 'shattered', {
	resource = 'shattered',

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
