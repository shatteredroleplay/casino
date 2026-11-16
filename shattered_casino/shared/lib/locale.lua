Locale = {}

local read = function(code)
	local raw = LoadResourceFile(Util.Resource, ('locales/%s.json'):format(code))
	if not raw then
		return nil
	end
	local ok, strings = pcall(json.decode, raw)
	if not ok or type(strings) ~= 'table' then
		UtilPrint('error', 'locales/%s.json is not valid JSON', code)
		return nil
	end
	return strings
end

local strings = read('en') or {}

if Config.Locale ~= 'en' then
	local chosen = read(Config.Locale)
	if chosen then
		for key, text in pairs(chosen) do
			strings[key] = text
		end
	else
		UtilPrint('warn', 'locale "%s" was not found, using English', tostring(Config.Locale))
	end
end

Locale.Code = Config.Locale
Locale.Strings = strings

L = function(key, vars)
	local text = strings[key]
	if not text then
		return key
	end
	if vars then
		text = text:gsub('{([%w_]+)}', function(name)
			local value = vars[name]
			return value ~= nil and tostring(value) or nil
		end)
	end
	return text
end
