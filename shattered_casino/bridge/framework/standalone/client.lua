Bridge.Add('framework', 'standalone', {
    IsLoaded = function()
        return NetworkIsPlayerActive(PlayerId())
    end,

    IsDead = function()
        return IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        AddEventHandler('playerSpawned', function() cb() end)
    end,

    OnUnload = function()
    end,
})
