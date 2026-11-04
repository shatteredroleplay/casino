-- Where everything stands. The defaults are for the GTA Online casino interior.
Config.Locations = {
    -- the cashiers selling and buying chips: vec4(x, y, z, heading) of the ped standing behind the counter
    Cashiers = {
        vec4(976.21, 37.26, 74.88, 90.44),
        vec4(1014.95, 62.46, 72.88, 226.40),
    },
    CashierModel = 'u_f_m_casinocash_01',
    CashierScenario = 'WORLD_HUMAN_STAND_IMPATIENT',

    -- the middle of the casino: nothing loads further away than Range metres from it
    Center = vec3(971.52, 39.12, 74.87),
    Range = 150.0,

    -- the casino floor as an outline (x, y) between MinZ and MaxZ. Tables, screens and sound only run inside it.
    -- Leave Zone empty to use the interior the tables stand in instead.
    -- Grace is how many seconds after leaving it things stay loaded.
    Zone = {
        vec2(1056.08, 78.57),
        vec2(985.16, -37.66),
        vec2(905.07, 11.08),
        vec2(1000.46, 114.65),
    },
    MinZ = 65.85,
    MaxZ = 81.09,
    Grace = 10,
}
