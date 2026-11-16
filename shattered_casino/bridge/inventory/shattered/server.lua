local Count = function(src, item)
	return exports.inv:GetInventoryItemAmount(src, item) or 0
end

local Add = function(src, item, amount, metadata)
	return exports.inv:AddInventoryItem(src, item, amount, metadata) ~= nil
end

local Remove = function(src, item, amount)
	return exports.inv:RemoveInventoryItem(src, item, amount) == true
end

local CanCarry = function()
	return true
end

BridgeAdd('inventory', 'shattered', {
	resource = 'inv',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
