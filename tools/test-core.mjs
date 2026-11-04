import { boot, expect, finish } from './harness.mjs'

{
  const lua = await boot({ side: 'server', running: ['qbx_core', 'qb-core', 'ox_inventory', 'ox_target'] })
  await expect('qbx wins over qb-core', lua, 'return Bridge.Framework.name', 'qbx')
  await expect('ox_inventory picked', lua, 'return Bridge.Inventory.name', 'ox')
  await expect('keys default none', lua, 'return Bridge.Keys.name', 'none')
  await expect('summary printed', lua, 'return Bridge.Summary', 'framework: qbx · inventory: ox · logs: none · society: none · vehiclekeys: none')
  await expect('number grouping', lua, 'return Format.Number(1234567)', '1,234,567')
  await expect('negative money', lua, 'return Format.Money(-2500)', '-$2,500')
  await expect('small number', lua, 'return Format.Number(999)', '999')
  await expect('chips text', lua, 'return Format.Chips(5000)', '5,000 chips')
  await expect('missing key returns key', lua, "return L('nope.key')", 'nope.key')
  await expect('vars keep unknown placeholder', lua, "return L('input.range', { min = 1 })", '1 – {max}')
  await expect('plate shape', lua, "return (Bridge.Plate(function() return false end)):match('^%u%u%u %d%d%d%d$') ~= nil", true)
  await expect('plate gives up when all taken', lua, 'return Bridge.Plate(function() return true end) == nil', true)
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: ['es_extended', 'esx_addonaccount'], config: "Config.Bridge.Society = 'esx'" })
  await expect('esx framework', lua, 'return Bridge.Framework.name', 'esx')
  await expect('esx inventory fallback', lua, 'return Bridge.Inventory.name', 'esx')
  await expect('esx society', lua, 'return Bridge.Society.name', 'esx')
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: ['shattered', 'inv'] })
  await expect('shattered framework', lua, 'return Bridge.Framework.name', 'shattered')
  await expect('shattered inventory', lua, 'return Bridge.Inventory.name', 'shattered')
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [] })
  await expect('nothing running: standalone', lua, 'return Bridge.Framework.name', 'standalone')
  await expect('nothing running: no inventory', lua, 'return Bridge.Inventory.name', 'none')
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [], config: "Config.Bridge.Framework = 'typo'" })
  await expect('unknown adapter is a stub', lua, 'return Bridge.Framework.broken', true)
  await expect('stub call does not throw', lua, 'return Bridge.Framework.GetIdentifier(1) == nil', true)
  await expect('error was printed', lua, "for _, l in ipairs(printed) do if l:find('does not exist', 1, true) then return true end end return false", true)
  lua.global.close()
}

{
  const lua = await boot({ side: 'client', running: ['qb-core', 'qb-target'] })
  await expect('client qb framework', lua, 'return Bridge.Framework.name', 'qb')
  await expect('client qb inventory', lua, 'return Bridge.Inventory.name', 'qb')
  await expect('client qb-target', lua, 'return Bridge.Target.name', 'qb')
  await expect('client builtin notify', lua, 'return Bridge.Notify.name', 'builtin')
  lua.global.close()
}

{
  const lua = await boot({ side: 'client', running: ['ND_Core'] })
  await expect('client nd framework', lua, 'return Bridge.Framework.name', 'nd')
  await expect('no target resource: builtin', lua, 'return Bridge.Target.name', 'builtin')
  lua.global.close()
}

{
  const lua = await boot({ side: 'client', running: [], locale: 'sv', config: "Config.Currency = { Symbol = 'kr', Position = 'after', Space = true, Thousands = ' ' }" })
  await expect('swedish locale', lua, "return L('common.cancel')", 'Avbryt')
  await expect('swedish chips', lua, 'return Format.Chips(12500)', '12 500 marker')
  await expect('money after', lua, 'return Format.Money(-1500)', '-1 500 kr')
  lua.global.close()
}

{
  const lua = await boot({ side: 'client', running: [], locale: 'xx' })
  await expect('unknown locale falls back to English', lua, "return L('common.cancel')", 'Cancel')
  lua.global.close()
}


{
  const lua = await boot({ side: 'server', running: [], extra: ['server/core/rig.lua'] })
  await lua.doString(`
    MySQL = { prepare = function() end, update = function() end, query = { await = function() return {} end } }
    Db = { Await = function() end }
    Players = { Source = function(id) return id == 'abc' and 1 or nil end, Name = function() return 'Tester' end, Online = function() return {} end }
    Audit = { Record = function() end }
    Pool = { Balance = function() return 1000 end }
    admin = { id = 'console', name = 'Console' }
  `)
  await expect('rig needs a game', lua, "return Rig.Set(admin, nil, 'win', 100, {})", 'Pick at least one game')
  await expect('global win on slots', lua, "Rig.Set(admin, nil, 'win', 100, { 'slots' }) return Rig.Want(nil, 'slots')", 1)
  await expect('game filter respected', lua, "return Rig.Want(nil, 'roulette')", 0)
  await expect('unknown offline player refused', lua, "return Rig.Set(admin, 'nobody', 'lose', 100, { 'slots' })", 'That player is no longer online')
  await expect('player rig beats global', lua, "Rig.Set(admin, 'abc', 'lose', 100, { 'slots' }, { limit = 100 }) return Rig.Want('abc', 'slots')", -1)
  await expect('limit ends player rig', lua, "Rig.Track('abc', 150, 0) return Rig.Want('abc', 'slots')", 1)
  await expect('ended rig is in the feed', lua, "local f = Rig.FeedSince(0) return f[#f].text", 'rig on Tester (1) ended (limit reached)')
  await expect('global net tracked', lua, 'return Rig.State().global.net', -150)
  await expect('pick finds a matching outcome', lua, "local n = 0 return Rig.Pick('slots', { abc = 1 }, -5, function() n = n + 1 return n end, function(c) return { abc = c } end)", 1)
  await expect('pick keeps first when it matches', lua, "return Rig.Pick('slots', { abc = 1 }, 7, function() return 1 end, function(c) return { abc = c } end)", 7)
  await expect('pick respects valid()', lua, "local n = 0 return Rig.Pick('slots', { abc = 1 }, -5, function() n = n + 1 return n end, function(c) return { abc = c } end, function(c) return c ~= 1 end)", 2)
  await expect('expiry ends global rig', lua, "Rig.Set(admin, nil, 'win', 100, { 'slots' }, { minutes = 1 }) local t = os.time os.time = function() return t() + 120 end local w = Rig.Want(nil, 'slots') os.time = t return w", 0)
  await expect('clear removes everything', lua, "Rig.Set(admin, nil, 'lose', 100, { 'slots', 'roulette' }) Rig.Clear(admin) return Rig.Want('abc', 'roulette')", 0)
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [], extra: ['shared/engine/cards.lua', 'shared/engine/roulette.lua'] })
  await expect('soft ace counts 11', lua, "return Cards.Value({ 'spd_ace', 'hrt_king' })", 21)
  await expect('two aces and nine', lua, "return Cards.Value({ 'spd_ace', 'hrt_ace', 'club_09' })", 21)
  await expect('aces drop to 1 when bust', lua, "return Cards.Value({ 'spd_ace', 'hrt_king', 'club_queen' })", 21)
  await expect('blackjack detected', lua, "return Cards.IsBlackjack({ 'spd_ace', 'hrt_jack' })", true)
  await expect('three card 21 is no blackjack', lua, "return Cards.IsBlackjack({ 'spd_07', 'hrt_07', 'club_07' })", false)
  await expect('blackjack pays 3:2', lua, "return Cards.Payout({ cards = { 'spd_ace', 'hrt_king' }, bet = 100 }, { 'club_10', 'dia_queen' })", 250)
  await expect('blackjack vs blackjack pushes', lua, "return Cards.Payout({ cards = { 'spd_ace', 'hrt_king' }, bet = 100 }, { 'club_ace', 'dia_queen' })", 100)
  await expect('split 21 is not blackjack', lua, "return Cards.Payout({ cards = { 'spd_ace', 'hrt_king' }, bet = 100 }, { 'club_10', 'dia_queen' }, true)", 200)
  await expect('bust loses even if dealer busts', lua, "return Cards.Payout({ cards = { 'spd_10', 'hrt_king', 'club_05' }, bet = 100 }, { 'club_10', 'dia_06', 'hrt_09' })", 0)
  await expect('dealer bust pays 1:1', lua, "return Cards.Payout({ cards = { 'spd_10', 'hrt_02' }, bet = 100 }, { 'club_10', 'dia_06', 'hrt_09' })", 200)
  await expect('equal totals push', lua, "return Cards.Payout({ cards = { 'spd_10', 'hrt_08' }, bet = 100 }, { 'club_10', 'dia_08' })", 100)
  await expect('dealer blackjack beats 21', lua, "return Cards.Payout({ cards = { 'spd_07', 'hrt_07', 'club_07' }, bet = 100 }, { 'club_ace', 'dia_king' })", 0)

  await expect('straight flush kind', lua, "return select(2, Cards.Poker({ 'hrt_09', 'hrt_10', 'hrt_jack', 'hrt_queen', 'hrt_king', 'spd_02', 'club_03' }))", 8)
  await expect('wheel straight', lua, "return select(2, Cards.Poker({ 'hrt_ace', 'spd_02', 'club_03', 'dia_04', 'hrt_05', 'spd_09', 'club_king' }))", 4)
  await expect('full house beats flush', lua, "return Cards.Poker({ 'hrt_09', 'spd_09', 'club_09', 'dia_04', 'hrt_04' }) > Cards.Poker({ 'hrt_02', 'hrt_05', 'hrt_07', 'hrt_09', 'hrt_jack' })", true)
  await expect('kicker decides two pair', lua, "return Cards.Poker({ 'hrt_09', 'spd_09', 'club_04', 'dia_04', 'hrt_ace' }) > Cards.Poker({ 'club_09', 'dia_09', 'hrt_04', 'spd_04', 'club_king' })", true)
  await expect('same hand same score', lua, "return Cards.Poker({ 'hrt_09', 'spd_09', 'club_04', 'dia_02', 'hrt_ace' }) == Cards.Poker({ 'club_09', 'dia_09', 'hrt_04', 'spd_02', 'club_ace' })", true)
  await expect('hand name localized', lua, 'return Cards.HandName(6)', 'Full house')

  await expect('baccarat points mod 10', lua, "return Cards.Points({ 'spd_09', 'hrt_08' })", 7)
  await expect('pictures count zero', lua, "return Cards.Points({ 'spd_king', 'hrt_ace' })", 1)
  await expect('natural stops the deal', lua, "local p, b = Cards.Baccarat({ 'x_02', 'x_03', 'club_02', 'dia_king', 'club_06', 'hrt_09' }) return #p + #b", 4)
  await expect('player draws on 5 or less', lua, "local p = Cards.Baccarat({ 'hrt_04', 'dia_02', 'club_02', 'spd_03', 'club_03' }) return #p", 3)
  await expect('bank on 6 stands against third 2', lua, "local p, b = Cards.Baccarat({ 'club_02', 'dia_06', 'hrt_king', 'club_queen', 'spd_04' }) return #b", 2)

  await expect('red pays even money', lua, "return Roulette.Payout('red', 100, '1')", 200)
  await expect('00 straight pays 35:1', lua, "return Roulette.Payout('00', 10, '00')", 360)
  await expect('odd loses on 00', lua, "return Roulette.Payout('odd', 100, '00')", 0)
  await expect('column 3 loses on 0', lua, "return Roulette.Payout('col3', 100, '0')", 0)
  await expect('dozen pays 2:1', lua, "return Roulette.Payout('dozen2', 100, '24')", 300)
  await expect('number max bet', lua, "return Roulette.MaxBet('17', 3500)", 100)
  await expect('bet label localized', lua, "return Roulette.Label('dozen1') .. ' / ' .. Roulette.Label('00')", '1st dozen (1 – 12) / Number 00')
  await expect('every bet has a label', lua, "for _, b in ipairs(Roulette.Order) do if Roulette.Label(b):find('roulette.', 1, true) then return b end end return 'ok'", 'ok')
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [], extra: ['config/games/slots.lua', 'shared/engine/slots.lua', 'shared/engine/slots_text.lua'] })
  await expect('slot title localized', lua, "return Slots.Text('ubaten').label", 'U-Boat')
  await expect('slot mode localized', lua, "return Slots.Text('ubaten').modes[1].label", 'Silent Hunt')
  await expect('no trademark names in slot texts', lua, `
    local bad = { 'xways', 'xnudge', 'xbomb', 'stackways', 'featurespin', 'throwdown' }
    local check = function(s) s = (s or ''):lower() for _, w in ipairs(bad) do if s:find(w, 1, true) then return false end end return true end
    for _, id in ipairs(Config.Slots.Order) do
      local t = Slots.Text(id)
      if not check(t.label) or not check(t.tag) or not check(t.bonus) then return id end
      for _, list in ipairs({ t.modes or {}, t.wheel or {}, t.upgrades or {} }) do
        for _, m in ipairs(list) do if not check(m.label) or not check(m.text) then return id .. ':' .. m.id end end
      end
    end
    return 'ok'`, 'ok')
  await expect('every slot text is translated', lua, `
    for _, id in ipairs(Config.Slots.Order) do
      local t = Slots.Text(id)
      for _, s in ipairs({ t.label, t.tag, t.bonus }) do if s:find('^slots%.') then return s end end
      for _, list in ipairs({ t.modes or {}, t.wheel or {}, t.upgrades or {} }) do
        for _, m in ipairs(list) do if m.label:find('^slots%.') or m.text:find('^slots%.') then return m.label end end
      end
    end
    return 'ok'`, 'ok')
  await expect('ante costs more than a plain spin', lua, "local g = Config.Slots.Games.holmgang return Slots.Cost(g, 10, 'ante') > Slots.Cost(g, 10)", true)
  await expect('every game spins every way without errors', lua, `
    math.randomseed(7)
    for _, id in ipairs(Config.Slots.Order) do
      local g = Config.Slots.Games[id]
      local kinds = { { nil, nil }, { 'ante', nil }, { 'buy', nil } }
      for _, m in ipairs(g.modes or {}) do if m.buy then kinds[#kinds + 1] = { 'buy', m.id } end end
      for _, k in ipairs(kinds) do
        for _ = 1, 40 do
          local ok, res = pcall(Slots.Spin, g, 10, k[1], k[2])
          if not ok then return id .. ' ' .. tostring(k[1]) .. ' ' .. tostring(k[2]) .. ': ' .. tostring(res) end
          if res.payout < 0 or res.payout > 10 * Config.Slots.MaxWin or not res.time or res.time <= 0 then return id .. ' bad result' end
        end
      end
    end
    return 'ok'`, 'ok')
  lua.global.close()
}

{
  const lua = await boot({ side: 'server', running: [], extra: ['config/games/track.lua', 'config/games/wheel.lua', 'shared/engine/track.lua', 'shared/engine/wheel.lua'] })
  await expect('40 horse names', lua, 'return #Track.Names', 40)
  await expect('english horse name', lua, 'return Track.Name(1)', 'North Wind')
  await expect('unknown horse falls back', lua, 'return Track.Name(99)', 'Horse 99')
  await expect('odds label with dot', lua, 'return Track.OddsLabel(2.5)', '3.50')
  await expect('track payout', lua, 'return Track.Payout(100, 2.5)', 350)
  await expect('track max bet by odds', lua, 'return Track.MaxBet(4, 5000)', 1250)
  await expect('chips prize label', lua, 'return Wheel.Label(Config.Wheel.Prizes[1])', '50 chips')
  await expect('money prize label', lua, 'return Wheel.Label(Config.Wheel.Prizes[4])', '$1,000')
  await expect('item prize label', lua, 'return Wheel.Label(Config.Wheel.Prizes[2])', '1× gold_ring')
  await expect('car prize label', lua, 'return Wheel.Label(Config.Wheel.Prizes[13]) == Config.Wheel.Car.Label', true)
  await expect('old 200-chip label bug is gone', lua, 'return Wheel.Label(Config.Wheel.Prizes[11])', '100 chips')
  lua.global.close()
}

{
  const lua = await boot({ side: 'client', running: [], locale: 'sv', config: "Config.Currency = { Symbol = 'kr', Position = 'after', Space = true, Thousands = ' ' }", extra: ['shared/engine/track.lua'] })
  await expect('swedish horse names', lua, 'return Track.Name(1)', 'Nordanvind')
  await expect('odds label with comma', lua, 'return Track.OddsLabel(2.5)', '3,50')
  lua.global.close()
}

finish('core tests')
