-- Client half of the custom inventory template.

Bridge.Add('inventory', 'custom', {
    resource = nil,

    -- how many of the item the local player has (shown in the chip HUD)
    Count = function(item)
        return 0
    end,

    -- busy = true while seated at a game: stop the inventory from opening
    SetBusy = function(busy)
    end,
})
