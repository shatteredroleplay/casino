local Cfg = Config.Track
local Terminals, Spawned = {}, {}
local Playing, Station, Return = false, nil, nil
local State, MyBet, Balance = nil, nil, 0
local Horse, Bet, Hover, Busy, Typing = nil, 0, nil, false, false
local HoverAt = 0
local Dui, NextPush = nil, 0
local Con, ConDirty, ConPush = nil, true, 0
local Cam, Sound
local Title = L('game.track')

local TXD, CON_TXD = 'casino_track', 'casino_track_console'
local SOUNDS = 'dlc_vw_casino_inside_track_betting_single_event_sounds'

local Seat = { x = Cfg.Seat.offset.x, y = Cfg.Seat.offset.y, z = Cfg.Seat.offset.z, heading = Cfg.Seat.heading }
local Scr = {
	x = Cfg.Console.offset.x,
	y = Cfg.Console.offset.y,
	z = Cfg.Console.offset.z,
	w = Cfg.Console.width,
	h = Cfg.Console.height,
	tilt = Cfg.Console.tilt,
	yaw = Cfg.Console.yaw,
}

local Styles = {
	{ 0xED5353, 0x5389ED },
	{ 0xFF3232, 0x383838 },
	{ 0xCEEC18, 0xEDC6EC },
	{ 0xFCA83F, 0x4DADB7 },
	{ 0x4DADB7, 0xFCA83F },
	{ 0xF84027, 0xFFD862 },
	{ 0x228AFF, 0xFFFFFF },
	{ 0x4A75FF, 0xFF0F4F },
}

local Spots = {}
for i = 1, 6 do
	Spots[i] = { id = 'h' .. i, horse = i, x = 0.03, y = 0.16 + (i - 1) * 0.105, w = 0.94, h = 0.095 }
end
Spots[#Spots + 1] = { id = 'minus', x = 0.03, y = 0.82, w = 0.10, h = 0.15 }
Spots[#Spots + 1] = { id = 'amount', x = 0.14, y = 0.82, w = 0.28, h = 0.15 }
Spots[#Spots + 1] = { id = 'plus', x = 0.43, y = 0.82, w = 0.10, h = 0.15 }
Spots[#Spots + 1] = { id = 'place', x = 0.56, y = 0.82, w = 0.41, h = 0.15 }

local setKeys = CasinoKeybinds('track', {
	leave = { 'X', 'track.key_leave' },
	bet = { 'SCROLL', 'track.key_bet' },
	play = { 'E', 'track.key_play' },
}, { 'bet', 'play', 'leave' })

local notify = function(msg, kind, time)
	BridgeNotifySend(msg, kind, time or 3000, Title)
end

local placedOn = function(horse)
	if not MyBet or not State or MyBet.id ~= State.id then
		return 0
	end
	return MyBet.amounts[horse] or 0
end

local hasBet = function()
	for horse = 1, 6 do
		if placedOn(horse) > 0 then
			return true
		end
	end
	return false
end

local canBet = function()
	return State ~= nil and State.phase == 'betting' and not Busy
end

local timeLeft = function()
	return State and math.max(0, State.endsAt - GetGameTimer()) or 0
end

local horseList = function()
	local horses = {}
	for i, h in ipairs(State.horses) do
		local s = Styles[h.style] or Styles[1]
		horses[i] = {
			name = TrackName(h.name),
			odds = TrackOddsLabel(h.odds),
			color = ('#%06X'):format(s[1]),
			trim = ('#%06X'):format(s[2]),
		}
	end
	return horses
end

local setBet = function(amount)
	local h = State.horses[Horse]
	local max = math.min(TrackMaxBet(h.odds, State.max) - placedOn(Horse), Balance)
	Bet = math.floor(math.max(State.min, math.min(max, amount)))
	ConDirty = true
end

local stepAt = function(amount)
	return amount >= 2000 and 500 or amount >= 500 and 100 or State.min
end

local stopSound = function()
	if not Sound then
		return
	end
	StopSound(Sound)
	ReleaseSoundId(Sound)
	Sound = nil
end

local startSound = function()
	stopSound()
	Sound = GetSoundId()
	PlaySoundFrontend(Sound, 'race_loop', SOUNDS, true)
end

local axes = function(yaw)
	local h = math.rad(Station.heading + (yaw or 0.0))
	return vec3(math.cos(h), math.sin(h), 0.0), vec3(-math.sin(h), math.cos(h), 0.0), vec3(0.0, 0.0, 1.0)
end

local quad = function()
	local right, fwd, up = axes(Scr.yaw)
	local t = math.rad(Scr.tilt)
	local u = up * math.cos(t) + fwd * math.sin(t)
	local c = Station.pos + right * Scr.x + fwd * Scr.y + up * Scr.z
	local r, d = right * (Scr.w / 2), u * (Scr.h / 2)
	return {
		c = c,
		tl = c - r + d,
		tr = c + r + d,
		bl = c - r - d,
		br = c + r - d,
		right = right,
		u = u,
		n = up * math.sin(t) - fwd * math.cos(t),
	}
end

local drawQuad = function(q)
	local txd = Dui and State.phase == 'racing' and TXD or CON_TXD
	DrawTri(txd, q.tl, q.tr, q.br, vec2(0, 0), vec2(1, 0), vec2(1, 1))
	DrawTri(txd, q.br, q.bl, q.tl, vec2(1, 1), vec2(0, 1), vec2(0, 0))
end

local pointOn = function(q, x, y)
	return q.tl + q.right * (Scr.w * x) - q.u * (Scr.h * y)
end

local pick = function(q)
	local cx, cy = GetNuiCursorPosition()
	local rx, ry = GetActiveScreenResolution()
	for _, s in ipairs(Spots) do
		local a, b = pointOn(q, s.x, s.y), pointOn(q, s.x + s.w, s.y + s.h)
		local okA, ax, ay = GetScreenCoordFromWorldCoord(a.x, a.y, a.z)
		local okB, bx, by = GetScreenCoordFromWorldCoord(b.x, b.y, b.z)
		if okA and okB then
			local x0, x1 = math.min(ax, bx) * rx, math.max(ax, bx) * rx
			local y0, y1 = math.min(ay, by) * ry, math.max(ay, by) * ry
			if cx >= x0 and cx <= x1 and cy >= y0 and cy <= y1 then
				return s
			end
		end
	end
end

local consoleMessage = function()
	local h = Horse and State.horses[Horse]
	return json.encode({
		spots = Spots,
		id = State.id,
		phase = State.phase,
		timeLeft = timeLeft(),
		horses = horseList(),
		order = State.order or false,
		hover = Hover or false,
		horse = Horse or false,
		bet = Bet,
		payout = h and TrackPayout(Bet, h.odds) or 0,
		balance = math.floor(Balance),
		placed = hasBet() and MyBet.amounts or false,
	})
end

local setCamera = function(on)
	if Cam then
		RenderScriptCams(false, true, 500, true, false)
		DestroyCam(Cam, false)
		Cam = nil
	end
	if not on then
		return
	end
	local q = quad()
	local p = q.c + q.n * Cfg.Camera.distance
	Cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', p.x, p.y, p.z, 0.0, 0.0, 0.0, Cfg.Camera.fov, false, 2)
	PointCamAtCoord(Cam, q.c.x, q.c.y, q.c.z)
	SetCamActive(Cam, true)
	RenderScriptCams(true, true, 500, true, false)
end

local sitDown = function()
	local ped = PlayerPedId()
	local right, fwd, up = axes()
	local p = Station.pos + right * Seat.x + fwd * Seat.y + up * Seat.z
	FreezeEntityPosition(ped, false)
	ClearPedTasksImmediately(ped)
	TaskStartScenarioAtPosition(
		ped,
		'PROP_HUMAN_SEAT_CHAIR_MP_PLAYER',
		p.x,
		p.y,
		p.z,
		Station.heading + 180.0 + Seat.heading,
		0,
		true,
		true
	)
	FreezeEntityPosition(ped, true)
end

local close = function()
	if not Playing then
		return
	end
	Playing = false
	Casino.Seated = false
	stopSound()
	setKeys({})
	setCamera(false)
	if Con then
		DestroyDui(Con)
	end
	Con = nil

	local ped = PlayerPedId()
	FreezeEntityPosition(ped, false)
	ClearPedTasksImmediately(ped)
	if Return then
		SetEntityCoordsNoOffset(ped, Return.x, Return.y, Return.z, false, false, false)
	end
	RpcAsync('track:leave', function() end)
end

local apply = function(s)
	s.endsAt = GetGameTimer() + (s.timeLeft or 0)
	State = s
	if s.bets then
		MyBet = { id = s.id, amounts = s.bets, told = MyBet and MyBet.id == s.id and MyBet.told }
	elseif MyBet and MyBet.id ~= s.id then
		MyBet = nil
	end
	if s.balance then
		Balance = s.balance
	end
	NextPush, ConDirty = 0, true
end

local place = function()
	local id, horse, bet = State.id, Horse, Bet
	Busy = true
	local res = RpcCall('track:bet', id, horse, bet)
	Busy, ConDirty = false, true
	if res ~= true then
		notify(type(res) == 'string' and res or L('table.bet_failed'), 'error')
		return
	end

	if not MyBet or MyBet.id ~= id then
		MyBet = { id = id, amounts = { 0, 0, 0, 0, 0, 0 } }
	end
	MyBet.amounts[horse] = (MyBet.amounts[horse] or 0) + bet
	Balance = Balance - bet
	NextPush = 0
	if State.id == id and Horse == horse then
		setBet(Bet)
	end
	PlaySoundFrontend(-1, 'DLC_VW_BET_DOWN', 'dlc_vw_table_games_frontend_sounds', true)
	local h = State.id == id and State.horses[horse]
	notify(L('track.placed', { amount = FormatChips(bet), horse = h and TrackName(h.name) or horse }), 'success', 4000)
end

local typeAmount = function()
	local h = State.horses[Horse]
	local max = math.max(State.min, math.min(TrackMaxBet(h.odds, State.max), Balance))
	Typing = true
	local values = UiInput({
		title = L('table.bet_title', { game = Title, min = FormatNumber(State.min), max = FormatNumber(max) }),
		fields = {
			{ name = 'amount', type = 'amount', label = L('table.bet'), min = State.min, max = max, default = Bet },
		},
	})
	Typing = false
	local amount = values and UtilInteger(values.amount) or 0
	if amount >= 1 and Playing and Horse and canBet() then
		setBet(amount)
	end
end

local Plus = function()
	setBet(Bet + stepAt(Bet))
end

local Minus = function()
	setBet(Bet - stepAt(Bet - 1))
end

local Amount = function()
	CreateThread(typeAmount)
end

local Place = function()
	CreateThread(place)
end

local Clicks = {
	plus = Plus,
	minus = Minus,
	amount = Amount,
	place = Place,
}

local click = function(spot)
	if not canBet() then
		if not Busy then
			notify(L('track.running_wait'), 'info')
		end
		return
	end
	if spot.horse then
		if not State.horses[spot.horse] then
			return
		end
		Horse = spot.horse
		setBet(Bet)
	elseif not Horse then
		notify(L('track.pick_first'), 'info')
	elseif Clicks[spot.id] then
		Clicks[spot.id]()
	end
end

local seatedLoop = function(me)
	while Playing == me do
		CasinoDisableControls()
		local q = quad()
		if Con then
			drawQuad(q)
		end

		local can = canBet()
		SetEntityLocallyInvisible(PlayerPedId())
		if not Typing then
			ShowCursorThisFrame()
			local spot = can and pick(q) or nil
			local id = spot and spot.id or nil
			if id ~= Hover then
				Hover, ConDirty = id, true
				if id and GetGameTimer() >= HoverAt then
					HoverAt = GetGameTimer() + 150
					PlaySoundFrontend(-1, 'DLC_VW_BET_DOWN', 'dlc_vw_table_games_frontend_sounds', true)
				end
			end

			if spot and IsDisabledControlJustPressed(0, 24) then
				click(spot)
			elseif can and Horse and IsDisabledControlJustPressed(0, 241) then
				setBet(Bet + stepAt(Bet))
			elseif can and Horse and IsDisabledControlJustPressed(0, 242) then
				setBet(Bet - stepAt(Bet - 1))
			end
		end

		if Con and (ConDirty or GetGameTimer() >= ConPush) then
			ConDirty, ConPush = false, GetGameTimer() + 1000
			SendDuiMessage(Con, consoleMessage())
		end

		setKeys({ leave = true, bet = can and Horse ~= nil })
		if CasinoIsDown() or not Typing and IsDisabledControlJustPressed(0, 73) then
			close()
		end
		Wait(0)
	end
end

local open = function(pos, heading)
	if Playing or Casino.Seated or CasinoIsDown() then
		return
	end
	Casino.Seated = true

	local state = RpcCall('track:open', pos)
	if type(state) ~= 'table' then
		Casino.Seated = false
		notify(type(state) == 'string' and state or L('track.no_answer'), 'error')
		return
	end
	apply(state)

	local me = {}
	Playing, Station = me, { pos = pos, heading = heading }
	Horse, Bet, Hover, Busy, Typing = nil, State.min, nil, false, false
	Return = GetEntityCoords(PlayerPedId())

	sitDown()
	local height = math.floor(math.max(300, math.min(1600, Cfg.Console.Width * Scr.h / Scr.w)))
	Con = CreateDui(DrawPageUrl('console', { 'track.' }), Cfg.Console.Width, height)
	CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(CON_TXD), CON_TXD, GetDuiHandle(Con))
	ConDirty = true
	setCamera(true)
	if State.phase == 'racing' then
		startSound()
	end
	CreateThread(function()
		seatedLoop(me)
	end)
end

local tellResult = function()
	local s = State
	if s.phase ~= 'result' or not s.order or not hasBet() or MyBet.told then
		return
	end
	MyBet.told = true
	local first, staked = s.order[1], 0
	for horse = 1, 6 do
		staked = staked + placedOn(horse)
	end
	local winner = TrackName(s.horses[first].name)
	local back = placedOn(first) > 0 and TrackPayout(placedOn(first), s.horses[first].odds) or 0
	if back > staked then
		notify(
			L('track.won', { horse = winner, back = FormatChips(back), profit = FormatChips(back - staked) }),
			'success',
			6000
		)
	elseif back > 0 then
		notify(
			L('track.partial', { horse = winner, back = FormatChips(back), staked = FormatChips(staked) }),
			'info',
			6000
		)
	else
		notify(L('track.lost', { horse = winner, staked = FormatChips(staked) }), 'error', 6000)
	end
end

local refresh = function()
	RpcAsync('track:state', function(s)
		if type(s) == 'table' then
			apply(s)
		end
	end)
end

AddEventHandler(UtilEvent('active'), function(active)
	if active then
		refresh()
	end
end)

local Racing = function()
	startSound()
end

local Result = function()
	stopSound()
end

local Betting = function(s)
	local me = Playing
	stopSound()
	Horse = nil
	Bet = s.min or Bet
	RpcAsync('track:state', function(p)
		if Playing == me and type(p) == 'table' then
			apply(p)
		end
	end)
end

local Phases = {
	racing = Racing,
	result = Result,
	betting = Betting,
}

RegisterNetEvent(UtilEvent('track:state'), function(s)
	apply(s)
	tellResult()
	if Playing and Phases[s.phase] then
		Phases[s.phase](s)
	end
end)

local trackMessage = function()
	if not State then
		return
	end
	return json.encode({
		id = State.id,
		phase = State.phase,
		horses = horseList(),
		order = State.order,
		timeLeft = timeLeft(),
		raceTime = Cfg.RaceTime,
		mine = hasBet() and MyBet.amounts or false,
	})
end

local closeScreen = function()
	if Dui then
		DestroyDui(Dui)
	end
	Dui = nil
end

local screenAt, guess, lookAt = nil, nil, 0

local screenPos = function()
	if screenAt then
		return screenAt
	end
	if GetGameTimer() >= lookAt then
		lookAt = GetGameTimer() + 5000
		local pos = GetEntityCoords(PlayerPedId())
		local obj = GetClosestObjectOfType(pos.x, pos.y, pos.z, 150.0, joaat(Cfg.Screen.Model), false, false, false)
		if obj ~= 0 then
			screenAt = GetEntityCoords(obj)
			return screenAt
		end
		guess = nil
		if #Terminals > 0 then
			local sum = vec3(0.0, 0.0, 0.0)
			for _, c in ipairs(Terminals) do
				sum = sum + c.xyz
			end
			guess = sum / #Terminals
		end
	end
	return guess
end

local screenNear = function(margin)
	local at = screenPos()
	return not at or #(GetEntityCoords(PlayerPedId()) - at) <= Cfg.Screen.Distance + margin
end

CreateThread(function()
	local scr = Cfg.Screen
	local rt, near
	while scr.Enabled do
		if not rt then
			CasinoWaitActive()
		end
		near = Casino.Active and screenNear(rt and 5.0 or 0.0)
		if near or Casino.Active and Playing then
			if not rt then
				if not IsNamedRendertargetRegistered(scr.Target) then
					RegisterNamedRendertarget(scr.Target, false)
				end
				if not IsNamedRendertargetLinked(joaat(scr.Model)) then
					LinkNamedRendertarget(joaat(scr.Model))
				end
				rt = GetNamedRendertargetRenderId(scr.Target)
				Dui = CreateDui(DrawPageUrl('track', { 'track.' }), scr.Width, scr.Height)
				CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(TXD), TXD, GetDuiHandle(Dui))
				NextPush = 0
			end
			if GetGameTimer() >= NextPush then
				NextPush = GetGameTimer() + 1000
				local msg = trackMessage()
				if msg then
					SendDuiMessage(Dui, msg)
				end
			end

			local at = screenPos()
			if Casino.Inside and near and (not at or CasinoOnScreen(scr, at, 6.0)) then
				SetTextRenderId(rt)
				SetScriptGfxDrawOrder(4)
				SetScriptGfxDrawBehindPausemenu(true)
				DrawSprite(TXD, TXD, 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
				SetTextRenderId(GetDefaultScriptRendertargetRenderId())
				Wait(0)
			else
				Wait(250)
			end
		else
			if rt then
				ReleaseNamedRendertarget(scr.Target)
				closeScreen()
				rt = nil
			end
			Wait(1000)
		end
	end
end)

local despawn = function(i)
	local t = Spawned[i]
	Spawned[i] = nil
	if t and t.own and DoesEntityExist(t.obj) then
		DeleteObject(t.obj)
	end
end

local spawn = function(i)
	local c, t = Terminals[i], {}
	Spawned[i] = t
	local model = CasinoLoadModel(Cfg.Model)
	if Spawned[i] ~= t or not model then
		return
	end

	local existing = GetClosestObjectOfType(c.x, c.y, c.z, 1.0, model, false, false, false)
	if existing ~= 0 then
		t.obj = existing
		return
	end
	t.obj = CreateObjectNoOffset(model, c.x, c.y, c.z, false, false, false)
	SetEntityHeading(t.obj, c.w)
	PlaceObjectOnGroundProperly(t.obj)
	FreezeEntityPosition(t.obj, true)
	t.own = true
end

CreateThread(function()
	local CanInteract = function()
		return not Casino.Seated
	end

	local OnSelect = function(entity)
		local pos, heading = GetEntityCoords(entity), GetEntityHeading(entity)
		CreateThread(function()
			open(pos, heading)
		end)
	end

	BridgeTargetAddModels({ Cfg.Model }, {
		{
			name = 'casino_track',
			label = L('track.key_play'),
			icon = 'fa-solid fa-horse',
			distance = 2.5,
			canInteract = CanInteract,
			onSelect = OnSelect,
		},
	})
end)

CreateThread(function()
	local list = RpcCall('track:terminals') or {}
	for i, c in ipairs(list) do
		Terminals[i] = vec4(c.x, c.y, c.z, c.w)
	end
	if not State then
		refresh()
	end

	while true do
		if not next(Spawned) and not Playing then
			CasinoWaitActive()
		end
		local pos, prompt = GetEntityCoords(PlayerPedId()), nil
		for i, c in ipairs(Terminals) do
			local dist = #(pos - c.xyz)
			local near = Casino.Active and dist < Cfg.RenderDistance
			if near and not Spawned[i] then
				spawn(i)
			elseif not near and Spawned[i] then
				despawn(i)
			end
			if dist < 1.6 and Spawned[i] and not Spawned[i].obj and not Casino.Seated then
				prompt = c
			end
		end

		if not Playing then
			setKeys({ play = prompt ~= nil })
		end
		if prompt and IsControlJustPressed(0, 38) then
			CreateThread(function()
				open(prompt.xyz, prompt.w)
			end)
		end
		Wait(prompt and 0 or 1000)
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource ~= Util.Resource then
		return
	end
	close()
	setKeys({})
	closeScreen()
	for i in pairs(Spawned) do
		despawn(i)
	end
end)
