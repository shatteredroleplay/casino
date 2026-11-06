Bridge.Add('inventory', 'core', {
    resource = 'core_inventory',

    Count = function(src, item)
        return exports.core_inventory:getItemCount(src, item) or 0
    end,

    Add = function(src, item, amount, metadata)
        return exports.core_inventory:addItem(src, item, amount, metadata) ~= false
    end,

    Remove = function(src, item, amount)
        return exports.core_inventory:removeItem(src, item, amount) ~= false
    end,

    CanCarry = function(src, item, amount)
        return exports.core_inventory:canCarry(src, item, amount) ~= false
    end,
})
