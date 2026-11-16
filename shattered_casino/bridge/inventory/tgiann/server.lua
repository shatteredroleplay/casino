local tgiann = function()
	return exports['tgiann-inventory']
end

local Count = function(src, item)
	return tgiann():GetItemCount(src, item) or 0
end

local Add = function(src, item, amount, metadata)
	return tgiann():AddItem(src, item, amount, nil, metadata) ~= false
end

local Remove = function(src, item, amount)
	return tgiann():RemoveItem(src, item, amount) ~= false
end

local CanCarry = function(src, item, amount)
	return tgiann():CanCarryItem(src, item, amount) ~= false
end

BridgeAdd('inventory', 'tgiann', {
	resource = 'tgiann-inventory',

	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
