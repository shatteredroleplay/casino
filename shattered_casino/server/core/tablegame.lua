TableGame = { All = {} }

TableGameSync = function(g, id)
	local def = g.Definition
	local STATE = UtilEvent(g.Name .. ':state')

	Broadcast(STATE, id, def.public(g, g.Tables[id]))
end

TableGameSpeak = function(g, id, line, delay)
	local SPEECH = UtilEvent(g.Name .. ':speech')

	SetTimeout(delay or 0, function()
		Broadcast(SPEECH, id, line)
	end)
end

TableGameUntil = function(g, cond)
	while not cond() do
		Wait(250)
	end
end

TableGameMaxBet = function(g, t)
	return PoolMaxBet(t.cfg.max)
end

TableGameTimeLeft = function(g, t)
	return t.deadline and math.max(0, t.deadline - os.time()) or nil
end

TableGameTake = function(g, src, amount)
	if not WalletRemove(src, amount) then
		return false
	end
	PoolAdd(amount)
	return true
end

TableGameOnline = function(g, id)
	return PlayersSource(id)
end

TableGameSettle = function(g, id, bet, payout)
	local name = g.Name

	local src = PlayersSource(id)
	PoolSettle(id, name, bet, payout)
	if payout > 0 then
		WalletGive(id, payout, src)
	end
	return src
end

TableGameRefund = function(g, id, amount)
	if amount <= 0 then
		return false
	end
	PoolAdd(-amount)
	WalletGive(id, amount)
	return true
end

TableGameLeave = function(g, src)
	local def = g.Definition

	local at = g.Seated[src]
	if not at then
		return
	end
	g.Seated[src] = nil
	local t = g.Tables[at.id]
	local occupant = t.seats[at.seat]
	t.seats[at.seat] = nil
	local result = def.left and def.left(g, t, src, at, occupant)
	if def.bye then
		TableGameSpeak(g, at.id, def.bye)
	end
	TableGameSync(g, at.id)
	return result
end

TableGameIdle = function(g, t, played)
	local cfg = g.Config

	for seat, occupant in pairs(t.seats) do
		local src = type(occupant) == 'table' and occupant.src or occupant
		local at = g.Seated[src]
		if at then
			if played(seat) then
				at.idle = 0
			else
				at.idle = at.idle + 1
				if at.idle >= cfg.IdleRounds then
					TableGameLeave(g, src)
				end
			end
		end
	end
end

TableGameStart = function(g, id)
	local def = g.Definition
	local name = g.Name

	local t = g.Tables[id]
	if t.running then
		return
	end
	t.running = true
	CreateThread(function()
		while next(t.seats) do
			local ok, err = pcall(def.play, g, t)
			if not ok then
				UtilPrint('error', '%s table %s: %s', name, id, tostring(err))
				if def.refund then
					def.refund(g, t)
				end
				Wait(5000)
			end
		end
		t.running = false
		if def.reset then
			def.reset(g, t)
		end
		t.phase, t.deadline = 'idle', nil
		TableGameSync(g, id)
	end)
end

TableGameNew = function(def)
	local name, cfg = def.name, def.config
	local g = { Definition = def, Tables = {}, Seated = {}, Config = cfg, Name = name }
	TableGame.All[name] = g
	for id, tcfg in ipairs(cfg.Tables) do
		local t = { id = id, cfg = tcfg, seats = {}, phase = 'idle', ped = { variation = math.random(14) } }
		if def.init then
			def.init(g, t)
		end
		g.Tables[id] = t
	end

	RpcRegister(name .. ':state', function(_, id)
		local t = g.Tables[id]
		return t and def.public(g, t)
	end)

	RpcRegister(name .. ':sit', function(src, id, seat, ...)
		local t = g.Tables[id]
		if not t or math.type(seat) ~= 'integer' or seat < 1 or seat > 4 then
			return false
		end
		if t.seats[seat] or g.Seated[src] then
			return false
		end
		if #(GetEntityCoords(GetPlayerPed(src)) - t.cfg.coords.xyz) > 4.0 then
			return false
		end
		if not PlayersId(src) then
			return L('error.not_loaded')
		end
		local refused = SettingsRefuse(src, name)
		if refused then
			return refused
		end

		local occupant = src
		if def.seat then
			local value, err = def.seat(g, t, src, seat, ...)
			if not value then
				return err or false
			end
			occupant = value
		end
		t.seats[seat] = occupant
		g.Seated[src] = { id = id, seat = seat, idle = 0 }
		if def.greet then
			TableGameSpeak(g, id, def.greet)
		end
		TableGameSync(g, id)
		TableGameStart(g, id)
		return true
	end, 4)

	RpcRegister(name .. ':leave', function(src)
		local result = TableGameLeave(g, src)
		if result == nil then
			return true
		end
		return result
	end)

	AddEventHandler(UtilEvent('player:unloaded'), function(src)
		TableGameLeave(g, src)
	end)

	AddEventHandler('playerDropped', function()
		TableGameLeave(g, source)
	end)

	AddEventHandler('onResourceStop', function(resource)
		if resource ~= Util.Resource then
			return
		end
		for _, t in ipairs(g.Tables) do
			if def.refund then
				def.refund(g, t)
			end
			if def.stop then
				def.stop(g, t)
			end
		end
	end)

	return g
end
