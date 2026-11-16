local Kinds = { info = 'primary', success = 'success', warning = 'warning', error = 'error' }

local Send = function(text, kind, duration)
	TriggerEvent('QBCore:Notify', text, Kinds[kind] or 'primary', duration)
end

BridgeAdd('notify', 'qb', {
	resource = 'qb-core',

	Send = Send,
})
