local Deposit = function()
	return true
end

BridgeAdd('society', 'none', {
	Deposit = Deposit,
})
