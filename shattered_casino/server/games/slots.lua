local Cfg = Config.Slots
local SPIN = UtilEvent('slots:spin')
local Players_, Machines, Picked = {}, {}, {}
GlobalState.casinoSlots = Picked

local maxBet, validBet = 0, {}
for _, bet in ipairs(Cfg.Bets) do
	validBet[bet] = true
	if bet > maxBet then
		maxBet = bet
	end
end

local pay = function(src, p)
	local owed = p.owed
	p.owed = nil
	if owed then
		WalletGive(p.player, owed, src)
	end
end

local leave = function(src)
	local p = Players_[src]
	if not p then
		return
	end
	pay(src, p)
	Players_[src] = nil
	Machines[p.key] = nil
end

local deny = function(src, key, reason, ...)
	UtilDebug('slots: %s refused, %s', src, reason:format(...))
	return L(key)
end

SlotsSeated = function()
	local n = 0
	for _ in pairs(Players_) do
		n = n + 1
	end
	return n
end

RpcRegister('slots:sit', function(src, pos, model)
	if type(pos) ~= 'vector3' or not Cfg.Machines[model] then
		return deny(src, 'error.generic', 'unknown machine %s', tostring(model))
	end
	if Players_[src] then
		leave(src)
	end
	local refused = SettingsRefuse(src, 'slots')
	if refused then
		return refused
	end
	local center = #(pos - Cfg.Center)
	if center > Cfg.Radius then
		return deny(
			src,
			'slots.ui.outside',
			'machine is %.0f m from Config.Slots.Center (Radius %.0f)',
			center,
			Cfg.Radius
		)
	end
	local reach = #(GetEntityCoords(GetPlayerPed(src)) - pos)
	if reach > 3.0 then
		return deny(src, 'slots.ui.too_far', 'player is %.1f m from the machine', reach)
	end
	local player = PlayersId(src)
	if not player then
		return deny(src, 'error.not_loaded', 'no identifier from the %s framework adapter', Bridge.Framework.name)
	end
	local key = SlotsKey(pos)
	if Machines[key] then
		return deny(src, 'slots.ui.busy', 'machine %s is used by %s', key, Machines[key])
	end

	local id = Picked[key] or SlotsDefault(key)
	Machines[key] = src
	Players_[src] = { key = key, pos = pos, id = id, player = player, game = Cfg.Games[id], busyUntil = 0 }
	return id
end, 4)

RpcRegister('slots:game', function(src, id)
	local p = Players_[src]
	if not p or GetGameTimer() < p.busyUntil or type(id) ~= 'string' or not Cfg.Games[id] then
		return false
	end
	p.id, p.game = id, Cfg.Games[id]
	Picked[p.key] = p.id
	GlobalState.casinoSlots = Picked
	return p.id
end, 4)

RpcRegister('slots:leave', function(src)
	leave(src)
	return true
end)

RpcRegister('slots:spin', function(src, bet, mode, pick)
	local p = Players_[src]
	if not p or GetGameTimer() < p.busyUntil then
		return false
	end
	if math.type(bet) ~= 'integer' or not validBet[bet] then
		return false
	end
	if mode ~= nil and mode ~= 'ante' and mode ~= 'buy' then
		return false
	end
	if pick ~= nil and not (mode == 'buy' and (p.game.byMode[pick] or {}).buy) then
		return false
	end
	if bet > PoolMaxBet(maxBet) then
		return L('slots.ui.bet_too_high')
	end
	if #(GetEntityCoords(GetPlayerPed(src)) - p.pos) > 3.0 then
		return false
	end

	local id = PlayersId(src)
	if not id then
		return false
	end
	local cost = SlotsCost(p.game, bet, mode, pick)
	pay(src, p)
	if not WalletRemove(src, cost) then
		return L('error.not_enough_chips')
	end
	PoolAdd(cost)

	local spin = function()
		return SlotsSpin(p.game, bet, mode, pick)
	end
	local res = spin()
	local want = RigWant(id, 'slots')
	if want ~= 0 then
		res = RigPick('slots', { [id] = want }, res, spin, function(r)
			return { [id] = r.payout - cost }
		end, function(r)
			return r.payout - cost <= PoolBalance()
		end)
	end
	if res.payout - cost > PoolBalance() or want == 0 and res.payout > cost and math.random() < Cfg.Rig then
		res = spin()
	end
	PoolSettle(id, 'slots:' .. p.id, cost, res.payout, res.time)

	p.owed = res.payout > 0 and res.payout or nil
	p.busyUntil = GetGameTimer() + res.time
	res.game = p.id
	SetTimeout(res.time, function()
		pay(src, p)
	end)

	BroadcastNear(SPIN, p.pos, Cfg.Audience, src, p.key, res)
	return res
end)

AddEventHandler(UtilEvent('player:unloaded'), function(src)
	leave(src)
end)

AddEventHandler('playerDropped', function()
	leave(source)
end)

AddEventHandler('onResourceStop', function(resource)
	if resource ~= Util.Resource then
		return
	end
	for src, p in pairs(Players_) do
		pay(src, p)
	end
end)
