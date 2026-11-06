Bridge.Add('inventory', 'shattered', {
    resource = 'inv',

    Count = function(item)
        return exports.inv:GetInventoryItemCount(item) or 0
    end,

    SetBusy = function(busy)
        LocalPlayer.state.invDisabled = busy
    end,
})
