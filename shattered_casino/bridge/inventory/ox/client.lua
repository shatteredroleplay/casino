Bridge.Add('inventory', 'ox', {
    resource = 'ox_inventory',

    Count = function(item)
        return exports.ox_inventory:GetItemCount(item) or 0
    end,

    SetBusy = function(busy)
        LocalPlayer.state.invBusy = busy
    end,
})
