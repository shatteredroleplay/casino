local QBCore

local core = function()
    QBCore = QBCore or exports['qb-core']:GetCoreObject()
    return QBCore
end

Bridge.Add('framework', 'qb', {
    resource = 'qb-core',

    IsLoaded = function()
        return LocalPlayer.state.isLoggedIn == true
    end,

    IsDead = function()
        local meta = core().Functions.GetPlayerData().metadata or {}
        return meta.isdead or meta.inlaststand or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        RegisterNetEvent('QBCore:Client:OnPlayerUnload', function() cb() end)
    end,
})
