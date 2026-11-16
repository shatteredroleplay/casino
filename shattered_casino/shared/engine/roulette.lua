Roulette = {}

Roulette.Wheel = {
	'00',
	'27',
	'10',
	'25',
	'29',
	'12',
	'8',
	'19',
	'31',
	'18',
	'6',
	'21',
	'33',
	'16',
	'4',
	'23',
	'35',
	'14',
	'2',
	'0',
	'28',
	'9',
	'26',
	'30',
	'11',
	'7',
	'20',
	'32',
	'17',
	'5',
	'22',
	'34',
	'15',
	'3',
	'24',
	'36',
	'13',
	'1',
}

local red = {}
for _, n in ipairs({ 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36 }) do
	red[n] = true
end

RouletteIsRed = function(number)
	return red[tonumber(number)] == true
end

local RedWins = function(n)
	return red[n] == true
end

local BlackWins = function(n)
	return n >= 1 and not red[n]
end

local EvenWins = function(n)
	return n >= 1 and n % 2 == 0
end

local OddWins = function(n)
	return n % 2 == 1
end

local LowWins = function(n)
	return n >= 1 and n <= 18
end

local HighWins = function(n)
	return n >= 19
end

local Dozen1Wins = function(n)
	return n >= 1 and n <= 12
end

local Dozen2Wins = function(n)
	return n >= 13 and n <= 24
end

local Dozen3Wins = function(n)
	return n >= 25
end

local Col1Wins = function(n)
	return n % 3 == 1
end

local Col2Wins = function(n)
	return n % 3 == 2
end

local Col3Wins = function(n)
	return n >= 1 and n % 3 == 0
end

Roulette.Bets = {
	red = {
		payout = 1,
		wins = RedWins,
	},
	black = {
		payout = 1,
		wins = BlackWins,
	},
	even = {
		payout = 1,
		wins = EvenWins,
	},
	odd = {
		payout = 1,
		wins = OddWins,
	},
	low = {
		payout = 1,
		wins = LowWins,
	},
	high = {
		payout = 1,
		wins = HighWins,
	},
	dozen1 = {
		payout = 2,
		wins = Dozen1Wins,
	},
	dozen2 = {
		payout = 2,
		wins = Dozen2Wins,
	},
	dozen3 = {
		payout = 2,
		wins = Dozen3Wins,
	},
	col1 = {
		payout = 2,
		wins = Col1Wins,
	},
	col2 = {
		payout = 2,
		wins = Col2Wins,
	},
	col3 = {
		payout = 2,
		wins = Col3Wins,
	},
}

Roulette.Order =
	{ 'red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3', 'col1', 'col2', 'col3', '0', '00' }

for _, number in ipairs({ '0', '00' }) do
	local Wins = function(_, s)
		return s == number
	end

	Roulette.Bets[number] = {
		payout = 35,
		number = true,
		wins = Wins,
	}
end
for i = 1, 36 do
	local number = tostring(i)

	local Wins = function(_, s)
		return s == number
	end

	Roulette.Bets[number] = {
		payout = 35,
		number = true,
		wins = Wins,
	}
	Roulette.Order[#Roulette.Order + 1] = number
end

RouletteLabel = function(bet)
	local def = Roulette.Bets[bet]
	if not def then
		return bet
	end
	if def.number then
		return L('roulette.bet_number', { number = bet })
	end
	return L('roulette.bet_' .. bet)
end

RoulettePayout = function(bet, amount, number)
	local def = Roulette.Bets[bet]
	if not def or not def.wins(tonumber(number) or 0, number) then
		return 0
	end
	return amount * (def.payout + 1)
end

RouletteMaxBet = function(bet, tableMax)
	return math.floor(tableMax / Roulette.Bets[bet].payout)
end

RouletteCovered = function(bet)
	local numbers = {}
	for _, number in ipairs(Roulette.Wheel) do
		if RoulettePayout(bet, 1, number) > 0 then
			numbers[#numbers + 1] = number
		end
	end
	return numbers
end
