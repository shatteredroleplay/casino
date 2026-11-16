local Send = function(text, kind, duration, title)
	exports.okokNotify:Alert(title or L('common.casino'), text, duration or 5000, kind or 'info', false)
end

BridgeAdd('notify', 'okok', {
	resource = 'okokNotify',

	Send = Send,
})
