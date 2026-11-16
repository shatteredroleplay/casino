local QBCore

local core = function()
	QBCore = QBCore or exports['qb-core']:GetCoreObject()
	return QBCore
end

local IsLoaded = function()
	return LocalPlayer.state.isLoggedIn == true
end

local IsDead = function()
	local meta = core().Functions.GetPlayerData().metadata or {}
	return meta.isdead or meta.inlaststand or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	RegisterNetEvent('QBCore:Client:OnPlayerUnload', function()
		cb()
	end)
end

BridgeAdd('framework', 'qb', {
	resource = 'qb-core',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
