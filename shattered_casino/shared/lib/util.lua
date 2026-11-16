Util = {}

Util.Resource = GetCurrentResourceName()
Util.Server = IsDuplicityVersion()

UtilEvent = function(name)
	return Util.Resource .. ':' .. name
end

local Colors = { info = '^5', warn = '^3', error = '^1', ok = '^2' }

UtilPrint = function(level, message, ...)
	if select('#', ...) > 0 then
		message = message:format(...)
	end
	print(('%s[%s]^0 %s'):format(Colors[level] or '^7', Util.Resource, message))
end

UtilDebug = function(message, ...)
	if Config.Debug then
		UtilPrint('info', message, ...)
	end
end

UtilInteger = function(value, min, max)
	local n = math.tointeger(tonumber(value))
	if not n or min and n < min or max and n > max then
		return nil
	end
	return n
end

UtilSet = function(list)
	local set = {}
	for _, v in ipairs(list or {}) do
		set[v] = true
	end
	return set
end

UtilRunning = function(resource)
	local state = GetResourceState(resource)
	return state == 'started' or state == 'starting'
end
