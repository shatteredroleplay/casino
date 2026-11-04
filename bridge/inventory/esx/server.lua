-- The inventory built into es_extended.
local ESX

local player = function(src)
    ESX = ESX or exports.es_extended:getSharedObject()
    return ESX.GetPlayerFromId(src)
end

Bridge.Add('inventory', 'esx', {
    resource = 'es_extended',

    Count = function(src, item)
        local p = player(src)
        local entry = p and p.getInventoryItem(item)
        return entry and entry.count or 0
    end,

    Add = function(src, item, amount)
        local p = player(src)
        if not p or not p.canCarryItem(item, amount) then return false end
        p.addInventoryItem(item, amount)
        return true
    end,

    Remove = function(src, item, amount)
        local p = player(src)
        local entry = p and p.getInventoryItem(item)
        if not entry or entry.count < amount then return false end
        p.removeInventoryItem(item, amount)
        return true
    end,

    CanCarry = function(src, item, amount)
        local p = player(src)
        return p ~= nil and p.canCarryItem(item, amount) == true
    end,
})
