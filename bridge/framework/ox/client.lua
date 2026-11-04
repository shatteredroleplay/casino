local loaded = false

AddEventHandler('ox:playerLoaded', function() loaded = true end)
AddEventHandler('ox:playerLogout', function() loaded = false end)

CreateThread(function()
    if not Util.Running('ox_core') then return end
    local ok, p = pcall(function() return exports.ox_core:GetPlayer() end)
    if ok and p and p.charId then loaded = true end
end)

Bridge.Add('framework', 'ox', {
    resource = 'ox_core',

    IsLoaded = function()
        return loaded
    end,

    IsDead = function()
        return LocalPlayer.state.isDead == true or IsEntityDead(PlayerPedId())
    end,

    OnLoad = function(cb)
        AddEventHandler('ox:playerLoaded', function() cb() end)
    end,

    OnUnload = function(cb)
        AddEventHandler('ox:playerLogout', function() cb() end)
    end,
})
