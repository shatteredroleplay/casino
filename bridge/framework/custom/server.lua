-- Template for a framework that is not supported out of the box.
-- Set Config.Bridge.Framework = 'custom' and fill in every function. Keep the names and return values.

Bridge.Add('framework', 'custom', {
    -- the resource that must be running, used only by 'auto' (custom is never picked by auto)
    resource = nil,

    -- a stable id for the character the player is playing (citizenid, identifier, charId ...), as a string.
    -- nil while no character is loaded
    GetIdentifier = function(src)
        return nil
    end,

    -- the server id of the player playing that character, or nil when offline
    GetSource = function(identifier)
        return nil
    end,

    -- the character's name, shown in the admin panel and in logs
    GetName = function(src)
        return GetPlayerName(src)
    end,

    -- account is 'cash' or 'bank'. Returns a number
    GetMoney = function(src, account)
        return 0
    end,

    -- returns true when the money was added
    AddMoney = function(src, account, amount, reason)
        return false
    end,

    -- returns true only when the player had enough and it was removed
    RemoveMoney = function(src, account, amount, reason)
        return false
    end,

    -- true when the player is in the group or has the rank (used by Config.Admin.Groups)
    HasGroup = function(src, group)
        return IsPlayerAceAllowed(src, 'group.' .. group)
    end,

    -- call cb(src) when a character has been loaded
    OnLoad = function(cb)
    end,

    -- call cb(src) when a character is unloaded / the player logs out (disconnects are handled already)
    OnUnload = function(cb)
    end,

    -- give the player an owned vehicle, stored in `vehicle.garage`.
    -- vehicle = { model = 'fmj2', label = 'FMJ', garage = 'casino', props = {} }. Returns the plate, or nil
    GiveVehicle = function(src, vehicle)
        return nil
    end,
})
