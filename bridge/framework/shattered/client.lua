local loaded = false

RegisterNetEvent('base:playerLoaded', function() loaded = true end)
RegisterNetEvent('base:playerUnloaded', function() loaded = false end)

CreateThread(function()
    if not Util.Running('shattered') then return end
    loaded = pcall(function() return exports.shattered:GetUserData() end)
end)

Bridge.Add('framework', 'shattered', {
    resource = 'shattered',

    IsLoaded = function()
        return loaded
    end,

    IsDead = function()
        return LocalPlayer.state.isDead == true or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        RegisterNetEvent('base:playerLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        RegisterNetEvent('base:playerUnloaded', function() cb() end)
    end,
})
