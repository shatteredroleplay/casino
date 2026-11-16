-- Client half of the custom inventory template.

local Count = function(item)
	return 0
end

local SetBusy = function(busy) end

BridgeAdd('inventory', 'custom', {
	resource = nil,

	-- how many of the item the local player has (shown in the chip HUD)
	Count = Count,

	-- busy = true while seated at a game: stop the inventory from opening
	SetBusy = SetBusy,
})
