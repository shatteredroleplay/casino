local Count = function(item)
	return exports['qs-inventory']:Search(item) or 0
end

local SetBusy = function(busy)
	LocalPlayer.state:set('inv_busy', busy, true)
end

BridgeAdd('inventory', 'qs', {
	resource = 'qs-inventory',

	Count = Count,
	SetBusy = SetBusy,
})
