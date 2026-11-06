local pack = msgpack.pack_args
local Members = {}

for _, id in ipairs(GetPlayers()) do
    if Player(id).state.casinoInside then Members[tonumber(id)] = true end
end

AddStateBagChangeHandler('casinoInside', nil, function(bagName, _, value)
    local src = GetPlayerFromStateBagName(bagName)
    if not src or src == 0 then return end
    Members[src] = value and true or nil
end)

AddEventHandler('playerDropped', function()
    Members[source] = nil
end)

Broadcast = function(event, ...)
    if not next(Members) then return end
    local payload = pack and pack(...)
    for src in pairs(Members) do
        if payload then
            TriggerClientEventInternal(event, src, payload, payload:len())
        else
            TriggerClientEvent(event, src, ...)
        end
    end
end

BroadcastNear = function(event, pos, range, extra, ...)
    local payload = pack and pack(...)
    for _, id in ipairs(GetPlayers()) do
        local src = tonumber(id)
        local ped = GetPlayerPed(src)
        if src == extra or (ped ~= 0 and #(GetEntityCoords(ped) - pos) <= range) then
            if payload then
                TriggerClientEventInternal(event, src, payload, payload:len())
            else
                TriggerClientEvent(event, src, ...)
            end
        end
    end
end
