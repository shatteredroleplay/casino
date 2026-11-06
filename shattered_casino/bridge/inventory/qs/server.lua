local qs = function()
    return exports['qs-inventory']
end

Bridge.Add('inventory', 'qs', {
    resource = 'qs-inventory',

    Count = function(src, item)
        return qs():GetItemTotalAmount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return qs():AddItem(src, item, amount, nil, metadata) == true
    end,

    Remove = function(src, item, amount)
        return qs():RemoveItem(src, item, amount) == true
    end,

    CanCarry = function(src, item, amount)
        return qs():CanCarryItem(src, item, amount) == true
    end,
})
