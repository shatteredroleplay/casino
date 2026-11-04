import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { boot, expect, finish, root } from './harness.mjs'

const world = `
  World = { [1] = { cid = 'ABC123', charId = 7, license = 'license:aa', first = 'Ada', last = 'Lovelace', cash = 500, bank = 1000, group = 'admin', items = { casino_chips = 40 } } }
  Capacity = 100
  Queries = {}
  Aces = { [1] = { ['group.admin'] = true } }
  GetPlayerName = function(src) return 'Steam' .. src end
  GetPlayers = function() return { '1' } end
  GetPlayerIdentifierByType = function(src, kind) return World[tonumber(src)] and World[tonumber(src)].license end
  IsPlayerAceAllowed = function(src, ace) return (Aces[tonumber(src)] or {})[ace] == true end
  joaat = function(s) return #s end
  local callable = function(fn) return setmetatable({ await = fn }, { __call = function(self, ...) return self.await(...) end }) end
  MySQL = {
    scalar = callable(function(q) Queries[#Queries + 1] = q return nil end),
    insert = callable(function(q) Queries[#Queries + 1] = q return 1 end),
    update = callable(function(q) Queries[#Queries + 1] = q return 1 end),
    prepare = callable(function(q) Queries[#Queries + 1] = q return 1 end),
  }
  local total = function(p) local n = 0 for _, v in pairs(p.items) do n = n + v end return n end
  Items = {
    count = function(src, item) local p = World[src] return p and (p.items[item] or 0) or 0 end,
    fits = function(src, n) local p = World[src] return p ~= nil and total(p) + n <= Capacity end,
    add = function(src, item, n)
      local p = World[src]
      if not p or total(p) + n > Capacity then return false end
      p.items[item] = (p.items[item] or 0) + n
      return true
    end,
    remove = function(src, item, n)
      local p = World[src]
      if not p or (p.items[item] or 0) < n then return false end
      p.items[item] = p.items[item] - n
      return true
    end,
  }
  Money = {
    add = function(src, account, n) local p = World[src] if not p then return false end p[account] = p[account] + n return true end,
    remove = function(src, account, n) local p = World[src] if not p or p[account] < n then return false end p[account] = p[account] - n return true end,
  }
  exports = {}
`

const mocks = {
  esx: `
    local xPlayer = function(src)
      local p = World[src]
      if not p then return nil end
      local accounts = { money = 'cash', bank = 'bank' }
      return {
        source = src, identifier = 'char1:' .. p.license,
        getName = function() return p.first .. ' ' .. p.last end,
        getGroup = function() return p.group end,
        getAccount = function(name) local key = accounts[name] return key and { name = name, money = p[key] } or nil end,
        addAccountMoney = function(name, n) Money.add(src, accounts[name], n) end,
        removeAccountMoney = function(name, n) Money.remove(src, accounts[name], n) end,
        getInventoryItem = function(item) return { name = item, count = p.items[item] or 0 } end,
        addInventoryItem = function(item, n) Items.add(src, item, n) end,
        removeInventoryItem = function(item, n) Items.remove(src, item, n) end,
        canCarryItem = function(item, n) return Items.fits(src, n) end,
      }
    end
    local ESX = {
      GetPlayerFromId = function(src) return xPlayer(src) end,
      GetPlayerFromIdentifier = function(id) for src, p in pairs(World) do if 'char1:' .. p.license == id then return xPlayer(src) end end end,
    }
    exports.es_extended = { getSharedObject = function() return ESX end }
  `,
  qbx: `
    local player = function(src)
      local p = World[src]
      if not p then return nil end
      return {
        PlayerData = { source = src, citizenid = p.cid, license = p.license, charinfo = { firstname = p.first, lastname = p.last } },
        Functions = {
          GetMoney = function(t) return p[t] end,
          AddMoney = function(t, n) return Money.add(src, t, n) end,
          RemoveMoney = function(t, n) return Money.remove(src, t, n) end,
        },
      }
    end
    exports.qbx_core = {
      GetPlayer = function(_, src) return player(src) end,
      GetPlayerByCitizenId = function(_, cid) for src, p in pairs(World) do if p.cid == cid then return player(src) end end end,
    }
    exports.qbx_vehicles = { CreatePlayerVehicle = function(_, req) Created = req return 42 end }
    RUNNING = RUNNING .. ',qbx_vehicles'
  `,
  qb: `
    local player = function(src)
      local p = World[src]
      if not p then return nil end
      local slots = {}
      for name, amount in pairs(p.items) do slots[#slots + 1] = { name = name, amount = amount } end
      return {
        PlayerData = { source = src, citizenid = p.cid, license = p.license, charinfo = { firstname = p.first, lastname = p.last }, items = slots },
        Functions = {
          GetMoney = function(t) return p[t] end,
          AddMoney = function(t, n) return Money.add(src, t, n) end,
          RemoveMoney = function(t, n) return Money.remove(src, t, n) end,
          AddItem = function(item, n) return Items.add(src, item, n) end,
          RemoveItem = function(item, n) return Items.remove(src, item, n) end,
        },
      }
    end
    local QBCore = { Functions = {
      GetPlayer = function(src) return player(src) end,
      GetPlayerByCitizenId = function(cid) for src, p in pairs(World) do if p.cid == cid then return player(src) end end end,
      HasPermission = function(src, perm) return World[src] ~= nil and World[src].group == perm end,
    } }
    exports['qb-core'] = { GetCoreObject = function() return QBCore end }
  `,
  ox: `
    exports.ox_core = {
      GetPlayer = function(_, src) local p = World[src] return p and { source = src, charId = p.charId } end,
      GetPlayerFromFilter = function(_, f) for src, p in pairs(World) do if p.charId == f.charId then return { source = src, charId = p.charId } end end end,
      CreateVehicle = function(_, data) Created = data return { plate = 'OX 1234' } end,
      CallPlayer = function(_, src, method, arg)
        local p = World[src]
        if method == 'get' then return ({ firstName = p.first, lastName = p.last })[arg] end
        if method == 'getGroup' then return arg == p.group and 1 or nil end
      end,
    }
    World[1].items.money = World[1].cash
    Capacity = 100000
  `,
  nd: `
    local player = function(src)
      local p = World[src]
      if not p then return nil end
      return setmetatable({
        id = p.charId, source = src, firstname = p.first, lastname = p.last, fullname = p.first .. ' ' .. p.last,
        addMoney = function(account, n) return Money.add(src, account, n) end,
        deductMoney = function(account, n) return Money.remove(src, account, n) end,
        getGroup = function(name) return name == p.group and { rank = 1 } or nil end,
      }, { __index = function(_, k) if k == 'cash' or k == 'bank' then return p[k] end end })
    end
    exports.ND_Core = {
      getPlayer = function(_, src) return player(src) end,
      getPlayers = function() local list = {} for src in pairs(World) do list[#list + 1] = player(src) end return list end,
      setVehicleOwned = function(_, id, props) Created = props return 9 end,
    }
  `,
  ox_inventory: `
    exports.ox_inventory = {
      GetItemCount = function(_, src, item) return Items.count(src, item) end,
      AddItem = function(_, src, item, n) if Items.add(src, item, n) then return true, {} end return false, 'inventory_full' end,
      RemoveItem = function(_, src, item, n) if Items.remove(src, item, n) then return true end return false, 'not_enough_items' end,
      CanCarryItem = function(_, src, item, n) return Items.fits(src, n) end,
    }
  `,
  qs: `
    exports['qs-inventory'] = {
      GetItemTotalAmount = function(_, src, item) return Items.count(src, item) end,
      AddItem = function(_, src, item, n) return Items.add(src, item, n) end,
      RemoveItem = function(_, src, item, n) return Items.remove(src, item, n) end,
      CanCarryItem = function(_, src, item, n) return Items.fits(src, n) end,
    }
  `,
  codem: `
    exports['codem-inventory'] = {
      GetItemsTotalAmount = function(_, src, item) return Items.count(src, item) end,
      AddItem = function(_, src, item, n) return Items.add(src, item, n) end,
      RemoveItem = function(_, src, item, n) return Items.remove(src, item, n) end,
    }
  `,
  tgiann: `
    exports['tgiann-inventory'] = {
      GetItemCount = function(_, src, item) return Items.count(src, item) end,
      AddItem = function(_, src, item, n) return Items.add(src, item, n) end,
      RemoveItem = function(_, src, item, n) return Items.remove(src, item, n) end,
      CanCarryItem = function(_, src, item, n) return Items.fits(src, n) end,
    }
  `,
  core: `
    exports.core_inventory = {
      getItemCount = function(_, src, item) return Items.count(src, item) end,
      addItem = function(_, src, item, n) return Items.add(src, item, n) end,
      removeItem = function(_, src, item, n) return Items.remove(src, item, n) end,
      canCarry = function(_, src, item, n) return Items.fits(src, n) end,
    }
  `,
}

const frameworks = [
  { name: 'esx', running: ['es_extended'], mocks: ['esx'], id: 'char1:license:aa', bank: true },
  { name: 'qbx', running: ['qbx_core'], mocks: ['qbx'], id: 'ABC123', bank: true },
  { name: 'qb', running: ['qb-core'], mocks: ['qb'], id: 'ABC123', bank: true },
  { name: 'ox', running: ['ox_core', 'ox_inventory'], mocks: ['ox', 'ox_inventory'], id: '7', bank: false, money: 'items' },
  { name: 'nd', running: ['ND_Core'], mocks: ['nd'], id: '7', bank: true },
]

for (const fw of frameworks) {
  const lua = await boot({ side: 'server', running: fw.running, config: `Config.Bridge.Framework = '${fw.name}'` })
  await lua.doString(world + fw.mocks.map((m) => mocks[m]).join('\n'))
  const F = 'Bridge.Framework'
  const cash = fw.money === 'items' ? 'World[1].items.money' : 'World[1].cash'
  await expect(`${fw.name}: adapter resolved`, lua, `return ${F}.name`, fw.name)
  await expect(`${fw.name}: identifier`, lua, `return ${F}.GetIdentifier(1)`, fw.id)
  await expect(`${fw.name}: offline identifier is nil`, lua, `return ${F}.GetIdentifier(99) == nil`, true)
  await expect(`${fw.name}: source from identifier`, lua, `return ${F}.GetSource('${fw.id}')`, 1)
  await expect(`${fw.name}: unknown identifier has no source`, lua, `return ${F}.GetSource('nobody') == nil`, true)
  await expect(`${fw.name}: character name`, lua, `return ${F}.GetName(1)`, 'Ada Lovelace')
  await expect(`${fw.name}: offline name falls back`, lua, `return ${F}.GetName(99)`, 'Steam99')
  await expect(`${fw.name}: cash balance`, lua, `return ${F}.GetMoney(1, 'cash')`, 500)
  await expect(`${fw.name}: add cash`, lua, `return ${F}.AddMoney(1, 'cash', 100, 'test') and ${cash}`, 600)
  await expect(`${fw.name}: overdraw refused`, lua, `return ${F}.RemoveMoney(1, 'cash', 10000, 'test') == false and ${cash}`, 600)
  await expect(`${fw.name}: remove cash`, lua, `return ${F}.RemoveMoney(1, 'cash', 600, 'test') and ${cash}`, 0)
  await expect(`${fw.name}: offline money calls are safe`, lua, `return ${F}.GetMoney(99, 'cash') == 0 and ${F}.AddMoney(99, 'cash', 1) == false and ${F}.RemoveMoney(99, 'cash', 1) == false`, true)
  if (fw.bank) await expect(`${fw.name}: bank account`, lua, `return ${F}.RemoveMoney(1, 'bank', 250) and ${F}.GetMoney(1, 'bank')`, 750)
  else await expect(`${fw.name}: bank is unsupported`, lua, `return ${F}.GetMoney(1, 'bank') == 0 and ${F}.RemoveMoney(1, 'bank', 1) == false`, true)
  await expect(`${fw.name}: admin group`, lua, `return ${F}.HasGroup(1, 'admin')`, true)
  await expect(`${fw.name}: missing group`, lua, `return ${F}.HasGroup(1, 'god')`, false)
  await expect(`${fw.name}: car stored with a plate`, lua, `local plate = ${F}.GiveVehicle(1, { model = 'zentorno', garage = 'casino', props = {} }) return type(plate) == 'string' and #plate > 0`, true)
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: ['es_extended'], config: "Config.Bridge.Framework = 'esx'" })
  await lua.doString(world + mocks.esx)
  await lua.doString(`MySQL.scalar.await = function(q) Queries[#Queries + 1] = q if q:find('information_schema', 1, true) then return 1 end return nil end`)
  await expect('esx: car sets esx_garage parking when the column exists', lua, `Bridge.Framework.GiveVehicle(1, { model = 'zentorno', garage = 'casino' }) for _, q in ipairs(Queries) do if q:find('SET \`parking\`', 1, true) then return true end end return false`, true)
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: ['qbx_core'], config: "Config.Bridge.Framework = 'qbx'" })
  await lua.doString(world + mocks.qbx)
  await expect('qbx: car goes through qbx_vehicles with garage', lua, `Bridge.Framework.GiveVehicle(1, { model = 'zentorno', garage = 'casino' }) return Created.citizenid .. '/' .. Created.garage .. '/' .. Created.model`, 'ABC123/casino/zentorno')
  await lua.doString(`RUNNING = 'qbx_core'`)
  await expect('qbx: no qbx_vehicles gives no car', lua, `return Bridge.Framework.GiveVehicle(1, { model = 'zentorno' }) == nil`, true)
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [], config: "Config.Bridge.Framework = 'standalone'" })
  await lua.doString(world)
  await expect('standalone: license identifier', lua, 'return Bridge.Framework.GetIdentifier(1)', 'license:aa')
  await expect('standalone: source from license', lua, "return Bridge.Framework.GetSource('license:aa')", 1)
  await expect('standalone: no money system', lua, "return Bridge.Framework.GetMoney(1, 'cash') == 0 and Bridge.Framework.RemoveMoney(1, 'cash', 1) == false", true)
  await expect('standalone: ace group', lua, "return Bridge.Framework.HasGroup(1, 'admin')", true)
  lua.global.close()
}

const inventories = [
  { name: 'ox', running: ['ox_inventory'], mocks: ['ox_inventory'], carry: true },
  { name: 'esx', running: ['es_extended'], mocks: ['esx'], carry: true },
  { name: 'qb', running: ['qb-core'], mocks: ['qb'], carry: false },
  { name: 'qs', running: ['qs-inventory'], mocks: ['qs'], carry: true },
  { name: 'codem', running: ['codem-inventory'], mocks: ['codem'], carry: false },
  { name: 'tgiann', running: ['tgiann-inventory'], mocks: ['tgiann'], carry: true },
  { name: 'core', running: ['core_inventory'], mocks: ['core'], carry: true },
]

for (const inv of inventories) {
  const lua = await boot({ side: 'server', running: inv.running, config: `Config.Bridge.Inventory = '${inv.name}'` })
  await lua.doString(world + inv.mocks.map((m) => mocks[m]).join('\n'))
  const I = 'Bridge.Inventory'
  await expect(`${inv.name} inventory: resolved`, lua, `return ${I}.name`, inv.name)
  await expect(`${inv.name} inventory: count`, lua, `return ${I}.Count(1, 'casino_chips')`, 40)
  await expect(`${inv.name} inventory: missing item counts 0`, lua, `return ${I}.Count(1, 'nothing')`, 0)
  await expect(`${inv.name} inventory: add`, lua, `return ${I}.Add(1, 'casino_chips', 10) and ${I}.Count(1, 'casino_chips')`, 50)
  await expect(`${inv.name} inventory: full inventory refuses add`, lua, `return ${I}.Add(1, 'casino_chips', 1000) == false and ${I}.Count(1, 'casino_chips')`, 50)
  await expect(`${inv.name} inventory: overdraw refused`, lua, `return ${I}.Remove(1, 'casino_chips', 51) == false and ${I}.Count(1, 'casino_chips')`, 50)
  await expect(`${inv.name} inventory: remove`, lua, `return ${I}.Remove(1, 'casino_chips', 50) and ${I}.Count(1, 'casino_chips')`, 0)
  await expect(`${inv.name} inventory: can carry small`, lua, `return ${I}.CanCarry(1, 'casino_chips', 5)`, true)
  if (inv.carry) await expect(`${inv.name} inventory: cannot carry huge`, lua, `return ${I}.CanCarry(1, 'casino_chips', 5000)`, false)
  lua.global.close()
}

const server = ['server/core/rpc.lua', 'server/core/wallet.lua', 'server/cashier.lua']
const core = `
  Db = { Await = function() end }
  Banned = {}
  Players = { Source = function(id) return Bridge.Framework.GetSource(id) end, Id = function(src) return Bridge.Framework.GetIdentifier(src) end, Banned = function(src) return Banned[src] == true end }
  Pushed = {}
  Notified = {}
  Notify = function(src, text, kind) Notified[#Notified + 1] = text end
  TriggerClientEvent = function(name, src, ...) Pushed[#Pushed + 1] = { name, src, ... } end
  GetGameTimer = function() return Now or 0 end
  GetPlayerPed = function(src) return src end
  local cashier = Config.Locations.Cashiers[1]
  Where = { x = cashier.x, y = cashier.y, z = cashier.z }
  GetEntityCoords = function() return setmetatable(Where, { __sub = function(a, b) return setmetatable({ x = a.x - b.x, y = a.y - b.y, z = a.z - b.z }, { __len = function(v) return math.sqrt(v.x ^ 2 + v.y ^ 2 + v.z ^ 2) end }) end }) end
  Rpcs = {}
  Handlers = {}
  RegisterNetEvent = function(name, fn) Handlers[name] = fn end
  AddEventHandler = function(name, fn) Handlers[name] = Handlers[name] or fn end
`

const scenario = async (label, { framework, inventory, mode, running }, run) => {
  const config = `Config.Bridge.Framework = '${framework}' Config.Bridge.Inventory = '${inventory}' Config.Chips.Mode = '${mode}'`
  const lua = await boot({ side: 'server', running, config })
  const fwMock = framework === 'ox' ? ['ox', 'ox_inventory'] : [framework]
  const invMock = { ox: 'ox_inventory', esx: 'esx', qb: 'qb', none: null }[inventory]
  await lua.doString(world + [...new Set([...fwMock, invMock].filter(Boolean))].map((m) => mocks[m]).join('\n') + '\n' + core)
  for (const file of server) await lua.doString(readFileSync(join(root, file), 'utf8'))
  await lua.doString(`
    Call = function(name, src, ...)
      local out
      if not Frozen then Now = (Now or 0) + 1000000 end
      TriggerClientEvent = function(event, to, id, ok, ...) if event:find('rpc:res', 1, true) then out = { ok = ok, ... } end end
      source = src
      Handlers['casino:rpc:req'](name, 1, ...)
      return out
    end
  `)
  await run(lua, label)
  lua.global.close()
}

const cashierFlows = async (lua, label, { cash }) => {
  const rate = await lua.doString('return Config.Chips.Rate')
  await expect(`${label}: buy takes money and gives chips`, lua, `local r = Call('cashier:buy', 1, 5) return r.ok and r[1].ok and r[1].chips .. '/' .. ${cash}`, `45/${500 - 5 * rate}`)
  await expect(`${label}: sell gives money back`, lua, `local r = Call('cashier:sell', 1, 5) return r[1].ok and r[1].chips .. '/' .. ${cash}`, `40/500`)
  await expect(`${label}: buy without money refused`, lua, `local r = Call('cashier:buy', 1, 1000) return r[1].ok == false and r[1].chips .. '/' .. ${cash}`, '40/500')
  await expect(`${label}: sell more than owned refused`, lua, `local r = Call('cashier:sell', 1, 41) return r[1].ok == false and r[1].chips`, 40)
  await expect(`${label}: sell all`, lua, `local r = Call('cashier:sell', 1, 'all') return r[1].ok and r[1].chips .. '/' .. ${cash}`, `0/${500 + 40 * rate}`)
  await expect(`${label}: too far from a cashier`, lua, `Where.x = Where.x + 50 local r = Call('cashier:buy', 1, 1) Where.x = Where.x - 50 return r[1].ok`, false)
  await expect(`${label}: banned player refused`, lua, `Banned[1] = true local r = Call('cashier:buy', 1, 1) Banned[1] = nil return r[1].ok == false and r[1].message`, await lua.doString("return L('admin.banned_notice')"))
  await expect(`${label}: bad amounts refused`, lua, `for _, v in ipairs({ 0, -5, 1.5, 'abc' }) do local r = Call('cashier:buy', 1, v) if r[1].ok then return v end end return 'ok'`, 'ok')
  await expect(`${label}: offline player refused`, lua, `local r = Call('cashier:buy', 99, 1) return r[1].ok`, false)
}

for (const [framework, inventory, running] of [['esx', 'esx', ['es_extended']], ['qbx', 'ox', ['qbx_core', 'ox_inventory']], ['qb', 'qb', ['qb-core']], ['ox', 'ox', ['ox_core', 'ox_inventory']]]) {
  const label = `${framework}+${inventory} item mode`
  await scenario(label, { framework, inventory, mode: 'item', running }, async (lua) => {
    await lua.doString(`World[1].cash = 500 World[1].items.money = 500 Capacity = 10000`)
    const cash = framework === 'ox' ? 'World[1].items.money' : 'World[1].cash'
    await cashierFlows(lua, label, { cash })
    await expect(`${label}: full inventory refunds the money`, lua, `Capacity = 0 local r = Call('cashier:buy', 1, 1) Capacity = 10000 return r[1].ok == false and ${cash}`, 500 + 40 * (await lua.doString('return Config.Chips.Rate')))
  })
}

await scenario('qbx wallet mode', { framework: 'qbx', inventory: 'none', mode: 'wallet', running: ['qbx_core'] }, async (lua, label) => {
  await lua.doString(`
    Store = { ABC123 = 40 }
    MySQL.scalar.await = function(_, args) return Store[args[1]] end
    MySQL.prepare.await = function(_, args) Store[args[1]] = (Store[args[1]] or 0) + args[3] return 1 end
    MySQL.update.await = function(_, args) if (Store[args[2]] or 0) < args[3] then return 0 end Store[args[2]] = Store[args[2]] - args[1] return 1 end
    World[1].cash = 500
  `)
  await cashierFlows(lua, label, { cash: 'World[1].cash' })
  await expect(`${label}: database follows the balance`, lua, 'return Store.ABC123', 0)
  await expect(`${label}: lost database row refuses the remove`, lua, `Wallet.Add(1, 10) Store.ABC123 = 0 return Wallet.Remove(1, 5)`, false)
})

await scenario('esx cash mode', { framework: 'esx', inventory: 'none', mode: 'cash', running: ['es_extended'] }, async (lua, label) => {
  const rate = await lua.doString('return Config.Chips.Rate')
  await lua.doString(`World[1].cash = ${rate * 30 + 5}`)
  await expect(`${label}: chips are cash / rate, rounded down`, lua, 'return Wallet.Get(1)', 30)
  await expect(`${label}: no cashier in cash mode`, lua, "return Call('cashier:buy', 1, 1)[1].ok", false)
  await expect(`${label}: bet takes cash`, lua, `return Wallet.Remove(1, 10) and World[1].cash`, rate * 20 + 5)
  await expect(`${label}: overdraw refused`, lua, 'return Wallet.Remove(1, 21)', false)
  await expect(`${label}: win pays cash`, lua, `return Wallet.Add(1, 5) and World[1].cash`, rate * 25 + 5)
})

await scenario('owed chips', { framework: 'qbx', inventory: 'ox', mode: 'item', running: ['qbx_core', 'ox_inventory'] }, async (lua, label) => {
  await lua.doString(`
    Owed = {}
    MySQL.prepare.await = function(q, args) if q:find('owed', 1, true) then Owed[args[1]] = (Owed[args[1]] or 0) + args[3] end return 1 end
    MySQL.scalar.await = function(q, args) if q:find('owed', 1, true) then return Owed[args[1]] end end
    MySQL.update.await = function(q, args) if q:find('owed', 1, true) then if (Owed[args[2]] or 0) < args[3] then return 0 end Owed[args[2]] = Owed[args[2]] - args[1] return 1 end return 1 end
    Capacity = 1000
    Pool = { Add = function(n) PoolDelta = (PoolDelta or 0) + n end, Settle = function(id, game, bet, payout) Settled = { id, bet, payout } end, MaxBet = function(n) return n end }
    Settings = { Refuse = function() end }
    Broadcast = function() end
  `)
  await lua.doString(readFileSync(join(root, 'server/core/tablegame.lua'), 'utf8'))
  await lua.doString(`G = TableGame.New({ name = 'testgame', config = { Tables = { { coords = { xyz = { x = 0, y = 0, z = 0 } }, min = 1, max = 100 } }, IdleRounds = 3 }, public = function() return {} end })`)
  await expect(`${label}: online player is paid at once`, lua, "return Wallet.Give('ABC123', 5) and World[1].items.casino_chips", 45)
  await expect(`${label}: full inventory becomes owed`, lua, "Capacity = 0 local ok = Wallet.Give('ABC123', 7) Capacity = 1000 return ok == false and Owed.ABC123", 7)
  await expect(`${label}: offline player becomes owed`, lua, "local p = World[1] World[1] = nil local ok = Wallet.Give('ABC123', 3) World[1] = p return ok == false and Owed.ABC123", 10)
  await expect(`${label}: owed is logged`, lua, "for _, l in ipairs(printed) do if l:find('owed to ABC123', 1, true) then return true end end return false", true)
  await expect(`${label}: collect pays everything owed`, lua, "return Wallet.Collect(1) .. '/' .. World[1].items.casino_chips .. '/' .. Owed.ABC123", '10/55/0')
  await expect(`${label}: player is told`, lua, 'return Notified[#Notified]', await lua.doString("return L('wallet.owed_paid', { chips = Format.Chips(10) })"))
  await expect(`${label}: nothing owed collects nothing`, lua, 'return Wallet.Collect(1)', 0)
  await expect(`${label}: collect waits until it fits`, lua, "Owed.ABC123 = 20 Capacity = 60 local got = Wallet.Collect(1) Capacity = 1000 return got .. '/' .. Owed.ABC123", '0/20')
  await expect(`${label}: collect on load`, lua, "Handlers['casino:player:loaded'](1) return Owed.ABC123 .. '/' .. World[1].items.casino_chips", '0/75')
  await expect(`${label}: table win for a player who left is owed, not kept`, lua, "local p = World[1] World[1] = nil G.Settle('ABC123', 10, 30) World[1] = p return Settled[3] .. '/' .. Owed.ABC123", '30/30')
  await expect(`${label}: table refund for a player who left is owed`, lua, "local p = World[1] World[1] = nil PoolDelta = 0 local ok = G.Refund('ABC123', 15) World[1] = p return tostring(ok) .. '/' .. PoolDelta .. '/' .. Owed.ABC123", 'true/-15/45')
  await expect(`${label}: table win for an online player is paid`, lua, "local before = World[1].items.casino_chips G.Settle('ABC123', 10, 20) return World[1].items.casino_chips - before", 20)
})

await scenario('rpc layer', { framework: 'qbx', inventory: 'ox', mode: 'item', running: ['qbx_core', 'ox_inventory'] }, async (lua) => {
  await lua.doString(`
    Frozen = true
    Rpc.Register('test:boom', function() error('kaboom') end)
    Rpc.Register('test:echo', function(src, v) return v end, 3)
  `)
  await expect('rpc: unknown call answers false', lua, "return Call('nope', 1).ok", false)
  await expect('rpc: handler error answers false', lua, "return Call('test:boom', 1).ok", false)
  await expect('rpc: handler error is logged', lua, "for _, l in ipairs(printed) do if l:find('kaboom', 1, true) then return true end end return false", true)
  await expect('rpc: echo works', lua, "return Call('test:echo', 1, 'hi')[1]", 'hi')
  await expect('rpc: rate limit kicks in', lua, "Call('test:echo', 1, 1) Call('test:echo', 1, 1) return Call('test:echo', 1, 1).ok", false)
  await expect('rpc: limit is per player', lua, "return Call('test:echo', 2, 'x').ok", true)
  await expect('rpc: limit resets after the window', lua, "Now = Config.RateLimit.Window + 1 return Call('test:echo', 1, 'y')[1]", 'y')
  await expect('rpc: bad request ignored', lua, "local out = 'none' TriggerClientEvent = function() out = 'sent' end source = 1 Handlers['casino:rpc:req'](42, 'x') return out", 'none')
})

const clientWorld = `
  Sent = {}
  TriggerEvent = function(name, ...) Sent[#Sent + 1] = { name, ... } end
  LocalPlayer = { state = { set = function(self, k, v) self[k] = v end } }
  PlayerPedId = function() return 1 end
  IsEntityDead = function() return false end
  Inv = { { name = 'casino_chips', count = 30, amount = 30 }, { name = 'casino_chips', count = 12, amount = 12 }, { name = 'water', count = 2, amount = 2 } }
  local ESX = { ShowNotification = function(text, kind, ms) Sent[#Sent + 1] = { 'esx', text, kind, ms } end, GetPlayerData = function() return { inventory = { { name = 'casino_chips', count = 42 } } } end, IsPlayerLoaded = function() return true end }
  local QB = { Functions = { GetPlayerData = function() return { items = Inv, metadata = { isdead = false, inlaststand = true } } end } }
  exports = {
    es_extended = { getSharedObject = function() return ESX end },
    ['qb-core'] = { GetCoreObject = function() return QB end },
    qbx_core = { GetPlayerData = function() return { metadata = { isdead = true } } end },
    ox_inventory = { GetItemCount = function(_, item) return item == 'casino_chips' and 42 or 0 end },
    ['qs-inventory'] = { Search = function(_, item) return item == 'casino_chips' and 42 or 0 end },
    ['codem-inventory'] = { GetClientPlayerInventory = function() return Inv end },
    ['tgiann-inventory'] = { GetItemCount = function(_, item) return item == 'casino_chips' and 42 or 0 end },
    okokNotify = { Alert = function(_, title, text, ms, kind) Sent[#Sent + 1] = { 'okok', title, text, ms, kind } end },
  }
`

const notifies = [
  ['ox', 'ox_lib', "local e = Sent[#Sent] return e[1] .. '|' .. e[2].description .. '|' .. e[2].type .. '|' .. e[2].title", 'ox_lib:notify|Hello|inform|Casino'],
  ['esx', 'es_extended', "local e = Sent[#Sent] return e[1] .. '|' .. e[2] .. '|' .. e[3]", 'esx|Hello|info'],
  ['qb', 'qb-core', "local e = Sent[#Sent] return e[1] .. '|' .. e[2] .. '|' .. e[3]", 'QBCore:Notify|Hello|primary'],
  ['okok', 'okokNotify', "local e = Sent[#Sent] return e[1] .. '|' .. e[2] .. '|' .. e[3] .. '|' .. e[5]", 'okok|Casino|Hello|info'],
]
for (const [name, resource, check, want] of notifies) {
  const lua = await boot({ side: 'client', running: [resource], config: `Config.Bridge.Notify = '${name}'` })
  await lua.doString(clientWorld)
  await expect(`${name} notify: resolved`, lua, 'return Bridge.Notify.name', name)
  await expect(`${name} notify: sends text and kind`, lua, `Bridge.Notify.Send('Hello', 'info', 4000, 'Casino') ${check}`, want)
  await expect(`${name} notify: error kind maps`, lua, "Sent = {} Bridge.Notify.Send('Oops', 'error', 4000, 'Casino') local e = Sent[#Sent] for _, v in pairs(e[2] == nil and {} or (type(e[2]) == 'table' and e[2] or e)) do if v == 'error' then return true end end return false", true)
}

for (const [name, resource] of [['ox', 'ox_inventory'], ['esx', 'es_extended'], ['qb', 'qb-core'], ['qs', 'qs-inventory'], ['codem', 'codem-inventory'], ['tgiann', 'tgiann-inventory']]) {
  const lua = await boot({ side: 'client', running: [resource], config: `Config.Bridge.Inventory = '${name}'` })
  await lua.doString(clientWorld)
  await expect(`${name} client inventory: counts chips across stacks`, lua, "return Bridge.Inventory.Count('casino_chips')", 42)
  await expect(`${name} client inventory: busy flag does not throw`, lua, 'Bridge.Inventory.SetBusy(true) Bridge.Inventory.SetBusy(false) return true', true)
}

for (const [name, resource, setup, loaded, dead] of [
  ['qbx', 'qbx_core', 'LocalPlayer.state.isLoggedIn = true', true, true],
  ['qb', 'qb-core', 'LocalPlayer.state.isLoggedIn = true', true, true],
  ['esx', 'es_extended', '', true, false],
]) {
  const lua = await boot({ side: 'client', running: [resource], config: `Config.Bridge.Framework = '${name}'` })
  await lua.doString(clientWorld + setup)
  await expect(`${name} client: loaded`, lua, 'return Bridge.Framework.IsLoaded()', loaded)
  await expect(`${name} client: dead or downed`, lua, 'return Bridge.Framework.IsDead() and true or false', dead)
}

finish('adapter tests')
