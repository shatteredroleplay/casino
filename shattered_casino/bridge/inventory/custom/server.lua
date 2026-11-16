-- Template for an inventory that is not supported out of the box. Set Config.Bridge.Inventory = 'custom'.

local Count = function(src, item)
	return 0
end

local Add = function(src, item, amount, metadata)
	return false
end

local Remove = function(src, item, amount)
	return false
end

local CanCarry = function(src, item, amount)
	return true
end

BridgeAdd('inventory', 'custom', {
	resource = nil,

	-- how many of the item the player has
	Count = Count,

	-- returns true only when the items were added. metadata may be nil
	Add = Add,

	-- returns true only when the player had them and they were removed
	Remove = Remove,

	-- true when the items fit (weight / slots)
	CanCarry = CanCarry,
})
