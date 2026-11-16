local ESX
local dead = false

local core = function()
	ESX = ESX or exports.es_extended:getSharedObject()
	return ESX
end

AddEventHandler('esx:onPlayerDeath', function()
	dead = true
end)
AddEventHandler('esx:onPlayerSpawn', function()
	dead = false
end)

local IsLoaded = function()
	return core().IsPlayerLoaded() == true
end

local IsDead = function()
	return dead or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	RegisterNetEvent('esx:playerLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	RegisterNetEvent('esx:onPlayerLogout', function()
		cb()
	end)
end

BridgeAdd('framework', 'esx', {
	resource = 'es_extended',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
