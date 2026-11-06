local ESX
local dead = false

local core = function()
    ESX = ESX or exports.es_extended:getSharedObject()
    return ESX
end

AddEventHandler('esx:onPlayerDeath', function() dead = true end)
AddEventHandler('esx:onPlayerSpawn', function() dead = false end)

Bridge.Add('framework', 'esx', {
    resource = 'es_extended',

    IsLoaded = function()
        return core().IsPlayerLoaded() == true
    end,

    IsDead = function()
        return dead or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        RegisterNetEvent('esx:playerLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        RegisterNetEvent('esx:onPlayerLogout', function() cb() end)
    end,
})
