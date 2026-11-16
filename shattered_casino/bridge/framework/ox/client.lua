local loaded = false

AddEventHandler('ox:playerLoaded', function()
	loaded = true
end)
AddEventHandler('ox:playerLogout', function()
	loaded = false
end)

CreateThread(function()
	if not UtilRunning('ox_core') then
		return
	end
	local ok, p = pcall(function()
		return exports.ox_core:GetPlayer()
	end)
	if ok and p and p.charId then
		loaded = true
	end
end)

local IsLoaded = function()
	return loaded
end

local IsDead = function()
	return LocalPlayer.state.isDead == true or IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb)
	AddEventHandler('ox:playerLoaded', function()
		cb()
	end)
end

local OnUnload = function(cb)
	AddEventHandler('ox:playerLogout', function()
		cb()
	end)
end

BridgeAdd('framework', 'ox', {
	resource = 'ox_core',

	IsLoaded = IsLoaded,
	IsDead = IsDead,
	OnLoad = OnLoad,
	OnUnload = OnUnload,
})
