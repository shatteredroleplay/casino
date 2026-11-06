RegisterNetEvent(Util.Event('rig:feed'), function(entry)
    if type(entry) ~= 'table' then return end
    TriggerEvent(Util.Event('rig:feed:local'), entry)
    Bridge.Notify.Send(entry.text, 'info', 6000, L('log.rig_title'))
end)
