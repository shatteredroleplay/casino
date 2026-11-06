Bridge.Add('inventory', 'tgiann', {
    resource = 'tgiann-inventory',

    Count = function(item)
        return exports['tgiann-inventory']:GetItemCount(item) or 0
    end,

    SetBusy = function(busy)
        LocalPlayer.state:set('inv_busy', busy, true)
    end,
})
