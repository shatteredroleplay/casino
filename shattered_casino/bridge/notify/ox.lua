local Kinds = { info = 'inform', success = 'success', warning = 'warning', error = 'error' }

local Send = function(text, kind, duration, title)
	TriggerEvent(
		'ox_lib:notify',
		{ title = title, description = text, type = Kinds[kind] or 'inform', duration = duration }
	)
end

BridgeAdd('notify', 'ox', {
	resource = 'ox_lib',

	Send = Send,
})
