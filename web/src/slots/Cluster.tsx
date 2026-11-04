import { type Accessor, batch, createEffect, createSignal, For, on, onCleanup, type Setter, Show } from 'solid-js'
import Cell from './Cell'
import { format, list, nameOf, randomGrid, reels, rows, type Step, T, teased, tr } from './config'
import { type Call, Callout, Impacts, impacts, shaker } from './Fx'
import type { BoardProps } from './Lines'
import { sfx } from './sound'

const H = 94
const W = 128
const GAP = 6
const WIDTH = reels * (W + GAP) - GAP

type Gem = { cell: string; reel: number; row: Accessor<number>; setRow: Setter<number>; state: Accessor<string>; setState: Setter<string> }
type Round = NonNullable<Step['rainbow']>[number]
type Item = Round['items'][number]

const gem = (cell: string, reel: number, at: number): Gem => {
  const [row, setRow] = createSignal(at)
  const [state, setState] = createSignal('')
  return { cell, reel, row, setRow, state, setState }
}

// a cell is reel * 10 + row, both counted from 1
const at = (key: number) => `translate(${(Math.floor(key / 10) - 1) * (W + GAP)}px, ${((key % 10) - 1) * H}px)`
const mid = (key: number): [number, number] => [(Math.floor(key / 10) - 1) * (W + GAP) + W / 2, ((key % 10) - 1) * H + H / 2]

// what the bandit says when a cluster is eaten
const chomps = tr('chomps').split('|')

// what the rainbow does to the gold cells: they turn over, the clovers go off one by one, then the coins fly into the pot
const SHOW = 1
const POT = 2

// a number that counts its way to every new value instead of jumping there
const Count = (props: { value: number; ms: number }) => {
  const [shown, setShown] = createSignal(props.value)
  let frame = 0
  createEffect(
    on(
      () => props.value,
      (to, from = to) => {
        const start = performance.now()
        cancelAnimationFrame(frame)
        const tick = () => {
          const p = Math.min((performance.now() - start) / props.ms, 1)
          setShown(from + (to - from) * (1 - (1 - p) ** 3))
          if (p < 1) frame = requestAnimationFrame(tick)
        }
        tick()
      },
      { defer: true },
    ),
  )
  onCleanup(() => cancelAnimationFrame(frame))
  return <>{shown() ? format(shown()) : ''}</>
}

export default function Cluster(props: BoardProps) {
  // columns hold their gems top to bottom
  let columns: Gem[][] = []
  const [gems, setGems] = createSignal<Gem[]>([])
  const [gold, setGold] = createSignal<number[]>([])
  const [round, setRound] = createSignal<Round>()
  const [beat, setBeat] = createSignal(0)
  // the clovers: the one going off, the cell it has reached, and what every cell it has passed is worth now
  const [clover, setClover] = createSignal<number>()
  const [reached, setReached] = createSignal<number>()
  const [worths, setWorths] = createSignal<Record<number, number>>({})
  // how many of the round's new pots have collected so far
  const [done, setDone] = createSignal(0)
  const [sweep, setSweep] = createSignal(false)
  const [banner, setBanner] = createSignal<number>()
  // the reels still teasing, one scatter short of the free spins. full: a full screen of gold being celebrated
  const [teasing, setTeasing] = createSignal<number[]>([])
  const [full, setFull] = createSignal<number>()
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

  // gems are added above the board and fall to their row on the next frame
  const land = (reel: number, delay = 0) => later(delay + 30, () => columns[reel].forEach((g, row) => g.setRow(row)))

  const rest = () => {
    setBanner()
    setFull()
    setCall()
    setRound()
    setSweep(false)
    setClover()
    setReached()
    setWorths({})
    setDone(0)
  }


  const drop = (grid: string[][], gap: number, tease?: number) =>
    batch(() => {
      clear()
      rest()
      const old = columns.flat()
      old.forEach(g => g.setRow(g.row() + rows + 1))
      columns = grid.map((column, r) => column.map((cell, row) => gem(cell, r, row - rows - 1)))
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
    setGold(cells => [...new Set([...cells, ...list(d.mark)])])
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
          setGold([])
          setTeasing([])
          return rest()
        }
        const gap = step.free ? T.FreeGap : T.Gap
        drop(step.grid, gap, step.tease)
        setGold(list(step.gold))
        let shown = step.total - step.win
        let t = (step.free ? T.FreeFirst : T.First) + (reels - 1) * gap + teased(reels - 1, step.tease) + 100

        // every column lands with a thud, a scatter rings higher for every one before it
        // one scatter short of the free spins, the reels left glow and take their time
        let scatters = 0
        for (let r = 0; r < reels; r++) {
          const n = step.grid[r].filter(cell => cell === 'scatter').length
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

        for (const [n, d] of list(step.drops).entries()) {
          later(t, () => {
            sfx.pop(n)
            columns.forEach((column, r) => {
              const out = new Set(list(d.gone[r]))
              column.forEach((g, i) => g.setState(out.has(i + 1) ? 'hit' : 'dim'))
            })
            // a round that reaches the max win stops counting there
            shown = Math.min(shown + list(d.wins).reduce((sum, w) => sum + w.amount, 0), step.total)
            props.show(shown)
            const best = list(d.wins).reduce((a, w) => (w.amount > a.amount ? w : a))
            props.say({ icon: best.symbol, text: tr('cluster_win', { count: best.count, symbol: nameOf(best.symbol), amount: format(best.amount) }) })
          })
          // the cluster is eaten: crumbs fly off every cell and the bandit smacks his lips over the middle of it
          later(t + T.Tumble * 0.45, () => {
            const eaten = list(d.gone).flatMap((rows, r) => list(rows).map(row => (r + 1) * 10 + row))
            columns.flat().forEach(g => g.state() === 'hit' && g.setState('gone'))
            eaten.forEach(key => fx.hit(...mid(key), { tone: '#ff8ac0', bits: 'crumb', size: 0.6 }))
            const x = eaten.reduce((s, k) => s + mid(k)[0], 0) / eaten.length
            const y = eaten.reduce((s, k) => s + mid(k)[1], 0) / eaten.length
            if (eaten.length) fx.hit(x, y, { tone: '#ff3a8a', bits: 'crumb', word: chomps[n % chomps.length], size: 1.1 })
            shake(5)
          })
          later(t + T.Tumble * 0.6, () =>
            batch(() => {
              sfx.stop()
              columns.flat().forEach(g => g.setState(''))
              collapse(d)
            }),
          )
          t += T.Tumble
        }

        // the rainbow opens every gold cell, once more for every round a new pot turned up
        for (const [i, r] of list(step.rainbow).entries()) {
          // a full screen of gold: the board lights up before the rainbow opens it
          const party = i === 0 && step.full ? T.Full : 0
          if (party) {
            later(t, () =>
              batch(() => {
                sfx.fanfare()
                setFull(step.full)
                setCall({ label: tr('full_screen'), text: tr('all_gold', { mult: step.full }), tone: '#ffb81f', icon: 'rainbow' })
                shake(16)
              }),
            )
            later(t + party - 200, () => setCall())
            t += party
          }
          later(t, () =>
            batch(() => {
              sfx.mult()
              rest()
              setSweep(true)
              columns.flat().forEach(g => g.setState(g.cell === 'rainbow' ? 'hit' : 'dim'))
            }),
          )
          later(t + 650, () =>
            batch(() => {
              sfx.pop(2)
              setBeat(SHOW)
              setRound(r)
              list(r.items).forEach(item => fx.hit(...mid(item.key), { tone: '#ffc83d', bits: 'coin', size: 0.55 }))
            }),
          )
          // one clover at a time: it swells, then a marker goes round the cells next to it and multiplies each as it lands
          let c = t + 1500
          const clovers = list(r.items).filter(item => item.mult).sort((a, b) => a.order! - b.order!)
          for (const item of clovers) {
            later(c, () =>
              batch(() => {
                sfx.mult()
                setClover(item.key)
                setReached()
                fx.hit(...mid(item.key), { tone: '#3ddc6a', bits: 'petal', word: `×${item.mult}`, size: 0.9 })
              }),
            )
            later(c + 150, () => setReached(item.key))
            c += T.Clover
            for (const [n, key] of list(item.hits).entries()) {
              later(c, () =>
                batch(() => {
                  sfx.pop(n)
                  setReached(key)
                  fx.hit(...mid(key), { tone: '#3ddc6a', bits: 'spark', size: 0.5 })
                  setWorths(w => ({ ...w, [key]: (w[key] ?? list(r.items).find(i => i.key === key)!.base ?? 1) * item.mult! }))
                }),
              )
              c += T.Hit
            }
          }
          later(c, () =>
            batch(() => {
              setClover()
              setReached()
            }),
          )
          // a pot gulps the coins down with a clang and a shower of gold
          const gulp = (key?: number) => {
            if (!key) return
            shake(10)
            fx.hit(...mid(key), { tone: '#ffc83d', bits: 'coin', word: 'KACHING!', size: 1.2 })
          }
          later(c + 300, () =>
            batch(() => {
              if (r.collect) sfx.duel()
              setBeat(POT)
              setDone(1)
            }),
          )
          later(c + 700, () => gulp(list(r.collects)[0] ?? r.collect))
          // every pot after the first takes its turn: it collects the coins and the pots before it
          for (let n = 1; n < list(r.collects).length; n++) {
            c += T.Pot
            later(c + 300, () => {
              sfx.duel()
              setDone(n + 1)
              gulp(list(r.collects)[n])
            })
          }
          later(c + 1200, () => {
            const won = Math.min(r.total, step.total - shown)
            sfx.win(won / props.bet)
            setBanner(won)
            props.show(shown + won)
          })
          t += r.time - party
        }
        if (step.rainbow) {
          later(t, () =>
            batch(() => {
              rest()
              columns.flat().forEach(g => g.setState(''))
              if (step.clear) setGold([])
            }),
          )
        }
      },
      { defer: true },
    ),
  )

  drop(randomGrid(), 0)

  // what a cell is worth right now: a coin or a pot from before with the clovers that have reached it, a new pot once it has collected
  const worth = (item: Item) => {
    if (item.kind === 'pot' && !item.held) return collected(item) ? item.amount! : 0
    return worths()[item.key] ?? item.base!
  }

  // a new pot has collected once its turn among the pots of the round has come
  const collected = (item: Item) => list(round()?.collects).indexOf(item.key) < done()

  // a new pot shows the multiplier the clovers have given it until it collects
  const waiting = (item: Item) => item.kind === 'pot' && !item.held && !collected(item) && worths()[item.key]

  // a coin flies to the pot that collects it
  const flown = (item: Item) => beat() >= POT && item.tier && round()?.collect

  const casting = (item: Item) => clover() === item.key
  const gulping = (item: Item) => done() > 0 && item.key === list(round()?.collects)[done() - 1]

  return (
    <div class="board tumble" ref={board} classList={{ full: !!full() }} style={{ width: `${WIDTH}px`, height: `${rows * H}px` }}>
      <For each={gold()}>{key => <div class="gold" style={{ width: `${W}px`, height: `${H}px`, transform: at(key) }} />}</For>
      <For each={teasing()}>{r => <div class="tease" style={{ width: `${W}px`, height: `${rows * H}px`, transform: `translateX(${r * (W + GAP)}px)` }} />}</For>
      <For each={gems()}>
        {g => (
          <div class={`gem ${g.state()}`} style={{ width: `${W}px`, height: `${H}px`, transform: `translate(${g.reel * (W + GAP)}px, ${g.row() * H}px)` }}>
            <Cell cell={g.cell} />
          </div>
        )}
      </For>
      <Show when={sweep()}>
        <svg class="sweep" viewBox={`0 0 ${WIDTH} ${rows * H}`}>
          <For each={['#e8322f', '#ffc83d', '#3ddc6a', '#3f8cff']}>
            {(color, i) => {
              const r = WIDTH / 2 - 30 - i() * 28
              return <path pathLength="1" stroke={color} d={`M${WIDTH / 2 - r} ${rows * H + 40}A${r} ${r} 0 0 1 ${WIDTH / 2 + r} ${rows * H + 40}`} />
            }}
          </For>
        </svg>
      </Show>
      <For each={list(round()?.items)}>
        {(item, i) => (
          <div
            class="prize"
            classList={{ flown: !!flown(item) }}
            style={{ width: `${W}px`, height: `${H}px`, transform: flown(item) ? `${at(flown(item) as number)} scale(.3)` : at(item.key), '--wait': `${i() * 22}ms` }}
          >
            <div
              classList={{ boosted: item.key in worths(), struck: !item.mult && reached() === item.key, cast: casting(item), gulp: gulping(item), held: !!item.held }}
              style={{ 'animation-delay': `${i() * 45}ms` }}
            >
              <svg viewBox="0 0 100 100">
                <use href={`#s-${item.kind === 'coin' ? `coin${item.tier}` : item.kind}`} />
              </svg>
              <b>
                {item.mult ? (
                  `×${item.mult}`
                ) : (
                  <>
                    {waiting(item) ? `×${waiting(item)}` : ''}
                    <Count value={worth(item)} ms={item.kind === 'pot' && !item.held ? 900 : 300} />
                  </>
                )}
              </b>
            </div>
            <Show when={casting(item) || gulping(item)}>
              <i classList={{ gold: gulping(item) }} />
            </Show>
          </div>
        )}
      </For>
      <Show when={reached()}>{key => <div class="marker" style={{ width: `${W}px`, height: `${H}px`, transform: at(key()) }} />}</Show>
      <Impacts hits={fx.hits()} />
      <Callout call={call()} />
      <Show when={banner()}>
        {amount => (
          <div class="pop">
            <span>{props.step?.full ? tr('full_screen_mult', { mult: props.step.full }) : tr('rainbow')}</span>
            <b>{format(amount())}</b>
          </div>
        )}
      </Show>
    </div>
  )
}
