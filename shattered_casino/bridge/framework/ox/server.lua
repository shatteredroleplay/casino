-- ox_core keeps cash as the ox_inventory 'money' item. The casino only moves cash, bank calls return 0/false here.
local player = function(src)
	return exports.ox_core:GetPlayer(src)
end

local charId = function(src)
	local p = player(src)
	return p and p.charId
end

local GetIdentifier = function(src)
	local id = charId(src)
	return id and tostring(id)
end

local GetSource = function(identifier)
	local p = exports.ox_core:GetPlayerFromFilter({ charId = tonumber(identifier) })
	return p and p.source
end

local GetName = function(src)
	local ok, first, last = pcall(function()
		return exports.ox_core:CallPlayer(src, 'get', 'firstName'), exports.ox_core:CallPlayer(src, 'get', 'lastName')
	end)
	return ok and first and ('%s %s'):format(first, last or '') or GetPlayerName(src)
end

local GetMoney = function(src, account)
	if account ~= 'cash' then
		return 0
	end
	return exports.ox_inventory:GetItemCount(src, 'money') or 0
end

local AddMoney = function(src, account, amount)
	if account ~= 'cash' then
		return false
	end
	return exports.ox_inventory:AddItem(src, 'money', amount) == true
end

local RemoveMoney = function(src, account, amount)
	if account ~= 'cash' then
		return false
	end
	return exports.ox_inventory:RemoveItem(src, 'money', amount) == true
end

local HasGroup = function(src, group)
	if IsPlayerAceAllowed(src, 'group.' .. group) then
		return true
	end
	local ok, grade = pcall(function()
		return exports.ox_core:CallPlayer(src, 'getGroup', group)
	end)
	return ok and grade ~= nil and grade ~= false
end

local OnLoad = function(cb)
	AddEventHandler('ox:playerLoaded', function(src)
		cb(src)
	end)
end

local OnUnload = function(cb)
	AddEventHandler('ox:playerLogout', function(src)
		cb(src)
	end)
end

local GiveVehicle = function(src, vehicle)
	local id = charId(src)
	if not id then
		return nil
	end
	local created = exports.ox_core:CreateVehicle({
		model = vehicle.model,
		owner = id,
		stored = vehicle.garage,
		properties = vehicle.props or {},
	})
	return created and created.plate or nil
end

BridgeAdd('framework', 'ox', {
	resource = 'ox_core',

	GetIdentifier = GetIdentifier,
	GetSource = GetSource,
	GetName = GetName,
	GetMoney = GetMoney,
	AddMoney = AddMoney,
	RemoveMoney = RemoveMoney,
	HasGroup = HasGroup,
	OnLoad = OnLoad,
	OnUnload = OnUnload,

	-- the plate comes from ox_core itself (convar ox:plateFormat)
	GiveVehicle = GiveVehicle,
})
