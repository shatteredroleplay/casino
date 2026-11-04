Bridge.Add('inventory', 'shattered', {
    resource = 'inv',

    Count = function(src, item)
        return exports.inv:GetInventoryItemAmount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return exports.inv:AddInventoryItem(src, item, amount, metadata) ~= nil
    end,

    Remove = function(src, item, amount)
        return exports.inv:RemoveInventoryItem(src, item, amount) == true
    end,

    CanCarry = function()
        return true
    end,
})
