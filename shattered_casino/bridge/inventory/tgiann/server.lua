local tgiann = function()
    return exports['tgiann-inventory']
end

Bridge.Add('inventory', 'tgiann', {
    resource = 'tgiann-inventory',

    Count = function(src, item)
        return tgiann():GetItemCount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return tgiann():AddItem(src, item, amount, nil, metadata) ~= false
    end,

    Remove = function(src, item, amount)
        return tgiann():RemoveItem(src, item, amount) ~= false
    end,

    CanCarry = function(src, item, amount)
        return tgiann():CanCarryItem(src, item, amount) ~= false
    end,
})
