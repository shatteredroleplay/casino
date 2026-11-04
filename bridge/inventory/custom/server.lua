-- Template for an inventory that is not supported out of the box. Set Config.Bridge.Inventory = 'custom'.

Bridge.Add('inventory', 'custom', {
    resource = nil,

    -- how many of the item the player has
    Count = function(src, item)
        return 0
    end,

    -- returns true only when the items were added. metadata may be nil
    Add = function(src, item, amount, metadata)
        return false
    end,

    -- returns true only when the player had them and they were removed
    Remove = function(src, item, amount)
        return false
    end,

    -- true when the items fit (weight / slots)
    CanCarry = function(src, item, amount)
        return true
    end,
})
