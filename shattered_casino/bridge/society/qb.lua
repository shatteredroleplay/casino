-- qb-banking (v2) or the older qb-management, whichever is running
Bridge.Add('society', 'qb', {
    resource = 'qb-banking',

    Deposit = function(amount, reason)
        local account = ServerConfig.Society.Account
        if Util.Running('qb-banking') then
            return exports['qb-banking']:AddMoney(account, amount, reason) ~= false
        end
        return exports['qb-management']:AddMoney(account, amount) ~= false
    end,
})
