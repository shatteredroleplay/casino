-- Client half of the custom framework template, see server.lua next to this file.

Bridge.Add('framework', 'custom', {
    resource = nil,

    -- true once the player has a character and can play
    IsLoaded = function()
        return NetworkIsPlayerActive(PlayerId())
    end,

    -- true while the player is dead or downed (they are stood up from tables and machines)
    IsDead = function()
        return IsEntityDead(PlayerPedId())
    end,

    -- call cb() when the character has been loaded
    OnLoad = function(cb)
    end,

    -- call cb() when the character is unloaded
    OnUnload = function(cb)
    end,
})
