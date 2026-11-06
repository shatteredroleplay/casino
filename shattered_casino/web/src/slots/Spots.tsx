import { type Accessor, batch, createEffect, createSignal, For, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { config, format, idOf, list, nameOf, randomGrid, reels, rows, type Step, stopAt, T, tr } from './config'
import Floats, { floating, type Floating } from './Float'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

// duck hunters 2 is 5 reels of 6
const H = 78
const W = 150
const GAP = 6
const WIDTH = reels * (W + GAP) - GAP
const wild = config.symbols.find(s => s.wild)?.id

type Gem = { cell: Accessor<string>; setCell: Setter<string>; reel: number; row: Accessor<number>; setRow: Setter<number>; state: Accessor<string>; setState: Setter<string> }

const gem = (id: string, reel: number, at: number): Gem => {
  const [cell, setCell] = createSignal(id)
  const [row, setRow] = createSignal(at)
  const [state, setState] = createSignal('')
  return { cell, setCell, reel, row, setRow, state, setState }
}

// a cell is reel * 10 + row, both counted from 1
const x = (key: number) => (Math.floor(key / 10) - 1) * (W + GAP)
const y = (key: number) => ((key % 10) - 1) * H
const at = (key: number) => `translate(${x(key)}px, ${y(key)}px)`
const mid = (key: number): [number, number] => [x(key) + W / 2, y(key) + H / 2]
const keyOf = (g: Gem) => (g.reel + 1) * 10 + g.row() + 1

// how hot a multiplier looks: the bigger, the brighter
const heat = (v: number) => (v >= 1024 ? 5 : v >= 64 ? 4 : v >= 16 ? 3 : v >= 4 ? 2 : 1)

// a stamp flying onto a cell: what it multiplies the cell by
type Stamp = { key: number; label: string; kind: string; wait: number }

// spots (andjakten, duck hunters 2): wins anywhere tumble away and leave a multiplier on every cell they leave, doubling each time.
// shots put multipliers on the board before the spin, xways turn into the symbol of the spin and multiply their cell (infectious
// ones every cell of that symbol), a molotov burns its reel upwards (and down, upgraded) and stacks x2, x4, x8 up it
export default function Spots(props: BoardProps) {
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  const [spots, setSpots] = createSignal<Record<number, number>>({})
  const [fresh, setFresh] = createSignal<number[]>([])
  const [stamps, setStamps] = createSignal<Stamp[]>([])
  const [aims, setAims] = createSignal<number[]>([])
  const [goo, setGoo] = createSignal<{ from: number; to: number }[]>([])
  const [fire, setFire] = createSignal<{ key: number; up: number; down: number }[]>([])
  const [floats, setFloats] = createSignal<Floating[]>([])
  const [banner, setBanner] = createSignal<{ label: string; amount?: number }>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [call, setCall] = createSignal<Call>()
  const fx = impacts()
  let board!: HTMLDivElement
  const shake = shaker(() => board)

  let timers: number[] = []
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
  const clear = () => {
    timers.forEach(clearTimeout)
    timers = []
  }
  onCleanup(clear)

  const land = (reel: number, delay: number) => later(delay, () => columns[reel].forEach((g, row) => g.setRow(row)))

  // new multipliers on the board: the ones that grew light up
  const place = (list_: { key: number; value: number }[] | undefined) => {
    const next = Object.fromEntries(list(list_).map(s => [s.key, s.value]))
    const before = spots()
    setFresh(Object.keys(next).map(Number).filter(k => next[k] !== before[k]))
    setSpots(next)
  }

  const stamp = (list_: Stamp[]) => {
    setStamps(list_)
    later(900, () => setStamps([]))
  }

  const drop = (grid: string[][], free: boolean, tease?: number) =>
    batch(() => {
      clear()
      setBanner()
      setFloats([])
      setGoo([])
      setFire([])
      setAims([])
      setCall()
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + rows + 1))
      columns = grid.map((column, r) => list(column).map((cell, row) => gem(cell, r, row - rows - 1)))
      setGems([...old, ...columns.flat()])
      later(400, () => setGems(columns.flat()))
      columns.forEach((_, r) => land(r, stopAt(r, free, tease) - 330))
    })

  const collapse = (d: NonNullable<Step['drops']>[number]) => {
    columns = columns.map((column, r) => {
      const out = new Set(list(d.gone[r]))
      const fill = list(d.fill[r])
      return [...fill.map((cell, i) => gem(cell, r, i - fill.length - 1)), ...column.filter((_, i) => !out.has(i + 1))]
    })
    setGems(columns.flat())
    columns.forEach((_, r) => land(r, 30))
  }

  // the crates of the spin burst into its symbol and stamp their multiplier on the cell, infectious ones spread to the
  // cells of that symbol after a beat. returns how long it took
  const turn = (found: NonNullable<Step['xways']> | undefined, reveal: string | undefined, then: { key: number; value: number }[] | undefined) => {
    if (!found || !reveal) return 0
    const own = list(found).filter(f => !f.infected)
    const infected = list(found).filter(f => f.infected)
    batch(() => {
      sfx.mult()
      props.say({ icon: reveal, text: `${tr('crates_turn', { symbol: nameOf(reveal) })} · ${own.map(f => `×${f.by}`).join(' ')}` })
      for (const g of columns.flat()) {
        if (own.some(f => f.key === keyOf(g))) {
          g.setCell(reveal)
          g.setState('burst')
        }
      }
      stamp(own.map((f, i) => ({ key: f.key, label: `×${f.by}`, kind: 'xways', wait: i * 80 })))
      own.forEach(f => fx.hit(...mid(f.key), { tone: '#ffc83d', bits: 'splinter' }))
      shake(7)
      if (!infected.length) place(then)
    })
    later(600, () => columns.flat().forEach(g => g.state() === 'burst' && g.setState('')))
    if (!infected.length) return 0
    // infectious: green streaks run from the crates to every cell of the symbol, each gets a multiplier of its own
    later(500, () =>
      batch(() => {
        sfx.duel()
        setGoo(infected.map((f, i) => ({ from: own[i % own.length].key, to: f.key })))
        props.say({ icon: reveal, text: tr('infection', { count: infected.length, symbol: nameOf(reveal) }) })
        columns.flat().forEach(g => infected.some(f => f.key === keyOf(g)) && g.setState('infect'))
        infected.forEach(f => fx.hit(...mid(f.key), { tone: '#5aff5a', bits: 'drop', size: 0.7 }))
      }),
    )
    later(500 + T.Infect - 300, () =>
      batch(() => {
        setGoo([])
        stamp(infected.map((f, i) => ({ key: f.key, label: `×${f.by}`, kind: 'infected', wait: i * 50 })))
        place(then)
        columns.flat().forEach(g => g.state() === 'infect' && g.setState(''))
      }),
    )
    return T.Infect
  }

  createEffect(on(() => props.demo, () => drop(randomGrid(), false), { defer: true }))

  createEffect(
    on(
      () => props.step,
      step => {
        if (!step) {
          clear()
          columns.flat().forEach(g => g.setState(''))
          setSpots({})
          setTeasing([])
          return setBanner()
        }
        drop(step.grid, !!step.free, step.tease)
        place(step.spots)
        let shown = step.total - step.win
        let t = stopAt(reels - 1, step.free, step.tease) + 100

        // a scatter rings higher for every one before it, one short of the free spins the rest take their time
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(cell => cell === 'scatter').length
          scatters += n
          const count = scatters
          later(stopAt(r, step.free, step.tease) - 300, () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        // the hunters take aim: a sight lands on every cell that gets a multiplier, then the shot rings out
        if (step.aim) {
          const aim = list(step.aim)
          const each = Math.min(220, (T.Aim - 500) / aim.length)
          aim.forEach((a, i) =>
            later(t + i * each, () =>
              batch(() => {
                sfx.duel()
                shake(9)
                fx.hit(...mid(a.key), { tone: '#ff8a2a', bits: 'feather', word: tr('bang') })
                setAims(v => [...v, a.key])
                props.say({ icon: 'shotgun', text: tr('shot', { mult: a.by }) })
                stamp([{ key: a.key, label: `×${a.by}`, kind: 'aim', wait: 0 }])
              }),
            ),
          )
          later(t + aim.length * each + 100, () => place(step.aimed))
          later(t + T.Aim - 100, () => setAims([]))
          t += T.Aim
        }

        // the crates rattle, then burst
        if (step.xways) {
          later(t - 100, () => columns.flat().forEach(g => idOf(g.cell()) === 'xways' && g.setState('shake')))
          later(t + T.Crate - 500, () => turn(step.xways, step.reveal, step.turned))
          t += T.Crate + (list(step.xways).some(f => f.infected) ? T.Infect : 0)
        }

        for (const [n, d] of list(step.drops).entries()) {
          const bombs = Array.isArray(d.bombs) ? d.bombs : undefined
          const symbols = new Set(list(d.wins).map(w => w.symbol))
          if (bombs) {
            // the molotovs: a flash, then fire runs up the reel (and down, upgraded) and the cells it burns stack their multipliers
            later(t, () =>
              batch(() => {
                sfx.duel()
                props.say({ icon: 'bomb', text: tr('molotov') })
                shake(16)
                bombs.forEach(key => fx.hit(...mid(key), { tone: '#ff6a1a', bits: 'spark', size: 1.4 }))
                const out = new Set(list(d.gone).flatMap((rows, r) => list(rows).map(row => (r + 1) * 10 + row)))
                setFire(
                  bombs.map(key => {
                    const r = Math.floor(key / 10)
                    let up = 0
                    let down = 0
                    while (out.has(key - up - 1) && (key - up - 1) % 10 > 0) up++
                    while (out.has(key + down + 1) && Math.floor((key + down + 1) / 10) === r) down++
                    return { key, up, down }
                  }),
                )
                columns.flat().forEach(g => g.setState(bombs.includes(keyOf(g)) ? 'boom' : out.has(keyOf(g)) ? 'burn' : ''))
                stamp(
                  [...out].map(key => {
                    const bomb = bombs.find(b => Math.floor(b / 10) === Math.floor(key / 10)) ?? key
                    return { key, label: `×${2 ** (Math.abs(bomb - key) + 1)}`, kind: 'fire', wait: Math.abs(bomb - key) * 120 }
                  }),
                )
              }),
            )
            later(t + T.Bomb, () => columns.flat().forEach(g => g.state() === 'burn' && g.setState('gone')))
            t += T.Bomb
          } else {
            later(t, () =>
              batch(() => {
                sfx.pop(n)
                columns.flat().forEach(g => g.setState(symbols.has(idOf(g.cell())) || (g.cell() === wild && symbols.size) ? 'hit' : 'dim'))
                const won = list(d.wins).reduce((sum, w) => sum + w.amount, 0)
                shown = Math.min(shown + won, step.total)
                props.show(shown)
                // a win on big multipliers gets the board to itself, the rest show what they paid over their symbols
                const mult = list(d.wins).reduce((m, w) => Math.max(m, w.mult ?? 0), 0)
                const best = list(d.wins).reduce((a, w) => (w.amount > a.amount ? w : a))
                props.say({ icon: best.symbol, text: `${best.count} × ${nameOf(best.symbol)}${best.mult ? ` · ${tr('multipliers', { mult: best.mult })}` : ''} · ${format(best.amount)}` })
                if (mult >= 4) setBanner({ label: `×${mult}`, amount: won })
                else
                  setFloats(
                    list(d.wins).map(w => {
                      const keys = list(w.keys)
                      return floating(keys.reduce((s, k) => s + x(k), 0) / keys.length + W / 2, keys.reduce((s, k) => s + y(k), 0) / keys.length + H / 2, w.amount)
                    }),
                  )
              }),
            )
            // what is hit is shot to pieces, feathers everywhere
            later(t + T.Tumble * 0.45, () =>
              columns.flat().forEach(g => {
                if (g.state() !== 'hit') return
                g.setState('gone')
                fx.hit(...mid(keyOf(g)), { tone: '#ff8a2a', bits: 'feather', size: 0.6 })
              }),
            )
          }
          later(t + T.Tumble * 0.6, () =>
            batch(() => {
              sfx.stop()
              setBanner()
              setFire([])
              columns.flat().forEach(g => g.setState(''))
              collapse(d)
              place(d.spots)
            }),
          )
          const extra = d.xways ? (list(d.xways).some(f => f.infected) ? T.Infect : 0) : 0
          if (d.xways) later(t + T.Tumble * 0.75, () => turn(d.xways, step.reveal, d.spots))
          t += T.Tumble + extra
        }
        later(t, () => props.show(step.total))

        // extra shots: the shells light up and the free spins get more
        if (step.more) {
          later(t, () =>
            batch(() => {
              sfx.bonus()
              columns.flat().forEach(g => g.setState(g.cell() === 'shot' ? 'hit' : 'dim'))
              setCall({ label: tr('extra_shot'), text: tr('extra_spins', { count: step.more }), tone: '#e8322f', icon: 'shot' })
              props.say({ icon: 'shot', text: `${tr('extra_shot_short')} · ${tr('extra_spins', { count: step.more })}` })
            }),
          )
          later(t + T.Win - 100, () =>
            batch(() => {
              setCall()
              columns.flat().forEach(g => g.setState(''))
            }),
          )
        }
      },
      { defer: true },
    ),
  )

  drop(randomGrid(), false)

  return (
    <div class="board tumble spots" ref={board} style={{ width: `${WIDTH}px`, height: `${rows * H}px` }}>
      <For each={teasing()}>{r => <div class="tease" style={{ width: `${W}px`, height: `${rows * H}px`, transform: `translateX(${r * (W + GAP)}px)` }} />}</For>
      <For each={Object.entries(spots())}>
        {([key, value]) => (
          <div class={`spot heat${heat(value)}`} classList={{ fresh: fresh().includes(Number(key)) }} style={{ width: `${W}px`, height: `${H}px`, transform: at(Number(key)) }}>
            <b>×{format(value)}</b>
          </div>
        )}
      </For>
      <For each={gems()}>
        {g => (
          <div class={`gem ${g.state()}`} style={{ width: `${W}px`, height: `${H}px`, transform: `translate(${g.reel * (W + GAP)}px, ${g.row() * H}px)` }}>
            <Cell cell={g.cell()} />
          </div>
        )}
      </For>
      <For each={fire()}>
        {f => (
          <div
            class="flames"
            style={{ left: `${x(f.key)}px`, top: `${y(f.key) - f.up * H}px`, width: `${W}px`, height: `${(f.up + f.down + 1) * H}px`, '--up': f.up / (f.up + f.down + 1) }}
          />
        )}
      </For>
      <svg class="goo" viewBox={`0 0 ${WIDTH} ${rows * H}`}>
        <For each={goo()}>{g => <path pathLength="1" d={`M${x(g.from) + W / 2} ${y(g.from) + H / 2}L${x(g.to) + W / 2} ${y(g.to) + H / 2}`} />}</For>
      </svg>
      <For each={aims()}>
        {key => (
          <div class="sight" style={{ width: `${W}px`, height: `${H}px`, transform: at(key) }}>
            <i />
          </div>
        )}
      </For>
      <For each={stamps()}>
        {s => (
          <b class={`stamp-cell ${s.kind}`} style={{ left: `${x(s.key) + W / 2}px`, top: `${y(s.key) + H / 2}px`, 'animation-delay': `${s.wait}ms` }}>
            {s.label}
          </b>
        )}
      </For>
      <Floats list={floats()} />
      <Impacts hits={fx.hits()} />
      <Callout call={call()} />
      <Show when={banner()}>
        {b => (
          <div class="pop">
            <span>{b().label}</span>
            <Show when={b().amount}>{amount => <b>{format(amount())}</b>}</Show>
          </div>
        )}
      </Show>
    </div>
  )
}
