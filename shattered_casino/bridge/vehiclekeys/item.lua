-- Gives Config.KeyItem with the plate as metadata, for key systems that use an item.
Bridge.Add('vehiclekeys', 'item', {
    Give = function(src, plate, label)
        return Bridge.Inventory.Add(src, Config.KeyItem, 1, { plate = plate, label = label })
    end,
})
