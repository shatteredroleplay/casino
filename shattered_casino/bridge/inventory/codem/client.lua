local Count = function(item)
	local total = 0
	for _, slot in pairs(exports['codem-inventory']:GetClientPlayerInventory() or {}) do
		if slot.name == item then
			total = total + (slot.amount or slot.count or 0)
		end
	end
	return total
end

local SetBusy = function(busy)
	LocalPlayer.state:set('inv_busy', busy, true)
end

BridgeAdd('inventory', 'codem', {
	resource = 'codem-inventory',

	Count = Count,
	SetBusy = SetBusy,
})
