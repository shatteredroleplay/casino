local Cfg = Config.Admin
local FEED = UtilEvent('admin:feed')
local Rate = Config.Chips.Rate
local Viewers, Feed = {}, {}

local push = function(kind, text, extra)
	local entry = { kind = kind, text = text, time = os.time() }
	for k, v in pairs(extra or {}) do
		entry[k] = v
	end
	table.insert(Feed, 1, entry)
	Feed[101] = nil
	for src in pairs(Viewers) do
		TriggerClientEvent(FEED, src, entry)
	end
end

local label = function(game)
	local kind, title = tostring(game):match('^([^:]+):?(.*)$')
	if kind == 'slots' and title ~= '' and SlotsText(title) then
		return ('%s · %s'):format(L('game.slots'), SlotsText(title).label)
	end
	return L('game.' .. (kind or game))
end

AddEventHandler(UtilEvent('rig:feed'), function(entry)
	push('rig', entry.text)
end)

AddEventHandler(UtilEvent('bigwin'), function(w)
	push(
		'bigwin',
		L('admin.feed_bigwin', { name = w.name, amount = FormatMoney(w.won - w.wagered), game = label(w.game) })
	)
end)

AddEventHandler(UtilEvent('audit'), function(a)
	push(
		'audit',
		L(
			a.target and a.target ~= '' and 'admin.feed_audit' or 'admin.feed_audit_short',
			{ admin = a.admin, action = a.action, target = a.target }
		)
	)
end)

AddEventHandler('playerDropped', function()
	Viewers[source] = nil
end)

local Any = function(src)
	return PermsAny(src)
end

local Checks = {
	any = Any,
}

local register = function(name, node, fn, calls)
	local allowed = Checks[node] or function(src)
		return PermsHas(src, node)
	end
	RpcRegister('admin:' .. name, function(src, ...)
		if not allowed(src) then
			return { error = L('error.no_permission') }
		end
		return fn(src, ...)
	end, calls or 6)
end

local sums = function(where, args)
	local row = MySQL.single.await(
		'SELECT COALESCE(SUM(`wagered`), 0) AS wagered, COALESCE(SUM(`won`), 0) AS won, COALESCE(SUM(`rounds`), 0) AS rounds FROM `casino_hourly` WHERE '
			.. where,
		args or {}
	) or {}
	return { wagered = tonumber(row.wagered) or 0, won = tonumber(row.won) or 0, rounds = tonumber(row.rounds) or 0 }
end

local inside = function()
	local n = 0
	for _, id in ipairs(GetPlayers()) do
		if Player(id).state.casinoInside then
			n = n + 1
		end
	end
	return n
end

local seated = function()
	local list = {}
	for name, g in pairs(TableGame.All) do
		local n = 0
		for _ in pairs(g.Seated) do
			n = n + 1
		end
		list[#list + 1] = { game = name, label = L('game.' .. name), seated = n, seats = #g.Tables * 4 }
	end
	list[#list + 1] = { game = 'slots', label = L('game.slots'), seated = SlotsSeated and SlotsSeated() or 0 }
	list[#list + 1] = { game = 'track', label = L('game.track'), seated = TrackSeated and TrackSeated() or 0 }
	table.sort(list, function(a, b)
		return a.label < b.label
	end)
	return list
end

register('open', 'any', function(src)
	Viewers[src] = true
	local games = {}
	for i, game in ipairs(Rig.Games) do
		games[i] = { id = game, label = L('game.' .. game) }
	end
	return { perms = PermsList(src), games = games, rate = Rate, feed = Feed }
end, 4)

RpcRegister('admin:close', function(src)
	Viewers[src] = nil
	return true
end)

register('dashboard', 'view', function()
	DbAwait()
	local bigwins = MySQL.query.await(
		[[SELECT r.`identifier`, COALESCE(p.`name`, r.`identifier`) AS name, r.`game`, r.`bet`, r.`payout`, UNIX_TIMESTAMP(r.`created_at`) AS time
        FROM `casino_rounds` r LEFT JOIN `casino_players` p ON p.`identifier` = r.`identifier`
        WHERE r.`payout` - r.`bet` >= ? ORDER BY r.`id` DESC LIMIT 12]],
		{ Config.Stats.BigWin }
	) or {}
	for _, w in ipairs(bigwins) do
		w.label = label(w.game)
	end
	return {
		pool = PoolBalance() * Rate,
		cap = Config.Pool.Cap * Rate,
		maxBet = PoolMaxBet(math.huge),
		fund = PoolFund(),
		carValue = Config.Wheel.Car.Value,
		car = Config.Wheel.Car.Label,
		today = sums('`hour` >= CURDATE()'),
		week = sums('`hour` >= NOW() - INTERVAL 7 DAY'),
		month = sums('`hour` >= NOW() - INTERVAL 30 DAY'),
		inside = inside(),
		seated = seated(),
		bigwins = bigwins,
	}
end)

register('games', 'view', function(_, days)
	days = UtilInteger(days, 1, 365) or 30
	DbAwait()
	local list = MySQL.query.await(
		[[SELECT `game`, SUM(`wagered`) AS wagered, SUM(`won`) AS won, SUM(`rounds`) AS rounds, MAX(`players`) AS players
        FROM `casino_hourly` WHERE `hour` >= NOW() - INTERVAL ? DAY GROUP BY `game` ORDER BY wagered DESC]],
		{ days }
	) or {}
	local best = {}
	for _, row in ipairs(MySQL.query.await('SELECT `game`, `biggest_win` FROM `casino_games`') or {}) do
		best[row.game] = row.biggest_win
	end
	for _, row in ipairs(list) do
		row.wagered, row.won, row.rounds = tonumber(row.wagered) or 0, tonumber(row.won) or 0, tonumber(row.rounds) or 0
		row.label, row.biggest = label(row.game), best[row.game] or 0
	end
	local series = MySQL.query.await(
		[[SELECT DATE_FORMAT(`hour`, '%Y-%m-%d') AS day, SUM(`wagered`) AS wagered, SUM(`won`) AS won, SUM(`rounds`) AS rounds
        FROM `casino_hourly` WHERE `hour` >= NOW() - INTERVAL ? DAY GROUP BY day ORDER BY day]],
		{ days }
	) or {}
	for _, row in ipairs(series) do
		row.wagered, row.won, row.rounds = tonumber(row.wagered) or 0, tonumber(row.won) or 0, tonumber(row.rounds) or 0
	end
	return { days = days, list = list, series = series }
end)

register('players', 'view', function(_, search)
	local online = {}
	for _, p in ipairs(PlayersOnline()) do
		online[#online + 1] = {
			id = p.id,
			src = p.src,
			name = PlayersName(p.src),
			chips = WalletGet(p.src),
			inside = Player(p.src).state.casinoInside == true,
		}
	end
	table.sort(online, function(a, b)
		return (a.inside and 0 or 1) .. a.name < (b.inside and 0 or 1) .. b.name
	end)

	local results
	if type(search) == 'string' and #search >= 2 then
		local like = '%' .. search:gsub('[%%_]', '') .. '%'
		results = MySQL.query.await(
			[[SELECT `identifier`, `name`, `wagered`, `won`, `rounds`, `biggest_win`, `banned`, UNIX_TIMESTAMP(`last_seen`) AS last_seen
            FROM `casino_players` WHERE `name` LIKE ? OR `identifier` LIKE ? ORDER BY `last_seen` DESC LIMIT 25]],
			{ like, like }
		)
	else
		results = MySQL.query.await(
			[[SELECT `identifier`, `name`, `wagered`, `won`, `rounds`, `biggest_win`, `banned`, UNIX_TIMESTAMP(`last_seen`) AS last_seen
            FROM `casino_players` WHERE `rounds` > 0 ORDER BY (`won` - `wagered`) DESC LIMIT 10]]
		)
	end
	return { online = online, results = results or {} }
end)

register('player', 'view', function(_, id)
	if type(id) ~= 'string' then
		return nil
	end
	local row = MySQL.single.await(
		'SELECT *, UNIX_TIMESTAMP(`last_seen`) AS seen FROM `casino_players` WHERE `identifier` = ?',
		{ id }
	) or { identifier = id }
	local rounds = MySQL.query.await(
		[[SELECT `game`, `bet`, `payout`, UNIX_TIMESTAMP(`created_at`) AS time FROM `casino_rounds`
        WHERE `identifier` = ? ORDER BY `id` DESC LIMIT 50]],
		{ id }
	) or {}
	for _, r in ipairs(rounds) do
		r.label = label(r.game)
	end
	local src = PlayersSource(id)
	local rig = RigState()
	local entry
	for _, p in ipairs(rig.players) do
		if p.id == id then
			entry = p.rig
		end
	end
	return {
		id = id,
		name = row.name or src and PlayersName(src) or id,
		src = src,
		chips = src and WalletGet(src) or nil,
		wagered = row.wagered or 0,
		won = row.won or 0,
		rounds = row.rounds or 0,
		biggest = row.biggest_win or 0,
		banned = row.banned == 1 or row.banned == true,
		wheel = row.wheel_spun_at,
		seen = row.seen,
		history = rounds,
		rig = entry,
		prizes = rig.prizes,
	}
end)

register('rig', 'rig', function()
	local state = RigState()
	state.feed = RigFeedSince(0)
	state.protection = PoolProtection()
	return state
end)

register('rig:set', 'rig', function(src, target, mode, chance, games, options)
	return RigSet(AuditAdmin(src), target or nil, mode, chance, games, options)
end)

register('rig:wheel', 'rig', function(src, target, index)
	return RigSetWheel(AuditAdmin(src), target, index)
end)

register('rig:clear', 'rig', function(src)
	return RigClear(AuditAdmin(src))
end, 2)

register('protection', 'economy', function(src, p)
	if type(p) ~= 'table' then
		return false
	end
	local max, curve, loss, chance = tonumber(p.max), tonumber(p.curve), UtilInteger(p.loss, 0), tonumber(p.chance)
	if
		not max
		or max < 0
		or max > 1
		or not curve
		or curve < 0.5
		or curve > 6
		or not loss
		or not chance
		or chance < 0
		or chance > 1
	then
		return false
	end
	local value = { Bias = { Max = max, Curve = curve }, HighRoller = { Loss = loss, Chance = chance } }
	PoolSetProtection(value)
	AuditRecord(AuditAdmin(src), 'economy', 'protection', L('admin.log_protection'), nil, {
		{ name = L('admin.bias'), value = ('%d%% · %.1f'):format(max * 100, curve), inline = true },
		{
			name = L('admin.high_roller'),
			value = ('%s · %d%%'):format(FormatChips(loss), chance * 100),
			inline = true,
		},
	}, value)
	return true
end)

register('economy', 'economy', function()
	return {
		pool = PoolBalance(),
		cap = Config.Pool.Cap,
		fund = PoolFund(),
		rate = Rate,
		maxBetPct = Config.Pool.MaxBetPct,
		income = StateGet('income', 0),
		incomeMode = Config.HouseIncome.Mode,
		protection = PoolProtection(),
	}
end)

local Pool = function(value)
	PoolSet(value)
	return FormatChips(PoolBalance())
end

local Fund = function(value)
	PoolSetFund(value)
	return FormatMoney(PoolFund())
end

local Changes = {
	pool = Pool,
	fund = Fund,
}

register('economy:set', 'economy', function(src, what, value)
	value = UtilInteger(value, 0)
	if not Changes[what] or not value then
		return false
	end
	local shown = Changes[what](value)
	AuditRecord(AuditAdmin(src), 'economy', 'economy.' .. what, L('admin.log_' .. what), nil, {
		{ name = L('admin.new_value'), value = shown, inline = true },
	}, { value = value })
	return true
end, 4)

register('chips', 'economy', function(src, id, amount)
	amount = UtilInteger(amount)
	local target = type(id) == 'string' and PlayersSource(id)
	if not target or not amount or amount == 0 then
		return L('rig.player_gone')
	end
	local ok = amount > 0 and WalletAdd(target, amount) or WalletRemove(target, -amount)
	if not ok then
		return L('error.generic')
	end
	AuditRecord(AuditAdmin(src), 'economy', 'chips', L('admin.log_chips'), id, {
		{ name = L('log.player'), value = ('%s [%s]'):format(PlayersName(target), id), inline = true },
		{ name = L('admin.amount'), value = FormatChips(amount), inline = true },
	}, { amount = amount })
	return true
end, 4)

register('wheel:reset', 'economy', function(src, id)
	if type(id) ~= 'string' then
		return false
	end
	MySQL.update.await('UPDATE `casino_players` SET `wheel_spun_at` = NULL WHERE `identifier` = ?', { id })
	AuditRecord(AuditAdmin(src), 'economy', 'wheel.reset', L('log.wheel_reset'), id)
	return true
end, 4)

register('ban', 'economy', function(src, id, on)
	if type(id) ~= 'string' then
		return false
	end
	PlayersSetBanned(id, on == true)
	AuditRecord(AuditAdmin(src), 'admin', on and 'ban' or 'unban', L(on and 'admin.log_ban' or 'admin.log_unban'), id)
	return true
end, 4)

register('settings', 'settings', function()
	local s, games, tables = Settings.Get(), {}, {}
	for i, game in ipairs(Settings.Games) do
		games[i] = { id = game, label = L('game.' .. game), disabled = s.disabled and s.disabled[game] == true }
	end
	for _, game in ipairs({ 'blackjack', 'roulette', 'baccarat', 'poker' }) do
		for id, t in ipairs(Settings.Tables[game].Tables) do
			local key = game .. ':' .. id
			local base = Settings.Defaults.limits[key]
			tables[#tables + 1] = {
				key = key,
				label = ('%s %d'):format(L('game.' .. game), id),
				min = t.min,
				max = t.max,
				baseMin = base.min,
				baseMax = base.max,
			}
		end
	end
	return {
		games = games,
		tables = tables,
		cooldown = Config.Wheel.Cooldown,
		baseCooldown = Settings.Defaults.cooldown,
	}
end)

register('settings:set', 'settings', function(src, data)
	if type(data) ~= 'table' then
		return false
	end
	local s = { disabled = {}, limits = {}, cooldown = nil }
	for _, game in ipairs(Settings.Games) do
		if type(data.disabled) == 'table' and data.disabled[game] == true then
			s.disabled[game] = true
		end
	end
	for key, base in pairs(Settings.Defaults.limits) do
		local over = type(data.limits) == 'table' and data.limits[key]
		local min, max = over and UtilInteger(over.min, 1), over and UtilInteger(over.max, 1)
		if min and max and min <= max and (min ~= base.min or max ~= base.max) then
			s.limits[key] = { min = min, max = max }
		end
	end
	local cooldown = UtilInteger(data.cooldown, 0, 30 * 24 * 3600)
	if cooldown and cooldown ~= Settings.Defaults.cooldown then
		s.cooldown = cooldown
	end
	SettingsSet(s)
	AuditRecord(AuditAdmin(src), 'admin', 'settings', L('admin.log_settings'), nil, nil, s)
	return true
end, 4)

register('audit', 'view', function(_, page)
	page = UtilInteger(page, 1, 1000) or 1
	local rows = MySQL.query.await(
		[[SELECT `id`, UNIX_TIMESTAMP(`created_at`) AS time, `admin_name`, `action`, `target`, `data`
        FROM `casino_audit` ORDER BY `id` DESC LIMIT 50 OFFSET ?]],
		{ (page - 1) * 50 }
	) or {}
	return { page = page, rows = rows }
end)

RegisterCommand(Cfg.Command, function(src)
	if src == 0 then
		return UtilPrint('info', 'open the panel in game')
	end
	if not PermsAny(src) then
		return Notify(src, L('error.no_permission'), 'error')
	end
	TriggerClientEvent(UtilEvent('admin:open'), src)
end, false)
