-- Fivemanage log API. Token and dataset in config/server.lua
Bridge.Add('logs', 'fivemanage', {
    Send = function(category, title, fields)
        local cfg = ServerConfig.Logs.Fivemanage
        if not cfg.Token or cfg.Token == '' then return end

        local metadata = { category = category, resource = Util.Resource }
        for _, f in ipairs(fields or {}) do metadata[tostring(f.name)] = f.value end
        local body = json.encode({ level = 'info', message = title, resource = Util.Resource, metadata = metadata })
        PerformHttpRequest('https://api.fivemanage.com/api/logs', function(status)
            if status >= 300 then Util.Debug('fivemanage log failed with %s', status) end
        end, 'POST', body, {
            ['Content-Type'] = 'application/json',
            ['Authorization'] = cfg.Token,
            ['X-Fivemanage-Dataset'] = cfg.Dataset,
        })
    end,
})
