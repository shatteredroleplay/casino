-- The inventory built into es_extended.
local ESX

local player = function(src)
	ESX = ESX or exports.es_extended:getSharedObject()
	return ESX.GetPlayerFromId(src)
end

local Count = function(src, item)
	local p = player(src)
	local entry = p and p.getInventoryItem(item)
	return entry and entry.count or 0
end

local Add = function(src, item, amount)
	local p = player(src)
	if not p or not p.canCarryItem(item, amount) then
		return false
	end
	p.addInventoryItem(item, amount)
	return true
end

local Remove = function(src, item, amount)
	local p = player(src)
	local entry = p and p.getInventoryItem(item)
	if not entry or entry.count < amount then
		return false
	end
	p.removeInventoryItem(item, amount)
	return true
end

local CanCarry = function(src, item, amount)
	local p = player(src)
	return p ~= nil and p.canCarryItem(item, amount) == true
end

BridgeAdd('inventory', 'esx', {
	resource = 'es_extended',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
