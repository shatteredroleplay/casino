State = {}

local FLUSH_MS = 5000
local Values, Dirty = {}, {}
local loaded, ready = false, promise.new()

local await = function()
    if not loaded then Citizen.Await(ready) end
end

State.Get = function(key, default)
    await()
    local value = Values[key]
    if value == nil then return default end
    return value
end

State.Set = function(key, value)
    await()
    Values[key] = value
    Dirty[key] = true
end

State.Flush = function()
    if not next(Dirty) then return end
    local queries = {}
    for key in pairs(Dirty) do
        queries[#queries + 1] = {
            query = 'INSERT INTO `casino_state` (`k`, `v`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `v` = ?',
            values = { key, json.encode({ v = Values[key] }), json.encode({ v = Values[key] }) },
        }
    end
    Dirty = {}
    MySQL.transaction(queries, function(ok)
        if not ok then Util.Print('error', 'could not save casino state') end
    end)
end

CreateThread(function()
    Db.Await()
    for _, row in ipairs(MySQL.query.await('SELECT `k`, `v` FROM `casino_state`') or {}) do
        local ok, data = pcall(json.decode, row.v)
        if ok and type(data) == 'table' then Values[row.k] = data.v end
    end
    loaded = true
    ready:resolve(true)

    while true do
        Wait(FLUSH_MS)
        State.Flush()
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource == Util.Resource and loaded then State.Flush() end
end)
