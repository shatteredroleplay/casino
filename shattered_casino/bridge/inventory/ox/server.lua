local Count = function(src, item)
	return exports.ox_inventory:GetItemCount(src, item) or 0
end

local Add = function(src, item, amount, metadata)
	return exports.ox_inventory:AddItem(src, item, amount, metadata) == true
end

local Remove = function(src, item, amount)
	return exports.ox_inventory:RemoveItem(src, item, amount) == true
end

local CanCarry = function(src, item, amount)
	return exports.ox_inventory:CanCarryItem(src, item, amount) == true
end

BridgeAdd('inventory', 'ox', {
	resource = 'ox_inventory',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
