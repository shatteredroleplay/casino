local open = false

local close = function()
    if not open then return end
    open = false
    Nui.Send('admin:close')
    Nui.Focus('admin', false)
    Rpc.Async('admin:close', function() end)
end

RegisterNetEvent(Util.Event('admin:open'), function()
    if open then return end
    local data = Rpc.Call('admin:open')
    if type(data) ~= 'table' or data.error then
        return Bridge.Notify.Send(data and data.error or L('error.no_permission'), 'error', 3000, L('admin.title'))
    end
    open = true
    data.resource = Util.Resource
    Nui.Send('admin:open', data)
    Nui.Focus('admin', true)
end)

RegisterNetEvent(Util.Event('admin:feed'), function(entry)
    if open then Nui.Send('admin:feed', { entry = entry }) end
end)

Nui.On('admin', function(data)
    if data.call == 'close' then
        close()
        return true
    end
    if type(data.call) ~= 'string' or not data.call:match('^[%w:]+$') then return { error = L('error.generic') } end
    local args = type(data.args) == 'table' and data.args or {}
    local result = Rpc.Call('admin:' .. data.call, table.unpack(args, 1, 6))
    if result == nil then return { error = L('error.generic') } end
    return { data = result }
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource and open then SetNuiFocus(false, false) end
end)
