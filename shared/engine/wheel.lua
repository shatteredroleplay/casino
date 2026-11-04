Wheel = {}

local Labels = {
    chips = function(p) return Format.Chips(p.amount) end,
    money = function(p) return Format.Money(p.amount) end,
    item = function(p) return L('wheel.item', { amount = p.amount or 1, item = p.itemLabel or p.name }) end,
    car = function() return Config.Wheel.Car.Label end,
}

Wheel.Label = function(prize)
    if not prize then return '' end
    if prize.label then return prize.label end
    local fn = Labels[prize.type]
    return fn and fn(prize) or prize.type
end
