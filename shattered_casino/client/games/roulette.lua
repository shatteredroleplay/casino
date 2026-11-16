local Cfg = Config.Roulette
local SHARED = TableGame.Shared
local PLAYER = 'anim_casino_b@amb@casino@games@blackjack@player'
local DEALER = 'anim_casino_b@amb@casino@games@roulette@dealer'
local DEALER_IDLE = TableGame.DealerIdle
local TABLE = 'anim_casino_b@amb@casino@games@roulette@table'
local BETS_TXD = 'casino_roulette_bets'
local Game
local Cam, Hovered, Markers, Amount, BetDui = nil, nil, {}, 0, nil

local Keys = {
	{ 'bet', 'LMB', 'table.bet' },
	{ 'amount', 'SCROLL', 'roulette.amount' },
	{ 'custom', 'SPACE', 'roulette.custom' },
	{ 'leave', 'X', 'roulette.leave' },
}

local Status =
	{ betting = 'roulette.status_betting', spinning = 'roulette.status_spinning', result = 'roulette.status_result' }

local dealerIdle = function(t)
	CasinoLoadDict(DEALER_IDLE)
	TaskPlayAnim(t.dealer, DEALER_IDLE, 'idle', 1000.0, -2.0, -1, 1, 0.0, false, false, false)
end

local dealerAnim = function(t, anim)
	CasinoLoadDict(DEALER)
	TaskPlayAnim(t.dealer, DEALER, anim, 3.0, 3.0, -1, 0, 0.0, false, false, false)
	local token = {}
	t.dealerToken = token
	CreateThread(function()
		Wait(math.floor(GetAnimDuration(DEALER, anim) * 1000))
		if t.dealerToken == token and DoesEntityExist(t.dealer) then
			dealerIdle(t)
		end
	end)
end

local deleteBall = function(t)
	if t.ball and DoesEntityExist(t.ball) then
		DeleteObject(t.ball)
	end
	t.ball = nil
end

local spin = function(t, tick)
	local token = {}
	t.spin = token
	CreateThread(function()
		dealerAnim(t, 'no_more_bets')
		Wait(1500)
		if t.spin ~= token then
			return
		end
		deleteBall(t)
		dealerAnim(t, 'spin_wheel')
		local ball = CasinoLoadModel('vw_prop_roulette_ball')
		CasinoLoadDict(TABLE)
		Wait(3000)
		if t.spin ~= token or not ball or not DoesEntityExist(t.obj) then
			return
		end

		local pos = GetWorldPositionOfEntityBone(t.obj, GetEntityBoneIndexByName(t.obj, 'Roulette_Wheel'))
		t.ball = CreateObjectNoOffset(ball, pos.x, pos.y, pos.z, false, false, false)
		SetEntityCoordsNoOffset(t.ball, pos.x, pos.y, pos.z, false, false, false)
		SetEntityRotation(t.ball, 0.0, 0.0, GetEntityHeading(t.obj) + 90.0, 2, false)

		PlayEntityAnim(t.ball, 'intro_ball', TABLE, 1000.0, false, true, true, 0, 136704)
		PlayEntityAnim(t.ball, 'loop_ball', TABLE, 1000.0, false, true, false, 0, 136704)
		PlayEntityAnim(t.obj, 'intro_wheel', TABLE, 1000.0, false, true, true, 0, 136704)
		PlayEntityAnim(t.obj, 'loop_wheel', TABLE, 1000.0, false, true, false, 0, 136704)
		PlayEntityAnim(t.ball, ('exit_%s_ball'):format(tick), TABLE, 1000.0, false, true, false, 0, 136704)
		PlayEntityAnim(t.obj, ('exit_%s_wheel'):format(tick), TABLE, 1000.0, false, true, false, 0, 136704)
	end)
end

local clearTable = function(t)
	CreateThread(function()
		Wait(1500)
		for zone = 1, 3 do
			if not DoesEntityExist(t.dealer) then
				return
			end
			dealerAnim(t, 'clear_chips_zone' .. zone)
			Wait(1500)
		end
	end)
end

local syncSpot = function(g, t, spot, amount)
	if (t.chips[spot] and t.chips[spot].amount or 0) == amount then
		return
	end
	TableGameClearChips(g, t, spot)
	if amount <= 0 or not RouletteSpots[spot] then
		return
	end

	local offset, height, objs = RouletteSpots[spot], 0.0, {}
	local heading = GetEntityHeading(t.obj)
	for _, stack in ipairs(CasinoChipStacks(amount)) do
		for _, model in ipairs(stack) do
			local pos =
				GetOffsetFromEntityInWorldCoords(t.obj, offset.x, offset.y, RouletteChipHeight + height + Cfg.ChipLift)
			local obj = CasinoSpawnChip(model, pos, heading)
			if obj then
				objs[#objs + 1] = obj
				height = height + (ChipThickness[model] or 0.0057)
			end
		end
	end
	t.chips[spot] = { amount = amount, objs = objs }
end

local myBets = function(s)
	local amount, payout, me = 0, 0, CasinoMe()
	for _, bet in ipairs(s.bets) do
		if bet.src == me then
			amount = amount + bet.amount
			payout = payout + (bet.payout or 0)
		end
	end
	return amount, payout
end

local limits = function(g)
	local tcfg = Cfg.Tables[g.Sitting.id]
	local s = g.States[g.Sitting.id]
	return tcfg.min, s and s.max or tcfg.max
end

local myLabels = function(s)
	local me, list = CasinoMe(), {}
	for _, bet in ipairs(s.bets) do
		if bet.src == me then
			if s.phase ~= 'result' then
				list[#list + 1] = { spot = bet.bet, value = bet.amount }
			elseif (bet.payout or 0) > 0 then
				list[#list + 1] = { spot = bet.bet, value = bet.payout, won = true }
			end
		end
	end
	return list
end

local planeAxes = function(origin)
	local rx, ry = GetActiveScreenResolution()
	local ok0, x0, y0 = GetScreenCoordFromWorldCoord(origin.x, origin.y, origin.z)
	local ok1, x1, y1 = GetScreenCoordFromWorldCoord(origin.x + 0.1, origin.y, origin.z)
	local ok2, x2, y2 = GetScreenCoordFromWorldCoord(origin.x, origin.y + 0.1, origin.z)
	if not (ok0 and ok1 and ok2) then
		return
	end
	local ax, ay = (x1 - x0) * rx, (y1 - y0) * ry
	local bx, by = (x2 - x0) * rx, (y2 - y0) * ry
	local det = ax * by - bx * ay
	if math.abs(det) < 1e-6 then
		return
	end
	return norm(vec3(by / det, -ay / det, 0.0)), norm(vec3(bx / det, -ax / det, 0.0))
end

local drawBets = function(t, labels)
	local b = Cfg.Board.Bet
	local right, up = planeAxes(GetOffsetFromEntityInWorldCoords(t.obj, 0.4, -0.12, RouletteChipHeight))
	if not right then
		return
	end
	local r, u = right * (b.Width / 2), up * (b.Width / 4)
	for i = 1, math.min(#labels, 12) do
		local offset = RouletteSpots[labels[i].spot]
		if offset then
			local pos = GetOffsetFromEntityInWorldCoords(
				t.obj,
				offset.x,
				offset.y,
				RouletteChipHeight + Cfg.ChipLift + b.Lift
			) + up * b.Shift
			local col, row = (i - 1) % 4, (i - 1) // 4
			DrawQuad(BETS_TXD, pos, r, u, col / 4, row / 3, (col + 1) / 4, (row + 1) / 3)
		end
	end
end

local setCamera = function(t, wheel)
	local old = Cam
	Cam = nil
	if not t then
		if old then
			RenderScriptCams(false, true, 900, true, false)
			DestroyCam(old, false)
		end
		return
	end
	if wheel then
		local o = Cfg.Camera.wheel.offset
		local target = GetWorldPositionOfEntityBone(t.obj, GetEntityBoneIndexByName(t.obj, 'Roulette_Wheel'))
		local at = GetOffsetFromEntityGivenWorldCoords(t.obj, target.x, target.y, target.z)
		local pos = GetOffsetFromEntityInWorldCoords(t.obj, at.x + o.x, at.y + o.y, at.z + o.z)
		Cam = CreateCamWithParams(
			'DEFAULT_SCRIPTED_CAMERA',
			pos.x,
			pos.y,
			pos.z,
			0.0,
			0.0,
			0.0,
			Cfg.Camera.wheel.fov,
			false,
			2
		)
		PointCamAtCoord(Cam, target.x, target.y, target.z)
	else
		local o = Cfg.Camera.offset
		local pos = GetOffsetFromEntityInWorldCoords(t.obj, o.x, o.y, o.z)
		Cam = CreateCamWithParams(
			'DEFAULT_SCRIPTED_CAMERA',
			pos.x,
			pos.y,
			pos.z,
			270.0,
			-90.0,
			GetEntityHeading(t.obj) + 270.0,
			Cfg.Camera.fov,
			false,
			2
		)
	end
	if old then
		SetCamActiveWithInterp(Cam, old, 1500, 1, 1)
		SetTimeout(1600, function()
			DestroyCam(old, false)
		end)
	else
		SetCamActive(Cam, true)
		RenderScriptCams(true, true, 900, true, false)
	end
end

local setHover = function(g, t, bet)
	if Hovered == bet then
		return
	end
	Hovered = bet
	for _, obj in ipairs(Markers) do
		DeleteObject(obj)
	end
	Markers = {}
	if bet and t then
		local heading = GetEntityHeading(t.obj)
		for _, number in ipairs(RouletteCovered(bet)) do
			local offset = RouletteSpots[number]
			local pos = GetOffsetFromEntityInWorldCoords(t.obj, offset.x, offset.y, RouletteChipHeight)
			local model = (number == '0' or number == '00') and 'vw_prop_vw_marker_01a' or 'vw_prop_vw_marker_02a'
			local obj = CasinoSpawnChip(model, pos, heading)
			if obj then
				Markers[#Markers + 1] = obj
			end
		end
	end
	if g.Sitting then
		TableGameRefresh(g, g.Sitting.id)
	end
end

local pick = function(t)
	local cx, cy = GetNuiCursorPosition()
	local rx, ry = GetActiveScreenResolution()
	local best, bestDist = nil, Cfg.PickRadius * ry / 1080
	for bet, offset in pairs(RouletteSpots) do
		local pos = GetOffsetFromEntityInWorldCoords(t.obj, offset.x, offset.y, RouletteChipHeight)
		local onScreen, sx, sy = GetScreenCoordFromWorldCoord(pos.x, pos.y, pos.z)
		if onScreen then
			local dist = math.sqrt((sx * rx - cx) ^ 2 + (sy * ry - cy) ^ 2)
			if dist < bestDist then
				best, bestDist = bet, dist
			end
		end
	end
	return best
end

local setAmount = function(g, value)
	local min, max = limits(g)
	Amount = math.max(min, math.min(max, math.floor(value / min) * min))
	TableGameRefresh(g, g.Sitting.id)
end

local customAmount = function(g)
	if not g.Sitting then
		return
	end
	local min, max = limits(g)
	local title = L(
		'roulette.custom_title',
		{ min = FormatNumber(min), max = FormatNumber(max), number = FormatNumber(RouletteMaxBet('0', max)) }
	)
	local amount = TableGameAsk(g, title, L('roulette.board_amount'), min, max, Amount)
	if amount and g.Sitting then
		setAmount(g, amount)
	end
end

local placeBet = function(g, bet)
	g.Busy = true
	RpcAsync('roulette:bet', function(res)
		g.Busy = false
		if res == true then
			PlaySoundFrontend(-1, 'DLC_VW_BET_DOWN', 'dlc_vw_table_games_frontend_sounds', true)
			TableGameGesture(g, PLAYER, 'place_bet_small')
		else
			TableGameNotify(g, type(res) == 'string' and res or L('table.bet_failed'))
		end
	end, bet, Amount)
end

local BoardChoose = function(g)
	return g.Sitting and g.Spawned[g.Sitting.id] and g.Sitting.id
end

local Spawn = function(_, _, tcfg, state)
	local c = tcfg.coords
	local tableModel, dealerModel = CasinoLoadModel(tcfg.model), CasinoLoadModel(CasinoDealerModel(state.ped.variation))
	if not tableModel or not dealerModel then
		return nil
	end

	local t = { chips = {}, coords = c }
	local existing = GetClosestObjectOfType(c.x, c.y, c.z, 1.0, tableModel, false, false, false)
	if existing ~= 0 then
		t.obj = existing
	else
		t.obj = CreateObjectNoOffset(tableModel, c.x, c.y, c.z, false, false, false)
		SetEntityRotation(t.obj, 0.0, 0.0, c.w, 2, true)
		FreezeEntityPosition(t.obj, true)
		t.own = true
	end

	t.wheel = GetWorldPositionOfEntityBone(t.obj, GetEntityBoneIndexByName(t.obj, 'Roulette_Wheel'))
	local heading = GetEntityHeading(t.obj)
	local pos = GetOffsetFromEntityInWorldCoords(t.obj, 0.0, 0.7, 1.0)
	t.dealer = CreatePed(4, dealerModel, pos.x, pos.y, pos.z, heading + 180.0, false, true)
	SetEntityCoordsNoOffset(t.dealer, pos.x, pos.y, pos.z, false, false, true)
	SetEntityHeading(t.dealer, heading + 180.0)
	CasinoDealerLook(t.dealer, state.ped.variation)
	FreezeEntityPosition(t.dealer, true)
	SetEntityCanBeDamaged(t.dealer, false)
	SetEntityInvincible(t.dealer, true)
	SetBlockingOfNonTemporaryEvents(t.dealer, true)
	SetPedCanRagdollFromPlayerImpact(t.dealer, false)
	dealerIdle(t)
	return t
end

local Despawn = function(_, t)
	t.spin = nil
	deleteBall(t)
	if not t.own and DoesEntityExist(t.obj) then
		StopEntityAnim(t.obj, 'loop_wheel', TABLE, 0.0)
	end
end

local Render = function(g, t, s)
	local totals = {}
	for _, bet in ipairs(s.bets) do
		local amount = s.phase == 'result' and (bet.payout or 0) or bet.amount
		totals[bet.bet] = (totals[bet.bet] or 0) + amount
	end
	for spot in pairs(t.chips) do
		if not totals[spot] then
			TableGameClearChips(g, t, spot)
		end
	end
	for spot, amount in pairs(totals) do
		syncSpot(g, t, spot, amount)
	end

	if s.phase ~= t.phase and t.animate then
		if s.phase == 'spinning' and s.tick then
			spin(t, s.tick)
		elseif s.phase == 'result' then
			clearTable(t)
		end
	end
	t.phase = s.phase
end

local Message = function(g, id, s)
	local history = s.history or {}
	local msg = {
		status = L(Status[s.phase] or 'roulette.status_waiting'),
		number = history[1],
		history = history,
		timer = s.phase == 'betting' and s.deadline and math.max(0, (s.deadline - GetGameTimer()) / 1000) or nil,
		total = Cfg.BetTime,
	}
	if g.Sitting and g.Sitting.id == id then
		local def = Hovered and Roulette.Bets[Hovered]
		msg.seated = {
			amount = Amount,
			bet = (myBets(s)),
			hover = def and { label = RouletteLabel(Hovered), payout = def.payout } or nil,
			keys = g.Keys,
		}
	end
	return msg
end

local Draw = function(g, id, t)
	if g.Sitting and g.Sitting.id == id then
		local sc = Cfg.Board.Screen
		local rx, ry = GetActiveScreenResolution()
		DrawSprite(g.Txd, g.Txd, sc.x, sc.y, sc.height * 2 * ry / rx, sc.height, 0.0, 255, 255, 255, 255)
		return
	end
	if not TableGameVisible(g, t) then
		return
	end
	local b = Cfg.Board
	local pos = t.wheel + vec3(0.0, 0.0, b.Lift)
	DrawQuad(g.Txd, pos, DrawFacing(pos, b.Width / 2), vec3(0.0, 0.0, b.Width / 8), 0.0, 0.0, 1.0, 0.5)
end

local OnSit = function(g, id)
	Hovered = nil
	Amount = Cfg.Tables[id].min
	setCamera(g.Spawned[id])
	g.OnWheel = false
end

local OnStand = function(g)
	setHover(g, nil, nil)
	setCamera(nil)
end

local Left = function(g, refunded)
	if (tonumber(refunded) or 0) > 0 then
		TableGameNotify(g, L('roulette.refunded', { amount = FormatChips(refunded) }), 'info')
	end
end

local Update = function(g, _, s)
	local amount, payout = myBets(s)
	if s.phase ~= 'result' then
		g.Notified = false
	end
	if s.phase == 'result' and not g.Notified and amount > 0 then
		g.Notified = true
		local mood = CasinoResult('roulette', amount, payout)
		TableGameGesture(g, SHARED, ('reaction_%s_var_01'):format(mood))
	end
end

local Tick = function(g, s, t)
	local canBet = s.phase == 'betting' and not g.Busy

	if s.phase == 'spinning' ~= g.OnWheel then
		g.OnWheel = not g.OnWheel
		setCamera(t, g.OnWheel)
	end

	local allowed = { bet = canBet, amount = canBet, custom = canBet, leave = true }
	local keys = {}
	for _, k in ipairs(Keys) do
		if allowed[k[1]] then
			keys[#keys + 1] = { k[2], L(k[3]) }
		end
	end
	TableGameSetKeys(g, keys)

	if canBet then
		ShowCursorThisFrame()
		setHover(g, t, pick(t))
		local min = limits(g)
		if TableGamePressed(g, 241) then
			setAmount(g, Amount + min)
		elseif TableGamePressed(g, 242) then
			setAmount(g, Amount - min)
		elseif TableGamePressed(g, 22) then
			g.Busy = true
			CreateThread(function()
				customAmount(g)
				g.Busy = false
			end)
		elseif Hovered and TableGamePressed(g, 24) then
			placeBet(g, Hovered)
		end
	elseif Hovered then
		setHover(g, t, nil)
	end

	if TableGamePressed(g, 73) then
		TableGameStandUp(g)
	end
end

Game = TableGameNew({
	name = 'roulette',
	config = Cfg,
	early = true,
	models = { 'vw_prop_casino_roulette_01', 'vw_prop_casino_roulette_01b' },
	board = {
		page = 'roulette',
		width = 1024,
		height = 512,
		prefixes = { 'roulette.' },
		choose = BoardChoose,
	},

	spawn = Spawn,
	despawn = Despawn,
	render = Render,
	message = Message,
	draw = Draw,
	onSit = OnSit,
	onStand = OnStand,
	left = Left,
	update = Update,
	tick = Tick,
})

CreateThread(function()
	local nextSend, sent = 0, nil
	while true do
		if not BetDui then
			CasinoWaitActive()
		end
		local t = Game.Sitting and Game.Spawned[Game.Sitting.id]
		local s = t and Game.States[Game.Sitting.id]
		local labels = s and myLabels(s) or {}
		if #labels > 0 then
			if not BetDui then
				BetDui = CreateDui(DrawPageUrl('roulette_bets', {}), 1024, 384)
				CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(BETS_TXD), BETS_TXD, GetDuiHandle(BetDui))
				sent = nil
			end
			local msg = json.encode({ labels = labels })
			if msg ~= sent or GetGameTimer() >= nextSend then
				sent, nextSend = msg, GetGameTimer() + 1000
				SendDuiMessage(BetDui, msg)
			end
			drawBets(t, labels)
			Wait(0)
		else
			if BetDui then
				DestroyDui(BetDui)
			end
			BetDui = nil
			Wait(250)
		end
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource ~= Util.Resource then
		return
	end
	if BetDui then
		DestroyDui(BetDui)
	end
end)
