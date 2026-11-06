local hashes = function(models)
    local list = {}
    for i, model in ipairs(models) do list[i] = type(model) == 'string' and joaat(model) or model end
    return list
end

Bridge.Add('target', 'context', {
    resource = 'context',

    AddModels = function(models, options)
        local list = {}
        for i, o in ipairs(options) do
            list[i] = {
                label = o.label,
                close = true,
                showIf = o.canInteract and function(entity) return o.canInteract(entity) end,
                action = function(_, entity) o.onSelect(entity) end,
            }
        end
        exports.context:AddTargetModel(hashes(models), { options = list })
    end,

    RemoveModels = function(models)
        exports.context:RemoveTargetModel(hashes(models))
    end,
})
