import { type Accessor, batch, createEffect, createSignal, For, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { format, idOf, list, nameOf, randomGrid, reels, rows, type Step, T, teased, valueOf, tr } from './config'
import Floats, { floating, type Floating } from './Float'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

const H = 94
const W = 128
const GAP = 6
const WIDTH = reels * (W + GAP) - GAP

type Gem = { cell: string; reel: number; row: Accessor<number>; setRow: Setter<number>; state: Accessor<string>; setState: Setter<string> }

const gem = (cell: string, reel: number, at: number): Gem => {
  const [row, setRow] = createSignal(at)
  const [state, setState] = createSignal('')
  return { cell, reel, row, setRow, state, setState }
}

// the colour of an orb by what it is worth, like the orbs zeus throws: green, blue, purple, then red and gold
const tierOf = (cell: string) => {
  if (idOf(cell) !== 'orb') return ''
  const v = valueOf(cell)
  return `orb${v >= 100 ? 4 : v >= 25 ? 3 : v >= 10 ? 2 : 1}`
}

// the colour of an orb's lightning by its tier
const tones: Record<string, string> = { orb1: '#5aff8a', orb2: '#5ab0ff', orb3: '#c86aff', orb4: '#ffc83d' }

// a bolt of lightning from the sky above the board down to x, y: a jagged line that wanders less the closer it gets
const zigzag = (x: number, y: number) => {
  const points = [[x + (Math.random() - 0.5) * 160, -80]]
  for (let i = 1; i < 9; i++) {
    const p = i / 9
    points.push([x + (points[0][0] - x) * (1 - p) + (Math.random() - 0.5) * 70 * (1 - p), -80 + (y + 80) * p])
  }
  points.push([x, y])
  return points.map(p => p.join(',')).join(' ')
}

// tumble (olympen): wins anywhere on the board go and the rest falls, the orbs left at the end fly into the win and multiply it
export default function Tumble(props: BoardProps) {
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  const [banner, setBanner] = createSignal<{ label: string; amount: number }>()
  // the orbs on their way to the middle of the board, and the multiplier they add up to so far
  const [flying, setFlying] = createSignal(false)
  const [sum, setSum] = createSignal<number>()
  // what the tumbles of the spin have won so far, shown under the board while they go on
  const [tumbled, setTumbled] = createSignal<number>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [floats, setFloats] = createSignal<Floating[]>([])
  const [bolts, setBolts] = createSignal<{ points: string; tone: string }[]>([])
  const [call, setCall] = createSignal<Call>()
  const fx = impacts()
  let board!: HTMLDivElement
  const shake = shaker(() => board)
  const mid = (g: Gem): [number, number] => [g.reel * (W + GAP) + W / 2, g.row() * H + H / 2]

  // zeus throws his lightning at every orb that lands: a bolt out of the sky, a crack and sparks in the orb's colour
  const strike = (orbs: Gem[]) => {
    if (!orbs.length) return
    sfx.duel()
    orbs.forEach(g => g.setState('strike'))
    setBolts(orbs.map(g => ({ points: zigzag(...mid(g)), tone: tones[tierOf(g.cell)] })))
    orbs.forEach(g => fx.hit(...mid(g), { tone: tones[tierOf(g.cell)], bits: 'spark' }))
    shake(8 + orbs.length * 2)
    later(450, () => setBolts([]))
    later(650, () => orbs.forEach(g => g.state() === 'strike' && g.setState('')))
  }
  const orbsOf = (list_: Gem[]) => list_.filter(g => idOf(g.cell) === 'orb')

  let timers: number[] = []
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
  const clear = () => {
    timers.forEach(clearTimeout)
    timers = []
  }
  onCleanup(clear)

  const land = (reel: number, delay = 0) => later(delay + 30, () => columns[reel].forEach((g, row) => g.setRow(row)))

  const rest = () => {
    setBanner()
    setFlying(false)
    setSum()
    setTumbled()
    setFloats([])
    setBolts([])
    setCall()
  }

  const drop = (grid: string[][], gap: number, tease?: number) =>
    batch(() => {
      clear()
      rest()
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + rows + 1))
      columns = grid.map((column, r) => list(column).map((cell, row) => gem(cell, r, row - rows - 1)))
      setGems([...old, ...columns.flat()])
      later(400, () => setGems(columns.flat()))
      columns.forEach((_, r) => land(r, 120 + r * gap + teased(r, tease)))
    })

  const collapse = (d: NonNullable<Step['drops']>[number]) => {
    columns = columns.map((column, r) => {
      const out = new Set(list(d.gone[r]))
      const fill = list(d.fill[r])
      return [...fill.map((cell, i) => gem(cell, r, i - fill.length - 1)), ...column.filter((_, i) => !out.has(i + 1))]
    })
    setGems(columns.flat())
    columns.forEach((_, r) => land(r))
  }

  createEffect(on(() => props.demo, () => drop(randomGrid(), T.Gap), { defer: true }))

  createEffect(
    on(
      () => props.step,
      step => {
        if (!step) {
          clear()
          columns.flat().forEach(g => g.setState(''))
          setTeasing([])
          return rest()
        }
        const gap = step.free ? T.FreeGap : T.Gap
        drop(step.grid, gap, step.tease)
        let shown = step.total - step.win
        let t = (step.free ? T.FreeFirst : T.First) + (reels - 1) * gap + teased(reels - 1, step.tease) + 100

        // a scatter rings higher for every one before it
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(cell => cell === 'scatter').length
          scatters += n
          const count = scatters
          later(450 + r * gap + teased(r, step.tease), () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        later(t - 150, () => strike(orbsOf(columns.flat())))

        let won = 0
        for (const [n, d] of list(step.drops).entries()) {
          const symbols = new Set(list(d.wins).map(w => w.symbol))
          later(t, () =>
            batch(() => {
              sfx.pop(n)
              columns.flat().forEach(g => g.setState(symbols.has(idOf(g.cell)) ? 'hit' : 'dim'))
              won += list(d.wins).reduce((sum, w) => sum + w.amount, 0)
              shown = Math.min(step.total - step.win + won, step.total)
              props.show(shown)
              setTumbled(won)
              const best = list(d.wins).reduce((a, w) => (w.amount > a.amount ? w : a))
              props.say({ icon: best.symbol, text: `${best.count} × ${nameOf(best.symbol)} · ${format(best.amount)}${d.wins!.length > 1 ? ` · ${tr('more', { count: d.wins!.length - 1 })}` : ''}` })
              // every win shows what it paid over the middle of its symbols
              setFloats(
                list(d.wins).map(w => {
                  const mine = columns.flat().filter(g => g.cell === w.symbol)
                  return floating(mine.reduce((s, g) => s + g.reel * (W + GAP), 0) / mine.length + W / 2, mine.reduce((s, g) => s + g.row() * H, 0) / mine.length + H / 2, w.amount)
                }),
              )
            }),
          )
          // the winning gems shatter
          later(t + T.Tumble * 0.45, () =>
            columns.flat().forEach(g => {
              if (g.state() !== 'hit') return
              g.setState('gone')
              fx.hit(...mid(g), { tone: '#b06aff', bits: 'shard', size: 0.6 })
            }),
          )
          later(t + T.Tumble * 0.6, () =>
            batch(() => {
              sfx.stop()
              columns.flat().forEach(g => g.setState(''))
              const before = new Set(columns.flat())
              collapse(d)
              later(380, () => strike(orbsOf(columns.flat().filter(g => !before.has(g)))))
            }),
          )
          t += T.Tumble
        }

        // the orbs light up one by one, fly into the middle and multiply what the tumbles won
        if (step.mult) {
          // the orbs that are on the board once the tumbles are over, some of them fell in on the way
          later(t, () => {
            const orbs = columns.flat().filter(g => idOf(g.cell) === 'orb')
            const own = orbs.reduce((sum, g) => sum + valueOf(g.cell), 0)
            const before = (step.mult ?? 0) - own
            batch(() => {
              columns.flat().forEach(g => g.setState(idOf(g.cell) === 'orb' ? 'hit' : 'dim'))
              setSum(before > 0 ? before : undefined)
            })
            const each = Math.min(300, (T.Orbs - 900) / Math.max(orbs.length, 1))
            orbs.forEach((g, i) =>
              timers.push(
                setTimeout(() =>
                  batch(() => {
                    sfx.mult()
                    fx.hit(...mid(g), { tone: tones[tierOf(g.cell)], bits: 'spark', size: 0.8 })
                    g.setState('gone')
                    setFlying(true)
                    setSum(s => (s ?? 0) + valueOf(g.cell))
                  }),
                  200 + i * each,
                ),
              ),
            )
          })
          later(t + T.Orbs - 650, () =>
            batch(() => {
              sfx.win(step.win / props.bet)
              shake(16)
              setBolts([{ points: zigzag(WIDTH / 2, (rows * H) / 2), tone: '#ffc83d' }])
              later(450, () => setBolts([]))
              setBanner({ label: `${format(won)} × ${step.mult}`, amount: step.win - (step.scatter ?? 0) })
              props.say({ icon: 'orb', text: tr('orb_multiplies', { mult: step.mult }) })
              props.show(step.total)
            }),
          )
          t += T.Orbs
        } else if (step.scatter) {
          later(t, () => props.show(step.total))
        }
      },
      { defer: true },
    ),
  )

  drop(randomGrid(), 0)

  return (
    <div class="board tumble" ref={board} style={{ width: `${WIDTH}px`, height: `${rows * H}px` }}>
      <For each={teasing()}>{r => <div class="tease" style={{ width: `${W}px`, height: `${rows * H}px`, transform: `translateX(${r * (W + GAP)}px)` }} />}</For>
      <For each={gems()}>
        {g => (
          <div class={`gem ${g.state()} ${tierOf(g.cell)}`} style={{ width: `${W}px`, height: `${H}px`, transform: `translate(${g.reel * (W + GAP)}px, ${g.row() * H}px)` }}>
            <Cell cell={g.cell} />
            <Show when={idOf(g.cell) === 'orb'}>
              <b class="value orb">×{valueOf(g.cell)}</b>
            </Show>
          </div>
        )}
      </For>
      <Floats list={floats()} />
      <svg class="zeus" viewBox={`0 0 ${WIDTH} ${rows * H}`}>
        <For each={bolts()}>
          {b => (
            <>
              <polyline class="glow" points={b.points} style={{ stroke: b.tone }} />
              <polyline points={b.points} />
            </>
          )}
        </For>
      </svg>
      <Impacts hits={fx.hits()} />
      <Callout call={call()} />
      <Show when={sum()}>
        <div class="total" classList={{ flying: flying() }}>
          <svg viewBox="0 0 100 100">
            <use href="#s-orb" />
          </svg>
          <b>×{sum()}</b>
        </div>
      </Show>
      <Show when={tumbled() && !banner()}>
        <div class="tumbled">
          <span>{tr('tumble_win')}</span>
          <b>{format(tumbled()!)}</b>
        </div>
      </Show>
      <Show when={banner()}>
        {b => (
          <div class="pop">
            <span>{b().label}</span>
            <b>{format(b().amount)}</b>
          </div>
        )}
      </Show>
    </div>
  )
}
