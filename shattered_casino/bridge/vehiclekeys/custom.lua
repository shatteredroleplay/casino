-- Template: give keys for the wheel car through your key resource. Set Config.Bridge.VehicleKeys = 'custom'.
-- The car is not spawned, it is stored in the garage, so only the plate is known. Return true when done.

local Give = function(src, plate, label)
	return true
end

BridgeAdd('vehiclekeys', 'custom', {
	Give = Give,
})
