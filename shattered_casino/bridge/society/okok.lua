Bridge.Add('society', 'okok', {
    resource = 'okokBanking',

    Deposit = function(amount)
        return exports.okokBanking:AddMoney(ServerConfig.Society.Account, amount) ~= false
    end,
})
