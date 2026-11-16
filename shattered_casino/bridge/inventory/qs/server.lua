local qs = function()
	return exports['qs-inventory']
end

local Count = function(src, item)
	return qs():GetItemTotalAmount(src, item) or 0
end

local Add = function(src, item, amount, metadata)
	return qs():AddItem(src, item, amount, nil, metadata) == true
end

local Remove = function(src, item, amount)
	return qs():RemoveItem(src, item, amount) == true
end

local CanCarry = function(src, item, amount)
	return qs():CanCarryItem(src, item, amount) == true
end

BridgeAdd('inventory', 'qs', {
	resource = 'qs-inventory',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
