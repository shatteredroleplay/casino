-- No target resource: walk up to the model and press E, scroll to pick between options.

local AddModels = function(models, options)
	InteractAdd(models, options)
end

local RemoveModels = function(models, options)
	InteractRemove(models, options)
end

BridgeAdd('target', 'builtin', {
	AddModels = AddModels,
	RemoveModels = RemoveModels,
})
