Bridge.Add('inventory', 'qs', {
    resource = 'qs-inventory',

    Count = function(item)
        return exports['qs-inventory']:Search(item) or 0
    end,

    SetBusy = function(busy)
        LocalPlayer.state:set('inv_busy', busy, true)
    end,
})
