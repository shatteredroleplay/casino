Wheel = {}

local Chips = function(p)
	return FormatChips(p.amount)
end

local Money = function(p)
	return FormatMoney(p.amount)
end

local Item = function(p)
	return L('wheel.item', { amount = p.amount or 1, item = p.itemLabel or p.name })
end

local Car = function()
	return Config.Wheel.Car.Label
end

local Labels = {
	chips = Chips,
	money = Money,
	item = Item,
	car = Car,
}

WheelLabel = function(prize)
	if not prize then
		return ''
	end
	if prize.label then
		return prize.label
	end
	local fn = Labels[prize.type]
	return fn and fn(prize) or prize.type
end
