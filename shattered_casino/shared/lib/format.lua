local Cfg = Config.Currency

FormatNumber = function(value)
	local n = math.tointeger(math.floor((tonumber(value) or 0) + 0.5)) or 0
	local grouped, replace, count = tostring(math.abs(n)), '%1' .. Cfg.Thousands:gsub('%%', '%%%%') .. '%2', 1
	while count > 0 do
		grouped, count = grouped:gsub('^(%d+)(%d%d%d)', replace)
	end
	return (n < 0 and '-' or '') .. grouped
end

FormatMoney = function(value)
	local number, gap = FormatNumber(value), Cfg.Space and ' ' or ''
	if Cfg.Position == 'after' then
		return number .. gap .. Cfg.Symbol
	end
	if number:sub(1, 1) == '-' then
		return '-' .. Cfg.Symbol .. gap .. number:sub(2)
	end
	return Cfg.Symbol .. gap .. number
end

FormatChips = function(value)
	return L('common.chips', { amount = FormatNumber(value) })
end
