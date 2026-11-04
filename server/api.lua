exports('GetChips', function(src)
    return Wallet.Get(src)
end)

exports('AddChips', function(src, amount)
    return Wallet.Add(src, amount)
end)

exports('RemoveChips', function(src, amount)
    return Wallet.Remove(src, amount)
end)

exports('PoolBalance', function()
    return Pool.Balance() * Config.Chips.Rate
end)

exports('CarFund', function()
    return Pool.Fund()
end)

exports('RigState', function()
    return Rig.State()
end)

exports('RigFeed', function(since)
    return Rig.FeedSince(since)
end)

exports('RigSet', function(admin, target, mode, chance, games, options)
    if not Audit.Valid(admin) then return false end
    return Rig.Set(admin, target or nil, mode, chance, games, options)
end)

exports('RigWheel', function(admin, target, index)
    if not Audit.Valid(admin) then return false end
    return Rig.SetWheel(admin, target, index)
end)

exports('RigClear', function(admin)
    if not Audit.Valid(admin) then return false end
    return Rig.Clear(admin)
end)
