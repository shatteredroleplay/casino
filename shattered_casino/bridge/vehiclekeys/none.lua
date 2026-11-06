-- The car is stored in a garage and the garage/key resource hands out keys when it is taken out.
Bridge.Add('vehiclekeys', 'none', {
    Give = function()
        return true
    end,
})
