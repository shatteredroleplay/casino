Log = function(category, title, fields)
	fields = fields or {}
	local ok, err = pcall(BridgeLogsSend, category, title, fields)
	if not ok then
		UtilPrint('error', 'log adapter failed: %s', tostring(err))
	end

	if Config.Debug then
		local parts = {}
		for _, f in ipairs(fields) do
			parts[#parts + 1] = ('%s: %s'):format(f.name, tostring(f.value))
		end
		UtilPrint('info', '[%s] %s | %s', category, title, table.concat(parts, ' | '))
	end
end
