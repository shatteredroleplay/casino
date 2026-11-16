local Deposit = function(amount)
	return exports['Renewed-Banking']:addAccountMoney(ServerConfig.Society.Account, amount) ~= false
end

BridgeAdd('society', 'renewed', {
	resource = 'Renewed-Banking',

	Deposit = Deposit,
})
