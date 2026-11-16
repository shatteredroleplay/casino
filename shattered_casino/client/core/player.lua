local seated = false

local Index = function(_, key)
	if key == 'Seated' then
		return seated
	end
end

local Newindex = function(t, key, value)
	if key ~= 'Seated' then
		return rawset(t, key, value)
	end
	seated = value and true or false
	BridgeInventorySetBusy(seated)
	LocalPlayer.state:set('casinoSeated', seated, true)
end

Casino = setmetatable({ Chips = 0 }, {
	__index = Index,
	__newindex = Newindex,
})

CasinoIsLoaded = function()
	local ok, loaded = pcall(BridgeFrameworkIsLoaded)
	return ok and loaded == true
end

CasinoIsDown = function()
	local ok, dead = pcall(BridgeFrameworkIsDead)
	return ok and dead == true or IsPedRagdoll(PlayerPedId())
end

local setChips = function(amount)
	if type(amount) ~= 'number' then
		return
	end
	Casino.Chips = amount
	TriggerEvent(UtilEvent('chips'), amount)
end

BridgeFrameworkOnLoad(function()
	TriggerEvent(UtilEvent('player:loaded'))
	RpcAsync('wallet:get', setChips)
end)

BridgeFrameworkOnUnload(function()
	setChips(0)
	if seated then
		Casino.Seated = false
	end
	TriggerEvent(UtilEvent('player:unloaded'))
end)

RegisterNetEvent(UtilEvent('wallet'), setChips)

RegisterNetEvent(UtilEvent('notify'), function(text, kind, duration, title)
	BridgeNotifySend(text, kind, duration, title)
end)

CreateThread(function()
	if CasinoIsLoaded() then
		RpcAsync('wallet:get', setChips)
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == Util.Resource and seated then
		BridgeInventorySetBusy(false)
	end
end)
