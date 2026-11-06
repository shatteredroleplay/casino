-- No target resource: walk up to the model and press E, scroll to pick between options.
Bridge.Add('target', 'builtin', {
    AddModels = function(models, options)
        Interact.Add(models, options)
    end,

    RemoveModels = function(models, options)
        Interact.Remove(models, options)
    end,
})
