import { batch, createEffect, createMemo, createSignal, For, Index, on, onCleanup, Show } from 'solid-js'
import { config, format, idOf, list, nameOf, type Note, randomGrid, reels, rows, type Step, stopAt, T, tr } from './config'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import Reel from './Reel'
import { sfx } from './sound'

export type BoardProps = { step?: Step; demo: number; bet: number; show: (total: number) => void; say: (note?: Note) => void }

const H = Math.floor(470 / rows)
const W = rows > 3 ? 150 : 180
const GAP = rows > 3 ? 8 : 12

type Win = NonNullable<Step['wins']>[number]

// the colour of the game's calls and hits
const tone = ({ holmgang: '#e0341f', vildmark: '#2ab89a', farao: '#e8a23a' } as Record<string, string>)[config.id] ?? '#ffd23d'

// the bear's claws tearing across the board: where each scratch starts
const claws = [0, 1, 2].map(i => ({ left: 22 + i * 18, top: 8 + i * 6 }))

export default function Lines(props: BoardProps) {
  const [grid, setGrid] = createSignal(randomGrid())
  const [spin, setSpin] = createSignal(0)
  const [free, setFree] = createSignal(false)
  const [tease, setTease] = createSignal<number>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [duels, setDuels] = createSignal<Record<number, number>>({})
  const [wins, setWins] = createSignal<Win[]>([])
  // after every line has been shown, one at a time with what it paid
  const [cycle, setCycle] = createSignal<number>()
  const [mult, setMult] = createSignal<Step>()
  const [banner, setBanner] = createSignal<{ label: string; amount?: number }>()
  const [megas, setMegas] = createSignal<NonNullable<Step['megas']>>([])
  // farao: the expanding symbol filling its reels
  const [grown, setGrown] = createSignal<NonNullable<Step['expands']>[number]>()
  // valhall: the valkyrie's respins. cells: what every cell holds so far, by r * 10 + row. fresh: what the latest respin brought
  // valhall: the swords crossing over a duel reel before it turns. vildmark: the bear's claws
  const [clash, setClash] = createSignal<number[]>([])
  const [clawed, setClawed] = createSignal(false)
  const [call, setCall] = createSignal<Call>()
  const fx = impacts()
  let board!: HTMLDivElement
  const shake = shaker(() => board)
  const [held, setHeld] = createSignal<{
    cells: Record<number, { kind: string; value: number }>
    fresh: number[]
    left: number
    intro?: boolean
    done?: boolean
    wilds: number
    mult: number
  }>()

  let timers: number[] = []
  let cycler = 0
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
  const clear = () => {
    timers.forEach(clearTimeout)
    timers = []
    clearInterval(cycler)
  }
  onCleanup(clear)

  const roll = (next: string[][], isFree: boolean, teaseAt?: number) =>
    batch(() => {
      clear()
      setGrid(next)
      setFree(isFree)
      setTease(teaseAt)
      setDuels({})
      setWins([])
      setCycle()
      setMult()
      setBanner()
      setMegas([])
      setGrown()
      setHeld()
      setClash([])
      setClawed(false)
      setCall()
      fx.clear()
      setSpin(n => n + 1)
    })

  // the lines are drawn all at once, and after a while shown one by one with what they paid, round and round until the next spin
  // the bar under the board says what each line is: the symbol, how many in a row, which line and what it paid
  const tell = (w: Win) => {
    const id = cellsOf(w).map(([r, row]) => idOf(grid()[r][row])).find(c => !config.symbols.find(s => s.id === c)?.wild) ?? 'wild'
    props.say({ icon: id, text: `${w.count} × ${nameOf(id)} · ${tr('line', { n: w.line })} · ${format(w.amount)}` })
  }
  const present = (lines: Win[]) => {
    setWins(lines)
    setCycle()
    if (lines.length < 2) return tell(lines[0])
    props.say({ text: `${tr('win_lines', { count: lines.length })} · ${format(lines.reduce((s, w) => s + w.amount, 0))}` })
    let i = 0
    later(1600, () => {
      setCycle(0)
      tell(lines[0])
      cycler = setInterval(() => {
        setCycle(++i % lines.length)
        tell(lines[i % lines.length])
      }, 1700)
    })
  }

  createEffect(on(() => props.demo, () => roll(randomGrid(), false), { defer: true }))

  createEffect(
    on(
      () => props.step,
      step => {
        if (!step) {
          clear()
          setDuels({})
          setMult()
          setBanner()
          setMegas([])
          setGrown()
          setHeld()
          setClash([])
          setCall()
          setTeasing([])
          setCycle()
          return setWins([])
        }
        roll(step.grid, !!step.free, step.tease)
        const before = step.total - step.win
        const lines = list(step.wins)
        let t = stopAt(reels - 1, step.free, step.tease) + 100

        sfx.spin(t)
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(c => c === 'scatter' || c.endsWith('scatter')).length
          // vildmark: a wild wolf howls as it lands
          const wolves = list(step.grid[r]).flatMap((c, row) => (c === 'wolfwild' ? [row] : []))
          scatters += n
          const count = scatters
          later(stopAt(r, step.free, step.tease), () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            wolves.forEach(row => fx.hit(r * (W + GAP) + W / 2, row * H + H / 2, { tone, bits: 'spark', size: 0.8 }))
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        // the bear tears its claws across the reels while they still turn and roars its multiplier
        if (step.boost) {
          later(300, () =>
            batch(() => {
              sfx.mult()
              shake(14)
              setClawed(true)
              setCall({ label: `${tr('bear')} ×${step.boost}`, text: tr('all_wins'), tone: '#c8702a', icon: 'bear' })
              props.say({ icon: 'bear', text: `${tr('bear')}: ${tr('all_wins')} ×${step.boost}` })
            }),
          )
          later(Math.min(t - 200, 1800), () => (setCall(), setClawed(false)))
        }

        // the cells of a giant symbol land one by one, then it is drawn over them in one piece and lands with a thud
        if (step.megas)
          later(t - 100, () => {
            setMegas(list(step.megas))
            shake(10)
            list(step.megas).forEach(m =>
              fx.hit((m.reel - 1 + m.size / 2) * (W + GAP) - GAP / 2, (m.row - 1 + m.size / 2) * H, { tone, bits: 'feather', size: 1.3 }),
            )
          })
        // a duel: two swords swing in over the reel and clash, then it turns wild with its multiplier
        if (step.duels) {
          const duels = list(step.duels)
          later(t, () =>
            batch(() => {
              sfx.duel()
              setClash(duels.map(d => d.reel - 1))
              props.say({ icon: 'duel', text: `${tr('duel')} ${duels.map(d => `×${d.mult}`).join(' + ')}` })
            }),
          )
          later(t + 380, () => {
            shake(12)
            duels.forEach(d => fx.hit((d.reel - 1) * (W + GAP) + W / 2, (rows * H) / 2, { tone: '#ffb347', bits: 'spark', size: 1.2 }))
          })
          later(t + 600, () =>
            batch(() => {
              setClash([])
              setDuels(Object.fromEntries(duels.map(d => [d.reel - 1, d.mult])))
            }),
          )
          t += T.Expand
        }
        if (lines.length) {
          later(t, () => {
            sfx.win(step.win / props.bet)
            present(lines)
            props.show(Math.min(before + lines.reduce((sum, w) => sum + w.amount, 0) / (step.mult ?? 1) + (step.scatter ?? 0), step.total))
          })
          t += T.Win
        } else if (step.scatter) {
          later(t, () => props.show(Math.min(before + step.scatter!, step.total)))
        }
        if (step.mult) {
          later(t, () => {
            sfx.mult()
            setMult(step)
            props.show(step.total)
          })
          t += T.Win
        }

        // every expanding symbol in turn grows over the reels it is on, then pays on every line
        let sum = before + lines.reduce((s, w) => s + w.amount, 0) + (step.scatter ?? 0)
        for (const e of list(step.expands)) {
          later(t, () =>
            batch(() => {
              sfx.duel()
              clearInterval(cycler)
              setWins([])
              setGrown(e)
              setCall()
              props.say({ icon: e.symbol, text: tr('expands', { symbol: nameOf(e.symbol), count: list(e.reels).length }) })
            }),
          )
          // the symbol pours down each reel in turn, gold flying where it lands
          list(e.reels).forEach((r, i) =>
            later(t + 250 + i * 140, () => {
              shake(6)
              fx.hit((r - 1) * (W + GAP) + W / 2, (rows * H) / 2, { tone, bits: 'coin', size: 1.1 })
            }),
          )
          later(t + T.Expand, () =>
            batch(() => {
              sum += e.amount
              sfx.win(e.amount / props.bet)
              setCall({ label: tr('all_lines'), text: format(e.amount), tone, icon: e.symbol })
              props.say({ icon: e.symbol, text: `${tr('on_all_lines', { symbol: nameOf(e.symbol) })} · ${format(e.amount)}` })
              props.show(Math.min(sum, step.total))
            }),
          )
          t += T.Expand + T.Win
        }

        // the valkyrie's respins: what she brings stays, the other cells spin again, anything new starts the respins over
        const dead = step.dead
        if (dead) {
          const cells: Record<number, { kind: string; value: number }> = {}
          later(t, () =>
            batch(() => {
              sfx.bonus()
              clearInterval(cycler)
              setWins([])
              setHeld({ cells: {}, fresh: [], left: 3, intro: true, wilds: 0, mult: 1 })
            }),
          )
          later(t + T.Intro - 900, () => setHeld(v => v && { ...v, intro: false }))
          t += T.Intro
          for (const round of list(dead.rounds)) {
            const landed = list(round.cells)
            later(t + 200, () =>
              batch(() => {
                // every wild or multiplier the valkyrie brings lands in a flurry of feathers
                landed.forEach((c, n) => {
                  sfx.pop(n)
                  cells[c.key] = { kind: c.kind, value: c.value }
                  fx.hit((Math.floor(c.key / 10) - 1) * (W + GAP) + W / 2, ((c.key % 10) - 1) * H + H / 2, { tone: '#b06aff', bits: 'feather', size: 0.8 })
                })
                if (!landed.length) sfx.stop()
                const kinds = Object.values(cells)
                const wilds = kinds.filter(k => k.kind === 'wild').length
                props.say({ icon: 'handscatter', text: tr('valkyrie_round', { wilds, mult: 1 + kinds.filter(k => k.kind === 'mult').length, left: round.left }) })
                setHeld({
                  cells: { ...cells },
                  fresh: landed.map(c => c.key),
                  left: round.left,
                  wilds: kinds.filter(k => k.kind === 'wild').length,
                  mult: 1 + kinds.filter(k => k.kind === 'mult').length,
                })
              }),
            )
            t += T.Respin
          }
          later(t, () =>
            batch(() => {
              sfx.fanfare()
              setHeld(v => v && { ...v, fresh: [], done: true, wilds: dead.wilds, mult: dead.mult })
            }),
          )
        }

        // vildmark: the bonus goes again
        if (step.respin) {
          later(t, () => (sfx.bonus(), setCall({ label: 'Respin!', text: tr('once_more'), tone }), props.say({ text: tr('bonus_again') })))
          later(t + T.Win - 100, () => setCall())
        }
      },
      { defer: true },
    ),
  )

  const cellsOf = (w: { line: number; count: number }) => Array.from({ length: w.count }, (_, r) => [r, config.lines![w.line - 1][r] - 1])
  const shown = () => (cycle() === undefined ? wins() : [wins()[cycle()!]].filter(Boolean))
  const hits = createMemo(() => new Set(shown().flatMap(cellsOf).map(([r, row]) => `${r}:${row}`)))
  const points = (w: { line: number; count: number }) =>
    cellsOf(w)
      .map(([r, row]) => `${r * (W + GAP) + W / 2},${row * H + H / 2}`)
      .join(' ')
  // where a line's amount sits: on its last symbol
  const end = (w: { line: number; count: number }) => {
    const [r, row] = cellsOf(w)[w.count - 1]
    return { left: `${r * (W + GAP) + W / 2}px`, top: `${row * H + H / 2}px` }
  }

  const state = (r: number, row: number) => {
    if (!hits().size) return ''
    return hits().has(`${r}:${row}`) ? 'hit' : 'dim'
  }

  return (
    <div class="board" ref={board} style={{ '--w': `${W}px`, '--gap': `${GAP}px`, '--h': `${H}px` }}>
      <Index each={grid()}>
        {(column, r) => (
          <Reel
            column={column()}
            spin={spin()}
            duration={stopAt(r, free(), tease())}
            height={H}
            duel={duels()[r]}
            tease={teasing().includes(r)}
            state={row => state(r, row)}
          />
        )}
      </Index>
      <For each={megas()}>
        {m => (
          <div
            class="mega"
            style={{ left: `${(m.reel - 1) * (W + GAP)}px`, top: `${(m.row - 1) * H}px`, width: `${m.size * (W + GAP) - GAP}px`, height: `${m.size * H}px` }}
          >
            <svg viewBox="0 0 100 100">
              <use href={`#s-${m.id}`} />
            </svg>
          </div>
        )}
      </For>
      <Show when={grown()}>
        {e => (
          <>
            <For each={list(e().reels)}>
              {r => (
                <div class="grow" style={{ left: `${(r - 1) * (W + GAP)}px`, width: `${W}px` }}>
                  <For each={Array.from({ length: rows })}>
                    {(_, i) => (
                      <svg viewBox="0 0 100 100" style={{ height: `${H - 10}px`, 'animation-delay': `${i() * 90}ms` }}>
                        <use href={`#s-${e().symbol}`} />
                      </svg>
                    )}
                  </For>
                </div>
              )}
            </For>
          </>
        )}
      </Show>
      <svg class="lines">
        <For each={shown()}>
          {w => (
            <>
              <polyline class="halo" pathLength="1" points={points(w)} />
              <polyline pathLength="1" points={points(w)} />
            </>
          )}
        </For>
      </svg>
      <For each={shown()}>
        {w => (
          <b class="line-pay" classList={{ one: cycle() !== undefined }} style={end(w)}>
            {format(w.amount)}
          </b>
        )}
      </For>
      <Show when={held()}>
        {h => (
          <div class="hold">
            <For each={Array.from({ length: reels * rows }, (_, i) => (Math.floor(i / rows) + 1) * 10 + (i % rows) + 1)}>
              {key => {
                const cell = () => h().cells[key]
                return (
                  <div
                    class="spot"
                    classList={{ pearl: !!cell(), fresh: h().fresh.includes(key) }}
                    style={{ left: `${(Math.floor(key / 10) - 1) * (W + GAP)}px`, top: `${((key % 10) - 1) * H}px`, width: `${W}px`, height: `${H - GAP}px` }}
                  >
                    <Show when={cell()}>
                      {p => (
                        <>
                          <svg viewBox="0 0 100 100">
                            <use href={`#s-${p().kind === 'mult' ? 'duel' : 'wild'}`} />
                          </svg>
                          <b>{p().kind === 'mult' ? '+1×' : ''}</b>
                        </>
                      )}
                    </Show>
                  </div>
                )
              }}
            </For>
            <Show when={h().intro}>
              <div class="pop">
                <span>{tr('valkyrie_collects')}</span>
                <b>{tr('spins', { count: 3 })}</b>
              </div>
            </Show>
            <Show when={h().done}>
              <div class="pop">
                <span>{tr('valkyrie_choice')}</span>
                <b>
                  {h().wilds} wilds · ×{h().mult}
                </b>
              </div>
            </Show>
          </div>
        )}
      </Show>
      <Show when={mult()}>
        {m => (
          <div class="pop">
            <span>×{m().mult}</span>
            <b>{format(m().win)}</b>
          </div>
        )}
      </Show>
      {/* the swords of a duel: one from each side, they meet in the middle of the reel */}
      <For each={clash()}>
        {r => (
          <div class="clash" style={{ left: `${r * (W + GAP)}px`, width: `${W}px` }}>
            <svg class="left" viewBox="0 0 100 100">
              <use href="#duel-sword" />
            </svg>
            <svg class="right" viewBox="0 0 100 100">
              <use href="#duel-sword" transform="matrix(-1 0 0 1 100 0)" />
            </svg>
          </div>
        )}
      </For>
      <Show when={clawed()}>
        <div class="claws">
          <For each={claws}>{(c, i) => <i style={{ left: `${c.left}%`, top: `${c.top}%`, 'animation-delay': `${i() * 70}ms` }} />}</For>
        </div>
      </Show>
      <Impacts hits={fx.hits()} />
      <Callout call={call()} />
      <Show when={banner()}>
        {b => (
          <div class="pop small">
            <span>{b().label}</span>
            <Show when={b().amount}>{amount => <b>{format(amount())}</b>}</Show>
          </div>
        )}
      </Show>
    </div>
  )
}
