Settings = {}

Settings.Games = { 'blackjack', 'roulette', 'baccarat', 'poker', 'slots', 'track', 'wheel' }
Settings.Tables =
	{ blackjack = Config.Blackjack, roulette = Config.Roulette, baccarat = Config.Baccarat, poker = Config.Poker }

local Defaults = { cooldown = Config.Wheel.Cooldown, limits = {} }
for game, cfg in pairs(Settings.Tables) do
	for id, t in ipairs(cfg.Tables) do
		Defaults.limits[game .. ':' .. id] = { min = t.min, max = t.max }
	end
end
Settings.Defaults = Defaults

local current = function()
	return StateGet('settings', { disabled = {}, limits = {} })
end

SettingsApply = function()
	local s = current()
	for key, base in pairs(Defaults.limits) do
		local game, id = key:match('^(%w+):(%d+)$')
		local t = Settings.Tables[game].Tables[tonumber(id)]
		local over = s.limits and s.limits[key]
		t.min, t.max = over and over.min or base.min, over and over.max or base.max
	end
	Config.Wheel.Cooldown = s.cooldown or Defaults.cooldown
	GlobalState.casinoSettings =
		{ disabled = s.disabled or {}, limits = s.limits or {}, cooldown = Config.Wheel.Cooldown }
end

Settings.Get = current

SettingsSet = function(s)
	StateSet('settings', s)
	SettingsApply()
end

SettingsDisabled = function(game)
	local s = current()
	return s.disabled and s.disabled[game] == true
end

SettingsRefuse = function(src, game)
	if SettingsDisabled(game) then
		return L('admin.game_closed')
	end
	if PlayersBanned(src) then
		return L('admin.banned_notice')
	end
end

CreateThread(function()
	DbAwait()
	SettingsApply()
end)
