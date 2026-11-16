local Count = function(item)
	return exports['tgiann-inventory']:GetItemCount(item) or 0
end

local SetBusy = function(busy)
	LocalPlayer.state:set('inv_busy', busy, true)
end

BridgeAdd('inventory', 'tgiann', {
	resource = 'tgiann-inventory',

	Count = Count,
	SetBusy = SetBusy,
})
