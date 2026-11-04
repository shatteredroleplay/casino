# Testing

There are three layers of testing. Run them in this order, and run everything again after any change to a bridge or to money code.

1. **Automated checks** run without a server: `cd tools && npm run check`.
2. **Live self test** runs in the server console with one player online: `casinoqa <server id>`.
3. **Manual matrix** is the checklist below, done once per framework setup.

## 1. Automated checks

`npm run check` runs four steps:

| Step | What it proves |
|---|---|
| `check-lua.mjs` | Every Lua file compiles as Lua 5.4 |
| `check-locales.mjs` | Both languages have the same keys and the same `{placeholders}` |
| `test-core.mjs` | Bridge auto detection, formatting, locales, rigging, card/roulette/baccarat payouts, every slot game in every mode, track odds, wheel prize labels |
| `test-adapters.mjs` | Each adapter is checked against a stand-in for that resource's API (see below). Also covers the cashier, the wallet modes, owed chips and the RPC layer |

`test-adapters.mjs` covers these:

- **Framework adapters** (esx, qbx, qb, ox, nd, standalone): identifier both ways, name, cash and bank, refusing to overdraw, calls for a player who is offline, groups, and storing the wheel car.
- **Inventory adapters** (ox, esx, qb, qs, codem, tgiann, core): count, add, add into a full inventory, refusing to overdraw, remove, and can-carry.
- **Client adapters:**
  - notify (ox, esx, qb, okok)
  - item counts for every client inventory
  - logged-in and dead state for qbx, qb and esx
- **Cashier**, tested with esx+esx, qbx+ox, qb+qb and ox+ox in item mode, qbx in wallet mode, and esx in cash mode:
  - buying, selling and selling all
  - no money, standing too far away, banned players, bad amounts
  - a full inventory, which refunds the money
- **Owed chips:** a payout to a player who has left, or whose inventory is full, is saved and paid out when they next load in. Wins and refunds at the tables go through this as well.
- **RPC layer:**
  - unknown calls
  - a handler that crashes
  - the rate limit, which is per player and resets after its window
  - bad requests

These stand-ins follow each resource's real API. ESX Legacy 1.12, qbx_core, qbx_vehicles, ox_inventory, ox_target and ox_lib were checked against their source. The others were written from their documentation. A test pass means the adapter uses the API correctly; it doesn't prove the resource behaves the same on a live server. The live self test covers that.

## 2. Live self test

Start the server, join with one character, and type this in the server console:

```
casinoqa 1
```

Replace `1` with your server id. Every line prints PASS or FAIL:

- the database is ready and the schema is up to date
- every adapter is usable (none fell back to a broken stub)
- the chip mode fits the framework (standalone needs `wallet`, item mode needs an inventory)
- the player identifier, both ways
- name, cash and bank
- the chip balance; then 1 chip is added and removed again (a FAIL here in item mode usually means the `casino_chips` item is missing from the inventory)
- the ban flag, admin permissions, and closed games

Without a server id, only the server-side checks run.

## 3. Manual matrix

Mark a cell ✅ when the full checklist below passes on that setup.

| Framework | Inventory | Target | Self test | Checklist | Notes |
|---|---|---|---|---|---|
| Qbox | ox_inventory | ox_target | ☐ | ☐ | Development server. All games were played during phases 3–5 |
| QBCore | qb-inventory | qb-target | ☐ | ☐ | |
| QBCore | ps / lj-inventory | qb-target | ☐ | ☐ | Uses the `qb` inventory adapter |
| ESX Legacy | built-in | ox_target | ☐ | ☐ | Also check esx_garage, because the car needs the `parking` column |
| ESX Legacy | ox_inventory | ox_target | ☐ | ☐ | |
| ox_core | ox_inventory | ox_target | ☐ | ☐ | Cash only; bank is not supported |
| ND_Core | ox_inventory | ox_target | ☐ | ☐ | |
| Standalone | none | builtin | ☐ | ☐ | `Config.Chips.Mode = 'wallet'` |
| any | qs / codem / tgiann / core | any | ☐ | ☐ | Paid inventories; test when a licence is available |
| any | any | sleepless / interact | ☐ | ☐ | |

### Checklist per setup (about 20 minutes)

**Start**
- [ ] `ensure casino` prints the bridge summary with no errors or warnings.
- [ ] `casinoqa <id>` has no FAIL lines.

**Chips**
- [ ] Cashier: buy 100, sell 50, then sell all. The money changes by chips × rate each time.
- [ ] Cashier: buying with too little money, and from 6 m away, are both refused with a message.
- [ ] In item mode, the chip HUD and the inventory show the same number.

**Each game: blackjack, roulette, baccarat, poker, slots, horse racing, lucky wheel**
- [ ] Sit down, play a round, win at least once, and leave.
- [ ] The HUD shows the round result.
- [ ] The admin panel shows the round under Games and on the player's profile.

**Lucky wheel car**
- [ ] Force the car with Rigging → wheel prize, then spin.
- [ ] The car appears in the garage set in `Config.Wheel.Car.Garage`, and keys are given if they're configured.

**Admin panel**
- [ ] Open it with `/casinoadmin`. A player without ACE sees nothing.
- [ ] Give and take chips, ban and unban, and reset the wheel. Each action appears in the audit log.
- [ ] Close a game in Settings. Sitting down at it is refused, and opening it again lets players sit.
- [ ] Change a table's min/max. The new limits show at the table without a restart.

**Two clients**
- [ ] Two players at the same blackjack table, then the same poker table: both see the same cards, turns, chips and results.
- [ ] Two players on neighbouring slot machines: each sees the other's spins on the machine screen.
- [ ] A second player trying to take an occupied seat or slot machine gets "seat taken".

**Refunds and crashes**

Do each of these with a bet on the table, then check the chips with `casinoqa <id>` once the player is back:

- [ ] Quit the game (F8 `quit`) during a blackjack hand → the bet comes back on rejoin, or the win if the hand was won.
- [ ] Quit during a roulette spin with a winning bet → the win is paid on rejoin with the "you were owed" message.
- [ ] Quit with chips at a poker table → the stack comes back on rejoin.
- [ ] Quit during a slot win animation → the win is paid on rejoin.
- [ ] Quit during a horse race with a bet on the winner → paid on rejoin.
- [ ] `restart casino` during a roulette or race round → every open bet is refunded.
- [ ] Item mode with a full inventory: win at a table → the chips are owed, and paid at the cashier or on the next load once there is room.

**Performance**

Open F8 and type `resmon 1`:
- [ ] Outside the casino: `casino` shows 0.00 ms.
- [ ] Inside, standing idle: 0.05 ms or less.
- [ ] Inside, playing slots or watching a race: note the peak here.

## Known gaps

- The qs, codem, tgiann and core_inventory adapters, the sleepless and interact target adapters, okok and Renewed society, and the Discord and fivemanage logs are written from their docs and have not run on a live server yet.
- On ox_core the casino only moves cash (the `money` item). Bank calls return 0 or false.
