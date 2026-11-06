Roulette = {}

Roulette.Wheel = {
    '00', '27', '10', '25', '29', '12', '8', '19', '31', '18', '6', '21', '33', '16', '4', '23', '35', '14', '2',
    '0', '28', '9', '26', '30', '11', '7', '20', '32', '17', '5', '22', '34', '15', '3', '24', '36', '13', '1',
}

local red = {}
for _, n in ipairs({ 1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36 }) do
    red[n] = true
end

Roulette.IsRed = function(number)
    return red[tonumber(number)] == true
end

Roulette.Bets = {
    red = { payout = 1, wins = function(n) return red[n] == true end },
    black = { payout = 1, wins = function(n) return n >= 1 and not red[n] end },
    even = { payout = 1, wins = function(n) return n >= 1 and n % 2 == 0 end },
    odd = { payout = 1, wins = function(n) return n % 2 == 1 end },
    low = { payout = 1, wins = function(n) return n >= 1 and n <= 18 end },
    high = { payout = 1, wins = function(n) return n >= 19 end },
    dozen1 = { payout = 2, wins = function(n) return n >= 1 and n <= 12 end },
    dozen2 = { payout = 2, wins = function(n) return n >= 13 and n <= 24 end },
    dozen3 = { payout = 2, wins = function(n) return n >= 25 end },
    col1 = { payout = 2, wins = function(n) return n % 3 == 1 end },
    col2 = { payout = 2, wins = function(n) return n % 3 == 2 end },
    col3 = { payout = 2, wins = function(n) return n >= 1 and n % 3 == 0 end },
}

Roulette.Order = { 'red', 'black', 'even', 'odd', 'low', 'high', 'dozen1', 'dozen2', 'dozen3', 'col1', 'col2', 'col3', '0', '00' }

for _, number in ipairs({ '0', '00' }) do
    Roulette.Bets[number] = { payout = 35, number = true, wins = function(_, s) return s == number end }
end
for i = 1, 36 do
    local number = tostring(i)
    Roulette.Bets[number] = { payout = 35, number = true, wins = function(_, s) return s == number end }
    Roulette.Order[#Roulette.Order + 1] = number
end

Roulette.Label = function(bet)
    local def = Roulette.Bets[bet]
    if not def then return bet end
    if def.number then return L('roulette.bet_number', { number = bet }) end
    return L('roulette.bet_' .. bet)
end

Roulette.Payout = function(bet, amount, number)
    local def = Roulette.Bets[bet]
    if not def or not def.wins(tonumber(number) or 0, number) then return 0 end
    return amount * (def.payout + 1)
end

Roulette.MaxBet = function(bet, tableMax)
    return math.floor(tableMax / Roulette.Bets[bet].payout)
end

Roulette.Covered = function(bet)
    local numbers = {}
    for _, number in ipairs(Roulette.Wheel) do
        if Roulette.Payout(bet, 1, number) > 0 then
            numbers[#numbers + 1] = number
        end
    end
    return numbers
end
