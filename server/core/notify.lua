local EVENT = Util.Event('notify')

Notify = function(src, text, kind, duration, title)
    TriggerClientEvent(EVENT, src, text, kind or 'info', duration, title)
end
