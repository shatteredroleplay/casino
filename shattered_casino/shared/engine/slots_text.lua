local Cache = {}

local optional = function(key)
	return Locale.Strings[key] and L(key) or nil
end

local copy = function(items, prefix)
	if not items then
		return nil
	end
	local list = {}
	for i, item in ipairs(items) do
		local c = {}
		for key, value in pairs(item) do
			c[key] = value
		end
		c.label, c.text = L(prefix .. item.id), L(prefix .. item.id .. '_text')
		list[i] = c
	end
	return list
end

SlotsText = function(id)
	if Cache[id] then
		return Cache[id]
	end
	local g = Config.Slots.Games[id]
	if not g then
		return nil
	end
	local k = 'slots.' .. id .. '.'
	local text = {
		label = L(k .. 'label'),
		tag = L(k .. 'tag'),
		bonus = L(k .. 'bonus'),
		max = optional(k .. 'max'),
		modes = copy(g.modes, k .. 'mode.'),
		wheel = copy(g.wheel, k .. 'wheel.'),
		upgrades = copy(g.upgrades, k .. 'up.'),
	}
	Cache[id] = text
	return text
end
