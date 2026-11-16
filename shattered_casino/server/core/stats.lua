Stats = {}

local Cfg = Config.Stats
local BATCH = 400
local People, Games, Hours, Rounds = {}, {}, {}, {}
local Seen = { hour = nil, games = {} }

local add = function(list, key, wagered, won)
	local entry = list[key]
	if not entry then
		entry = { wagered = 0, won = 0, rounds = 0, best = 0 }
		list[key] = entry
	end
	entry.wagered = entry.wagered + wagered
	entry.won = entry.won + won
	entry.rounds = entry.rounds + 1
	entry.best = math.max(entry.best, won - wagered)
	return entry
end

local seen = function(hour, game, id)
	if Seen.hour ~= hour then
		Seen.hour, Seen.games = hour, {}
	end
	local set = Seen.games[game]
	if not set then
		set = { count = 0 }
		Seen.games[game] = set
	end
	if not set[id] then
		set[id] = true
		set.count = set.count + 1
	end
	return set.count
end

StatsRecord = function(id, game, wagered, won, meta)
	if not id then
		return
	end
	wagered, won = math.floor(wagered), math.floor(won)

	local person = add(People, id, wagered, won)
	local src = PlayersSource(id)
	if src then
		person.name = PlayersName(src)
	end
	add(Games, game, wagered, won)

	local hour = os.date('%Y-%m-%d %H:00:00')
	local slot = add(Hours, hour .. '|' .. game, wagered, won)
	slot.hour, slot.game, slot.players = hour, game, seen(hour, game, id)

	Rounds[#Rounds + 1] = { id, game, wagered, won, meta and json.encode(meta) or '', os.date('%Y-%m-%d %H:%M:%S') }

	local net = won - wagered
	if net >= Cfg.BigWin then
		local name = person.name or id
		TriggerEvent(UtilEvent('bigwin'), { id = id, name = name, game = game, wagered = wagered, won = won })
		Log('bigwin', L('log.bigwin'), {
			{ name = L('log.player'), value = ('%s [%s]'):format(name, id), inline = true },
			{ name = L('log.game'), value = game, inline = true },
			{ name = L('log.wagered'), value = FormatMoney(wagered), inline = true },
			{ name = L('log.won'), value = FormatMoney(won), inline = true },
		})
	end
end

local roundQueries = function(list, queries)
	for first = 1, #list, BATCH do
		local last, marks, values = math.min(#list, first + BATCH - 1), {}, {}
		for i = first, last do
			local r = list[i]
			marks[#marks + 1] = "(?, ?, ?, ?, NULLIF(?, ''), ?)"
			for j = 1, 6 do
				values[#values + 1] = r[j]
			end
		end
		queries[#queries + 1] = {
			query = 'INSERT INTO `casino_rounds` (`identifier`, `game`, `bet`, `payout`, `meta`, `created_at`) VALUES '
				.. table.concat(marks, ', '),
			values = values,
		}
	end
end

StatsFlush = function()
	if not next(People) and not next(Games) and #Rounds == 0 then
		return
	end
	local people, games, hours, rounds = People, Games, Hours, Rounds
	People, Games, Hours, Rounds = {}, {}, {}, {}

	local queries = {}
	for id, p in pairs(people) do
		queries[#queries + 1] = {
			query = [[INSERT INTO `casino_players` (`identifier`, `name`, `wagered`, `won`, `rounds`, `biggest_win`) VALUES (?, NULLIF(?, ''), ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `name` = COALESCE(NULLIF(?, ''), `name`), `wagered` = `wagered` + ?, `won` = `won` + ?, `rounds` = `rounds` + ?, `biggest_win` = GREATEST(`biggest_win`, ?)]],
			values = {
				id,
				p.name or '',
				p.wagered,
				p.won,
				p.rounds,
				p.best,
				p.name or '',
				p.wagered,
				p.won,
				p.rounds,
				p.best,
			},
		}
	end
	for game, g in pairs(games) do
		queries[#queries + 1] = {
			query = [[INSERT INTO `casino_games` (`game`, `wagered`, `won`, `rounds`, `biggest_win`) VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `wagered` = `wagered` + ?, `won` = `won` + ?, `rounds` = `rounds` + ?, `biggest_win` = GREATEST(`biggest_win`, ?)]],
			values = { game, g.wagered, g.won, g.rounds, g.best, g.wagered, g.won, g.rounds, g.best },
		}
	end
	for _, h in pairs(hours) do
		queries[#queries + 1] = {
			query = [[INSERT INTO `casino_hourly` (`hour`, `game`, `wagered`, `won`, `rounds`, `players`) VALUES (?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE `wagered` = `wagered` + ?, `won` = `won` + ?, `rounds` = `rounds` + ?, `players` = GREATEST(`players`, ?)]],
			values = { h.hour, h.game, h.wagered, h.won, h.rounds, h.players, h.wagered, h.won, h.rounds, h.players },
		}
	end
	roundQueries(rounds, queries)

	MySQL.transaction(queries, function(ok)
		if not ok then
			UtilPrint('error', 'could not save casino stats (%d rounds lost)', #rounds)
		end
	end)
end

local prune = function()
	MySQL.update('DELETE FROM `casino_rounds` WHERE `created_at` < NOW() - INTERVAL ? DAY', { Cfg.RetentionDays })
end

CreateThread(function()
	DbAwait()
	prune()
	local nextPrune = os.time() + 6 * 3600
	while true do
		Wait(Cfg.Flush * 1000)
		StatsFlush()
		if os.time() >= nextPrune then
			nextPrune = os.time() + 6 * 3600
			prune()
		end
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == Util.Resource and Db.Ready then
		StatsFlush()
	end
end)
