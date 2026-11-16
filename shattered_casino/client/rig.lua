RegisterNetEvent(UtilEvent('rig:feed'), function(entry)
	if type(entry) ~= 'table' then
		return
	end
	TriggerEvent(UtilEvent('rig:feed:local'), entry)
	BridgeNotifySend(entry.text, 'info', 6000, L('log.rig_title'))
end)
