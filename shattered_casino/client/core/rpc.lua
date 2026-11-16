local REQUEST, RESPONSE = UtilEvent('rpc:req'), UtilEvent('rpc:res')
local TIMEOUT = 30000
local Pending, nextId = {}, 0

RegisterNetEvent(RESPONSE, function(id, ok, ...)
	local pending = Pending[id]
	if not pending then
		return
	end
	Pending[id] = nil
	pending:resolve(ok and table.pack(...) or false)
end)

RpcCall = function(name, ...)
	nextId = nextId + 1
	local id, pending = nextId, promise.new()
	Pending[id] = pending
	TriggerServerEvent(REQUEST, name, id, ...)
	SetTimeout(TIMEOUT, function()
		if Pending[id] ~= pending then
			return
		end
		Pending[id] = nil
		UtilDebug('rpc %s timed out', name)
		pending:resolve(false)
	end)

	local result = Citizen.Await(pending)
	if not result then
		return nil
	end
	return table.unpack(result, 1, result.n)
end

RpcAsync = function(name, cb, ...)
	local args = table.pack(...)
	CreateThread(function()
		cb(RpcCall(name, table.unpack(args, 1, args.n)))
	end)
end
