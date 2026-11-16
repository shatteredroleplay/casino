local QBCore

local Count = function(item)
	QBCore = QBCore or exports['qb-core']:GetCoreObject()
	local total = 0
	for _, slot in pairs(QBCore.Functions.GetPlayerData().items or {}) do
		if slot.name == item then
			total = total + (slot.amount or slot.count or 0)
		end
	end
	return total
end

local SetBusy = function(busy)
	LocalPlayer.state:set('inv_busy', busy, true)
end

BridgeAdd('inventory', 'qb', {
	resource = 'qb-core',

	Count = Count,
	SetBusy = SetBusy,
})
