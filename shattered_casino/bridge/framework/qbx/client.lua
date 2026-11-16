local IsLoaded = function()
	return LocalPlayer.state.isLoggedIn == true
end

local IsDead = function()
	local data = exports.qbx_core:GetPlayerData() or {}
	local meta = data.metadata or {}
	return meta.isdead or meta.inlaststand or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	RegisterNetEvent('QBCore:Client:OnPlayerLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	RegisterNetEvent('qbx_core:client:playerLoggedOut', function()
		cb()
	end)
end

BridgeAdd('framework', 'qbx', {
	resource = 'qbx_core',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
