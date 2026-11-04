-- No framework: players are known by their license and there is no money system.
-- Use Config.Chips.Mode = 'wallet' and hand out chips from the admin panel, or write a custom adapter.
local license = function(src)
    return GetPlayerIdentifierByType(src, 'license')
end

Bridge.Add('framework', 'standalone', {
    GetIdentifier = function(src)
        return license(src)
    end,

    GetSource = function(identifier)
        for _, id in ipairs(GetPlayers()) do
            if license(id) == identifier then return tonumber(id) end
        end
    end,

    GetName = function(src)
        return GetPlayerName(src)
    end,

    GetMoney = function()
        return 0
    end,

    AddMoney = function()
        return false
    end,

    RemoveMoney = function()
        return false
    end,

    HasGroup = function(src, group)
        return IsPlayerAceAllowed(src, 'group.' .. group)
    end,

    OnLoad = function(cb)
        AddEventHandler('playerJoining', function() cb(source) end)
    end,

    OnUnload = function()
    end,

    GiveVehicle = function()
        return nil
    end,
})
