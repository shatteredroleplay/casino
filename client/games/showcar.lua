local Cfg = Config.Wheel.Car
local Pos = Cfg.Coords.xyz
local Car

local spawn = function()
    local model = joaat(Cfg.Model)
    if not IsModelInCdimage(model) then
        Util.Print('warn', 'show car model "%s" does not exist on this server (Config.Wheel.Car.Model)', Cfg.Model)
        return
    end
    RequestModel(model)
    local timeout = GetGameTimer() + 10000
    while not HasModelLoaded(model) do
        if GetGameTimer() > timeout then
            Util.Print('warn', 'show car model "%s" did not load in 10 seconds', Cfg.Model)
            return
        end
        Wait(0)
    end

    local c = Cfg.Coords
    local veh = CreateVehicle(model, c.x, c.y, c.z, c.w, false, false)
    SetModelAsNoLongerNeeded(model)
    SetVehicleOnGroundProperly(veh)
    FreezeEntityPosition(veh, true)
    SetEntityInvincible(veh, true)
    SetEntityCanBeDamaged(veh, false)
    SetVehicleDoorsLocked(veh, 2)
    SetVehicleDirtLevel(veh, 0.0)
    SetVehicleNumberPlateText(veh, 'CASINO')
    SetVehicleEngineOn(veh, false, true, true)
    return veh
end

local remove = function()
    if Car and DoesEntityExist(Car) then DeleteEntity(Car) end
    Car = nil
end

local turn = function(veh)
    local nextCheck, visible = 0, true
    while Car == veh do
        local now = GetGameTimer()
        if now >= nextCheck then
            if not DoesEntityExist(veh) then break end
            visible = IsEntityOnScreen(veh)
            nextCheck = now + 250
        end
        SetEntityHeading(veh, (Cfg.Coords.w + Cfg.Speed * now / 1000.0) % 360.0)
        Wait(visible and 0 or 250)
    end
end

CreateThread(function()
    while true do
        if not Car then Casino.WaitActive() end
        local near = Casino.Active and #(GetEntityCoords(PlayerPedId()) - Pos) < Cfg.RenderDistance
        if Car and not DoesEntityExist(Car) then Car = nil end

        if near and not Car then
            Util.Debug('show car: spawning %s at %.1f m', Cfg.Model, #(GetEntityCoords(PlayerPedId()) - Pos))
            local veh = spawn()
            Car = veh
            if veh then CreateThread(function() turn(veh) end) end
        elseif not near and Car then
            remove()
        end

        Wait(near and Car and 1000 or near and 5000 or 1500)
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource then remove() end
end)
