RegisterCommand('casinobridge', function(src)
	if src ~= 0 then
		return
	end
	UtilPrint('info', Bridge.Summary)
	UtilPrint(
		'info',
		'chips: %s · locale: %s · database: %s',
		Wallet.Mode,
		Locale.Code,
		Db.Ready and 'ready' or 'not ready'
	)
end, true)

local check = function(results, ok, label, detail)
	results[#results + 1] = { ok = ok, text = detail and ('%s (%s)'):format(label, tostring(detail)) or label }
	return ok
end

local selftest = function(target)
	local r = {}
	check(r, Db.Ready, 'database ready')
	check(
		r,
		Db.Version == Db.Latest,
		'database schema up to date',
		('%s of %s'):format(tostring(Db.Version), Db.Latest)
	)
	for kind, def in pairs(Bridge.Kinds) do
		local adapter = Bridge[def.field]
		if def.server then
			check(r, adapter ~= nil and not adapter.broken, kind .. ' adapter usable', adapter and adapter.name)
		end
	end
	check(
		r,
		Bridge.Framework.name ~= 'standalone' or Wallet.Mode == 'wallet',
		'chip mode fits the framework',
		Wallet.Mode
	)
	check(
		r,
		Wallet.Mode ~= 'item' or Bridge.Inventory.name ~= 'none',
		'item mode has an inventory',
		Bridge.Inventory.name
	)

	if target then
		local id = PlayersId(target)
		if check(r, id ~= nil, 'player identifier', id) then
			check(r, PlayersSource(id) == target, 'identifier maps back to the player')
			check(r, type(PlayersName(target)) == 'string', 'player name', PlayersName(target))
			check(
				r,
				type(BridgeFrameworkGetMoney(target, 'cash')) == 'number',
				'cash balance',
				BridgeFrameworkGetMoney(target, 'cash')
			)
			check(
				r,
				type(BridgeFrameworkGetMoney(target, 'bank')) == 'number',
				'bank balance',
				BridgeFrameworkGetMoney(target, 'bank')
			)
			local before = WalletGet(target)
			check(r, type(before) == 'number', 'chip balance', before)
			if check(r, WalletCanAdd(target, 1), 'can receive a chip') then
				local added = WalletAdd(target, 1)
				check(r, added and WalletGet(target) == before + 1, 'add 1 chip', Config.Chips.Item)
				if added then
					check(r, WalletRemove(target, 1) and WalletGet(target) == before, 'remove 1 chip')
				end
			end
			check(r, not PlayersBanned(target), 'not banned from the casino')
			local perms = PermsList(target)
			check(r, true, 'admin permissions', #perms > 0 and table.concat(perms, ', ') or 'none')
		end
	end

	local closed = {}
	for game, off in pairs(Settings.Get().disabled or {}) do
		if off then
			closed[#closed + 1] = game
		end
	end
	check(r, true, 'closed games', #closed > 0 and table.concat(closed, ', ') or 'none')
	return r
end

RegisterCommand('casinoqa', function(src, args)
	if src ~= 0 then
		return
	end
	local target = tonumber(args[1])
	if args[1] and (not target or not GetPlayerName(target)) then
		return UtilPrint('warn', 'usage: casinoqa [server id of an online player]')
	end
	CreateThread(function()
		local failed = 0
		for _, line in ipairs(selftest(target)) do
			if not line.ok then
				failed = failed + 1
			end
			UtilPrint(line.ok and 'ok' or 'error', '%s %s', line.ok and 'PASS' or 'FAIL', line.text)
		end
		UtilPrint(failed == 0 and 'ok' or 'error', failed == 0 and 'self test passed' or '%d check(s) failed', failed)
	end)
end, true)

if not Config.Debug then
	return
end

RpcRegister('debug:self', function(src)
	return {
		id = PlayersId(src),
		name = PlayersName(src),
		chips = WalletGet(src),
		cash = BridgeFrameworkGetMoney(src, 'cash'),
		perms = PermsList(src),
		bridge = Bridge.Summary,
		mode = Wallet.Mode,
	}
end)

RegisterCommand('casinochips', function(src, args)
	if src ~= 0 and not PermsHas(src, 'economy') then
		return
	end
	local target, amount = tonumber(args[1]), UtilInteger(args[2])
	if not target or not amount or amount == 0 then
		return UtilPrint('warn', 'usage: casinochips <server id> <amount, negative to take>')
	end
	local ok = amount > 0 and WalletAdd(target, amount) or WalletRemove(target, -amount)
	UtilPrint(ok and 'ok' or 'error', '%s %d chips for %s', ok and 'moved' or 'could not move', amount, target)
end, false)
