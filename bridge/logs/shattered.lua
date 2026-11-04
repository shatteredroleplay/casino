Bridge.Add('logs', 'shattered', {
    resource = 'shattered',

    Send = function(_, title, fields)
        local Base = exports.shattered:Object()
        pcall(Base.Utils.Log, 'Admin', title, fields or {})
    end,
})
