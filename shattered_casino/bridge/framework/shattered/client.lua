local loaded = false

RegisterNetEvent('base:playerLoaded', function()
	loaded = true
end)
RegisterNetEvent('base:playerUnloaded', function()
	loaded = false
end)

CreateThread(function()
	if not UtilRunning('shattered') then
		return
	end
	loaded = pcall(function()
		return exports.shattered:GetUserData()
	end)
end)

local IsLoaded = function()
	return loaded
end

local IsDead = function()
	return LocalPlayer.state.isDead == true or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	RegisterNetEvent('base:playerLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	RegisterNetEvent('base:playerUnloaded', function()
		cb()
	end)
end

BridgeAdd('framework', 'shattered', {
	resource = 'shattered',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
