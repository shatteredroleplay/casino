-- Every system the casino talks to goes through one adapter table, picked by Config.Bridge.
-- An adapter is registered with BridgeAdd(kind, name, table). The table has `resource` (used by 'auto')
-- and the functions listed for its kind below. Copy bridge/<kind>/custom to support another resource.
Bridge = {}

Bridge.Kinds = {
	framework = {
		setting = 'Framework',
		field = 'Framework',
		fallback = 'standalone',
		order = { 'qbx', 'qb', 'esx', 'ox', 'nd', 'shattered' },
		server = {
			'GetIdentifier',
			'GetSource',
			'GetName',
			'GetMoney',
			'AddMoney',
			'RemoveMoney',
			'HasGroup',
			'OnLoad',
			'OnUnload',
			'GiveVehicle',
		},
		client = { 'IsLoaded', 'IsDead', 'OnLoad', 'OnUnload' },
	},
	inventory = {
		setting = 'Inventory',
		field = 'Inventory',
		fallback = 'none',
		order = { 'ox', 'qs', 'codem', 'tgiann', 'core', 'qb', 'esx', 'shattered' },
		server = { 'Count', 'Add', 'Remove', 'CanCarry' },
		client = { 'Count', 'SetBusy' },
	},
	target = {
		setting = 'Target',
		field = 'Target',
		fallback = 'builtin',
		order = { 'ox', 'qb', 'sleepless', 'interact', 'context' },
		client = { 'AddModels', 'RemoveModels' },
	},
	notify = {
		setting = 'Notify',
		field = 'Notify',
		fallback = 'builtin',
		order = { 'ox', 'okok', 'esx', 'qb' },
		client = { 'Send' },
	},
	vehiclekeys = {
		setting = 'VehicleKeys',
		field = 'Keys',
		fallback = 'none',
		order = {},
		server = { 'Give' },
	},
	society = {
		setting = 'Society',
		field = 'Society',
		fallback = 'none',
		order = {},
		server = { 'Deposit' },
	},
	logs = {
		setting = 'Logs',
		field = 'Logs',
		fallback = 'none',
		order = {},
		server = { 'Send' },
	},
}

local Adapters = {}

BridgeAdd = function(kind, name, adapter)
	Adapters[kind] = Adapters[kind] or {}
	adapter.name = name
	Adapters[kind][name] = adapter
end

local Side = Util.Server and 'server' or 'client'

local pick = function(kind, def)
	local list, wanted = Adapters[kind] or {}, Config.Bridge[def.setting] or 'auto'
	if wanted ~= 'auto' then
		local adapter = list[wanted]
		if adapter and adapter.resource and not UtilRunning(adapter.resource) then
			UtilPrint('warn', '%s "%s" is selected but %s is not running', kind, wanted, adapter.resource)
		end
		return adapter, wanted
	end
	for _, name in ipairs(def.order) do
		local adapter = list[name]
		if adapter and adapter.resource and UtilRunning(adapter.resource) then
			return adapter, name
		end
	end
	return list[def.fallback], def.fallback
end

local broken = function(kind, name, reason)
	UtilPrint('error', '%s adapter "%s" %s. Check Config.Bridge in config/main.lua', kind, tostring(name), reason)
	local warned = false

	local Index = function(_, fn)
		return function()
			if not warned then
				warned = true
				UtilPrint('error', 'called %s.%s but the %s adapter is not usable', kind, fn, kind)
			end
		end
	end

	return setmetatable({ name = name, broken = true }, {
		__index = Index,
	})
end

BridgeResolve = function()
	local picked = {}
	for kind, def in pairs(Bridge.Kinds) do
		local required = def[Side]
		if required then
			local adapter, name = pick(kind, def)
			if not adapter then
				adapter = broken(kind, name, 'does not exist')
			else
				local missing = {}
				for _, fn in ipairs(required) do
					if type(adapter[fn]) ~= 'function' then
						missing[#missing + 1] = fn
					end
				end
				if #missing > 0 then
					adapter = broken(kind, name, 'is missing ' .. table.concat(missing, ', '))
				end
			end
			Bridge[def.field] = { name = adapter.name, broken = adapter.broken }
			for _, fn in ipairs(required) do
				_G['Bridge' .. def.field .. fn] = adapter[fn]
			end
			picked[#picked + 1] = ('%s: %s'):format(kind, name)
		end
	end
	table.sort(picked)
	Bridge.Summary = table.concat(picked, ' · ')
end

BridgePlate = function(taken)
	local letters = 'ABCDEFGHJKLMNPRSTUVWXYZ'
	for _ = 1, 50 do
		local plate = ''
		for i = 1, 8 do
			if i == 4 then
				plate = plate .. ' '
			elseif i < 4 then
				local n = math.random(#letters)
				plate = plate .. letters:sub(n, n)
			else
				plate = plate .. tostring(math.random(0, 9))
			end
		end
		if not taken(plate) then
			return plate
		end
	end
end
