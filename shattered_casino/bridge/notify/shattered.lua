Bridge.Add('notify', 'shattered', {
    resource = 'ui',

    Send = function(text, kind, duration, title)
        exports.ui:Notify(text, kind == 'warning' and 'error' or kind, duration or 3000, title or L('common.casino'))
    end,
})
