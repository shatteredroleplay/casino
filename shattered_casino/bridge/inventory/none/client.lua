local Count = function()
	return 0
end

local SetBusy = function() end

BridgeAdd('inventory', 'none', {
	Count = Count,
	SetBusy = SetBusy,
})
