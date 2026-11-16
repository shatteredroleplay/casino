-- kind is 'info', 'success', 'warning' or 'error' in every notify adapter

local Send = function(text, kind, duration, title)
	UiNotify(text, kind, duration, title)
end

BridgeAdd('notify', 'builtin', {
	Send = Send,
})
