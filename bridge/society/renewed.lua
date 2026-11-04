Bridge.Add('society', 'renewed', {
    resource = 'Renewed-Banking',

    Deposit = function(amount)
        return exports['Renewed-Banking']:addAccountMoney(ServerConfig.Society.Account, amount) ~= false
    end,
})
