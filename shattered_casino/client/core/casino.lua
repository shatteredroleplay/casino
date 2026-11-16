local seen = setmetatable({}, { __mode = 'k' })

CasinoOnScreen = function(key, pos, radius)
	local now, c = GetGameTimer(), seen[key]
	if c and now < c.at then
		return c.visible
	end
	c = c or {}
	c.at, c.visible = now + 100, IsSphereVisible(pos.x, pos.y, pos.z, radius)
	seen[key] = c
	return c.visible
end

CasinoWaitActive = function()
	while not Casino.Active do
		Wait(1000)
	end
end

CasinoMe = function()
	return GetPlayerServerId(PlayerId())
end

CasinoLoadModel = function(model)
	model = type(model) == 'string' and joaat(model) or model
	if not IsModelInCdimage(model) then
		return
	end
	RequestModel(model)
	while not HasModelLoaded(model) do
		Wait(0)
	end
	return model
end

CasinoLoadDict = function(dict)
	RequestAnimDict(dict)
	while not HasAnimDictLoaded(dict) do
		Wait(0)
	end
end

CasinoChair = function(obj, seat)
	local bone = GetEntityBoneIndexByName(obj, 'Chair_Base_0' .. seat)
	return GetWorldPositionOfEntityBone(obj, bone), GetWorldRotationOfEntityBone(obj, bone)
end

CasinoClosestSeat = function(obj, seats, maxDist)
	local me = GetEntityCoords(PlayerPedId())
	local best, bestDist
	for seat = 1, 4 do
		if not seats[seat] then
			local dist = #(me - (CasinoChair(obj, seat)))
			if dist <= maxDist and (not bestDist or dist < bestDist) then
				best, bestDist = seat, dist
			end
		end
	end
	return best
end

CasinoSeatScene = function(obj, seat, dict, anim, loop)
	if not DoesEntityExist(obj) then
		return 0
	end
	local pos, rot = CasinoChair(obj, seat)
	CasinoLoadDict(dict)
	local scene =
		NetworkCreateSynchronisedScene(pos.x, pos.y, pos.z, rot.x, rot.y, rot.z, 2, not loop, loop, 1.0, 0.0, 1.0)
	NetworkAddPedToSynchronisedScene(PlayerPedId(), scene, dict, anim, 2.0, -2.0, 13, 16, 2.0, 0)
	NetworkStartSynchronisedScene(scene)
	return math.floor(GetAnimDuration(dict, anim) * 1000)
end

CasinoDisableControls = function()
	DisableAllControlActions(0)
	for _, control in ipairs({ 0, 1, 2, 199, 200, 245, 249 }) do
		EnableControlAction(0, control, true)
	end
end

CasinoChipStacks = function(amount)
	local stacks, index = {}, {}
	local take = function(models)
		for _, chip in ipairs(models) do
			while amount >= chip[1] do
				amount = amount - chip[1]
				local kind = chip[2]:sub(1, -4)
				if not index[kind] then
					stacks[#stacks + 1] = {}
					index[kind] = #stacks
				end
				table.insert(stacks[index[kind]], chip[2])
			end
		end
	end
	if amount >= Config.Chips.PlaqueMin then
		take(PlaqueModels)
	end
	take(ChipModels)
	return stacks
end

CasinoSpawnChip = function(model, pos, heading)
	local hash = CasinoLoadModel(model)
	if not hash then
		return
	end
	local obj = CreateObjectNoOffset(hash, pos.x, pos.y, pos.z, false, false, false)
	SetEntityCollision(obj, false, false)
	FreezeEntityPosition(obj, true)
	SetEntityRotation(obj, 0.0, 0.0, heading, 2, true)
	return obj
end

CasinoStackChips = function(origin, heading, amount, spots, base, lift)
	local objs, heights = {}, {}
	for s, stack in ipairs(CasinoChipStacks(amount)) do
		local si = math.min(s, #spots)
		local spot = spots[si]
		for _, model in ipairs(stack) do
			local pos = GetObjectOffsetFromCoords(
				origin.x,
				origin.y,
				origin.z,
				heading,
				spot[1].x,
				spot[1].y,
				base + (heights[si] or 0.0) + (lift or 0.0)
			)
			local obj = CasinoSpawnChip(model, pos, heading + spot[2])
			if obj then
				objs[#objs + 1] = obj
			end
			heights[si] = (heights[si] or 0.0) + (ChipThickness[model] or 0.0057)
		end
	end
	return objs
end

CasinoDealerModel = function(variation)
	return variation <= 7 and 's_m_y_casino_01' or 's_f_y_casino_01'
end

CasinoDealerLook = function(ped, variation)
	local outfit = DealerOutfits[variation]
	SetPedDefaultComponentVariation(ped)
	if not outfit then
		return
	end
	for _, c in ipairs(outfit) do
		SetPedComponentVariation(ped, c[1], c[2], c[3], 0)
	end
	for _, p in ipairs(outfit.props or {}) do
		SetPedPropIndex(ped, p[1], p[2], p[3], false)
	end
end

CasinoSpeech = function(ped, line)
	if not DoesEntityExist(ped) then
		return
	end
	StopCurrentPlayingAmbientSpeech(ped)
	PlayAmbientSpeech1(ped, line, 'SPEECH_PARAMS_FORCE_NORMAL_CLEAR')
end

CasinoKeybinds = function(id, keys, order)
	local last
	return function(active)
		local list = {}
		for _, name in ipairs(order) do
			local state = active[name]
			if state then
				list[#list + 1] = { key = keys[name][1], label = L(keys[name][2]), active = state == 'on' }
			end
		end
		local sig = json.encode(list)
		if sig == last then
			return
		end
		last = sig
		UiHints(id, #list > 0 and list or nil)
	end
end

CasinoResult = function(game, staked, payout)
	local title = L('game.' .. game)
	if payout > staked then
		BridgeNotifySend(L('table.won', { amount = FormatChips(payout - staked) }), 'success', 5000, title)
		return 'good'
	elseif payout == staked then
		BridgeNotifySend(L('table.push'), 'info', 5000, title)
		return 'impartial'
	end
	BridgeNotifySend(L('table.lost', { amount = FormatChips(staked - payout) }), 'error', 5000, title)
	return 'bad'
end
