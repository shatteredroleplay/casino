-- Texas Hold'em between players. The house only takes a rake from pots that saw a flop.
Config.Poker = {
    TurnTime = 25,
    ResultTime = 8,
    IdleRounds = 3,             -- hands in a row without chips for the big blind before the seat is freed
    DealTime = 1500,            -- ms between the streets
    DealCard = 900,             -- ms between hole cards as they are dealt around the table
    DealRate = 1.6,             -- how much faster than blackjack the dealer deals them
    CardInHand = 1300,
    RenderDistance = 30.0,
    SitDistance = 1.6,
    Rake = 0.05,
    RakeCap = 500,

    -- the board and pot float over the table, a tag over every seat, your own cards and keys on your box
    Board = {
        Distance = 12.0,
        Table = { Width = 0.9, Z = 1.2 },
        Seat = { Width = 0.34, Z = 1.65 },
        Own = { Width = 0.8, Z = 0.97 },
    },

    -- small/big are the blinds, min/max the buy-in
    Tables = {
        { coords = vec4(1026.73, 67.01, 71.48, 10.79), model = 'vw_prop_casino_3cardpoker_01', small = 10, big = 20, min = 400, max = 4000 },
        { coords = vec4(1019.49, 44.72, 72.28, 195.79), model = 'vw_prop_casino_3cardpoker_01b', small = 50, big = 100, min = 2000, max = 20000 },
    },
}
