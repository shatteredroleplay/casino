local text = function(value)
	local s = tostring(value == nil and '-' or value)
	if s == '' then
		s = '-'
	end
	return #s > 1024 and s:sub(1, 1021) .. '...' or s
end

local Send = function(category, title, fields)
	local cfg = ServerConfig.Logs.Discord
	local url = cfg.Webhooks[category]
	if not url or url == '' then
		url = cfg.Default
	end
	if not url or url == '' then
		return
	end

	local list = {}
	for i, f in ipairs(fields or {}) do
		list[i] = { name = text(f.name), value = text(f.value), inline = f.inline == true }
	end
	local body = json.encode({
		username = cfg.Name,
		embeds = {
			{
				title = title,
				color = cfg.Color,
				fields = list,
				timestamp = os.date('!%Y-%m-%dT%H:%M:%SZ'),
				footer = { text = ('%s · %s'):format(Util.Resource, category) },
			},
		},
	})
	PerformHttpRequest(url, function(status)
		if status >= 300 then
			UtilDebug('discord log failed with %s', status)
		end
	end, 'POST', body, { ['Content-Type'] = 'application/json' })
end

BridgeAdd('logs', 'discord', {
	Send = Send,
})
