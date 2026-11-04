import { type Accessor, batch, createEffect, createSignal, For, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { config, format, list, nameOf, randomCell, reels, rows, type Step, stopAt, T, tr } from './config'
import Floats, { floating, type Floating } from './Float'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

const W = 114
const H = 136
const GAP = 6
const wild = config.symbols.find(s => s.wild)?.id
const paying = config.symbols.filter(s => s.pays && !s.wild)

type Gem = { cell: string; reel: number; row: Accessor<number>; setRow: Setter<number>; state: Accessor<string>; setState: Setter<string> }

const gem = (cell: string, reel: number, at: number): Gem => {
  const [row, setRow] = createSignal(at)
  const [state, setState] = createSignal('')
  return { cell, reel, row, setRow, state, setState }
}

// the wins on the board, ways from the left: every symbol that reaches 3 reels, how far, and the reels of the run
const evaluate = (grid: string[][]) =>
  paying.flatMap(s => {
    let length = 0
    for (const column of grid) {
      if (!column.some(c => c === s.id || c === wild)) break
      length++
    }
    return s.pays?.[length - 3] ? [{ symbol: s.id, count: length }] : []
  })

// infinity (gruvan): the mine starts three reels deep, a win that reaches the last reel digs the next one open, dynamite blasts
// one open anyway. the board grows to the right and stays centred, in the free spins the multiplier climbs with every reel
export default function Infinity(props: BoardProps) {
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  const [count, setCount] = createSignal(reels)
  const [mult, setMult] = createSignal<number>()
  const [floats, setFloats] = createSignal<Floating[]>([])
  const [banner, setBanner] = createSignal<{ label: string; amount?: number }>()
  const [dug, setDug] = createSignal<number>()
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
  const grid = () => columns.map(c => c.map(g => g.cell))

  // the cells of every win that reaches the last reel light up, the rest go dark
  const light = (wins: { symbol?: string; count: number }[]) => {
    columns.forEach((column, r) => column.forEach(g => g.setState(wins.some(w => r < w.count && (g.cell === w.symbol || g.cell === wild)) ? 'hit' : 'dim')))
  }

  const drop = (start: string[][], free: boolean, tease?: number) =>
    batch(() => {
      clear()
      setBanner()
      setFloats([])
      setDug()
      setCall()
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + rows + 1))
      columns = start.map((column, r) => list(column).map((cell, row) => gem(cell, r, row - rows - 1)))
      setCount(columns.length)
      setGems([...old, ...columns.flat()])
      later(400, () => setGems(columns.flat()))
      // a free spin deeper in the mine than the reels it starts with: the reels past them land right after
      columns.forEach((_, r) => land(r, stopAt(Math.min(r, reels - 1), free, tease) + Math.max(r - reels + 1, 0) * 60 - 330))
    })

  createEffect(
    on(
      () => props.demo,
      () => drop(Array.from({ length: reels }, () => Array.from({ length: rows }, randomCell)), false),
      { defer: true },
    ),
  )

  createEffect(
    on(
      () => props.step,
      step => {
        if (!step) {
          clear()
          columns.flat().forEach(g => g.setState(''))
          setTeasing([])
          setMult()
          return setBanner()
        }
        drop(step.grid, !!step.free, step.tease)
        setMult(step.free ? step.bank : undefined)
        let t = stopAt(reels - 1, step.free, step.tease) + Math.max(list(step.grid).length - reels, 0) * 60 + 100

        let scatters = 0
        list(step.grid).forEach((column, r) => {
          const n = list(column).filter(c => c === 'scatter').length
          scatters += n
          const seen = scatters
          later(stopAt(Math.min(r, reels - 1), step.free, step.tease) - 300, () => {
            sfx.stop()
            if (n) sfx.scatter?.(seen)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        })

        // every dig: the win that reaches the end lights up (or the dynamite goes off), the rock gives and a new reel drops in
        for (const [i, d] of list(step.digs).entries()) {
          const r = list(step.grid).length + i
          later(t, () =>
            batch(() => {
              if (d.why === 'blast') {
                sfx.duel()
                shake(20)
                columns.flat().forEach(g => g.setState(g.cell === 'dynamite' ? 'boom' : 'dim'))
                // the dynamite goes up in a fireball and throws rock all over
                columns
                  .flat()
                  .filter(g => g.cell === 'dynamite')
                  .forEach(g => {
                    fx.hit(g.reel * (W + GAP) + W / 2, g.row() * H + H / 2, { tone: '#ff5a1a', bits: 'rock', size: 1.5 })
                    fx.hit(g.reel * (W + GAP) + W / 2, g.row() * H + H / 2, { tone: '#ffc83d', bits: 'spark', size: 1.1 })
                  })
                props.say({ icon: 'dynamite', text: `${tr('dynamite', { n: r + 1 })}${step.free ? ` · ×${d.mult}` : ''}` })
              } else {
                sfx.pop(columns.length - 3)
                const reaching = evaluate(grid()).filter(w => w.count === columns.length)
                light(reaching)
                props.say({ icon: reaching[0]?.symbol, text: `${tr('dig', { reach: columns.length, n: r + 1 })}${step.free ? ` · ×${d.mult}` : ''}` })
              }
            }),
          )
          later(t + T.Dig * 0.35, () =>
            batch(() => {
              columns.flat().forEach(g => g.setState(''))
              columns.push(list(d.column).map((cell, row) => gem(cell, r, row - rows - 1)))
              setCount(columns.length)
              setDug(r)
              setGems(columns.flat())
              sfx.stop()
              // the rock face of the new reel caves in
              shake(9)
              for (let row = 0; row < rows; row++) fx.hit(r * (W + GAP) + W / 2, row * H + H / 2, { tone: '#c87a2a', bits: 'rock', size: 0.9 })
              if (step.free) {
                sfx.mult()
                setMult(d.mult)
              }
            }),
          )
          land(r, t + T.Dig * 0.5)
          t += T.Dig
        }
        if (step.deeper) {
          later(t, () =>
            batch(() => {
              sfx.mult()
              setMult(step.x)
              setCall({ label: tr('mother_lode'), text: `+1× · ${tr('now', { mult: step.x })}`, tone: '#ffb81f', icon: 'cart' })
            }),
          )
          later(t + T.Win - 150, () => setCall())
          t += T.Win
        }

        // what the mine pays when the digging stops
        const wins = list(step.wins)
        if (wins.length) {
          later(t, () =>
            batch(() => {
              light(wins)
              setDug()
              sfx.win(step.win / props.bet)
              props.show(step.total)
              wins.forEach((w, i) =>
                later(i * 1700, () => props.say({ icon: w.symbol, text: `${tr('reels_of', { count: w.count, symbol: nameOf(w.symbol!) })} · ${tr('ways', { count: format(w.ways ?? 1) })}${(step.x ?? 1) > 1 ? ` · ×${step.x}` : ''} · ${format(w.amount)}` })),
              )
              // a big one or a multiplied one gets the board to itself, the rest show what they paid over their run
              if ((step.x ?? 1) > 1 || step.win >= props.bet * 10) setBanner({ label: (step.x ?? 1) > 1 ? `×${step.x}` : tr('reels_deep', { count: columns.length }), amount: step.win })
              else setFloats(wins.map((w, i) => floating((w.count * (W + GAP)) / 2, H * (0.6 + i * 0.9), w.amount)).slice(0, 3))
            }),
          )
        }
      },
      { defer: true },
    ),
  )

  drop(Array.from({ length: reels }, () => Array.from({ length: rows }, randomCell)), false)

  return (
    <div class="board infinity" ref={board} style={{ width: `${count() * (W + GAP) - GAP}px`, height: `${rows * H}px` }}>
      <For each={Array.from({ length: count() }, (_, r) => r)}>
        {r => (
          <div class="lane" classList={{ teasing: teasing().includes(r), dug: dug() === r }} style={{ left: `${r * (W + GAP)}px`, top: '0px', width: `${W}px`, height: `${rows * H}px` }} />
        )}
      </For>
      <For each={gems()}>
        {g => (
          <div class={`gem ${g.state()}`} style={{ width: `${W}px`, height: `${H}px`, transform: `translate(${g.reel * (W + GAP)}px, ${g.row() * H}px)` }}>
            <Cell cell={g.cell} />
          </div>
        )}
      </For>
      <Floats list={floats()} />
      <Impacts hits={fx.hits()} />
      <Callout call={call()} />
      <div class="ways-count corner">
        <b>{count()}</b>
        <span>{tr('reels_deep_label')}</span>
      </div>
      <Show when={mult()}>
        <div class="meter mine">
          <svg viewBox="0 0 100 100">
            <use href="#s-dynamite" />
          </svg>
          <b>×{mult()}</b>
        </div>
      </Show>
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
