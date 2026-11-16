# shattered_casino

A playable casino for FiveM with table games, slot machines, horse racing and a lucky wheel. Made by [Shattered](https://www.shattered.se). Includes a cashier, a shared house bankroll and an admin panel for managing the casino while the server is running.

## Features

- Blackjack, roulette, baccarat and Texas Hold'em poker with seated players, dealers, cards and chip stacks
- Ten slot games with their own themes, bonus rounds and animations
- Horse racing with betting terminals and a shared race screen
- Lucky wheel with chips, money, items and a podium car, with a configurable spin cost and cooldown
- Cashier for buying and selling chips, with inventory items, a saved chip wallet or direct cash betting
- House bankroll, configurable bet limits, outcome protection and optional society income
- Admin panel with game statistics, player history, casino bans, economy controls, rigging and an audit log
- Casino video wall, crowd audio and a chip HUD showing the player's session results
- Built-in interactions, notifications and input menus, with bridges for supported resources
- Framework support for Qbox, QBCore, ESX, ox_core, ND Core, Shattered and standalone
- English and Swedish included, with configurable currency formatting and UI accent color

## Installation

1. Download the resource and put the `shattered_casino` folder in your server's `resources` folder.
2. Make sure OneSync is enabled, your server uses game build **2060 or newer**, and `oxmysql` is connected to your database.
3. Load your casino interior. The default positions are for the GTA Online casino interior; adjust `config/locations.lua` and the game configs if your map uses a different layout. IPLs can be added in `Config.Atmosphere.Ipls` if your map resource does not load them.
4. Choose your chip mode in `config/main.lua`. The default is `item`, which needs a `casino_chips` item in your inventory. Use `wallet` for a saved balance without an inventory item, or `cash` to bet directly from the player's cash.
5. Check the wheel prizes in `config/games/wheel.lua`. Item prizes must exist in your inventory, and the car needs a garage supported by your framework bridge. The Qbox vehicle bridge uses `qbx_vehicles`.
6. Add these lines to your `server.cfg`, after your framework, inventory and any other bridge resources:

   ```cfg
   ensure oxmysql
   ensure shattered_casino
   ```

7. Restart your server.

The database tables and migrations are applied automatically on startup. Keep the `sql` folder in the resource; no manual SQL import is needed for a fresh install. The built UI is included in `web/dist`.

Standalone servers should use `wallet` mode and give players chips through the admin panel or server exports. The standalone bridge does not provide a money system or owned vehicles.

## Configuration

Settings are split between the files in `config/`:

| File | What it does |
| --- | --- |
| `main.lua` | Language, currency, bridges, chip mode, UI color, admin access and request limits |
| `economy.lua` | House bankroll, cashier limits, society income, rigging and statistics |
| `locations.lua` | Cashiers, casino center, floor boundary and loading range |
| `atmosphere.lua` | Map blip, crowd audio, video wall, chip HUD and IPLs |
| `games/*.lua` | Tables, positions, bets, timings, rules and prizes for each game |
| `server.lua` | Society account, Discord webhooks and Fivemanage credentials; only loaded on the server |

The main options in `config/main.lua` are:

| Option | What it does |
| --- | --- |
| `Locale` | Language file in `locales/`, such as `en` or `sv`; missing keys fall back to English |
| `Currency` | Currency symbol, thousands separator, spacing and symbol position |
| `Bridge` | Framework, inventory, targeting, notifications, vehicle keys, society and logging adapters |
| `Chips.Mode` | `item`, `wallet` or `cash` |
| `Chips.Item` | Inventory item used in item mode, default `casino_chips` |
| `Chips.Rate` | Money value of one chip, default `10` |
| `Ui.Accent` | Accent color for the casino UI |
| `Admin` | Admin command, ACE permission and framework groups |
| `Debug` | Diagnostic output and the `/casinotest` and `/casinotarget` commands |

Framework, inventory, targeting and notifications use automatic detection by default. Vehicle keys, society payouts and external logs are disabled until configured. Each bridge folder has a `custom` adapter for connecting another resource.

House outcome protection is enabled by default. To disable it, set `Config.Pool.Protection.Bias.Max` and `Config.Pool.Protection.HighRoller.Chance` to `0` in `config/economy.lua`. Slot rerolls are configured separately through `Config.Slots.Rig`.

## Admin panel

Open the panel with `/casinoadmin`. Give an ACE group full access with:

```cfg
add_ace group.admin casino.admin allow
```

Individual permissions are `casino.admin.view`, `casino.admin.rig`, `casino.admin.economy` and `casino.admin.settings`. Framework group access can also be set in `Config.Admin.Groups`.

Players can toggle the chip HUD with `/casinohud`. Both command names can be changed in the config.

## Exports

These exports are available on the server. `src` is the player's server ID; chip amounts are whole numbers.

```lua
exports.shattered_casino:GetChips(src)
exports.shattered_casino:AddChips(src, amount)
exports.shattered_casino:RemoveChips(src, amount)
exports.shattered_casino:PoolBalance()
exports.shattered_casino:CarFund()
```

`GetChips` returns the player's chip balance. `AddChips` and `RemoveChips` return whether the change succeeded. `PoolBalance` and `CarFund` return money values, rather than chip counts.

Rigging integrations can also use `RigState`, `RigFeed`, `RigSet`, `RigWheel` and `RigClear`. Their arguments are defined in `server/api.lua`; changes require an admin identity for the audit log. The calling resource must handle its own access checks.

## Support

For help, visit our [Discord](https://discord.gg/KfXAmc3qmh).
