-- Template: send the notification through any resource. Set Config.Bridge.Notify = 'custom'.
-- kind is 'info', 'success', 'warning' or 'error', duration is in ms (may be nil), title may be nil.

local Send = function(text, kind, duration, title)
	UiNotify(text, kind, duration, title)
end

BridgeAdd('notify', 'custom', {
	Send = Send,
})
