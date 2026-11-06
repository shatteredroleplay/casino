local ESX

Bridge.Add('inventory', 'esx', {
    resource = 'es_extended',

    Count = function(item)
        ESX = ESX or exports.es_extended:getSharedObject()
        for _, entry in pairs(ESX.GetPlayerData().inventory or {}) do
            if entry.name == item then return entry.count or 0 end
        end
        return 0
    end,

    SetBusy = function()
    end,
})
