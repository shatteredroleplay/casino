-- Template: pay the house income somewhere. Set Config.Bridge.Society = 'custom'.
-- amount is in money (not chips), reason is a short text. Return true when paid.
Bridge.Add('society', 'custom', {
    Deposit = function(amount, reason)
        return true
    end,
})
