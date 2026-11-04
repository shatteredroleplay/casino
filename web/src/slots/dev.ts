// npm run dev: the game runs in the browser the way the server and client/slots.lua run it in game,
// with config.lua and shared/slots.lua in a lua vm. ?game=fyllekak picks the game, ?view=plate shows the name plate
import { LuaFactory } from 'wasmoon'
import wasm from 'wasmoon/dist/glue.wasm?url'
import configLua from '../../../config/games/slots.lua?raw'
import slotsLua from '../../../shared/engine/slots.lua?raw'
import textLua from '../../../shared/engine/slots_text.lua?raw'
import en from '../../../locales/en.json'

const locales = import.meta.glob('../../../locales/*.json', { eager: true, import: 'default' }) as Record<string, Record<string, string>>

const lua = await new LuaFactory(wasm).createEngine()
await lua.doString(`
vec2 = function(x, y) return { x = x, y = y } end
vec3 = function(x, y, z) return { x = x, y = y, z = z } end
vec4 = function(x, y, z, w) return { x = x, y = y, z = z, w = w } end
vector3 = vec3
json = {}
json.encode = function(v)
    local t = type(v)
    if t == 'table' then
        local out = {}
        if #v > 0 or next(v) == nil then
            for i, x in ipairs(v) do out[i] = json.encode(x) end
            return '[' .. table.concat(out, ',') .. ']'
        end
        for k, x in pairs(v) do
            if type(x) ~= 'function' then out[#out + 1] = json.encode(tostring(k)) .. ':' .. json.encode(x) end
        end
        return '{' .. table.concat(out, ',') .. '}'
    end
    if t == 'string' then return '"' .. v:gsub('[%c"\\\\]', function(c) return ('\\\\u%04x'):format(c:byte()) end) .. '"' end
    if t == 'number' and v ~= v then return 'null' end
    return v == nil and 'null' or tostring(v)
end
`)
const query = new URLSearchParams(location.search)
const lang = query.get('lang') ?? 'en'
const shot = query.has('shot')
const merged = { ...(en as Record<string, string>), ...(locales[`../../../locales/${lang}.json`] ?? {}) }
const strings = Object.entries(merged).map(([k, v]) => `[${JSON.stringify(k)}] = ${JSON.stringify(v)}`).join(',\n')
await lua.doString(`
Config = {}
Locale = { Strings = { ${strings} } }
L = function(key, vars)
    local text = Locale.Strings[key] or key
    if vars then text = text:gsub('{([%w_]+)}', function(n) return vars[n] ~= nil and tostring(vars[n]) or nil end) end
    return text
end
`)
await lua.doString(configLua)
await lua.doString(slotsLua)
await lua.doString(textLua)

const games: string[] = JSON.parse(await lua.doString(`local ids = {} for id in pairs(Config.Slots.Games) do ids[#ids + 1] = id end table.sort(ids) return json.encode(ids)`))
const any = query.get('game') === 'any'
const game = any ? 'holmgang' : games.includes(query.get('game')!) ? query.get('game')! : 'fyllekak'
const view = query.get('view') ?? 'screen'

// what client/slots.lua puts in the url
const raw = await lua.doString(`
local id, Cfg = '${game}', Config.Slots
local g, text, symbols = Cfg.Games[id], Slots.Text(id), {}
local strings = {}
for key, value in pairs(Locale.Strings) do
    if key:sub(1, 9) == 'slots.ui.' or key:sub(1, 10) == 'slots.sym.' then strings[key] = value end
end
local bonus = {}
for k, v in pairs(g.bonus) do bonus[k] = v end
bonus.name = text.bonus
for i, s in ipairs(g.symbols) do
    symbols[i] = { id = s.id, pays = s.pays, wild = s.wild, scatter = s.scatter, valued = s.valued, reels = s.reels, coin = s.coin }
end
return json.encode({
    id = id, view = '${view}', kind = g.kind, label = text.label, tag = text.tag, reels = g.reels, rows = g.rows, lines = g.lines,
    symbols = symbols, bonus = bonus, wheel = text.wheel, shape = g.shape, modes = text.modes, time = Cfg.Time, max = Cfg.MaxWin,
    spots = g.spots, maxLabel = text.max, most = g.most, upgrades = text.upgrades, t = strings, sep = ',',
})`)
const built = JSON.parse(raw)
built.idle = lang
if (any) {
  const count: number = await lua.doString('return #Config.Slots.Order')
  Object.assign(built, { id: 'any', label: merged['slots.ui.any_title'], tag: merged['slots.ui.any_tag'].replace('{count}', String(count)) })
}
const data = JSON.stringify(built)
history.replaceState(null, '', `${location.pathname}?${query}#${encodeURIComponent(data)}`)

const config = JSON.parse(data)
// what client/slots.lua puts in the game menu
const lobby = JSON.parse(await lua.doString(`
local out = {}
for i, id in ipairs(Config.Slots.Order) do
    local g, text = Config.Slots.Games[id], Slots.Text(id)
    out[i] = { id = id, label = text.label, tag = text.tag, rtp = g.rtp, bonus = text.bonus }
end
return json.encode(out)`))
const bets: number[] = JSON.parse(await lua.doString('return json.encode(Config.Slots.Bets)'))
let bet = bets[bets.length - 1]
let ante = false
let chips = 1_000_000

const post = (msg: object) => window.postMessage(msg, '*')
const seat = () => post({ type: 'seat', seated: true, bet, ante })
const cost = (mode: string | null, kind: string | null) =>
  lua.doString(`return Slots.Cost(Config.Slots.Games['${game}'], ${bet}, ${mode ? `'${mode}'` : 'nil'}, ${kind ? `'${kind}'` : 'nil'})`) as Promise<number>

const spin = async (mode: string | null, kind: string | null = null) => {
  const res = JSON.parse(await lua.doString(`return json.encode(Slots.Spin(Config.Slots.Games['${game}'], ${bet}, ${mode ? `'${mode}'` : 'nil'}, ${kind ? `'${kind}'` : 'nil'}))`))
  chips += res.payout - res.cost
  post({ ...res, type: 'spin', volume: 1 })
  // the screen takes the cost off when the round starts and shows the payout when it ends
  setTimeout(() => post({ type: 'chips', chips }), res.time + 50)
  console.log(`${config.label}: cost ${res.cost}, paid ${res.payout} over ${res.steps.length} steps`, res)
}

const el = (tag: string, props: Record<string, unknown> = {}, ...children: (Node | string)[]): any => {
  const e = Object.assign(document.createElement(tag), props)
  e.append(...children)
  return e
}

const panel = el('div', { id: 'dev' })
panel.style.cssText =
  'position:fixed;left:0;right:0;bottom:0;z-index:99;display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:8px;background:#111d;font:13px sans-serif;color:#fff'
document.body.style.overflow = 'auto'

const pickGame = el('select', { onchange: () => (location.href = `?game=${pickGame.value}&view=${view}`) }, ...games.map(id => el('option', { value: id, selected: id === game }, id)))
const pickBet = el('select', { onchange: () => ((bet = Number(pickBet.value)), seat(), refresh()) }, ...bets.map(b => el('option', { value: String(b), selected: b === bet }, `bet ${b}`)))
const anteBox = el('input', { type: 'checkbox', onchange: () => ((ante = anteBox.checked), seat()) })
const buys = el('span')

// every kind of free spins can be bought here, also the ones the machine does not sell
const refresh = async () => {
  const kinds: { id: string | null; label: string }[] = [{ id: null, label: 'free spins' }, ...(config.modes ?? []).map((m: { id: string; label: string }) => m)]
  buys.replaceChildren(
    ...(await Promise.all(
      kinds.map(async k => el('button', { onclick: () => spin('buy', k.id) }, `buy ${k.label} (${await cost('buy', k.id)})`)),
    )),
  )
}

panel.append(
  pickGame,
  el('select', { onchange: (e: Event) => (location.href = `?game=${game}&view=${(e.target as HTMLSelectElement).value}`) }, ...['screen', 'plate'].map(v => el('option', { value: v, selected: v === view }, v))),
  pickBet,
  el('button', { onclick: () => spin(ante ? 'ante' : null) }, 'spin (space)'),
  el('label', {}, anteBox, ' bonus hunt'),
  buys,
  el('span', { style: 'opacity:.6' }, 'arrows + E: map'),
)
refresh()

addEventListener('keydown', e => {
  if (e.target instanceof HTMLSelectElement) return
  const move: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }
  if (e.code === 'Space') spin(ante ? 'ante' : null)
  else if (move[e.key]) post({ type: 'pick', dx: move[e.key][0], dy: move[e.key][1] })
  else if (e.key === 'e') post({ type: 'pick', open: true })
  else return
  e.preventDefault()
})

// a tap in the game menu or the buy menu, answered the way client/slots.lua answers it
const kinds = () => [{ id: null as string | null, label: config.modes?.[0]?.label ?? 'Free spins', text: '' }, ...(config.modes ?? []).filter((m: { buy?: number }) => m.buy)]
;(window as any).slotsAction = async (action: string, value: any) => {
  if (action === 'buyMenu') post({ type: 'buy', index: 1, options: await Promise.all(kinds().map(async k => ({ label: k.label, text: k.text, cost: await cost('buy', k.id) }))) })
  else if (action === 'buy') post({ type: 'buy' }), spin('buy', kinds()[value - 1]?.id ?? null)
  else if (action === 'gamesMenu') post({ type: 'games', index: lobby.findIndex((o: { id: string }) => o.id === game) + 1, options: lobby })
  else if (action === 'game') location.href = `?game=${value}&view=${view}`
  else if (action === 'close') post({ type: 'games' })
}

// from the console: spins until a step of a round passes test and plays that step on its own, find(null, null, s => !!s.duels)
;(window as any).find = async (mode: string | null, kind: string | null, test: (s: any) => boolean, tries = 3000) => {
  for (let i = 0; i < tries; i++) {
    const res = JSON.parse(await lua.doString(`return json.encode(Slots.Spin(Config.Slots.Games['${game}'], ${bet}, ${mode ? `'${mode}'` : 'nil'}, ${kind ? `'${kind}'` : 'nil'}))`))
    const step = res.steps.find(test)
    if (!step) continue
    post({ ...res, type: 'spin', volume: 1, steps: [{ ...step, last: false, trigger: undefined, extra: undefined }], time: step.time })
    return step
  }
}

// the screen is there once app.tsx has rendered
setTimeout(() => {
  if (shot) return
  document.body.append(panel)
  seat()
  post({ type: 'chips', chips })
}, 300)
