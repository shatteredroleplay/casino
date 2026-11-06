Players = {}

local LOADED, UNLOADED = Util.Event('player:loaded'), Util.Event('player:unloaded')
local Ids, Sources = {}, {}

local remember = function(src, id)
    local old = Ids[src]
    if old and old ~= id and Sources[old] == src then Sources[old] = nil end
    Ids[src], Sources[id] = id, src
end

Players.Id = function(src)
    src = tonumber(src)
    if not src or src <= 0 then return nil end
    local id = Bridge.Framework.GetIdentifier(src)
    if not id then return nil end
    id = tostring(id)
    if Ids[src] ~= id then remember(src, id) end
    return id
end

Players.Source = function(id)
    id = tostring(id)
    local src = Sources[id]
    if src and Players.Id(src) == id then return src end
    src = Bridge.Framework.GetSource(id)
    if src then remember(src, id) end
    return src
end

Players.Name = function(src)
    local ok, name = pcall(Bridge.Framework.GetName, src)
    return ok and name or GetPlayerName(src) or tostring(src)
end

local Banned = {}

Players.Banned = function(src)
    local id = Players.Id(src)
    if not id then return false end
    if Banned[id] == nil then
        Db.Await()
        Banned[id] = (function(v) return v == 1 or v == true end)(MySQL.scalar.await('SELECT `banned` FROM `casino_players` WHERE `identifier` = ?', { id }))
    end
    return Banned[id]
end

Players.SetBanned = function(id, on)
    Banned[id] = on and true or false
    MySQL.prepare.await('INSERT INTO `casino_players` (`identifier`, `banned`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `banned` = ?', { id, on and 1 or 0, on and 1 or 0 })
end

Players.Online = function()
    local list = {}
    for _, value in ipairs(GetPlayers()) do
        local src = tonumber(value)
        local id = Players.Id(src)
        if id then list[#list + 1] = { src = src, id = id } end
    end
    return list
end

local loaded = function(src)
    src = tonumber(src)
    local id = src and Players.Id(src)
    if not id then return end
    TriggerEvent(LOADED, src, id)
end

local unloaded = function(src)
    src = tonumber(src)
    local id = src and Ids[src]
    if not id then return end
    Ids[src] = nil
    if Sources[id] == src then Sources[id] = nil end
    TriggerEvent(UNLOADED, src, id)
end

Bridge.Framework.OnLoad(loaded)
Bridge.Framework.OnUnload(unloaded)

AddEventHandler('playerDropped', function()
    unloaded(source)
end)

CreateThread(function()
    for _, value in ipairs(GetPlayers()) do loaded(value) end
end)
