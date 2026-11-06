Log = function(category, title, fields)
    fields = fields or {}
    local ok, err = pcall(Bridge.Logs.Send, category, title, fields)
    if not ok then Util.Print('error', 'log adapter failed: %s', tostring(err)) end

    if Config.Debug then
        local parts = {}
        for _, f in ipairs(fields) do parts[#parts + 1] = ('%s: %s'):format(f.name, tostring(f.value)) end
        Util.Print('info', '[%s] %s | %s', category, title, table.concat(parts, ' | '))
    end
end
