local Count = function(item)
	return exports.ox_inventory:GetItemCount(item) or 0
end

local SetBusy = function(busy)
	LocalPlayer.state.invBusy = busy
end

BridgeAdd('inventory', 'ox', {
	resource = 'ox_inventory',

	Count = Count,
	SetBusy = SetBusy,
})
