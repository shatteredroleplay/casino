local Deposit = function(amount)
	return exports.okokBanking:AddMoney(ServerConfig.Society.Account, amount) ~= false
end

BridgeAdd('society', 'okok', {
	resource = 'okokBanking',

	Deposit = Deposit,
})
