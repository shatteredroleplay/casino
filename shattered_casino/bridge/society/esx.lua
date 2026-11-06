-- esx_addonaccount: ServerConfig.Society.Account is the shared account, e.g. 'society_casino'
Bridge.Add('society', 'esx', {
    resource = 'esx_addonaccount',

    Deposit = function(amount)
        TriggerEvent('esx_addonaccount:getSharedAccount', ServerConfig.Society.Account, function(account)
            if account then account.addMoney(amount) end
        end)
        return true
    end,
})
