import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LuaFactory } from 'wasmoon'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')))
const spins = Number(args.spins ?? 200000)
const only = args.game
const tolerance = Number(args.tolerance ?? 1.5)
const bet = Number(args.bet ?? 10)
const modes = args.mode ? args.mode.split(',') : null

const lua = await new LuaFactory().createEngine()
await lua.doString(`
  vec2 = function(x, y) return { x = x, y = y } end
  vec3 = function(x, y, z) return { x = x, y = y, z = z } end
  vec4 = function(x, y, z, w) return { x = x, y = y, z = z, w = w } end
  Config = {}
`)
await lua.doString(readFileSync(join(root, 'config/games/slots.lua'), 'utf8'))
await lua.doString(readFileSync(join(root, 'shared/engine/slots.lua'), 'utf8'))
await lua.doString(`
  math.randomseed(os.time())
  simulate = function(id, n, bet, mode, kind)
    local g = Config.Slots.Games[id]
    local cost = Slots.Cost(g, bet, mode, kind)
    local paid, hits, best = 0, 0, 0
    for _ = 1, n do
      local res = Slots.Spin(g, bet, mode, kind)
      paid = paid + res.payout
      if res.payout > 0 then hits = hits + 1 end
      if res.payout / bet > best then best = res.payout / bet end
    end
    return { paid / (cost * n) * 100, hits / n * 100, best }
  end
  list = function()
    local out = {}
    for _, id in ipairs(Config.Slots.Order) do
      local g = Config.Slots.Games[id]
      local kinds = { { 'base' } , { 'ante', 'ante' }, { 'buy', 'buy' } }
      for _, m in ipairs(g.modes or {}) do
        if m.buy then kinds[#kinds + 1] = { 'buy:' .. m.id, 'buy', m.id } end
      end
      for _, k in ipairs(kinds) do out[#out + 1] = { id, g.rtp, k[1], k[2] or false, k[3] or false } end
    end
    return out
  end
`)

const rows = lua.global.get('list')()
const simulate = lua.global.get('simulate')
let off = 0
console.log(`${spins.toLocaleString('en')} spins per row · bet ${bet} · tolerance ±${tolerance}%`)
console.log('game'.padEnd(10), 'mode'.padEnd(16), 'target'.padStart(7), 'rtp'.padStart(8), 'hit'.padStart(7), 'best'.padStart(8))
for (const [id, target, label, mode, kind] of rows) {
  if (only && only !== id) continue
  if (modes && !modes.some((m) => label === m || label.startsWith(m + ':'))) continue
  const n = label === 'base' || label === 'ante' ? spins : Math.max(2000, Math.floor(spins / 50))
  const started = Date.now()
  const [rtp, hit, best] = simulate(id, n, bet, mode || undefined, kind || undefined)
  const bad = Math.abs(rtp - target) > tolerance * (n < spins ? 3 : 1)
  if (bad) off++
  console.log(
    `${bad ? '\x1b[33m' : ''}${id.padEnd(10)} ${label.padEnd(16)} ${String(target).padStart(6)}% ${rtp.toFixed(2).padStart(7)}% ${hit.toFixed(1).padStart(6)}% ${String(Math.round(best)).padStart(7)}x\x1b[0m`,
    `(${n.toLocaleString('en')} in ${((Date.now() - started) / 1000).toFixed(1)}s)`,
  )
}
lua.global.close()
console.log(off ? `\x1b[33m${off} rows outside tolerance (bonus buys use fewer spins and vary more)\x1b[0m` : '\x1b[32mall rows within tolerance\x1b[0m')
