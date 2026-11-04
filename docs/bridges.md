# Bridges

The casino never calls a framework, inventory or target resource directly. Every system goes through one adapter
table, chosen in `config/main.lua`:

```lua
Config.Bridge = {
    Framework = 'auto',
    Inventory = 'auto',
    Target = 'auto',
    Notify = 'builtin',
    VehicleKeys = 'none',
    Society = 'none',
    Logs = 'none',
}
```

`'auto'` walks the list below and takes the first adapter whose resource is running. If nothing matches, the
fallback is used. On start the server prints what was picked, for example:

```
[casino] framework: qbx · inventory: ox · logs: none · society: none · vehiclekeys: none
```

Run `casinobridge` in the server console at any time to see it again.

| Kind | Auto order | Fallback | Other choices |
|---|---|---|---|
| Framework | qbx, qb, esx, ox, nd | standalone | custom |
| Inventory | ox, qs, codem, tgiann, core, qb, esx | none | custom |
| Target | ox, qb, sleepless, interact | builtin | custom |
| Notify | — | builtin | ox, qb, esx, okok, custom |
| VehicleKeys | — | none | item, custom |
| Society | — | none | esx, qb, renewed, okok, custom |
| Logs | — | none | discord, fivemanage, custom |

`qb` inventory goes through the qb-core player functions, so ps-inventory and lj-inventory work with it too.
`builtin` target needs no resource: walk up to a table and press E, and scroll when there is more than one option.

## Errors

If the selected adapter does not exist, or is missing a function, the console shows

```
[casino] framework adapter "x" does not exist. See docs/bridges.md
[casino] inventory adapter "x" is missing Count, Add. See docs/bridges.md
```

The casino keeps running. Calls into a broken adapter do nothing and print one error, so check the name in
`Config.Bridge` or fill in the missing functions.

## Writing an adapter

Every kind has a `custom` file that is never picked by auto. Fill it in and select `'custom'`. The comments in it list
what every function gets and must return. To support another resource permanently, copy `custom`, give it a name and
a `resource`, and add the name to the `order` list of its kind in `bridge/init.lua` if auto should find it.
Framework and inventory adapters live in a folder each, so add their `client.lua` and `server.lua` to the
`client_scripts` and `server_scripts` lists in `fxmanifest.lua` as well. The flat kinds (target, notify, keys,
society, logs) are picked up by their folder's `*.lua` pattern.

### Framework (server)
| Function | Returns |
|---|---|
| `GetIdentifier(src)` | the loaded character's id as a string, or nil |
| `GetSource(identifier)` | server id, or nil when offline |
| `GetName(src)` | character name |
| `GetMoney(src, account)` | number. account is `'cash'` or `'bank'` |
| `AddMoney(src, account, amount, reason)` | true when added |
| `RemoveMoney(src, account, amount, reason)` | true only when the player had enough |
| `HasGroup(src, group)` | true when in the group or rank, used by `Config.Admin.Groups` |
| `OnLoad(cb)` | call `cb(src)` when a character loads |
| `OnUnload(cb)` | call `cb(src)` when a character unloads |
| `GiveVehicle(src, { model, label, garage, props })` | plate, or nil |

### Framework (client)
`IsLoaded()`, `IsDead()`, `OnLoad(cb)`, `OnUnload(cb)`

### Inventory
Server: `Count(src, item)`, `Add(src, item, amount, metadata)`, `Remove(src, item, amount)`, `CanCarry(src, item, amount)`.
Client: `Count(item)`, `SetBusy(busy)`. `SetBusy` is called with true while the player sits at a game.

### Target (client)
`AddModels(models, options)` and `RemoveModels(models, options)`. Options have this shape:

```lua
{ name = 'casino_blackjack', label = 'Play Blackjack', icon = 'fa-solid fa-dice', distance = 2.0,
  canInteract = function(entity) return true end, onSelect = function(entity) end }
```

### Notify (client)
`Send(text, kind, duration, title)`. kind is `'info'`, `'success'`, `'warning'` or `'error'`.

### VehicleKeys, Society, Logs (server)
`Give(src, plate, label)`, `Deposit(amount, reason)`, `Send(category, title, fields)`.
