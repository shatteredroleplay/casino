import { type Accessor, batch, createEffect, createSignal, For, Index, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { config, format, idOf, list, nameOf, randomGrid, reels, rows, type Step, T, teased, valueOf, tr } from './config'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

const H = 104
const BAY = 52
const W = 128
const GAP = 6
const shape = config.shape ?? []

// vargflocken: the reels with a section of the torpedo tube under them
const tubeReels = config.modes?.find(m => m.torpedo)?.torpedo?.reels ?? []
const wilds = new Set(['wild', 'xwild', 'scope', 'twild'])

// the short reels sit in the middle of the tall ones
const top = (reel: number) => ((rows - shape[reel]) / 2) * H

// row: where the gem starts on its reel, counted in cells from the top. size: how many cells it holds, a crate opens into 2 to 4
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

// a reel that has turned wild: the submarine (shift: rows it still sticks out, it moves in one at a time) or the periscope's wilds
type Frozen = { reel: number; id: string; from: number; mult: number; shift: number; down: boolean; shown: number }

export default function Ways(props: BoardProps) {
  // columns hold their gems top to bottom
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  // how many cells every reel holds right now, the crates make a reel longer and its symbols smaller
  const [cells, setCells] = createSignal<number[]>([...shape])
  const [frozen, setFrozen] = createSignal<Frozen[]>([])
  const [banner, setBanner] = createSignal<{ label: string; amount?: number }>()
  const [shake, setShake] = createSignal(false)
  // the multiplier of the spin, or of the free spins so far, shown on a mine in the empty corner
  const [meter, setMeter] = createSignal<number>()
  // vargflocken: what every section of the tube holds, the sections that just loaded, and the torpedo on its way
  const [tube, setTube] = createSignal<number[]>()
  const [loading, setLoading] = createSignal<number[]>([])
  const [firing, setFiring] = createSignal(false)
  // tyst jakt: the view through the periscope, the torpedo running at the ship and whether it hit
  const [periscope, setPeriscope] = createSignal<{ hit?: boolean }>()
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [call, setCall] = createSignal<Call>()
  const fx = impacts()
  let board!: HTMLDivElement
  const jolt = shaker(() => board)

  let timers: number[] = []
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))
  const clear = () => {
    timers.forEach(clearTimeout)
    timers = []
  }
  onCleanup(clear)

  const unit = (reel: number) => (shape[reel] * H) / Math.max(cells()[reel] ?? shape[reel], 1)
  // the middle of a gem on the board
  const hitAt = (g: Gem, o: Parameters<typeof fx.hit>[2]) => fx.hit(g.reel * (W + GAP) + W / 2, top(g.reel) + (g.row() + g.size() / 2) * unit(g.reel), o)

  // the ways on the board: every reel's cells times each other, a wild reel counts all its rows
  const ways = () => cells().reduce((n, c) => n * c, 1)

  // every gem goes to its place on the reel, a new one falls in from above
  const layout = (reel: number) => {
    let at = 0
    for (const g of columns[reel]) {
      g.setRow(at)
      at += g.size()
    }
    setCells(c => c.map((n, r) => (r === reel ? at : n)))
  }
  const land = (reel: number, delay = 0) => later(delay + 30, () => layout(reel))

  const rest = () => {
    setBanner()
    setFrozen([])
    setPeriscope()
    setFiring(false)
    setLoading([])
    setShake(false)
    setCall()
  }

  const drop = (grid: string[][], gap: number, tease?: number) =>
    batch(() => {
      clear()
      rest()
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + rows * 2 + 1))
      columns = grid.map((column, r) => list(column).map((cell, row) => gem(cell, r, row - list(column).length - 1)))
      setCells(columns.map(c => c.length))
      setGems([...old, ...columns.flat()])
      later(400, () => setGems(columns.flat()))
      columns.forEach((_, r) => land(r, 120 + r * gap + teased(r, tease)))
    })

  const crates = () => columns.flat().filter(g => idOf(g.cell()) === 'xways')

  // every crate of the spin bursts into the same symbol, 2 to 4 of it, and the reel grows to hold them
  const open = (step: Step) => {
    const found = crates()
    if (!found.length) return
    sfx.pop(2)
    jolt(7)
    // the crates split open in a spray of splinters
    found.forEach(g => hitAt(g, { tone: '#ffc83d', bits: 'splinter' }))
    batch(() => {
      for (const g of found) {
        const n = valueOf(g.cell())
        g.setCell(`${step.reveal}:${n}`)
        g.setSize(n)
        g.setState('burst')
      }
      new Set(found.map(g => g.reel)).forEach(r => layout(r))
    })
    later(600, () => found.forEach(g => g.state() === 'burst' && g.setState('')))
  }

  // torpedo wilds that landed load the sections of the tube under their reels
  const load = (step: Step, at: number) => {
    const loads = list(step.loads).filter(l => l.at === at)
    if (!loads.length) return
    sfx.pop(1)
    batch(() => {
      for (const l of loads) columns[l.reel - 1]?.[l.row - 1]?.setState('burst')
      setTube(t => t?.map((v, i) => loads.filter(l => l.reel === tubeReels[i]).pop()?.size ?? v))
      setLoading(loads.map(l => tubeReels.indexOf(l.reel)))
    })
    later(700, () => batch(() => (setLoading([]), columns.flat().forEach(g => g.state() === 'burst' && g.setState('')))))
  }

  // a full tube launches: the torpedo runs along it, every section turns into an xways of its size on its reel
  // (wilds on the middle reels), and the multiplier goes up by one for the rest of the free spins
  const launch = (l: NonNullable<Step['launches']>[number]) => {
    sfx.bonus()
    setFiring(true)
    later(700, () =>
      batch(() => {
        sfx.duel()
        setFiring(false)
        setTube(t => t?.map(() => 0))
        setMeter(l.mult)
        setCall({ label: tr('torpedo'), text: `+1× · ${tr('now', { mult: l.mult })}`, tone: '#ff3a2a', icon: 'twild', small: true })
        jolt(14)
        for (const c of list(l.cells)) {
          const g = columns[c.reel - 1][c.row - 1]
          g.setCell(c.cell)
          g.setSize(valueOf(c.cell) || 1)
          g.setState('burst')
          layout(c.reel - 1)
        }
        for (const c of list(l.cells)) hitAt(columns[c.reel - 1][c.row - 1], { tone: '#ff8a2a', bits: 'drop', size: 0.9 })
      }),
    )
  }

  // the mines go off: each one flashes and the board shakes, all that is not part of a win is blown away
  const blast = (d: NonNullable<Step['drops']>[number]) => {
    sfx.duel()
    setMeter(d.mult)
    setBanner({ label: `+${d.bombs ?? 1}×` })
    props.say({ icon: 'wild', text: tr('mine_blast', { mult: d.mult }) })
    jolt(18)
    // every mine goes up in a fireball with the sea spraying off it
    columns.flat().filter(g => g.cell() === 'wild').forEach(g => {
      hitAt(g, { tone: '#ff6a1a', bits: 'rock', size: 1.4 })
      hitAt(g, { tone: '#5fd0ff', bits: 'drop', size: 1.1 })
    })
    columns.forEach((column, r) => {
      const out = new Set(list(d.gone[r]))
      column.forEach((g, i) => g.setState(out.has(i + 1) ? 'gone' : g.cell() === 'wild' ? 'boom' : ''))
    })
  }

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
          setMeter()
          setTube()
          setTeasing([])
          return rest()
        }
        drop(step.grid, step.free ? T.FreeGap : T.Gap, step.tease)
        setMeter(step.bank)
        setTube(step.tube && list(step.tube))
        const launches = list(step.launches)
        let t = (step.free ? T.FreeFirst + (reels - 1) * T.FreeGap : T.First + (reels - 1) * T.Gap) + teased(reels - 1, step.tease) + 100

        // every column lands with a thud, a sonar pings higher for every one before it, one short of the free spins the rest take their time
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = list(step.grid[r]).filter(c => c === 'scatter').length
          scatters += n
          const count = scatters
          later(450 + r * (step.free ? T.FreeGap : T.Gap) + teased(r, step.tease), () => {
            sfx.stop()
            if (n) sfx.scatter?.(count)
            setTeasing(w => w.filter(x => x !== r))
            if (step.tease === r + 2) {
              sfx.tease?.()
              setTeasing(Array.from({ length: reels - r - 1 }, (_, i) => r + 1 + i))
            }
          })
        }

        // the crates that landed shake, then burst open
        if (step.crate) {
          later(t - 100, () => crates().forEach(g => g.setState('shake')))
          later(t + T.Crate - 500, () => (open(step), load(step, 0)))
          t += T.Crate
        } else {
          later(t - 100, () => open(step))
        }

        const fire = (at: number) => {
          for (const l of launches.filter(l => l.at === at)) {
            later(t, () => launch(l))
            later(t + T.Launch - 200, () => batch(() => (setCall(), columns.flat().forEach(g => g.setState('')))))
            t += T.Launch
          }
        }
        fire(0)

        // the periscope comes up: a ship on the horizon, the torpedo runs at it, and it sinks or the torpedo misses
        const a = step.attack
        if (a) {
          later(t, () =>
            batch(() => {
              sfx.mult()
              setPeriscope({})
            }),
          )
          later(t + 1300, () =>
            batch(() => {
              a.hit ? sfx.duel() : sfx.stop()
              if (a.hit) jolt(12)
              setPeriscope({ hit: a.hit })
            }),
          )
          later(t + T.Attack - 450, () =>
            batch(() => {
              setPeriscope()
              setCall(a.hit ? { label: tr('sunk'), text: `+1× · ${tr('now', { mult: a.mult })}`, tone: '#ff3a2a', icon: 'scope' } : { label: tr('miss'), tone: '#4a5a6a' })
              if (a.mult) setMeter(a.mult)
            }),
          )
          later(t + T.Attack - 50, () => setCall())
          t += T.Attack
        }

        // a submarine surfaces sticking out of its reel and moves in one row at a time, every row +1 to its multiplier.
        // the periscope's wilds grow down the reel the same way
        const nudges = list(step.nudges)
        if (nudges.length) {
          const most = Math.max(...nudges.map(n => n.mult - 1))
          later(t, () =>
            batch(() => {
              sfx.duel()
              // the periscope's wilds come in from the top, a submarine from above or below
              setFrozen(nudges.map(n => ({ ...n, reel: n.reel - 1, shift: n.mult - 1, down: n.id === 'nudge' && Math.random() < 0.5, shown: 1 })))
            }),
          )
          for (let k = 1; k <= most; k++) {
            later(t + 500 + k * T.Nudge, () =>
              batch(() => {
                sfx.stop()
                setFrozen(f => f.map(n => (n.shown < n.mult ? { ...n, shift: n.shift - 1, shown: n.shown + 1 } : n)))
              jolt(5)
              }),
            )
          }
          later(t + 500 + most * T.Nudge + 150, () => {
            sfx.mult()
            nudges.forEach(n => fx.hit((n.reel - 1) * (W + GAP) + W / 2, top(n.reel - 1) + (shape[n.reel - 1] * H) / 2, { tone: '#5fe0ff', bits: 'drop', word: `×${n.mult}` }))
          })
          t += T.Expand + most * T.Nudge
        }

        for (const [n, d] of list(step.drops).entries()) {
          later(t, () => blast(d))
          later(t + T.Tumble * 0.45, () =>
            batch(() => {
              sfx.stop()
              setBanner()
              columns.flat().forEach(g => g.setState(''))
              collapse(d)
            }),
          )
          later(t + T.Tumble * 0.65, () => (open(step), load(step, n + 1)))
          t += T.Tumble
          fire(n + 1)
        }

        // what is left pays once, times the multiplier
        const wins = list(step.wins)
        if (wins.length) {
          later(t, () =>
            batch(() => {
              const wild = new Set(nudges.map(n => n.reel - 1))
              columns.forEach((column, r) =>
                column.forEach(g => {
                  const id = idOf(g.cell())
                  const hit = wins.some(w => r < w.count && (id === w.symbol || wilds.has(id)))
                  g.setState(hit || wild.has(r) ? 'hit' : 'dim')
                }),
              )
              sfx.win(step.win / props.bet)
              props.show(step.total)
              const best = wins.reduce((a, w) => (w.amount > a.amount ? w : a))
              props.say({ icon: best.symbol, text: `${best.count} × ${nameOf(best.symbol!)} · ${tr('ways', { count: best.ways ?? 0 })}${(step.x ?? 1) > 1 ? ` · ×${step.x}` : ''} · ${format(best.amount)}` })
              if ((step.x ?? 1) > 1) setBanner({ label: `×${step.x}`, amount: step.win })
            }),
          )
          t += T.Win
        }

        // vargflocken ends one section short of a launch
        if (step.nein) {
          later(t, () =>
            batch(() => {
              sfx.stop()
              setCall({ label: 'Nein, nein, nein!', text: tr('one_section_left'), tone: '#c8141a' })
            }),
          )
        }
      },
      { defer: true },
    ),
  )

  drop(randomGrid(), 0)

  return (
    <div class="board ways" ref={board} classList={{ shake: shake() }} style={{ width: `${reels * (W + GAP) - GAP}px`, height: `${rows * H + BAY}px` }}>
      <Show when={tube()}>
        {sections => (
          <div class="tube" classList={{ firing: firing() }} style={{ left: `${(tubeReels[0] - 1) * (W + GAP)}px`, top: `${rows * H + 8}px`, width: `${tubeReels.length * (W + GAP) - GAP}px` }}>
            <For each={tubeReels}>
              {(r, i) => (
                <i classList={{ on: sections()[i()] > 0, loading: loading().includes(i()) }} style={{ left: `${(r - tubeReels[0]) * (W + GAP)}px`, width: `${W}px` }}>
                  {sections()[i()] ? `${sections()[i()]}×` : ''}
                </i>
              )}
            </For>
            <svg class="fish" viewBox="0 0 100 100">
              <use href="#s-torpedo" />
            </svg>
          </div>
        )}
      </Show>
      <For each={shape}>
        {(n, r) => <div class="lane" classList={{ teasing: teasing().includes(r()) }} style={{ left: `${r() * (W + GAP)}px`, top: `${top(r())}px`, width: `${W}px`, height: `${n * H}px` }} />}
      </For>
      <For each={gems()}>
        {g => (
          <div
            class={`gem ${g.state()}`}
            style={{
              width: `${W}px`,
              height: `${g.size() * unit(g.reel)}px`,
              transform: `translate(${g.reel * (W + GAP)}px, ${top(g.reel) + g.row() * unit(g.reel)}px)`,
            }}
          >
            <Cell cell={g.cell()} />
          </div>
        )}
      </For>
      <Index each={frozen()}>
        {f => (
          <div class="lane clip" style={{ left: `${f().reel * (W + GAP)}px`, top: `${top(f().reel)}px`, width: `${W}px`, height: `${shape[f().reel] * H}px` }}>
            <Show
              when={f().id === 'nudge'}
              fallback={
                <div class="wilds" style={{ height: `${shape[f().reel] * H}px`, transform: `translateY(${-f().shift * unit(f().reel)}px)` }}>
                  <For each={Array.from({ length: columns[f().reel]?.length ?? 1 })}>
                    {() => (
                      <svg viewBox="0 0 100 100" style={{ height: `${unit(f().reel)}px` }}>
                        <use href="#s-scope" />
                      </svg>
                    )}
                  </For>
                </div>
              }
            >
              <div class="sub" style={{ transform: `translateY(${(f().down ? 1 : -1) * f().shift * unit(f().reel)}px)` }}>
                <svg viewBox="0 0 100 400" preserveAspectRatio="none">
                  <use href="#s-sub" />
                </svg>
              </div>
            </Show>
            <b class="badge" classList={{ done: f().shown === f().mult }}>
              ×{f().shown}
            </b>
          </div>
        )}
      </Index>
      <Show when={periscope()}>
        {p => (
          <div class="periscope" classList={{ hit: p().hit === true, miss: p().hit === false }}>
            <div class="view">
              <div class="sea" />
              <svg class="ship" viewBox="0 0 200 80">
                <path d="M10 50H190L170 72H30Z" fill="#3a4250" stroke="#1b1220" stroke-width="4" />
                <path d="M60 50V30H120V50M80 30V14H100V30M140 50V36H160V50" fill="#5a6676" stroke="#1b1220" stroke-width="4" />
              </svg>
              <i class="wake" />
              <i class="blast" />
              <i class="cross" />
            </div>
          </div>
        )}
      </Show>
      <div class="ways-count">
        <b>{format(ways())}</b>
        <span>{tr('ways_label')}</span>
      </div>
      <Show when={meter()}>
        <div class="meter">
          <svg viewBox="0 0 100 100">
            <use href="#s-wild" />
          </svg>
          <b>×{meter() ?? 1}</b>
        </div>
      </Show>
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
