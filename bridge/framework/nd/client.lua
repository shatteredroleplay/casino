Bridge.Add('framework', 'nd', {
    resource = 'ND_Core',

    IsLoaded = function()
        return exports.ND_Core:getPlayer() ~= nil
    end,

    IsDead = function()
        return LocalPlayer.state.dead == true or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        RegisterNetEvent('ND:characterLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        RegisterNetEvent('ND:characterUnloaded', function() cb() end)
    end,
})
