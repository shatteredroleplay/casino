import { batch, createEffect, createMemo, createSignal, For, Index, on, onCleanup, Show } from 'solid-js'
import { config, format, idOf, list, nameOf, randomGrid, reels, rows, type Step, stopAt, T, tr } from './config'
import type { BoardProps } from './Lines'
import Reel from './Reel'
import { sfx } from './sound'

const H = Math.floor(470 / rows)
const W = 150
const GAP = 8
const team = { red: tr('team_red'), blue: tr('team_blue') }

type Win = NonNullable<Step['wins']>[number]
type Fist = NonNullable<Step['fists']>[number]
// a fist on its way up: the row it has reached, the punches it has thrown so far and the multiplier they add up to
// charge: shaking where it landed, fly: on its way, top: it has hit the top of the reel. hits: what it smashed (cell: the symbol)
type Raised = { fist: Fist; at: number; hits: { row: number; value: number; cell: string; word: string }[]; mult: number; phase: 'charge' | 'fly' | 'top' }
// the fists of an epic drop falling onto the board one after the other
type Falling = { reel: number; row: number; team: string; wait: number }

// what the comic burst of a punch says, one after the other
const words = ['POW!', 'BAM!', 'WHAM!', 'KAPOW!', 'SMASH!']
// the splinters a smashed symbol breaks into: where each flies, how far it turns
const shards = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2 + (i % 3) * 0.3
  const d = 90 + (i % 4) * 30
  return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: (i % 2 ? 1 : -1) * (120 + i * 30), size: 10 + (i % 3) * 6 }
})

// fist (järnnäven): five reels of four and 14 lines. a fist that makes a win goes up its reel and turns it wild from where it
// landed to the top, every fighter of the other team and every wild on the way takes a punch and the reel a multiplier
export default function FistBoard(props: BoardProps) {
  const [grid, setGrid] = createSignal(randomGrid())
  const [spin, setSpin] = createSignal(0)
  const [free, setFree] = createSignal(false)
  const [tease, setTease] = createSignal<number>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [raised, setRaised] = createSignal<Raised[]>([])
  const [wins, setWins] = createSignal<Win[]>([])
  const [cycle, setCycle] = createSignal<number>()
  const [banner, setBanner] = createSignal<{ label: string; text?: string; team?: string }>()
  // the fists of an epic drop glow before they go up
  const [dropped, setDropped] = createSignal(false)
  const [falling, setFalling] = createSignal<Falling[]>([])

  // the board jolts on every hit, harder the bigger it is
  let board!: HTMLDivElement
  const shake = (power: number) =>
    board?.animate(
      [
        { transform: 'translate(0, 0)' },
        { transform: `translate(${-power}px, ${power * 0.6}px)` },
        { transform: `translate(${power * 0.8}px, ${-power * 0.5}px)` },
        { transform: `translate(${-power * 0.4}px, ${power * 0.3}px)` },
        { transform: 'translate(0, 0)' },
      ],
      { duration: 320, easing: 'ease-out' },
    )

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
      setRaised([])
      setWins([])
      setCycle()
      setBanner()
      setDropped(false)
      setFalling([])
      setSpin(n => n + 1)
    })

  const cellsOf = (w: { line: number; count: number }) => Array.from({ length: w.count }, (_, r) => [r, config.lines![w.line - 1][r] - 1])
  // the multiplier of a line: the fist reels it goes through on their wild part, added together
  const multOf = (w: Win) =>
    raised().reduce((sum, f) => (f.fist.reel <= w.count && config.lines![w.line - 1][f.fist.reel - 1] <= f.fist.row ? sum + f.mult : sum), 0)
  const tell = (w: Win) => {
    const id =
      cellsOf(w)
        .filter(([r, row]) => !raised().some(f => f.fist.reel - 1 === r && row + 1 <= f.fist.row))
        .map(([r, row]) => idOf(grid()[r][row]))
        .find(c => !config.symbols.find(s => s.id === c)?.wild) ?? 'wild'
    const m = multOf(w)
    props.say({ icon: id, text: `${w.count} × ${nameOf(id)} · ${tr('line', { n: w.line })}${m > 1 ? ` · ×${m}` : ''} · ${format(w.amount)}` })
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
          setRaised([])
          setFalling([])
          setBanner()
          setTeasing([])
          setCycle()
          return setWins([])
        }
        roll(step.grid, !!step.free, step.tease)
        const lines = list(step.wins)
        let t = stopAt(reels - 1, step.free, step.tease) + 100

        sfx.spin(t)
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(c => c === 'scatter').length
          const fist = list(step.grid[r]).some(c => c.endsWith('fist'))
          scatters += n
          const count = scatters
          later(stopAt(r, step.free, step.tease), () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            if (fist) sfx.pop(r)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        // the epic drop: the band slams across the board, then the team's fists fall onto their reels one by one and light up
        const drop = step.drop
        if (drop) {
          const cells = list(step.grid).flatMap((column, r) => list(column).flatMap((c, row) => (c === `${drop.team}fist` ? [{ reel: r, row, team: drop.team }] : [])))
          const gap = Math.min(200, (T.Drop * 0.5) / Math.max(cells.length, 1))
          later(t, () =>
            batch(() => {
              sfx.bonus()
              setBanner({ label: 'Epic Drop', text: `${team[drop.team]} · ${tr('at_least_fists', { count: drop.fists })}`, team: drop.team })
              props.say({ icon: `${drop.team}fist`, text: `Epic Drop · ${team[drop.team]} · ${tr('at_least_fists', { count: drop.fists })}` })
            }),
          )
          later(t + T.Drop * 0.4, () => batch(() => (setBanner(), setDropped(true), setFalling(cells.map((c, i) => ({ ...c, wait: i * gap }))))))
          cells.forEach((_, i) => later(t + T.Drop * 0.4 + i * gap + 380, () => (sfx.pop(i), shake(9))))
          later(t + T.Drop - 150, () => setFalling([]))
          t += T.Drop
        }

        // the fists go up one after the other, stopping at every punch on the way, and then on to the top
        for (const fist of list(step.fists)) {
          const punches = list(fist.punches)
          const update = (fn: (f: Raised) => Raised) => setRaised(all => all.map(f => (f.fist === fist ? fn(f) : f)))
          // it charges where it landed, then flies up: every punch smashes the symbol, then it slams into the top of the reel
          const charge = T.Fist * 0.28
          later(t, () =>
            batch(() => {
              sfx.duel()
              setRaised(all => [...all, { fist, at: fist.row, hits: [], mult: 0, phase: 'charge' }])
              props.say({ icon: `${fist.team}fist`, text: tr('fist_charges', { team: team[fist.team] }) })
            }),
          )
          punches.forEach((p, i) => {
            const cell = idOf(step.grid[fist.reel - 1][p.row - 1])
            later(t + charge + i * T.Punch, () => update(f => ({ ...f, at: p.row, phase: 'fly' })))
            later(t + charge + i * T.Punch + 180, () =>
              batch(() => {
                sfx.punch?.(i)
                shake(8 + Math.min(p.value, 50) / 4)
                update(f => ({ ...f, hits: [...f.hits, { ...p, cell, word: words[i % words.length] }], mult: f.mult + p.value }))
                props.say({ icon: cell, text: `${words[i % words.length]} ${nameOf(cell)} · +×${p.value}` })
              }),
            )
          })
          later(t + charge + punches.length * T.Punch, () => update(f => ({ ...f, at: 1, phase: 'fly' })))
          later(t + charge + punches.length * T.Punch + 180, () =>
            batch(() => {
              sfx.stop()
              shake(6)
              update(f => ({ ...f, phase: 'top' }))
              props.say({ icon: `${fist.team}fist`, text: `${tr('fist_wild', { team: team[fist.team] })}${punches.length ? ` · ×${punches.reduce((s, p) => s + p.value, 0)}` : ''}` })
            }),
          )
          t += T.Fist + punches.length * T.Punch
        }

        if (lines.length) {
          later(t, () =>
            batch(() => {
              setDropped(false)
              sfx.win(step.win / props.bet)
              present(lines)
              props.show(step.total)
            }),
          )
          t += T.Win
        }

        // a team with three victory points wins an epic drop and goes up a level
        for (const won of list(step.won)) {
          later(t, () =>
            batch(() => {
              sfx.mult()
              clearInterval(cycler)
              setWins([])
              setBanner({ label: 'Epic Drop!', text: tr('team_levels_up', { team: team[won] }), team: won })
              props.say({ icon: `${won}fist`, text: `${tr('team_points', { team: team[won] })} · Epic Drop` })
            }),
          )
          later(t + T.Win - 100, () => setBanner())
          t += T.Win
        }
        if (step.respin) {
          later(t, () => (sfx.bonus(), setBanner({ label: 'Respin!' }), props.say({ text: tr('epic_respin') })))
          later(t + T.Win - 100, () => setBanner())
        }
      },
      { defer: true },
    ),
  )

  const shown = () => (cycle() === undefined ? wins() : [wins()[cycle()!]].filter(Boolean))
  const hits = createMemo(() => new Set(shown().flatMap(cellsOf).map(([r, row]) => `${r}:${row}`)))
  const points = (w: { line: number; count: number }) =>
    cellsOf(w)
      .map(([r, row]) => `${r * (W + GAP) + W / 2},${row * H + H / 2}`)
      .join(' ')
  const end = (w: { line: number; count: number }) => {
    const [r, row] = cellsOf(w)[w.count - 1]
    return { left: `${r * (W + GAP) + W / 2}px`, top: `${row * H + H / 2}px` }
  }
  // a wild reel lights up with the line on screen that goes through its wild part, and fades with the rest when none does
  const lit = (f: Raised) => (hits().size ? Array.from({ length: f.fist.row }, (_, row) => `${f.fist.reel - 1}:${row}`).some(k => hits().has(k)) : undefined)
  const state = (r: number, row: number) => {
    const fist = idOf(grid()[r]?.[row] ?? '').endsWith('fist')
    if (dropped() && fist) return 'hit'
    if (!hits().size) return ''
    return hits().has(`${r}:${row}`) ? 'hit' : 'dim'
  }

  return (
    <div class="board fists" ref={board} style={{ '--w': `${W}px`, '--gap': `${GAP}px`, '--h': `${H}px` }}>
      <Index each={grid()}>
        {(column, r) => (
          <Reel column={column()} spin={spin()} duration={stopAt(r, free(), tease())} height={H} tease={teasing().includes(r)} state={row => state(r, row)} />
        )}
      </Index>
      {/* a wild reel from the top down to where its fist landed: the beam follows the fist up, every punch leaves its multiplier */}
      <For each={raised()}>
        {f => (
          <div
            class={`fist-reel ${f.fist.team} ${f.phase}`}
            classList={{ dim: lit(f) === false, lit: lit(f) === true }}
            style={{ left: `${(f.fist.reel - 1) * (W + GAP)}px`, width: `${W}px`, height: `${f.fist.row * H}px` }}
          >
            <div class="beam" style={{ top: `${(f.at - 1) * H}px` }}>
              <span class="wild-word">WILD</span>
              <Show when={f.mult > 0 && f.mult} keyed>
                {m => <b class="reel-mult">×{m}</b>}
              </Show>
            </div>
            <For each={f.hits}>
              {p => (
                <div class="punch" style={{ top: `${(p.row - 1) * H}px`, height: `${H}px` }}>
                  <svg class="half left" viewBox="0 0 100 100">
                    <use href={`#s-${p.cell}`} />
                  </svg>
                  <svg class="half right" viewBox="0 0 100 100">
                    <use href={`#s-${p.cell}`} />
                  </svg>
                  <i class="burst" />
                  <For each={shards}>{s => <i class="shard" style={{ '--x': `${s.x}px`, '--y': `${s.y}px`, '--r': `${s.r}deg`, width: `${s.size}px`, height: `${s.size}px` }} />}</For>
                  <em class="word">{p.word}</em>
                  <b class="hitmult">×{p.value}</b>
                </div>
              )}
            </For>
            <div class="glove" style={{ top: `${(f.at - 1) * H}px`, height: `${H}px` }}>
              <i class="trail" />
              <svg viewBox="0 0 100 100">
                <use href={`#s-${f.fist.team}fist`} />
              </svg>
            </div>
          </div>
        )}
      </For>
      {/* an epic drop: the fists fall in from above the board and crack the ground where they land */}
      <For each={falling()}>
        {d => (
          <div class={`dropper ${d.team}`} style={{ left: `${d.reel * (W + GAP)}px`, top: `${d.row * H}px`, width: `${W}px`, height: `${H}px`, '--wait': `${d.wait}ms` }}>
            <i class="ring" />
            <svg viewBox="0 0 100 100">
              <use href={`#s-${d.team}fist`} />
            </svg>
          </div>
        )}
      </For>
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
      {/* a banner like a fighting game's round call: a slanted band in the team's colour, the call slides in from the left */}
      <Show when={banner()} keyed>
        {b => (
          <div class={`versus ${b.team ?? ''}`}>
            <div class="band" />
            <span>{b.label}</span>
            <Show when={b.text}>{text => <em>{text()}</em>}</Show>
          </div>
        )}
      </Show>
    </div>
  )
}
