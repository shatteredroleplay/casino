Bridge.Add('framework', 'qbx', {
    resource = 'qbx_core',

    IsLoaded = function()
        return LocalPlayer.state.isLoggedIn == true
    end,

    IsDead = function()
        local data = exports.qbx_core:GetPlayerData() or {}
        local meta = data.metadata or {}
        return meta.isdead or meta.inlaststand or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        RegisterNetEvent('qbx_core:client:playerLoggedOut', function() cb() end)
    end,
})
