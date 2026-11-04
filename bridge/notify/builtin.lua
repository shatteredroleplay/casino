-- kind is 'info', 'success', 'warning' or 'error' in every notify adapter
Bridge.Add('notify', 'builtin', {
    Send = function(text, kind, duration, title)
        Ui.Notify(text, kind, duration, title)
    end,
})
