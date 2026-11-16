local Models, range = {}, 0.0
local POOLS = { 'CObject', 'CPed', 'CVehicle' }
local KEY_USE, KEY_UP, KEY_DOWN = 38, 15, 14

local hash = function(model)
	return type(model) == 'string' and joaat(model) or model
end

local measure = function()
	range = 0.0
	for _, list in pairs(Models) do
		for _, o in ipairs(list) do
			range = math.max(range, o.distance or 2.0)
		end
	end
end

InteractAdd = function(models, options)
	for _, model in ipairs(models) do
		local h = hash(model)
		Models[h] = Models[h] or {}
		for _, o in ipairs(options) do
			table.insert(Models[h], o)
		end
	end
	measure()
end

InteractRemove = function(models, options)
	local drop = {}
	for _, o in ipairs(options or {}) do
		drop[o] = true
	end
	for _, model in ipairs(models) do
		local h = hash(model)
		local list = Models[h]
		if list then
			for i = #list, 1, -1 do
				if not options or drop[list[i]] then
					table.remove(list, i)
				end
			end
			if #list == 0 then
				Models[h] = nil
			end
		end
	end
	measure()
end

local scan = function()
	local ped = PlayerPedId()
	if IsPedInAnyVehicle(ped, false) then
		return nil
	end
	local pos, best, bestDist = GetEntityCoords(ped), nil, nil
	for _, pool in ipairs(POOLS) do
		for _, entity in ipairs(GetGamePool(pool)) do
			if entity ~= ped and Models[GetEntityModel(entity)] then
				local dist = #(pos - GetEntityCoords(entity))
				if dist <= range and (not bestDist or dist < bestDist) then
					best, bestDist = entity, dist
				end
			end
		end
	end
	if not best then
		return nil
	end

	local visible = {}
	for _, o in ipairs(Models[GetEntityModel(best)]) do
		if bestDist <= (o.distance or 2.0) and (not o.canInteract or o.canInteract(best)) then
			visible[#visible + 1] = o
		end
	end
	if #visible == 0 then
		return nil
	end
	return best, visible
end

CreateThread(function()
	local entity, options, selected, shown, nextScan = nil, {}, 1, nil, 0
	while true do
		if not next(Models) then
			if shown then
				UiPrompt(nil)
				shown = nil
			end
			entity = nil
			Wait(1000)
		else
			local now = GetGameTimer()
			if now >= nextScan then
				nextScan = now + 300
				local ok, found, list = pcall(scan)
				entity, options = ok and found or nil, ok and list or {}
				if selected > #options then
					selected = 1
				end
			end

			local active = entity and not IsPauseMenuActive() and not NuiFocused()
			if active and #options > 1 then
				DisableControlAction(0, KEY_UP, true)
				DisableControlAction(0, KEY_DOWN, true)
				if IsDisabledControlJustPressed(0, KEY_UP) or IsControlJustPressed(0, 172) then
					selected = selected == 1 and #options or selected - 1
				end
				if IsDisabledControlJustPressed(0, KEY_DOWN) or IsControlJustPressed(0, 173) then
					selected = selected % #options + 1
				end
			end

			local labels = {}
			if active then
				for i, o in ipairs(options) do
					labels[i] = o.label
				end
			end
			local key = active and (selected .. '|' .. table.concat(labels, '|')) or nil
			if key ~= shown then
				shown = key
				UiPrompt(active and labels or nil, selected)
			end

			if active and IsControlJustPressed(0, KEY_USE) then
				local option, target = options[selected], entity
				entity, shown, nextScan = nil, nil, now + 800
				UiPrompt(nil)
				CreateThread(function()
					option.onSelect(target)
				end)
			end
			Wait(active and 0 or 250)
		end
	end
end)
