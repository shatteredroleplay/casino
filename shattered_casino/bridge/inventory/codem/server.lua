local codem = function()
    return exports['codem-inventory']
end

Bridge.Add('inventory', 'codem', {
    resource = 'codem-inventory',

    Count = function(src, item)
        return codem():GetItemsTotalAmount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return codem():AddItem(src, item, amount, nil, metadata) ~= false
    end,

    Remove = function(src, item, amount)
        return codem():RemoveItem(src, item, amount) ~= false
    end,

    -- codem-inventory refuses an AddItem that does not fit, Add returns false then
    CanCarry = function()
        return true
    end,
})
