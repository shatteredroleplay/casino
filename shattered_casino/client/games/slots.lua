local Cfg = Config.Slots
local Near, Hashes, Own = {}, {}, {}
local Picked = GlobalState.casinoSlots or {}
local IdleLoaded, OwnCount = false, 0
local Sitting, Busy, BetIndex, Ante, Buying = nil, false, 1, false, nil
local Choosing, Drawn
local volumeOf

local DICT = 'anim_casino_a@amb@casino@games@slots@male'
local TXD = 'casino_slot_%s_%s'
local Views = { screen = Cfg.Screen, plate = Cfg.Plate }

local idleLocale = function()
	for _, code in ipairs({ Cfg.IdleLocale or false, Locale.Code or false, 'en' }) do
		if
			type(code) == 'string'
			and LoadResourceFile(Util.Resource, ('web/dist/slots/idle/%s/any_screen.png'):format(code))
		then
			return code
		end
	end
	return 'en'
end
local IdleLocale = idleLocale()
local Title = L('game.slots')

local setKeys = CasinoKeybinds('slots', {
	spin = { 'E', 'slots.ui.key_spin' },
	bet = { 'SCROLL', 'slots.ui.key_bet' },
	ante = { 'G', 'slots.ui.key_ante' },
	buy = { 'H', 'slots.ui.key_buy' },
	browse = { '← →', 'slots.ui.key_browse' },
	click = { 'LMB', 'slots.ui.key_click' },
	leave = { 'X', 'slots.ui.key_leave' },
}, { 'spin', 'bet', 'ante', 'buy', 'browse', 'click', 'leave' })

for name in pairs(Cfg.Machines) do
	Hashes[joaat(name)] = name
end

local strings = function()
	local list = {}
	for key, text in pairs(Locale.Strings) do
		if key:sub(1, 9) == 'slots.ui.' or key:sub(1, 10) == 'slots.sym.' then
			list[key] = text
		end
	end
	return list
end
local Strings = strings()

local urlData = function(id, view, scale)
	local g, text, symbols = Cfg.Games[id], SlotsText(id), {}
	for i, s in ipairs(g.symbols) do
		symbols[i] = {
			id = s.id,
			pays = s.pays,
			wild = s.wild,
			scatter = s.scatter,
			valued = s.valued,
			reels = s.reels,
			coin = s.coin,
		}
	end
	local bonus = {}
	for k, v in pairs(g.bonus) do
		bonus[k] = v
	end
	bonus.name = text.bonus
	local data = {
		id = id,
		view = view,
		kind = g.kind,
		label = text.label,
		tag = text.tag,
		reels = g.reels,
		rows = g.rows,
		lines = g.lines,
		symbols = symbols,
		bonus = bonus,
		wheel = text.wheel,
		shape = g.shape,
		modes = text.modes,
		time = Cfg.Time,
		max = Cfg.MaxWin,
		spots = g.spots,
		maxLabel = text.max,
		most = g.most,
		upgrades = text.upgrades,
		scale = scale,
		t = Strings,
		sep = Config.Currency.Thousands,
		idle = IdleLocale,
	}
	return (json.encode(data):gsub('[^%w]', function(c)
		return ('%%%02X'):format(c:byte())
	end))
end

local gameOf = function(key)
	return Picked[key] or SlotsDefault(key)
end

local urlOf = function(game, small)
	return ('nui://%s/web/dist/slots.html?game=%s#%s'):format(
		Util.Resource,
		game,
		urlData(game, 'screen', small and Cfg.Watch.Scale or nil)
	)
end

local replace = function(name, on)
	for view in pairs(Views) do
		local txd, texture = TXD:format('any', view), ('%s_%s'):format(Cfg.Machines[name].texture, view)
		if on then
			AddReplaceTexture(name, texture, txd, txd)
		else
			RemoveReplaceTexture(name, texture)
		end
	end
end

local loadIdle = function()
	if IdleLoaded then
		return
	end
	IdleLoaded = true
	for _, id in ipairs({ 'any', table.unpack(Cfg.Order) }) do
		for view in pairs(Views) do
			local txd = TXD:format(id, view)
			CreateRuntimeTextureFromImage(
				CreateRuntimeTxd(txd),
				txd,
				('web/dist/slots/idle/%s/%s_%s.png'):format(IdleLocale, id, view)
			)
		end
	end
end

local destroy = function(s)
	if s.dui then
		DestroyDui(s.dui)
	end
	s.dui, s.obj = nil, nil
	for i, other in ipairs(Own) do
		if other == s then
			table.remove(Own, i)
			break
		end
	end
end

local closeScreens = function()
	for name in pairs(Cfg.Machines) do
		replace(name, false)
	end
	for i = #Own, 1, -1 do
		destroy(Own[i])
	end
	Near = {}
end

local watching = function(obj)
	for _, s in ipairs(Own) do
		if s.obj == obj then
			return s
		end
	end
end

local switch = function(s, game)
	s.game, s.ready = game, GetGameTimer() + 2500
	SetDuiUrl(s.dui, urlOf(game, s.small))
end

local claim = function(m, game, small)
	local s = watching(m.obj)
	if s and s.small ~= small then
		destroy(s)
		s = nil
	end
	if not s then
		for _, o in ipairs(Own) do
			if not o.obj and o.small == small and (not s or o.game == game) then
				s = o
			end
		end
	end

	if not s then
		OwnCount = OwnCount + 1
		local size = small and Cfg.Watch.Scale or 1
		s = { game = game, small = small, txd = ('casino_slot_own_%s'):format(OwnCount), ready = GetGameTimer() + 2000 }
		s.dui = CreateDui(urlOf(game, small), math.floor(Cfg.Screen.Width * size), math.floor(Cfg.Screen.Height * size))
		CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(s.txd), s.txd, GetDuiHandle(s.dui))
		Own[#Own + 1] = s
	elseif s.game ~= game then
		switch(s, game)
	end
	s.freed, s.obj = nil, m.obj
	return s
end

local send = function(s, msg)
	local post = function()
		if s.dui then
			SendDuiMessage(s.dui, json.encode(msg))
		end
	end
	local wait = s.ready - GetGameTimer()
	if wait > 0 then
		SetTimeout(wait, post)
	else
		post()
	end
end

local release = function(s)
	if not s.obj then
		return
	end
	send(s, { type = 'seat', seated = false })
	send(s, { type = 'sleep' })
	s.obj = nil
	local stamp = GetGameTimer()
	s.freed = stamp
	SetTimeout(Cfg.Keep, function()
		if not s.obj and s.freed == stamp then
			destroy(s)
		end
	end)
end

Drawn = {}

CreateThread(function()
	while true do
		if not Casino.Active then
			Drawn = {}
			CasinoWaitActive()
		end
		local now, cam, shown, list = GetGameTimer(), GetFinalRenderedCamCoord(), {}, {}
		for _, s in ipairs(Own) do
			if s.obj and now >= s.ready then
				shown[s.obj] = s.txd
			end
		end
		for obj, m in pairs(Near) do
			local to, f = cam - m.mid, m.facing
			if
				#to <= Cfg.IdleDistance
				and to.x * f.x + to.y * f.y > 0
				and IsSphereVisible(m.mid.x, m.mid.y, m.mid.z, 0.6)
			then
				local a, b, c, d = m.tl, m.tr, m.bl, m.br
				list[#list + 1] = {
					shown[obj] or TXD:format(gameOf(m.key), 'screen'),
					a.x,
					a.y,
					a.z,
					b.x,
					b.y,
					b.z,
					c.x,
					c.y,
					c.z,
					d.x,
					d.y,
					d.z,
				}
			end
		end
		Drawn = list
		Wait(100)
	end
end)

CreateThread(function()
	local draw = DrawSpritePoly
	while true do
		local list = Drawn
		for i = 1, #list do
			local t, ax, ay, az, bx, by, bz, cx, cy, cz, dx, dy, dz = table.unpack(list[i])
			draw(
				ax,
				ay,
				az,
				bx,
				by,
				bz,
				cx,
				cy,
				cz,
				255,
				255,
				255,
				255,
				t,
				t,
				0.0,
				0.0,
				1.0,
				1.0,
				0.0,
				1.0,
				0.0,
				1.0,
				1.0
			)
			draw(
				cx,
				cy,
				cz,
				bx,
				by,
				bz,
				ax,
				ay,
				az,
				255,
				255,
				255,
				255,
				t,
				t,
				0.0,
				1.0,
				1.0,
				1.0,
				0.0,
				1.0,
				0.0,
				0.0,
				1.0
			)
			draw(
				bx,
				by,
				bz,
				dx,
				dy,
				dz,
				cx,
				cy,
				cz,
				255,
				255,
				255,
				255,
				t,
				t,
				1.0,
				0.0,
				1.0,
				1.0,
				1.0,
				1.0,
				0.0,
				1.0,
				1.0
			)
			draw(
				cx,
				cy,
				cz,
				dx,
				dy,
				dz,
				bx,
				by,
				bz,
				255,
				255,
				255,
				255,
				t,
				t,
				0.0,
				1.0,
				1.0,
				1.0,
				1.0,
				1.0,
				1.0,
				0.0,
				1.0
			)
		end
		Wait(#list > 0 and 0 or 100)
	end
end)

local track = function(obj, name)
	local bottom, top = table.unpack(Cfg.Machines[name].screen)
	local x, lift = Cfg.ScreenWidth / 2, Cfg.ScreenLift
	local at = function(side, edge)
		return GetOffsetFromEntityInWorldCoords(obj, x * side, edge[1] - lift, edge[2])
	end
	local m = {
		obj = obj,
		name = name,
		key = SlotsKey(GetEntityCoords(obj)),
		tl = at(-1, top),
		tr = at(1, top),
		bl = at(-1, bottom),
		br = at(1, bottom),
	}
	m.mid = (m.tl + m.br) / 2
	m.facing = -GetEntityForwardVector(obj)
	Near[obj] = m
end

local machineByKey = function(key)
	for _, m in pairs(Near) do
		if m.key == key then
			return m
		end
	end
end

local sceneAt = function(obj, anim, loop)
	if not DoesEntityExist(obj) then
		return 0
	end
	CasinoLoadDict(DICT)
	local pos = GetEntityCoords(obj)
	local scene = NetworkCreateSynchronisedScene(
		pos.x,
		pos.y,
		pos.z,
		0.0,
		0.0,
		GetEntityHeading(obj),
		2,
		not loop,
		loop,
		1.0,
		0.0,
		1.0
	)
	NetworkAddPedToSynchronisedScene(PlayerPedId(), scene, DICT, anim, 2.0, -2.0, 13, 16, 1000.0, 0)
	NetworkStartSynchronisedScene(scene)
	return math.floor(GetAnimDuration(DICT, anim) * 1000)
end

local gesture = function(anim)
	local obj = Sitting.obj
	CreateThread(function()
		Wait(sceneAt(obj, anim, false))
		if Sitting and Sitting.obj == obj then
			sceneAt(obj, 'betidle_idle_a', true)
		end
	end)
end

local updateInfo = function()
	if not Sitting then
		return
	end
	local g, bet = Cfg.Games[Sitting.game], Cfg.Bets[BetIndex]
	send(Sitting.screen, { type = 'seat', seated = true, bet = bet, ante = Ante })
	UiSnackbar(
		SlotsText(Sitting.game).label,
		L(Ante and 'slots.ui.snack_ante' or 'slots.ui.snack', {
			bet = FormatChips(SlotsCost(g, bet, Ante and 'ante' or nil)),
			buy = FormatNumber(SlotsCost(g, bet, 'buy')),
		})
	)
end

local showChips = function()
	RpcAsync('wallet:get', function(count)
		if Sitting and count then
			send(Sitting.screen, { type = 'chips', chips = count })
		end
	end)
end

local showGames = function(index)
	Choosing = index and (index - 1) % #Cfg.Order + 1
	local options = {}
	for i, id in ipairs(Cfg.Order) do
		local text = SlotsText(id)
		options[i] = { id = id, label = text.label, tag = text.tag, rtp = Cfg.Games[id].rtp, bonus = text.bonus }
	end
	send(Sitting.screen, { type = 'games', index = Choosing, options = Choosing and options })
end

local orderOf = function(game)
	for i, id in ipairs(Cfg.Order) do
		if id == game then
			return i
		end
	end
	return 1
end

local choose = function(id)
	showGames()
	if id == Sitting.game then
		return
	end
	Busy = true
	local game = RpcCall('slots:game', id)
	Busy = false
	if not game or not Sitting then
		return
	end
	local s = Sitting.screen
	Sitting.game, Ante, Buying = game, false, nil
	Picked[Sitting.key] = game
	switch(s, game)
	updateInfo()
	showChips()
	local round = s.round
	for _, ms in ipairs({ 4000, 6500 }) do
		SetTimeout(ms, function()
			if Sitting and Sitting.screen == s and s.round == round and not Busy and not Buying and not Choosing then
				updateInfo()
				showChips()
			end
		end)
	end
end

local standUp = function(skipAnim)
	if not Sitting then
		return
	end
	local obj = Sitting.obj
	release(Sitting.screen)
	if Sitting.view then
		SetFollowPedCamViewMode(Sitting.view)
	end
	Sitting = nil
	Casino.Seated = false
	setKeys({})
	UiSnackbar(nil)
	RpcAsync('slots:leave', function() end)
	if not skipAnim then
		Wait(sceneAt(obj, 'exit_left', false))
	end
	ClearPedTasks(PlayerPedId())
	if DoesEntityExist(obj) then
		SetEntityCollision(obj, true, true)
	end
end

local spin = function(mode, pick)
	local bet = Cfg.Bets[BetIndex]
	Busy = true
	gesture('press_spin_a')
	RpcAsync('slots:spin', function(res)
		if type(res) ~= 'table' then
			Busy = false
			BridgeNotifySend(type(res) == 'string' and res or L('slots.ui.no_answer'), 'error', 3000, Title)
			return
		end
		CreateThread(function()
			Wait(res.time)
			Busy = false
			showChips()
			if res.payout > res.cost then
				BridgeNotifySend(L('table.won', { amount = FormatChips(res.payout) }), 'success', 5000, Title)
			elseif res.payout == res.cost then
				BridgeNotifySend(L('table.push'), 'info', 5000, Title)
			end
		end)
	end, bet, mode, pick)
end

local buys = function(g, bet, id)
	local text = SlotsText(id)
	local first = text.modes and text.modes[1]
		or {
			label = text.bonus,
			text = g.wheel and L('slots.ui.wheel_picks') or L('slots.ui.free_spins', { count = g.bonus.spins or 0 }),
		}
	local list = { { label = first.label, text = first.text, cost = SlotsCost(g, bet, 'buy') } }
	for _, m in ipairs(text.modes or {}) do
		if m.buy then
			list[#list + 1] = { label = m.label, text = m.text, cost = SlotsCost(g, bet, 'buy', m.id), pick = m.id }
		end
	end
	return list
end

local showBuy = function(index)
	Buying = index
	send(Sitting.screen, {
		type = 'buy',
		index = index,
		options = index and buys(Cfg.Games[Sitting.game], Cfg.Bets[BetIndex], Sitting.game),
	})
end

local canAct = function()
	return Sitting and not Busy and GetGameTimer() >= Sitting.screen.ready
end

local Close = function()
	if Buying then
		showBuy()
	end
	if Choosing then
		showGames()
	end
end

local Select = function(value)
	if Choosing and type(value) == 'number' then
		showGames(value)
	end
end

local Leave = function()
	standUp()
end

local Actions = {
	close = Close,
	select = Select,
	leave = Leave,
}

local Spin = function()
	Buying, Choosing = nil, nil
	spin(Ante and 'ante' or nil)
end

local Bet = function(value)
	local index = math.max(1, math.min(#Cfg.Bets, BetIndex + value))
	if index == BetIndex then
		return
	end
	BetIndex = index
	gesture(BetIndex == #Cfg.Bets and 'betidle_press_betmax_a' or 'betidle_press_betone_a')
	updateInfo()
end

local ToggleAnte = function()
	Ante = not Ante
	updateInfo()
end

local BuyMenu = function()
	Choosing = nil
	showBuy(1)
end

local Buy = function(value)
	local o = buys(Cfg.Games[Sitting.game], Cfg.Bets[BetIndex], Sitting.game)[value]
	if not o then
		return
	end
	showBuy()
	spin('buy', o.pick)
end

local GamesMenu = function()
	Buying = nil
	showGames(orderOf(Sitting.game))
end

local Game = function(value)
	if Cfg.Games[value] then
		CreateThread(function()
			choose(value)
		end)
	end
end

local Playing = {
	spin = Spin,
	bet = Bet,
	ante = ToggleAnte,
	buyMenu = BuyMenu,
	buy = Buy,
	gamesMenu = GamesMenu,
	game = Game,
}

local act = function(action, value)
	if not Sitting then
		return
	end
	if Actions[action] then
		return Actions[action](value)
	end
	if Playing[action] and canAct() then
		Playing[action](value)
	end
end

NuiOn('slots', function(data)
	if type(data) == 'table' then
		act(data.action, data.value)
	end
	return 'ok'
end)

local cursorOn = function(m)
	local p = {}
	for i, corner in ipairs({ m.tl, m.tr, m.br, m.bl }) do
		local ok, x, y = GetScreenCoordFromWorldCoord(corner.x, corner.y, corner.z)
		if not ok then
			return
		end
		p[i] = { x, y }
	end
	local x0, y0, x1, y1, x2, y2, x3, y3 = p[1][1], p[1][2], p[2][1], p[2][2], p[3][1], p[3][2], p[4][1], p[4][2]
	local dx1, dx2, dx3 = x1 - x2, x3 - x2, x0 - x1 + x2 - x3
	local dy1, dy2, dy3 = y1 - y2, y3 - y2, y0 - y1 + y2 - y3
	local det = dx1 * dy2 - dx2 * dy1
	if math.abs(det) < 1e-9 then
		return
	end
	local g, h = (dx3 * dy2 - dx2 * dy3) / det, (dx1 * dy3 - dx3 * dy1) / det
	local a, b, c = x1 - x0 + g * x1, x3 - x0 + h * x3, x0
	local d, e, f = y1 - y0 + g * y1, y3 - y0 + h * y3, y0
	local cx, cy = GetDisabledControlNormal(0, 239), GetDisabledControlNormal(0, 240)
	local A, B, C = e - f * h, c * h - b, b * f - c * e
	local D, E, F = f * g - d, a - c * g, c * d - a * f
	local G, H, I = d * h - e * g, b * g - a * h, a * e - b * d
	local w = G * cx + H * cy + I
	if math.abs(w) < 1e-9 then
		return
	end
	local u, v = (A * cx + B * cy + C) / w, (D * cx + E * cy + F) / w
	if u < 0 or u > 1 or v < 0 or v > 1 then
		return
	end
	return math.floor(u * Cfg.Screen.Width), math.floor(v * Cfg.Screen.Height)
end

local seatedLoop = function()
	CreateThread(function()
		local lastX, lastY, down, shown, check = nil, nil, nil, nil, 0
		local controls = { 38, 47, 73, 74, 172, 173, 174, 175, 241, 242 }
		local just = {}
		while Sitting do
			local canSpin = canAct()
			local open = Buying ~= nil or Choosing ~= nil
			local state = (open and 1 or 0) + (canSpin and 2 or 0) + (Ante and 4 or 0)
			if state ~= shown then
				shown = state
				setKeys({
					click = open,
					spin = canSpin,
					bet = canSpin,
					ante = canSpin and (Ante and 'on' or true),
					buy = canSpin,
					browse = canSpin,
					leave = true,
				})
			end
			CasinoDisableControls()

			local s = Sitting.screen
			if open then
				DisableControlAction(0, 1, true)
				DisableControlAction(0, 2, true)
				SetMouseCursorActiveThisFrame()
				local m, x, y = Near[Sitting.obj], nil, nil
				if m then
					x, y = cursorOn(m)
				end
				if x and s.dui and GetGameTimer() >= s.ready then
					if x ~= lastX or y ~= lastY then
						SendDuiMouseMove(s.dui, x, y)
						lastX, lastY = x, y
					end
					if IsDisabledControlJustPressed(0, 24) then
						SendDuiMouseDown(s.dui, 'left')
						down = s.dui
					end
				end
			end
			if down and IsDisabledControlJustReleased(0, 24) then
				SendDuiMouseUp(down, 'left')
				down = nil
			end

			local any = false
			for _, c in ipairs(controls) do
				just[c] = IsDisabledControlJustPressed(0, c)
				any = any or just[c]
			end
			local pressed = function(control)
				return just[control]
			end
			local list = any and Buying and buys(Cfg.Games[Sitting.game], Cfg.Bets[BetIndex], Sitting.game)
			local menu = Choosing ~= nil
			local scroll = pressed(241) and -1 or pressed(242) and 1

			local dx = (pressed(175) and 1 or 0) - (pressed(174) and 1 or 0) + (scroll or 0)
			local dy = (pressed(173) and 1 or 0) - (pressed(172) and 1 or 0)
			if Busy and not menu and (dx ~= 0 or dy ~= 0 or pressed(38)) then
				send(s, { type = 'pick', dx = dx, dy = dy, open = pressed(38) })
			end

			if not any then
			elseif menu and pressed(38) then
				act('game', Cfg.Order[Choosing])
				showGames()
			elseif menu and (dx ~= 0 or dy ~= 0) then
				showGames(Choosing + dx + dy)
			elseif list and pressed(38) then
				act('buy', Buying)
			elseif list and (scroll or pressed(74)) then
				showBuy((Buying - 1 + (scroll or 1)) % #list + 1)
			elseif (menu or list) and pressed(73) then
				act('close')
			elseif menu or list then
			elseif pressed(38) then
				act('spin')
			elseif pressed(74) then
				act('buyMenu')
			elseif canSpin and (pressed(174) or pressed(175)) then
				showGames(orderOf(Sitting.game) + (pressed(175) and 1 or -1))
			elseif pressed(47) then
				act('ante')
			elseif scroll then
				act('bet', -scroll)
			elseif pressed(73) then
				act('leave')
			end

			local now = GetGameTimer()
			if now >= check then
				check = now + 250
				if Sitting and CasinoIsDown() then
					standUp(true)
				end
			end
			Wait(0)
		end
	end)
end

local sit = function(obj)
	if Casino.Seated or CasinoIsDown() or not DoesEntityExist(obj) then
		return
	end
	local name, m = Hashes[GetEntityModel(obj)], Near[obj]
	if not name or not m then
		return
	end

	Casino.Seated = true
	local game = RpcCall('slots:sit', GetEntityCoords(obj), name)
	if not Cfg.Games[game] then
		Casino.Seated = false
		BridgeNotifySend(type(game) == 'string' and game or L('slots.ui.busy'), 'error', 4000, Title)
		return
	end

	Sitting = { obj = obj, name = name, key = m.key, game = game, screen = claim(m, game, false) }
	Busy, BetIndex, Ante, Buying, Choosing = false, 1, false, nil, nil

	local ped = PlayerPedId()
	local walkTo = GetOffsetFromEntityInWorldCoords(obj, -0.471, -1.419, 0.0)
	TaskGoStraightToCoord(ped, walkTo.x, walkTo.y, walkTo.z, 1.0, 3000, GetEntityHeading(obj), 0.05)
	local timeout = GetGameTimer() + 3000
	while #(GetEntityCoords(ped).xy - walkTo.xy) > 0.15 and GetGameTimer() < timeout do
		Wait(0)
	end

	if not Sitting then
		return
	end
	Sitting.view = GetFollowPedCamViewMode()
	SetFollowPedCamViewMode(4)
	SetEntityCollision(obj, false, true)
	Wait(sceneAt(obj, 'enter_left', false))
	if not Sitting then
		return
	end
	sceneAt(obj, 'betidle_idle_a', true)
	updateInfo()
	showChips()
	seatedLoop()
end

volumeOf = function(obj)
	local V = Cfg.Volume
	if Sitting and Sitting.obj == obj then
		return V.Own
	end
	local near = math.max(0.0, 1.0 - #(GetEntityCoords(PlayerPedId()) - GetEntityCoords(obj)) / V.Range)
	return V.Others * near * near
end

CreateThread(function()
	while true do
		Wait(Own[1] and 250 or 1000)
		for _, s in ipairs(Own) do
			if s.obj and DoesEntityExist(s.obj) and GetGameTimer() >= s.ready then
				local v = volumeOf(s.obj)
				if math.abs(v - (s.volume or -1)) > 0.005 then
					s.volume = v
					send(s, { type = 'volume', volume = v })
				end
			end
		end
	end
end)

RegisterNetEvent(UtilEvent('slots:spin'), function(key, res)
	local m = machineByKey(key)
	if not m or not DoesEntityExist(m.obj) then
		return
	end
	local mine = Sitting and Sitting.obj == m.obj
	local pos = GetEntityCoords(PlayerPedId())
	local dist = #(pos - GetEntityCoords(m.obj))
	if not mine and not watching(m.obj) then
		if dist > Cfg.ViewDistance then
			return
		end
		local count, far, farDist = 0, nil, dist
		for _, o in ipairs(Own) do
			if o.obj and o.small then
				count = count + 1
				local d = #(pos - GetEntityCoords(o.obj))
				if d > farDist then
					far, farDist = o, d
				end
			end
		end
		if count >= Cfg.Watch.Max then
			if not far then
				return
			end
			release(far)
		end
	end
	local s = claim(m, res.game, not mine)
	res.type = 'spin'
	res.volume = volumeOf(m.obj)
	s.volume = res.volume
	send(s, res)

	s.round = (s.round or 0) + 1
	local round = s.round
	SetTimeout(res.time + 10000, function()
		if s.round == round and s.obj == m.obj and not (Sitting and Sitting.obj == m.obj) then
			release(s)
		end
	end)
end)

AddStateBagChangeHandler('casinoSlots', 'global', function(_, _, value)
	Picked = value or {}
	for _, s in ipairs(Own) do
		local m = s.obj and Near[s.obj]
		if m and s.game ~= gameOf(m.key) and not (Sitting and Sitting.obj == s.obj) then
			switch(s, gameOf(m.key))
		end
	end
end)

CreateThread(function()
	local models = {}
	for name in pairs(Cfg.Machines) do
		models[#models + 1] = name
	end

	local CanInteract = function(entity)
		return not Casino.Seated and Near[entity] ~= nil
	end

	local OnSelect = function(entity)
		CreateThread(function()
			sit(entity)
		end)
	end

	BridgeTargetAddModels(models, {
		{
			name = 'casino_slots',
			label = L('slots.ui.play'),
			icon = 'fa-solid fa-dice',
			distance = 2.0,
			canInteract = CanInteract,
			onSelect = OnSelect,
		},
	})
end)

CreateThread(function()
	local wasInside, nextScan, enteredAt = false, 0, 0
	while true do
		if not wasInside then
			CasinoWaitActive()
		end
		local inside, now = Casino.Active, GetGameTimer()
		if inside and not wasInside then
			loadIdle()
			enteredAt, nextScan = now, 0
		end
		if wasInside and not inside then
			closeScreens()
		end
		wasInside = inside

		if inside then
			for obj in pairs(Near) do
				if not DoesEntityExist(obj) then
					nextScan = 0
					break
				end
			end
			if now >= nextScan then
				nextScan = now + (now - enteredAt < 10000 and 2000 or Cfg.Scan)
				local seen, models = {}, {}
				for _, obj in ipairs(GetGamePool('CObject')) do
					local name = Hashes[GetEntityModel(obj)]
					if name then
						seen[obj], models[name] = true, true
						if not Near[obj] then
							track(obj, name)
						end
					end
				end
				for name in pairs(models) do
					replace(name, true)
				end
				for obj in pairs(Near) do
					if not seen[obj] then
						Near[obj] = nil
					end
				end
			end
		end

		local pos = GetEntityCoords(PlayerPedId())
		for _, s in ipairs(Own) do
			local mine = Sitting and Sitting.obj == s.obj
			if s.obj and (not Near[s.obj] or not mine and #(pos - GetEntityCoords(s.obj)) > Cfg.ViewDistance + 3.0) then
				release(s)
			end
		end

		if Sitting and not DoesEntityExist(Sitting.obj) then
			standUp(true)
		end
		Wait(2000)
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource ~= Util.Resource then
		return
	end
	if Sitting then
		Casino.Seated = false
		setKeys({})
		UiSnackbar(nil)
		ClearPedTasks(PlayerPedId())
		if Sitting.view then
			SetFollowPedCamViewMode(Sitting.view)
		end
		if DoesEntityExist(Sitting.obj) then
			SetEntityCollision(Sitting.obj, true, true)
		end
	end
	closeScreens()
end)
