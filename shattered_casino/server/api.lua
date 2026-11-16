exports('GetChips', function(src)
	return WalletGet(src)
end)

exports('AddChips', function(src, amount)
	return WalletAdd(src, amount)
end)

exports('RemoveChips', function(src, amount)
	return WalletRemove(src, amount)
end)

exports('PoolBalance', function()
	return PoolBalance() * Config.Chips.Rate
end)

exports('CarFund', function()
	return PoolFund()
end)

exports('RigState', function()
	return RigState()
end)

exports('RigFeed', function(since)
	return RigFeedSince(since)
end)

exports('RigSet', function(admin, target, mode, chance, games, options)
	if not AuditValid(admin) then
		return false
	end
	return RigSet(admin, target or nil, mode, chance, games, options)
end)

exports('RigWheel', function(admin, target, index)
	if not AuditValid(admin) then
		return false
	end
	return RigSetWheel(admin, target, index)
end)

exports('RigClear', function(admin)
	if not AuditValid(admin) then
		return false
	end
	return RigClear(admin)
end)
