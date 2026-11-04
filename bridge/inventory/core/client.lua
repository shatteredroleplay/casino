Bridge.Add('inventory', 'core', {
    resource = 'core_inventory',

    Count = function(item)
        return exports.core_inventory:getItemCount(item) or 0
    end,

    SetBusy = function(busy)
        LocalPlayer.state:set('inv_busy', busy, true)
    end,
})
