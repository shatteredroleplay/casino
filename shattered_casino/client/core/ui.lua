local Inputs, nextInput = {}, 0

UiNotify = function(text, kind, duration, title)
	NuiSend('notify', { text = text, kind = kind or 'info', duration = duration or 4000, title = title })
end

UiHints = function(id, keys)
	NuiSend('hints', { id = id, keys = keys })
end

UiSnackbar = function(title, text)
	NuiSend('snackbar', { title = title, text = text })
end

UiPrompt = function(options, selected)
	NuiSend('prompt', { options = options, selected = selected })
end

local close = function(id, values)
	local pending = Inputs[id]
	if not pending then
		return
	end
	Inputs[id] = nil
	NuiFocus('input:' .. id, false)
	pending:resolve(values or false)
end

UiCloseInput = function()
	for id in pairs(Inputs) do
		NuiSend('input:close', { id = id })
		close(id)
	end
end

UiInput = function(spec)
	UiCloseInput()
	nextInput = nextInput + 1
	local id, pending = nextInput, promise.new()
	Inputs[id] = pending
	NuiSend('input', { id = id, spec = spec })
	NuiFocus('input:' .. id, true)
	return Citizen.Await(pending) or nil
end

NuiOn('input', function(data)
	close(data.id, type(data.values) == 'table' and data.values or nil)
	return true
end)
