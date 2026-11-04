local seated = false

Casino = setmetatable({ Chips = 0 }, {
    __index = function(_, key)
        if key == 'Seated' then return seated end
    end,
    __newindex = function(t, key, value)
        if key ~= 'Seated' then return rawset(t, key, value) end
        seated = value and true or false
        Bridge.Inventory.SetBusy(seated)
        LocalPlayer.state:set('casinoSeated', seated, true)
    end,
})

Casino.IsLoaded = function()
    local ok, loaded = pcall(Bridge.Framework.IsLoaded)
    return ok and loaded == true
end

Casino.IsDown = function()
    local ok, dead = pcall(Bridge.Framework.IsDead)
    return (ok and dead == true) or IsPedRagdoll(PlayerPedId())
end

local setChips = function(amount)
    if type(amount) ~= 'number' then return end
    Casino.Chips = amount
    TriggerEvent(Util.Event('chips'), amount)
end

Bridge.Framework.OnLoad(function()
    TriggerEvent(Util.Event('player:loaded'))
    Rpc.Async('wallet:get', setChips)
end)

Bridge.Framework.OnUnload(function()
    setChips(0)
    if seated then Casino.Seated = false end
    TriggerEvent(Util.Event('player:unloaded'))
end)

RegisterNetEvent(Util.Event('wallet'), setChips)

RegisterNetEvent(Util.Event('notify'), function(text, kind, duration, title)
    Bridge.Notify.Send(text, kind, duration, title)
end)

CreateThread(function()
    if Casino.IsLoaded() then Rpc.Async('wallet:get', setChips) end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource and seated then Bridge.Inventory.SetBusy(false) end
end)
