local Tables = { blackjack = Config.Blackjack, roulette = Config.Roulette, baccarat = Config.Baccarat, poker = Config.Poker }
local Defaults = {}
for game, cfg in pairs(Tables) do
    for id, t in ipairs(cfg.Tables) do Defaults[game .. ':' .. id] = { min = t.min, max = t.max } end
end

local apply = function(s)
    s = type(s) == 'table' and s or {}
    local limits = s.limits or {}
    for key, base in pairs(Defaults) do
        local game, id = key:match('^(%w+):(%d+)$')
        local t = Tables[game].Tables[tonumber(id)]
        local over = limits[key]
        t.min, t.max = over and over.min or base.min, over and over.max or base.max
    end
    Casino.Closed = s.disabled or {}
end

apply(GlobalState.casinoSettings)

AddStateBagChangeHandler('casinoSettings', 'global', function(_, _, value)
    apply(value)
end)
