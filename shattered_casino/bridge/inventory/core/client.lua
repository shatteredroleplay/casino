local Count = function(item)
	return exports.core_inventory:getItemCount(item) or 0
end

local SetBusy = function(busy)
	LocalPlayer.state:set('inv_busy', busy, true)
end

BridgeAdd('inventory', 'core', {
	resource = 'core_inventory',

	Count = Count,
	SetBusy = SetBusy,
})
