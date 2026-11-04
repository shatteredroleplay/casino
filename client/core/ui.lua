Ui = {}

local Inputs, nextInput = {}, 0

Ui.Notify = function(text, kind, duration, title)
    Nui.Send('notify', { text = text, kind = kind or 'info', duration = duration or 4000, title = title })
end

Ui.Hints = function(id, keys)
    Nui.Send('hints', { id = id, keys = keys })
end

Ui.Snackbar = function(title, text)
    Nui.Send('snackbar', { title = title, text = text })
end

Ui.Prompt = function(options, selected)
    Nui.Send('prompt', { options = options, selected = selected })
end

local close = function(id, values)
    local pending = Inputs[id]
    if not pending then return end
    Inputs[id] = nil
    Nui.Focus('input:' .. id, false)
    pending:resolve(values or false)
end

Ui.CloseInput = function()
    for id in pairs(Inputs) do
        Nui.Send('input:close', { id = id })
        close(id)
    end
end

Ui.Input = function(spec)
    Ui.CloseInput()
    nextInput = nextInput + 1
    local id, pending = nextInput, promise.new()
    Inputs[id] = pending
    Nui.Send('input', { id = id, spec = spec })
    Nui.Focus('input:' .. id, true)
    return Citizen.Await(pending) or nil
end

Nui.On('input', function(data)
    close(data.id, type(data.values) == 'table' and data.values or nil)
    return true
end)
