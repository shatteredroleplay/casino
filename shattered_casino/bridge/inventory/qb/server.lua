-- Goes through the qb-core player functions, so it works with qb-inventory, ps-inventory and lj-inventory alike.
local QBCore

local player = function(src)
    QBCore = QBCore or exports['qb-core']:GetCoreObject()
    return QBCore.Functions.GetPlayer(src)
end

Bridge.Add('inventory', 'qb', {
    resource = 'qb-core',

    Count = function(src, item)
        local p, total = player(src), 0
        if not p then return 0 end
        for _, slot in pairs(p.PlayerData.items or {}) do
            if slot.name == item then total = total + (slot.amount or slot.count or 0) end
        end
        return total
    end,

    Add = function(src, item, amount, metadata)
        local p = player(src)
        return p ~= nil and p.Functions.AddItem(item, amount, false, metadata) == true
    end,

    Remove = function(src, item, amount)
        local p = player(src)
        return p ~= nil and p.Functions.RemoveItem(item, amount) == true
    end,

    CanCarry = function(src, item, amount)
        if not Util.Running('qb-inventory') then return true end
        local ok, fits = pcall(function() return exports['qb-inventory']:CanAddItem(src, item, amount) end)
        return not ok or fits ~= false
    end,
})
