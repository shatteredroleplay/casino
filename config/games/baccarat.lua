-- Punto banco. Every seat can bet on player, banker and tie at the same time.
Config.Baccarat = {
    BetTime = 20,
    DealTime = 1500,
    ResultTime = 7,
    IdleRounds = 3,
    RenderDistance = 30.0,
    SitDistance = 1.6,
    Tie = 8,                    -- a tie pays this many times the bet
    Commission = 0.07,          -- the part of a banker win the house keeps (0.05 is the usual casino rule)

    Board = { Distance = 12.0, Width = 0.96, Z = 1.0, Prompt = { Forward = 0.5, Z = 1.02, Width = 0.9 } },

    Tables = {
        { coords = vec4(1028.92, 55.66, 71.48, 191.50), model = 'vw_prop_casino_baccarat_01', min = 25, max = 2000 },
        { coords = vec4(1013.18, 72.62, 72.28, 17.22), model = 'vw_prop_casino_baccarat_01b', min = 500, max = 5000 },
    },
}
