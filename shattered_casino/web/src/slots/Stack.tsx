import { type Accessor, batch, createEffect, createSignal, For, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { format, idOf, list, nameOf, randomGrid, reels, rows, type Step, stopAt, T, valueOf, tr } from './config'
import Floats, { floating, type Floating } from './Float'
import { Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

const BH = 470
const W = 150
const GAP = 8
const tiles = new Set(['stack', 'reveal'])

// row: where the gem starts on its reel in units from the top, size: how many units it holds
type Gem = {
  cell: Accessor<string>
  setCell: Setter<string>
  reel: number
  row: Accessor<number>
  setRow: Setter<number>
  size: Accessor<number>
  setSize: Setter<number>
  state: Accessor<string>
  setState: Setter<string>
}

const gem = (id: string, reel: number, at: number): Gem => {
  const [cell, setCell] = createSignal(id)
  const [row, setRow] = createSignal(at)
  const [size, setSize] = createSignal(1)
  const [state, setState] = createSignal('')
  return { cell, setCell, reel, row, setRow, size, setSize, state, setState }
}

// stack (ronin): five reels of four that the stackways make taller, up to ten. the symbols shrink to fit and the ways count up
export default function Stack(props: BoardProps) {
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  const [cells, setCells] = createSignal<number[]>(Array(reels).fill(rows))
  const [floats, setFloats] = createSignal<Floating[]>([])
  const [banner, setBanner] = createSignal<{ label: string; amount: number }>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [grown, setGrown] = createSignal<number[]>([])
  // the stackways cut open with a katana: where each tile was and what it was
  const [cuts, setCuts] = createSignal<{ left: number; top: number; height: number; id: string }[]>([])
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

  const unit = (reel: number) => BH / Math.max(cells()[reel] ?? rows, 1)
  const ways = () => cells().reduce((n, c) => n * c, 1)

  const layout = (reel: number) => {
    let at = 0
    for (const g of columns[reel]) {
      g.setRow(at)
      at += g.size()
    }
    setCells(c => c.map((n, r) => (r === reel ? at : n)))
  }

  const drop = (grid: string[][], free: boolean, tease?: number) =>
    batch(() => {
      clear()
      setBanner()
      setFloats([])
      setGrown([])
      setCuts([])
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + 12))
      columns = grid.map((column, r) => list(column).map((cell, row) => gem(cell, r, row - rows - 1)))
      setCells(Array(reels).fill(rows))
      setGems([...old, ...columns.flat()])
      later(400, () => setGems(columns.flat()))
      columns.forEach((_, r) => later(stopAt(r, free, tease) - 330, () => layout(r)))
    })

  createEffect(on(() => props.demo, () => drop(randomGrid(), false), { defer: true }))

  createEffect(
    on(
      () => props.step,
      step => {
        if (!step) {
          clear()
          columns.flat().forEach(g => g.setState(''))
          setTeasing([])
          setGrown([])
          return setBanner()
        }
        drop(step.grid, !!step.free, step.tease)
        let t = stopAt(reels - 1, step.free, step.tease) + 100

        // every reel thuds down, a scatter rings higher for every one before it, and one short of the free spins the rest take their time
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(c => c === 'scatter').length
          const tile = list(step.grid[r]).some(c => tiles.has(idOf(c)))
          scatters += n
          const count = scatters
          later(stopAt(r, step.free, step.tease) - 300, () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            if (tile) sfx.pop(1)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        // the stackways glow, then open into their symbol and push the reel taller, cutting what does not fit
        const after = step.after && list(step.after)
        if (after) {
          later(t, () => columns.flat().forEach(g => tiles.has(idOf(g.cell())) && g.setState('shake')))
          // a blade flashes across every tile and cuts it in two, petals flying
          later(t + 1000, () => {
            const opened = columns.flat().filter(g => tiles.has(idOf(g.cell())))
            setCuts(opened.map(g => ({ left: g.reel * (W + GAP), top: g.row() * unit(g.reel), height: g.size() * unit(g.reel), id: idOf(g.cell()) })))
            opened.forEach(g => fx.hit(g.reel * (W + GAP) + W / 2, (g.row() + 0.5) * unit(g.reel), { tone: '#e8322f', bits: 'petal', size: 1.2 }))
            shake(12)
          })
          later(t + 1900, () => setCuts([]))
          later(t + 1000, () =>
            batch(() => {
              sfx.duel()
              props.say({ icon: step.reveal, text: `${tr('stacks_turn', { symbol: nameOf(step.reveal!) })} · ${tr('ways', { count: format(ways()) })}` })
              const opened: number[] = []
              columns = columns.map((column, r) => {
                const next = list(after[r])
                const tile = column.find(g => tiles.has(idOf(g.cell())))
                if (!tile) return column
                opened.push(r)
                // the cells cut are the ones missing from the ends of the reel: what is left is the run of cells that matches
                const at = column.indexOf(tile)
                const top = Array.from({ length: column.length - next.length + 1 }, (_, i) => i).find(i => next.every((c, j) => i + j === at || c === column[i + j].cell())) ?? 0
                const kept = column.slice(top, top + next.length)
                column.forEach(g => !kept.includes(g) && g.setState('gone'))
                tile.setCell(next[at - top])
                tile.setSize(valueOf(next[at - top]) || 1)
                tile.setState('burst')
                return kept
              })
              setGrown(opened)
              later(300, () => setGems(columns.flat()))
              opened.forEach(r => layout(r))
            }),
          )
          later(t + T.Stack - 200, () => columns.flat().forEach(g => g.state() === 'burst' && g.setState('')))
          t += T.Stack
        }

        // every win lights up the symbols it is made of, from the left over the reels it reaches, and shows what it paid
        const wins = list(step.wins)
        if (wins.length) {
          later(t, () =>
            batch(() => {
              const hit = new Set<Gem>()
              const out: Floating[] = []
              for (const w of wins) {
                const mine = columns.slice(0, w.count).flat().filter(g => idOf(g.cell()) === w.symbol)
                mine.forEach(g => hit.add(g))
                const first = mine[0]
                if (first) out.push(floating(first.reel * (W + GAP) + W / 2, (first.row() + first.size() / 2) * unit(first.reel), w.amount))
              }
              columns.flat().forEach(g => g.setState(hit.has(g) ? 'hit' : 'dim'))
              sfx.win(step.win / props.bet)
              props.show(step.total)
              // a big one gets the board to itself, the rest show what each symbol paid where it starts
              if (step.win >= props.bet * 5) setBanner({ label: tr('ways', { count: format(ways()) }), amount: step.win })
              else setFloats(out)
              // the bar under the board goes through the wins one by one
              wins.forEach((w, i) =>
                later(i * 1700, () => props.say({ icon: w.symbol, text: `${tr('reels_of', { count: w.count, symbol: nameOf(w.symbol!) })} · ${tr('ways', { count: format(w.ways ?? 1) })} · ${format(w.amount)}` })),
              )
            }),
          )
        }
      },
      { defer: true },
    ),
  )

  drop(randomGrid(), false)

  return (
    <div class="board stackways" ref={board} style={{ width: `${reels * (W + GAP) - GAP}px`, height: `${BH}px` }}>
      <For each={Array.from({ length: reels }, (_, r) => r)}>
        {r => <div class="lane" classList={{ teasing: teasing().includes(r), grown: grown().includes(r) }} style={{ left: `${r * (W + GAP)}px`, top: '0px', width: `${W}px`, height: `${BH}px` }} />}
      </For>
      <For each={gems()}>
        {g => (
          <div
            class={`gem ${g.state()}`}
            style={{
              width: `${W}px`,
              height: `${g.size() * unit(g.reel)}px`,
              transform: `translate(${g.reel * (W + GAP)}px, ${g.row() * unit(g.reel)}px)`,
            }}
          >
            <Cell cell={g.cell()} />
          </div>
        )}
      </For>
      <For each={cuts()}>
        {c => (
          <div class="cut" style={{ left: `${c.left}px`, top: `${c.top}px`, width: `${W}px`, height: `${c.height}px` }}>
            <svg class="half left" viewBox="0 0 100 100">
              <use href={`#s-${c.id}`} />
            </svg>
            <svg class="half right" viewBox="0 0 100 100">
              <use href={`#s-${c.id}`} />
            </svg>
            <i class="blade" />
          </div>
        )}
      </For>
      <Floats list={floats()} />
      <Impacts hits={fx.hits()} />
      <div class="ways-count corner">
        <b>{format(ways())}</b>
        <span>{tr('ways_label')}</span>
      </div>
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
