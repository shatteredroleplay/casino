Rpc = {}

local REQUEST, RESPONSE = Util.Event('rpc:req'), Util.Event('rpc:res')
local Limit = Config.RateLimit
local Handlers, Hits = {}, {}

local limited = function(src, name, calls)
    local now, buckets = GetGameTimer(), Hits[src]
    if not buckets then
        buckets = {}
        Hits[src] = buckets
    end
    local bucket = buckets[name]
    if not bucket or now >= bucket.reset then
        bucket = { reset = now + Limit.Window, count = 0 }
        buckets[name] = bucket
    end
    bucket.count = bucket.count + 1
    return bucket.count > calls
end

Rpc.Register = function(name, handler, calls)
    Handlers[name] = { fn = handler, calls = calls or Limit.Calls }
end

RegisterNetEvent(REQUEST, function(name, id, ...)
    local src = source
    if type(name) ~= 'string' or math.type(id) ~= 'integer' then return end

    local handler = Handlers[name]
    if not handler then
        Util.Debug('rpc %s from %s: no such function', name, src)
        return TriggerClientEvent(RESPONSE, src, id, false)
    end
    if limited(src, name, handler.calls) then
        Util.Debug('rpc %s from %s: rate limited', name, src)
        return TriggerClientEvent(RESPONSE, src, id, false)
    end

    local result = table.pack(pcall(handler.fn, src, ...))
    if not result[1] then
        Util.Print('error', 'rpc %s failed: %s', name, tostring(result[2]))
        return TriggerClientEvent(RESPONSE, src, id, false)
    end
    TriggerClientEvent(RESPONSE, src, id, true, table.unpack(result, 2, result.n))
end)

AddEventHandler('playerDropped', function()
    Hits[source] = nil
end)
