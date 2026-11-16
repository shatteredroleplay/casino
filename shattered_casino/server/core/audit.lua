AuditAdmin = function(src)
	if not src or src == 0 then
		return { id = 'console', name = 'Console' }
	end
	return {
		id = PlayersId(src) or GetPlayerIdentifierByType(src, 'license') or tostring(src),
		name = ('%s (%s)'):format(GetPlayerName(src) or '?', src),
		src = src,
	}
end

AuditValid = function(admin)
	return type(admin) == 'table'
		and type(admin.name) == 'string'
		and (type(admin.id) == 'string' or type(admin.discord) == 'string')
end

AuditRecord = function(admin, category, action, title, target, fields, data)
	MySQL.insert(
		'INSERT INTO `casino_audit` (`admin`, `admin_name`, `action`, `target`, `data`) VALUES (?, ?, ?, ?, ?)',
		{
			admin.id or admin.discord,
			admin.name,
			action,
			target and tostring(target) or '',
			data and json.encode(data) or '',
		}
	)

	local list = {
		{ name = L('log.admin'), value = admin.name, inline = true },
		{ name = L('log.admin_id'), value = admin.id or admin.discord, inline = true },
	}
	for _, f in ipairs(fields or {}) do
		list[#list + 1] = f
	end
	Log(category, title, list)
	TriggerEvent(UtilEvent('audit'), { admin = admin.name, action = action, target = target, time = os.time() })
end
