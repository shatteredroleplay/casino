local Kinds = { info = 'primary', success = 'success', warning = 'warning', error = 'error' }

Bridge.Add('notify', 'qb', {
    resource = 'qb-core',

    Send = function(text, kind, duration)
        TriggerEvent('QBCore:Notify', text, Kinds[kind] or 'primary', duration)
    end,
})
