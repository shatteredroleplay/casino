local names = function(options)
	local list = {}
	for i, o in ipairs(options) do
		list[i] = o.name
	end
	return list
end

local AddModels = function(models, options)
	local list = {}
	for i, o in ipairs(options) do
		local OnSelect = function(data)
			o.onSelect(data.entity)
		end

		list[i] = {
			name = o.name,
			label = o.label,
			icon = o.icon,
			distance = o.distance or 2.0,
			canInteract = o.canInteract and function(entity)
				return o.canInteract(entity)
			end,
			onSelect = OnSelect,
		}
	end
	exports.sleepless_interact:addModel(models, list)
end

local RemoveModels = function(models, options)
	exports.sleepless_interact:removeModel(models, names(options))
end

BridgeAdd('target', 'sleepless', {
	resource = 'sleepless_interact',

	AddModels = AddModels,
	RemoveModels = RemoveModels,
})
