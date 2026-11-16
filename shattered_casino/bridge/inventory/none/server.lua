-- No inventory. Fine with Config.Chips.Mode 'wallet' or 'cash', but item prizes on the wheel can't be given.

local Count = function()
	return 0
end

local Add = function()
	return false
end

local Remove = function()
	return false
end

local CanCarry = function()
	return false
end

BridgeAdd('inventory', 'none', {
	Count = Count,
	Add = Add,
	Remove = Remove,
	CanCarry = CanCarry,
})
