Nui = {}

local ready, queue, owners = false, {}, {}

Nui.Send = function(kind, data)
    data = data or {}
    data.type = kind
    if not ready then
        queue[#queue + 1] = data
        return
    end
    SendNUIMessage(data)
end

Nui.On = function(name, handler)
    RegisterNUICallback(name, function(data, cb)
        local ok, result = pcall(handler, data or {})
        if not ok then Util.Print('error', 'nui %s failed: %s', name, tostring(result)) end
        cb(ok and result or {})
    end)
end

Nui.Focus = function(owner, on, cursor)
    owners[owner] = on and { cursor = cursor ~= false } or nil
    local any, mouse = false, false
    for _, o in pairs(owners) do
        any = true
        if o.cursor then mouse = true end
    end
    SetNuiFocus(any, mouse)
end

Nui.Focused = function()
    return next(owners) ~= nil
end

Nui.On('ready', function()
    ready = true
    SendNUIMessage({
        type = 'init',
        lang = Locale.Code,
        locale = Locale.Strings,
        currency = Config.Currency,
        accent = Config.Ui.Accent,
    })
    for _, message in ipairs(queue) do SendNUIMessage(message) end
    queue = {}
    return true
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource and next(owners) then SetNuiFocus(false, false) end
end)
