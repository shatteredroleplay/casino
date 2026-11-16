local Deposit = function(amount)
	local chips = math.floor(amount / Config.Chips.Rate)
	if chips > 0 then
		exports.businesses:CasinoIncome(chips)
	end
	return true
end

BridgeAdd('society', 'shattered', {
	resource = 'businesses',

	Deposit = Deposit,
})
