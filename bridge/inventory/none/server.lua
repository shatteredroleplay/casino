-- No inventory. Fine with Config.Chips.Mode 'wallet' or 'cash', but item prizes on the wheel can't be given.
Bridge.Add('inventory', 'none', {
    Count = function()
        return 0
    end,

    Add = function()
        return false
    end,

    Remove = function()
        return false
    end,

    CanCarry = function()
        return false
    end,
})
