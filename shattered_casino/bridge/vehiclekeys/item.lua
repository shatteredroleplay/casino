-- Gives Config.KeyItem with the plate as metadata, for key systems that use an item.

local Give = function(src, plate, label)
	return BridgeInventoryAdd(src, Config.KeyItem, 1, { plate = plate, label = label })
end

BridgeAdd('vehiclekeys', 'item', {
	Give = Give,
})
