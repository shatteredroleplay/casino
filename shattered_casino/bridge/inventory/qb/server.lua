-- Goes through the qb-core player functions, so it works with qb-inventory, ps-inventory and lj-inventory alike.
local QBCore

local player = function(src)
	QBCore = QBCore or exports['qb-core']:GetCoreObject()
	return QBCore.Functions.GetPlayer(src)
end

local Count = function(src, item)
	local p, total = player(src), 0
	if not p then
		return 0
	end
	for _, slot in pairs(p.PlayerData.items or {}) do
		if slot.name == item then
			total = total + (slot.amount or slot.count or 0)
		end
	end
	return total
end

local Add = function(src, item, amount, metadata)
	local p = player(src)
	return p ~= nil and p.Functions.AddItem(item, amount, false, metadata) == true
end

local Remove = function(src, item, amount)
	local p = player(src)
	return p ~= nil and p.Functions.RemoveItem(item, amount) == true
end

local CanCarry = function(src, item, amount)
	if not UtilRunning('qb-inventory') then
		return true
	end
	local ok, fits = pcall(function()
		return exports['qb-inventory']:CanAddItem(src, item, amount)
	end)
	return not ok or fits ~= false
end

BridgeAdd('inventory', 'qb', {
	resource = 'qb-core',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
