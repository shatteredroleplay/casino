local IsLoaded = function()
	return NetworkIsPlayerActive(PlayerId())
end

local IsDead = function()
	return IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	AddEventHandler('playerSpawned', function()
		cb()
	end)
end

local OnUnload = function() end

BridgeAdd('framework', 'standalone', {
	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
