Bridge.Add('inventory', 'ox', {
    resource = 'ox_inventory',

    Count = function(src, item)
        return exports.ox_inventory:GetItemCount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return exports.ox_inventory:AddItem(src, item, amount, metadata) == true
    end,

    Remove = function(src, item, amount)
        return exports.ox_inventory:RemoveItem(src, item, amount) == true
    end,

    CanCarry = function(src, item, amount)
        return exports.ox_inventory:CanCarryItem(src, item, amount) == true
    end,
})
