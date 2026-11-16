local IsLoaded = function()
	return exports.ND_Core:getPlayer() ~= nil
end

local IsDead = function()
	return LocalPlayer.state.dead == true or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	RegisterNetEvent('ND:characterLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	RegisterNetEvent('ND:characterUnloaded', function()
		cb()
	end)
end

BridgeAdd('framework', 'nd', {
	resource = 'ND_Core',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
