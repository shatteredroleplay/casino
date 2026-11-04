-- Template: send the notification through any resource. Set Config.Bridge.Notify = 'custom'.
-- kind is 'info', 'success', 'warning' or 'error', duration is in ms (may be nil), title may be nil.
Bridge.Add('notify', 'custom', {
    Send = function(text, kind, duration, title)
        Ui.Notify(text, kind, duration, title)
    end,
})
