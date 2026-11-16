-- The car is stored in a garage and the garage/key resource hands out keys when it is taken out.

local Give = function()
	return true
end

BridgeAdd('vehiclekeys', 'none', {
	Give = Give,
})
