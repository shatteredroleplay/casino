Track = {}

Track.Names = {}
for name in L('track.horses'):gmatch('[^|]+') do Track.Names[#Track.Names + 1] = name end

Track.Name = function(index)
    return Track.Names[index] or L('track.horse', { n = index })
end

local decimal = Config.Currency.Thousands == ',' and '.' or ','

Track.OddsLabel = function(odds)
    return (('%.2f'):format(odds + 1):gsub('%.', decimal))
end

Track.Payout = function(amount, odds)
    return math.floor(amount * (odds + 1))
end

Track.MaxBet = function(odds, tableMax)
    return math.floor(tableMax / odds)
end
