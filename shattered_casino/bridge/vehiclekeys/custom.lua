-- Template: give keys for the wheel car through your key resource. Set Config.Bridge.VehicleKeys = 'custom'.
-- The car is not spawned, it is stored in the garage, so only the plate is known. Return true when done.
Bridge.Add('vehiclekeys', 'custom', {
    Give = function(src, plate, label)
        return true
    end,
})
