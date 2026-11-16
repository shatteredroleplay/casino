local Count = function(item)
	return exports.inv:GetInventoryItemCount(item) or 0
end

local SetBusy = function(busy)
	LocalPlayer.state.invDisabled = busy
end

BridgeAdd('inventory', 'shattered', {
	resource = 'inv',

	Count = Count,
	SetBusy = SetBusy,
})
