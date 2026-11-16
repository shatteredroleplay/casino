if not Config.Debug then
	return
end

local selftest = function()
	local title = L('debug.title')
	for _, kind in ipairs({ 'info', 'success', 'warning', 'error' }) do
		BridgeNotifySend(L('debug.notify_' .. kind), kind, 5000, title)
		Wait(250)
	end

	UiHints('debug', {
		{ key = 'E', label = L('debug.hint') },
		{ key = 'SPACE', label = L('debug.hint'), active = true },
		{ key = 'BACKSPACE', label = L('common.close') },
	})
	SetTimeout(6000, function()
		UiHints('debug', nil)
	end)

	local values = UiInput({
		title = L('debug.input_title'),
		fields = {
			{ name = 'amount', type = 'amount', label = L('input.amount'), min = 25, max = 5000, default = 100 },
			{ name = 'name', type = 'text', label = L('debug.input_name'), default = GetPlayerName(PlayerId()) },
			{
				name = 'game',
				type = 'select',
				label = L('debug.input_game'),
				default = 'roulette',
				options = {
					{ value = 'blackjack', label = 'Blackjack' },
					{ value = 'roulette', label = 'Roulette' },
					{ value = 'poker', label = 'Poker' },
				},
			},
			{
				name = 'volume',
				type = 'slider',
				label = L('debug.input_volume'),
				min = 0,
				max = 100,
				step = 5,
				default = 50,
			},
			{ name = 'enabled', type = 'checkbox', label = L('debug.input_toggle'), default = true },
		},
	})
	print(('[%s] input: %s'):format(Util.Resource, json.encode(values)))

	local info = RpcCall('debug:self')
	if not info then
		return BridgeNotifySend(L('debug.server_failed'), 'error', 5000, title)
	end
	BridgeNotifySend(
		L('debug.server', { id = info.id or '-', name = info.name or '-', chips = FormatChips(info.chips or 0) }),
		'success',
		8000,
		title
	)
	print(('[%s] server: %s'):format(Util.Resource, json.encode(info)))
	print(
		('[%s] client: %s · loaded: %s · dead: %s · chips: %s'):format(
			Util.Resource,
			Bridge.Summary,
			tostring(CasinoIsLoaded()),
			tostring(CasinoIsDown()),
			Casino.Chips
		)
	)
end

RegisterCommand('casinotest', function()
	CreateThread(selftest)
end, false)

RegisterCommand('casinotarget', function()
	local model = 'vw_prop_casino_slot_01a'

	local OnSelect = function(entity)
		BridgeNotifySend(('%s · %s'):format(L('debug.hint'), entity), 'info', 3000)
	end

	local option = {
		name = 'casino_debug',
		label = L('debug.hint'),
		icon = 'fa-solid fa-dice',
		distance = 2.0,
		onSelect = OnSelect,
	}

	local RemoveDebugTarget = function()
		BridgeTargetRemoveModels({ model }, { option })
	end

	BridgeTargetAddModels({ model }, {
		option,
		{
			name = 'casino_debug_2',
			label = L('common.close'),
			icon = 'fa-solid fa-xmark',
			distance = 2.0,
			onSelect = RemoveDebugTarget,
		},
	})
	BridgeNotifySend(model, 'info', 3000, Bridge.Target.name)
end, false)
