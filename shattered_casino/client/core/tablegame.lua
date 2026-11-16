TableGame = {}

local SHARED = 'anim_casino_b@amb@casino@games@shared@player@'
local DEALER_IDLE = 'anim_casino_b@amb@casino@games@shared@dealer@'
TableGame.Shared = SHARED
TableGame.DealerIdle = DEALER_IDLE

local occupant = function(state, seat)
	local s = state.seats[seat]
	return type(s) == 'table' and s.src or s
end

TableGameEvent = function(g, event)
	local name = g.Name
	return UtilEvent(name .. ':' .. event)
end

TableGameRpc = function(g, fn, ...)
	local name = g.Name
	return RpcCall(name .. ':' .. fn, ...)
end

TableGameNotify = function(g, text, kind)
	BridgeNotifySend(text, kind or 'error', kind == 'success' and 5000 or 3000, g.Title)
end

TableGamePressed = function(g, control)
	return IsDisabledControlJustPressed(0, control)
end

TableGameVisible = function(g, t)
	return CasinoOnScreen(t, t.coords.xyz + vec3(0.0, 0.0, 1.0), 2.0)
end

TableGameDealerScene = function(g, t, dict, anim, loop, rate)
	CasinoLoadDict(dict)
	local c = t.coords
	local scene = CreateSynchronizedScene(c.x, c.y, c.z - 0.025, 0.0, 0.0, c.w, 2)
	SetSynchronizedSceneLooped(scene, loop)
	TaskSynchronizedScene(
		t.dealer,
		scene,
		dict,
		anim,
		loop and 1000.0 or 8.0,
		loop and -8.0 or 8.0,
		4,
		1,
		1148846080,
		0
	)
	if rate then
		SetSynchronizedSceneRate(scene, rate)
	end
	t.scene = scene
	if loop then
		return
	end
	CreateThread(function()
		Wait(math.floor(GetAnimDuration(dict, anim) * 1000 / (rate or 1.0)))
		if t.scene == scene and DoesEntityExist(t.dealer) then
			TableGameDealerScene(g, t, DEALER_IDLE, 'idle', true)
		end
	end)
end

TableGameScene = function(g, id, seat, dict, anim, loop)
	local t = g.Spawned[id]
	if not t then
		return 0
	end
	return CasinoSeatScene(t.obj, seat, dict, anim, loop)
end

TableGameGesture = function(g, dict, anim)
	local sitting = g.Sitting
	if not sitting or GetGameTimer() < (sitting.enterUntil or 0) then
		return
	end
	CreateThread(function()
		Wait(TableGameScene(g, sitting.id, sitting.seat, dict, anim, false))
		if g.Sitting == sitting then
			TableGameScene(g, sitting.id, sitting.seat, SHARED, 'idle_cardgames', true)
		end
	end)
end

TableGameClearChips = function(g, t, key)
	local current = t.chips[key]
	if not current then
		return
	end
	for _, obj in ipairs(current.objs) do
		DeleteObject(obj)
	end
	t.chips[key] = nil
end

TableGameSyncChips = function(g, t, key, amount, spots, base, lift)
	if (t.chips[key] and t.chips[key].amount or 0) == amount then
		return
	end
	TableGameClearChips(g, t, key)
	if amount <= 0 then
		return
	end
	t.chips[key] =
		{ amount = amount, objs = CasinoStackChips(t.coords, t.coords.w, amount, spots, base or ChipHeight, lift) }
end

TableGameSend = function(g, id)
	local def = g.Definition

	if not def.message then
		return
	end
	SendDuiMessage(g.Dui, json.encode(def.message(g, id, g.States[id])))
end

TableGameRefresh = function(g, id)
	if g.Dui and g.Board == id and g.Spawned[id] and g.States[id] then
		TableGameSend(g, id)
	end
end

TableGameSetKeys = function(g, keys)
	if json.encode(keys) == json.encode(g.Keys) then
		return
	end
	g.Keys = keys
	if g.Board then
		TableGameRefresh(g, g.Board)
	end
end

TableGameAsk = function(g, title, label, min, max, default)
	g.Busy = true
	local values = UiInput({
		title = title,
		fields = { { name = 'amount', type = 'amount', label = label, min = min, max = max, default = default or min } },
	})
	g.Busy = false
	return values and tonumber(values.amount)
end

TableGameChips = function(g)
	return RpcCall('wallet:get') or 0
end

TableGameUpdate = function(g, id)
	local def = g.Definition

	TableGameRefresh(g, id)
	if not g.Sitting or g.Sitting.id ~= id then
		return
	end
	if def.update then
		def.update(g, id, g.States[id])
	end
end

TableGameStandUp = function(g, skipAnim)
	local def = g.Definition
	local name = g.Name

	if not g.Sitting then
		return
	end
	local id, seat = g.Sitting.id, g.Sitting.seat
	g.Sitting = nil
	Casino.Seated = false
	TableGameSetKeys(g, {})
	if def.onStand then
		def.onStand(g, id, seat)
	end
	RpcAsync(name .. ':leave', function(res)
		if def.left then
			def.left(g, res)
		end
	end)
	if skipAnim then
		return
	end
	Wait(TableGameScene(g, id, seat, SHARED, 'sit_exit_left', false))
	ClearPedTasks(PlayerPedId())
end

TableGameNew = function(def)
	local name, cfg = def.name, def.config
	local g = {
		Definition = def,
		States = {},
		Spawned = {},
		Keys = {},
		Busy = false,
		Notified = false,
		Config = cfg,
		Name = name,
	}
	local txd = 'casino_' .. name

	g.Title = L('game.' .. name)

	g.Txd = txd

	local closestSeat = function(id)
		local t, s = g.Spawned[id], g.States[id]
		if not t or not s then
			return
		end
		return CasinoClosestSeat(t.obj, s.seats, cfg.SitDistance)
	end

	local fromEntity = function(entity)
		for id, t in pairs(g.Spawned) do
			if t.obj == entity then
				return id
			end
		end
	end

	local seatedLoop = function()
		CreateThread(function()
			while g.Sitting do
				local s, t = g.States[g.Sitting.id], g.Spawned[g.Sitting.id]
				CasinoDisableControls()
				if s and t then
					def.tick(g, s, t)
				end
				if g.Sitting and CasinoIsDown() then
					TableGameStandUp(g, true)
				end
				Wait(0)
			end
		end)
	end

	local sit = function(id)
		if Casino.Seated or CasinoIsDown() then
			return
		end
		local seat = closestSeat(id)
		if not seat then
			return TableGameNotify(g, L('table.no_seat'))
		end

		Casino.Seated = true
		local extra = { n = 0 }
		if def.sitArgs then
			extra = table.pack(def.sitArgs(g, id, seat))
			if extra[1] == nil then
				Casino.Seated = false
				return
			end
		end
		local res = RpcCall(name .. ':sit', id, seat, table.unpack(extra, 1, extra.n))
		if res ~= true then
			Casino.Seated = false
			return TableGameNotify(g, type(res) == 'string' and res or L('table.cannot_sit'))
		end

		local sitting = { id = id, seat = seat }
		g.Sitting, g.Busy, g.Notified = sitting, false, false
		Casino.Seated = true
		if def.onSit then
			def.onSit(g, id, seat)
		end

		if def.early then
			TableGameUpdate(g, id)
			seatedLoop()
			sitting.enterUntil = GetGameTimer() + TableGameScene(g, id, seat, SHARED, 'sit_enter_left', false)
			Wait(sitting.enterUntil - GetGameTimer())
			if g.Sitting ~= sitting then
				return
			end
			TableGameScene(g, id, seat, SHARED, 'idle_cardgames', true)
			return
		end

		Wait(TableGameScene(g, id, seat, SHARED, 'sit_enter_left', false))
		if g.Sitting ~= sitting then
			return
		end
		TableGameScene(g, id, seat, SHARED, 'idle_cardgames', true)
		TableGameUpdate(g, id)
		seatedLoop()
	end

	local spawnDefault = function(id, tcfg, state)
		local c = tcfg.coords
		local tableModel, dealerModel =
			CasinoLoadModel(tcfg.model), CasinoLoadModel(CasinoDealerModel(state.ped.variation))
		if not tableModel or not dealerModel then
			return nil
		end
		local t = { cards = {}, chips = {}, coords = c, own = true }
		t.obj = CreateObjectNoOffset(tableModel, c.x, c.y, c.z, false, false, false)
		SetEntityRotation(t.obj, 0.0, 0.0, c.w, 2, true)
		FreezeEntityPosition(t.obj, true)

		t.dealer = CreatePed(4, dealerModel, c.x, c.y, c.z, c.w, false, true)
		CasinoDealerLook(t.dealer, state.ped.variation)
		SetEntityCanBeDamaged(t.dealer, false)
		SetEntityInvincible(t.dealer, true)
		SetBlockingOfNonTemporaryEvents(t.dealer, true)
		SetPedCanRagdollFromPlayerImpact(t.dealer, false)
		TableGameDealerScene(g, t, DEALER_IDLE, 'idle', true)
		return t
	end

	local spawn = function(id)
		local state = TableGameRpc(g, 'state', id)
		if not state then
			return
		end
		local t
		if def.spawn then
			t = def.spawn(g, id, cfg.Tables[id], state)
		else
			t = spawnDefault(id, cfg.Tables[id], state)
		end
		if not t then
			return
		end
		g.Spawned[id] = t
		if not g.States[id] then
			state.deadline = state.timeLeft and GetGameTimer() + state.timeLeft * 1000
			g.States[id] = state
		end
		t.dirty = true
	end

	local despawn = function(id)
		local t = g.Spawned[id]
		g.Spawned[id] = nil
		g.States[id] = nil
		if def.despawn then
			def.despawn(g, t)
		end
		for _, list in pairs(t.cards or {}) do
			for _, card in pairs(list) do
				DeleteObject(type(card) == 'table' and card.obj or card)
			end
		end
		for key in pairs(t.chips or {}) do
			TableGameClearChips(g, t, key)
		end
		if t.dealer then
			DeletePed(t.dealer)
		end
		if t.own then
			DeleteObject(t.obj)
		end
	end

	CreateThread(function()
		local CanInteract = function(entity)
			local id = fromEntity(entity)
			return not Casino.Seated and id ~= nil and closestSeat(id) ~= nil
		end

		local OnSelect = function(entity)
			local id = fromEntity(entity)
			if id then
				CreateThread(function()
					sit(id)
				end)
			end
		end

		BridgeTargetAddModels(def.models, {
			{
				name = 'casino_' .. name,
				label = L('table.play', { game = g.Title }),
				icon = 'fa-solid fa-dice',
				distance = 3.5,
				canInteract = CanInteract,
				onSelect = OnSelect,
			},
		})
	end)

	RegisterNetEvent(TableGameEvent(g, 'speech'), function(id, line)
		local t = g.Spawned[id]
		if t then
			CasinoSpeech(t.dealer, line)
		end
	end)

	RegisterNetEvent(TableGameEvent(g, 'state'), function(id, state)
		state.deadline = state.timeLeft and GetGameTimer() + state.timeLeft * 1000
		g.States[id] = state
		if g.Spawned[id] then
			g.Spawned[id].dirty = true
		end
		if g.Sitting and g.Sitting.id == id and occupant(state, g.Sitting.seat) ~= CasinoMe() then
			CreateThread(function(...)
				return TableGameStandUp(g, ...)
			end)
			return
		end
		TableGameUpdate(g, id)
	end)

	CreateThread(function()
		local nextCheck = 0
		while true do
			if not next(g.Spawned) then
				CasinoWaitActive()
			end
			if GetGameTimer() >= nextCheck then
				nextCheck = GetGameTimer() + 1000
				local pos = GetEntityCoords(PlayerPedId())
				for id, tcfg in ipairs(cfg.Tables) do
					local near = Casino.Active
						and #(pos - tcfg.coords.xyz) < cfg.RenderDistance + (g.Spawned[id] and 5.0 or 0.0)
					if near and not g.Spawned[id] then
						spawn(id)
					elseif not near and g.Spawned[id] then
						if g.Sitting and g.Sitting.id == id then
							TableGameStandUp(g, true)
						end
						despawn(id)
					end
				end
			end
			for id, t in pairs(g.Spawned) do
				if t.dirty then
					t.dirty = false
					def.render(g, t, g.States[id], id)
					t.animate = true
				end
			end
			Wait(next(g.Spawned) and 100 or 1000)
		end
	end)

	if def.board then
		CreateThread(function()
			local b, nextSend = def.board, 0
			while true do
				if not g.Dui then
					CasinoWaitActive()
				end
				local id = b.choose and b.choose(g)
				if not id then
					local pos, best = GetEntityCoords(PlayerPedId()), nil
					for tid, t in pairs(g.Spawned) do
						local dist = #(pos - t.coords.xyz)
						if dist < cfg.Board.Distance and (not best or dist < best) then
							id, best = tid, dist
						end
					end
				end

				if id and g.States[id] and g.Spawned[id] then
					if not g.Dui then
						g.Dui = CreateDui(DrawPageUrl(b.page, b.prefixes), b.width, b.height)
						CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(txd), txd, GetDuiHandle(g.Dui))
					end
					if id ~= g.Board or GetGameTimer() >= nextSend then
						g.Board, nextSend = id, GetGameTimer() + 1000
						TableGameSend(g, id)
					end
					def.draw(g, id, g.Spawned[id], g.States[id])
					Wait(0)
				else
					if g.Dui then
						DestroyDui(g.Dui)
					end
					g.Dui, g.Board = nil, nil
					Wait(500)
				end
			end
		end)
	end

	AddEventHandler('onResourceStop', function(resource)
		if resource ~= Util.Resource then
			return
		end
		if g.Sitting then
			local id, seat = g.Sitting.id, g.Sitting.seat
			g.Sitting = nil
			Casino.Seated = false
			if def.onStand then
				def.onStand(g, id, seat)
			end
			ClearPedTasks(PlayerPedId())
		end
		if g.Dui then
			DestroyDui(g.Dui)
		end
		for id in pairs(g.Spawned) do
			despawn(id)
		end
	end)

	return g
end
