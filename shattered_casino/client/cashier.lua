if Config.Chips.Mode == 'cash' then return end

local Loc = Config.Locations
local SPAWN, DESPAWN, REACH = 40.0, 50.0, 4.0
local Peds, Spawned = {}, {}
local open = false

local spawn = function(coords)
    local model = joaat(Loc.CashierModel)
    if not IsModelInCdimage(model) then return nil end
    RequestModel(model)
    local timeout = GetGameTimer() + 5000
    while not HasModelLoaded(model) do
        if GetGameTimer() > timeout then return nil end
        Wait(0)
    end
    local ped = CreatePed(4, model, coords.x, coords.y, coords.z - 1.0, coords.w, false, false)
    SetModelAsNoLongerNeeded(model)
    SetEntityInvincible(ped, true)
    FreezeEntityPosition(ped, true)
    SetBlockingOfNonTemporaryEvents(ped, true)
    SetPedCanRagdoll(ped, false)
    SetPedDefaultComponentVariation(ped)
    if Loc.CashierScenario then TaskStartScenarioInPlace(ped, Loc.CashierScenario, 0, true) end
    return ped
end

local close = function()
    if not open then return end
    open = false
    Nui.Send('cashier:close')
    Nui.Focus('cashier', false)
end

local openCashier = function()
    if open then return end
    local info = Rpc.Call('cashier:info')
    if not info then return end
    open = true
    Nui.Send('cashier:open', info)
    Nui.Focus('cashier', true)

    CreateThread(function()
        while open do
            local pos, near = GetEntityCoords(PlayerPedId()), false
            for _, c in ipairs(Loc.Cashiers) do
                if #(pos - c.xyz) <= REACH then near = true end
            end
            if not near or Casino.IsDown() then close() end
            Wait(500)
        end
    end)
end

Nui.On('cashier', function(data)
    if data.action == 'close' then
        close()
        return true
    end
    if data.action ~= 'buy' and data.action ~= 'sell' then return false end
    local before = Casino.Chips
    local result = Rpc.Call('cashier:' .. data.action, data.amount)
    if not result then return { ok = false, message = L('error.generic') } end
    if result.ok then TriggerEvent(Util.Event('hud:exchange'), result.chips - before) end
    return result
end)

CreateThread(function()
    Bridge.Target.AddModels({ Loc.CashierModel }, { {
        name = 'casino_cashier',
        label = L('cashier.target'),
        icon = 'fa-solid fa-coins',
        distance = 2.5,
        canInteract = function(entity) return Peds[entity] ~= nil end,
        onSelect = openCashier,
    } })

    while true do
        local pos = GetEntityCoords(PlayerPedId())
        for i, coords in ipairs(Loc.Cashiers) do
            local dist, ped = #(pos - coords.xyz), Spawned[i]
            if ped and not DoesEntityExist(ped) then
                Peds[ped], Spawned[i], ped = nil, nil, nil
            end
            if not ped and dist <= SPAWN then
                ped = spawn(coords)
                if ped then Spawned[i], Peds[ped] = ped, true end
            elseif ped and dist > DESPAWN then
                DeleteEntity(ped)
                Peds[ped], Spawned[i] = nil, nil
            end
        end
        Wait(1000)
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= Util.Resource then return end
    for ped in pairs(Peds) do
        if DoesEntityExist(ped) then DeleteEntity(ped) end
    end
end)
