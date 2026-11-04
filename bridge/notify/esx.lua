local ESX
local Kinds = { info = 'info', success = 'success', warning = 'info', error = 'error' }

Bridge.Add('notify', 'esx', {
    resource = 'es_extended',

    Send = function(text, kind, duration)
        ESX = ESX or exports.es_extended:getSharedObject()
        ESX.ShowNotification(text, Kinds[kind] or 'info', duration)
    end,
})
