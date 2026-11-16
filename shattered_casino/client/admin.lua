local open = false

local close = function()
	if not open then
		return
	end
	open = false
	NuiSend('admin:close')
	NuiFocus('admin', false)
	RpcAsync('admin:close', function() end)
end

RegisterNetEvent(UtilEvent('admin:open'), function()
	if open then
		return
	end
	local data = RpcCall('admin:open')
	if type(data) ~= 'table' or data.error then
		return BridgeNotifySend(data and data.error or L('error.no_permission'), 'error', 3000, L('admin.title'))
	end
	open = true
	data.resource = Util.Resource
	NuiSend('admin:open', data)
	NuiFocus('admin', true)
end)

RegisterNetEvent(UtilEvent('admin:feed'), function(entry)
	if open then
		NuiSend('admin:feed', { entry = entry })
	end
end)

NuiOn('admin', function(data)
	if data.call == 'close' then
		close()
		return true
	end
	if type(data.call) ~= 'string' or not data.call:match('^[%w:]+$') then
		return { error = L('error.generic') }
	end
	local args = type(data.args) == 'table' and data.args or {}
	local result = RpcCall('admin:' .. data.call, table.unpack(args, 1, 6))
	if result == nil then
		return { error = L('error.generic') }
	end
	return { data = result }
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == Util.Resource and open then
		SetNuiFocus(false, false)
	end
end)
