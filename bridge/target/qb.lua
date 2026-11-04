local labels = function(options)
    local list = {}
    for i, o in ipairs(options) do list[i] = o.label end
    return list
end

Bridge.Add('target', 'qb', {
    resource = 'qb-target',

    AddModels = function(models, options)
        local list, distance = {}, 0.0
        for i, o in ipairs(options) do
            distance = math.max(distance, o.distance or 2.0)
            list[i] = {
                label = o.label,
                icon = o.icon,
                canInteract = o.canInteract and function(entity) return o.canInteract(entity) end,
                action = function(entity) o.onSelect(entity) end,
            }
        end
        exports['qb-target']:AddTargetModel(models, { options = list, distance = distance })
    end,

    RemoveModels = function(models, options)
        exports['qb-target']:RemoveTargetModel(models, labels(options))
    end,
})
