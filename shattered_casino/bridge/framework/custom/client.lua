-- Client half of the custom framework template, see server.lua next to this file.

local IsLoaded = function()
	return NetworkIsPlayerActive(PlayerId())
end

local IsDead = function()
	return IsEntityDead(PlayerPedId())
end

local OnLoad = function(cb) end

local OnUnload = function(cb) end

BridgeAdd('framework', 'custom', {
	resource = nil,

	-- true once the player has a character and can play
	IsLoaded = IsLoaded,

	-- true while the player is dead or downed (they are stood up from tables and machines)
	IsDead = IsDead,

	-- call cb() when the character has been loaded
	OnLoad = OnLoad,

	-- call cb() when the character is unloaded
	OnUnload = OnUnload,
})
