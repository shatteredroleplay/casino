Util = {}

Util.Resource = GetCurrentResourceName()
Util.Server = IsDuplicityVersion()

Util.Event = function(name)
    return Util.Resource .. ':' .. name
end

local Colors = { info = '^5', warn = '^3', error = '^1', ok = '^2' }

Util.Print = function(level, message, ...)
    if select('#', ...) > 0 then message = message:format(...) end
    print(('%s[%s]^0 %s'):format(Colors[level] or '^7', Util.Resource, message))
end

Util.Debug = function(message, ...)
    if Config.Debug then Util.Print('info', message, ...) end
end

Util.Integer = function(value, min, max)
    local n = math.tointeger(tonumber(value))
    if not n or (min and n < min) or (max and n > max) then return nil end
    return n
end

Util.Set = function(list)
    local set = {}
    for _, v in ipairs(list or {}) do set[v] = true end
    return set
end

Util.Running = function(resource)
    local state = GetResourceState(resource)
    return state == 'started' or state == 'starting'
end
