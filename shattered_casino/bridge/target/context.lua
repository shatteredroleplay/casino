local hashes = function(models)
	local list = {}
	for i, model in ipairs(models) do
		list[i] = type(model) == 'string' and joaat(model) or model
	end
	return list
end

local AddModels = function(models, options)
	local list = {}
	for i, o in ipairs(options) do
		local Action = function(_, entity)
			o.onSelect(entity)
		end

		list[i] = {
			label = o.label,
			close = true,
			showIf = o.canInteract and function(entity)
				return o.canInteract(entity)
			end,
			action = Action,
		}
	end
	exports.context:AddTargetModel(hashes(models), { options = list })
end

local RemoveModels = function(models)
	exports.context:RemoveTargetModel(hashes(models))
end

BridgeAdd('target', 'context', {
	resource = 'context',

	AddModels = AddModels,
	RemoveModels = RemoveModels,
})
