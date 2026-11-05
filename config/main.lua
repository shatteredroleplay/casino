Config = {}

-- Language file from locales/ (en, sv). Keys missing in it fall back to English.
Config.Locale = 'en'

-- How money is written everywhere (chat, NUI, admin panel).
-- Position 'before' gives $1,000, 'after' gives 1 000 kr. Space puts a space between the symbol and the number.
Config.Currency = {
    Symbol = '$',
    Position = 'before',
    Space = false,
    Thousands = ',',
}

-- Prints what the bridge picked and every rejected request to the console, and enables /casinotest.
Config.Debug = true

-- Which resource handles each system. 'auto' takes the first supported one that is running.
--   Framework   : auto | qbx | qb | esx | ox | nd | standalone | custom
--   Inventory   : auto | ox | qs | codem | tgiann | core | qb | esx | none | custom
--                 (qb also covers ps-inventory and lj-inventory, they hook the qb-core player functions)
--   Target      : auto | ox | qb | sleepless | interact | context | builtin
--                 (builtin needs no resource: walk up to a table and press E)
--   Notify      : builtin | ox | qb | esx | okok | shattered | custom
--   VehicleKeys : none | item | custom    (the wheel car is stored in a garage, most key systems hand out keys on spawn)
--   Society     : none | esx | qb | renewed | okok | shattered | custom    (where the house income goes, account in config/server.lua)
--   Logs        : none | discord | fivemanage | shattered | custom    (webhooks and tokens in config/server.lua)
Config.Bridge = {
    Framework = 'qbx',
    Inventory = 'ox',
    Target = 'ox',
    Notify = 'ox',
    VehicleKeys = 'none',
    Society = 'none',
    Logs = 'none',
}

-- How players hold chips.
--   item   : an inventory item, bought and sold at the cashier
--   wallet : a balance the casino keeps in its own database, no item needed, works on any framework
--   cash   : no chips, bets are taken straight from cash (the cashier is not used)
-- Rate is what one chip costs. In cash mode one chip is worth Rate in cash.
-- PlaqueMin: bets of this many chips or more are shown on the table with plaques instead of only chips.
Config.Chips = {
    Mode = 'item',
    Item = 'casino_chips',
    Rate = 10,
    PlaqueMin = 1000,
}

-- The item given with the wheel car when VehicleKeys is 'item'. It gets { plate, label } as metadata.
Config.KeyItem = 'carkey'

-- Accent colour of the casino UI.
Config.Ui = {
    Accent = '#d6b25e',
}

-- Admin panel. Access is given by ACE or by framework group.
--   ACE: add_ace group.admin casino.admin allow            -> everything
--        add_ace group.mod casino.admin.view allow         -> one part: view, rig, economy, settings
--   Groups: framework groups and the parts of the panel they get without any ACE.
--           On qbx, ox, nd and standalone a group is an ACE group (group.admin).
Config.Admin = {
    Command = 'casinoadmin',
    Ace = 'casino.admin',
    Groups = {
        god = { 'view', 'rig', 'economy', 'settings' },
        superadmin = { 'view', 'rig', 'economy', 'settings' },
        admin = { 'view', 'rig', 'economy', 'settings' },
    },
}

-- Requests a player may send to one server function per Window milliseconds before they are dropped.
Config.RateLimit = {
    Calls = 12,
    Window = 1000,
}
