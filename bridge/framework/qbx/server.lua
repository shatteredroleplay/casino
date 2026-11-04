local player = function(src)
    return exports.qbx_core:GetPlayer(src)
end

Bridge.Add('framework', 'qbx', {
    resource = 'qbx_core',

    GetIdentifier = function(src)
        local p = player(src)
        return p and p.PlayerData.citizenid
    end,

    GetSource = function(identifier)
        local p = exports.qbx_core:GetPlayerByCitizenId(identifier)
        return p and p.PlayerData.source
    end,

    GetName = function(src)
        local p = player(src)
        if not p then return GetPlayerName(src) end
        local info = p.PlayerData.charinfo
        return ('%s %s'):format(info.firstname, info.lastname)
    end,

    GetMoney = function(src, account)
        local p = player(src)
        return p and p.Functions.GetMoney(account) or 0
    end,

    AddMoney = function(src, account, amount, reason)
        local p = player(src)
        return p ~= nil and p.Functions.AddMoney(account, amount, reason) == true
    end,

    RemoveMoney = function(src, account, amount, reason)
        local p = player(src)
        return p ~= nil and p.Functions.RemoveMoney(account, amount, reason) == true
    end,

    -- Qbox permissions are ACE groups (add_principal identifier.x group.admin)
    HasGroup = function(src, group)
        return IsPlayerAceAllowed(src, 'group.' .. group)
    end,

    OnLoad = function(cb)
        AddEventHandler('QBCore:Server:PlayerLoaded', function(p) cb(p.PlayerData.source) end)
    end,

    OnUnload = function(cb)
        AddEventHandler('qbx_core:server:playerLoggedOut', function(src) cb(src) end)
        AddEventHandler('QBCore:Server:OnPlayerUnload', function(src) cb(src) end)
    end,

    GiveVehicle = function(src, vehicle)
        local p = player(src)
        if not p then return nil end
        if not Util.Running('qbx_vehicles') then
            Util.Print('error', 'qbx_vehicles is not running, the wheel car could not be stored')
            return nil
        end
        local plate = Bridge.Plate(function(plate)
            return MySQL.scalar.await('SELECT 1 FROM `player_vehicles` WHERE `plate` = ?', { plate }) ~= nil
        end)
        if not plate then return nil end
        local props = vehicle.props or {}
        props.model, props.plate = joaat(vehicle.model), plate
        local id = exports.qbx_vehicles:CreatePlayerVehicle({
            model = vehicle.model,
            citizenid = p.PlayerData.citizenid,
            garage = vehicle.garage,
            props = props,
        })
        return id and plate or nil
    end,
})
