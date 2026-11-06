local Kinds = { info = 'inform', success = 'success', warning = 'warning', error = 'error' }

Bridge.Add('notify', 'ox', {
    resource = 'ox_lib',

    Send = function(text, kind, duration, title)
        TriggerEvent('ox_lib:notify', { title = title, description = text, type = Kinds[kind] or 'inform', duration = duration })
    end,
})
