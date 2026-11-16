local codem = function()
	return exports['codem-inventory']
end

local Count = function(src, item)
	return codem():GetItemsTotalAmount(src, item) or 0
end

local Add = function(src, item, amount, metadata)
	return codem():AddItem(src, item, amount, nil, metadata) ~= false
end

local Remove = function(src, item, amount)
	return codem():RemoveItem(src, item, amount) ~= false
end

local CanCarry = function()
	return true
end

BridgeAdd('inventory', 'codem', {
	resource = 'codem-inventory',

	Count = Count,
	Add = Add,
	Remove = Remove,

	-- codem-inventory refuses an AddItem that does not fit, Add returns false then
	CanCarry = CanCarry,
})
