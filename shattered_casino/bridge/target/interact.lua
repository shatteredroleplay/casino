-- darktrace "interact": one interaction per model, the options are listed in it.
local id = function(model)
	return ('%s:%s'):format(Util.Resource, model)
end

local AddModels = function(models, options)
	local list, distance = {}, 0.0
	for i, o in ipairs(options) do
		distance = math.max(distance, o.distance or 2.0)

		local Action = function(entity)
			o.onSelect(entity)
		end

		list[i] = {
			label = o.label,
			canInteract = o.canInteract and function(entity)
				return o.canInteract(entity)
			end,
			action = Action,
		}
	end
	for _, model in ipairs(models) do
		exports.interact:AddModelInteraction({
			model = model,
			id = id(model),
			distance = distance + 4.0,
			interactDst = distance,
			options = list,
		})
	end
end

local RemoveModels = function(models)
	for _, model in ipairs(models) do
		exports.interact:RemoveModelInteraction(model, id(model))
	end
end

BridgeAdd('target', 'interact', {
	resource = 'interact',

	AddModels = AddModels,
	RemoveModels = RemoveModels,
})
