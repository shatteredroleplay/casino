local Send = function(_, title, fields)
	local Base = exports.shattered:Object()
	pcall(Base.Utils.Log, 'Admin', title, fields or {})
end

BridgeAdd('logs', 'shattered', {
	resource = 'shattered',

	Send = Send,
})
