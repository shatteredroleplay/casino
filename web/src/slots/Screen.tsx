import { batch, createEffect, createSignal, For, Index, on, onCleanup, Show } from 'solid-js'
import Backdrop from './Backdrop'
import Cluster from './Cluster'
import FistBoard from './Fist'
import { fit } from './fit'
import { config, format, list, type Message, type Note, pace, reels, type Step, stopAt, T, title, tr } from './config'
import Lines from './Lines'
import { act } from './nui'
import { setVolume, sfx } from './sound'
import Infinity from './Infinity'
import Spots from './Spots'
import Stack from './Stack'
import Tumble from './Tumble'
import Ways from './Ways'
import Wheel from './Wheel'

type Round = Extract<Message, { type: 'spin' }>
type Buy = Extract<Message, { type: 'buy' }>
type Games = Extract<Message, { type: 'games' }>

// the idle pictures of every game sit next to the built page: web/slots/idle
const pictures = new URL(`./slots/idle/${config.idle ?? 'en'}/`, location.href).href

const Board = { lines: Lines, cluster: Cluster, ways: Ways, tumble: Tumble, spots: Spots, stack: Stack, infinity: Infinity, fist: FistBoard }[config.kind]

// the feature shown next to the board: symbol, name, what it does
const feature = {
  holmgang: ['duel', tr('f_holmgang'), '×2 – ×100'],
  vildmark: ['wild', tr('f_vildmark'), tr('f_vildmark_text')],
  fyllekak: ['rainbow', tr('f_fyllekak'), tr('f_fyllekak_text')],
  ubaten: ['wild', tr('f_ubaten'), tr('f_ubaten_text')],
  farao: ['scatter', tr('f_farao'), tr('f_farao_text')],
  olympen: ['orb', tr('f_olympen'), '×2 – ×500'],
  andjakt: ['bomb', tr('f_andjakt'), tr('f_andjakt_text')],
  ronin: ['reveal', tr('f_ronin'), tr('f_ronin_text')],
  gruvan: ['dynamite', tr('f_gruvan'), tr('f_gruvan_text')],
  jarnnave: ['redfist', tr('f_jarnnave'), '×2 – ×200'],
  any: [],
}[config.id]!

// farao: the symbols the book turns its pages through
const pages = list(config.symbols).filter(s => s.pays && !s.wild).map(s => s.id)

// the free spins a game has to give: picked by the wheel, or by how many scatters landed
const wheel: NonNullable<typeof config.modes> = config.wheel ?? config.modes ?? []

// andjakten: the lucky draw wheel, half of it the first kind of free spins, a quarter each the other two
const draws = ['hunt', 'hunt', 'hawk', 'big']

// a wheel on the screen: what is on it, where it stops, its title and what it says once it has stopped
type Spin = { title: string; items: { icon: string; label?: string }[]; index: number; ms: number; result: string }

const Icon = (props: { id: string }) => (
  <svg viewBox="0 0 100 100">
    <use href={`#s-${props.id}`} />
  </svg>
)

// the same scatter of sparks every time: left, delay, how long it falls, size, how far it turns
const sparks = Array.from({ length: 44 }, (_, i) => ({ x: (i * 37) % 100, wait: (i * 173) % 1700, fall: 1600 + ((i * 89) % 1400), size: 14 + ((i * 7) % 18), turn: (i % 2 ? 1 : -1) * (180 + ((i * 53) % 540)) }))

// light turning behind a celebration, and coins raining down through it
const Rays = () => <div class="rays" />
const Rain = (props: { count?: number }) => (
  <div class="rain">
    <For each={sparks.slice(0, props.count ?? sparks.length)}>
      {p => <i style={{ left: `${p.x}%`, width: `${p.size}px`, height: `${p.size}px`, 'animation-delay': `${p.wait}ms`, 'animation-duration': `${p.fall}ms`, '--turn': `${p.turn}deg` }} />}
    </For>
  </div>
)

// a title that drops in one letter at a time
const Letters = (props: { text: string; wait?: number }) => (
  <h2 class="letters" style={{ 'font-size': `${Math.min(124, Math.floor(1900 / props.text.length))}px` }}>
    <For each={[...props.text]}>{(c, i) => <span style={{ 'animation-delay': `${(props.wait ?? 0) + i() * 45}ms` }}>{c === ' ' ? ' ' : c}</span>}</For>
  </h2>
)

// järnnäven: a team's fighter beside the board. in the free spins its level and the victory points on the way to an epic drop
const Team = (props: { id: 'red' | 'blue'; fighter: string; teams?: NonNullable<Step['teams']> }) => {
  const now = () => props.teams?.[props.id]
  return (
    <aside class={`team ${props.id}`}>
      <Icon id={props.fighter} />
      <b>{tr(props.id === 'red' ? 'team_red' : 'team_blue')}</b>
      <Show when={now()} fallback={<span>{tr('fist_range')}</span>}>
        {n => (
          <>
            <span>{tr('level', { n: n()[1] })}</span>
            <div class="points">
              <For each={[0, 1, 2]}>{i => <i classList={{ on: i < n()[0] }} />}</For>
            </div>
          </>
        )}
      </Show>
    </aside>
  )
}

// the tiers a win climbs through while it counts up, in times the bet
const tiers: [number, string][] = [
  [100, tr('tier_epic')],
  [50, tr('tier_mega')],
  [20, tr('tier_big')],
]

// a big win or the total of the free spins: the amount counts up and the label climbs the tiers it passes, the max win shakes the screen
function Celebrate(props: { amount: number; bet: number; label: string; maxed: boolean; ms: number }) {
  const [shown, setShown] = createSignal(0)
  const tier = () => (props.maxed && shown() >= props.amount ? config.maxLabel ?? tr('max_win') : tiers.find(([x]) => shown() >= props.bet * x)?.[1] ?? props.label)
  const start = performance.now()
  let frame = 0
  const tick = () => {
    const p = Math.min((performance.now() - start) / props.ms, 1)
    setShown(props.amount * (1 - (1 - p) ** 2.4))
    if (p < 1) frame = requestAnimationFrame(tick)
  }
  tick()
  // every tier it climbs to rings once
  createEffect(on(tier, (t, before) => before && t !== before && sfx.mult(), { defer: false }))
  onCleanup(() => cancelAnimationFrame(frame))
  return (
    <div class="overlay celebrate" classList={{ max: props.maxed }}>
      <Rays />
      <Rain />
      <Show when={props.maxed}>
        <div class="bolts" />
      </Show>
      <Show when={tier()} keyed>
        {t => <p class="tier">{t}</p>}
      </Show>
      <h2 class="amount" classList={{ done: shown() >= props.amount }}>
        {format(shown())}
      </h2>
      <Show when={props.maxed}>
        <span class="stamp">×{format(config.max)}</span>
      </Show>
      <small>{tr('times_bet', { mult: format(props.amount / props.bet) })}</small>
    </div>
  )
}

export default function Screen() {
  const [seated, setSeated] = createSignal(false)
  const [bet, setBet] = createSignal(0)
  const [ante, setAnte] = createSignal(false)
  const [phase, setPhase] = createSignal<'idle' | 'play' | 'done'>('idle')
  const [step, setStep] = createSignal<Step>()
  const [overlay, setOverlay] = createSignal<'wheel' | 'explore' | 'book' | 'upgrades' | 'intro' | 'outro' | 'big'>()
  // farao: the page the book is open on, and the expanding symbols of the free spins so far
  const [page, setPage] = createSignal<{ id: string; found: boolean }>()
  const [expanding, setExpanding] = createSignal<string[]>([])
  // andjakten: the upgrades the free spins were dealt, and how many of them the wheel has given so far
  const [upgrades, setUpgrades] = createSignal<string[]>([])
  const [dealt, setDealt] = createSignal(0)
  // what the bar under the board says about the win or the feature on screen
  const [note, setNote] = createSignal<Note>()
  // the wheel spinning now, and whether it has stopped
  const [spinning, setSpinning] = createSignal<Spin>()
  const [stopped, setStopped] = createSignal(false)
  const spinWheel = (w: Spin) =>
    batch(() => {
      sfx.wheel()
      setStopped(false)
      setSpinning(w)
      setOverlay('wheel')
      later(w.ms + 100, () => (sfx.mult(), setStopped(true)))
    })
  const [bonus, setBonus] = createSignal(-1)
  const [payout, setPayout] = createSignal(0)
  const [win, setWin] = createSignal(0)
  const [demo, setDemo] = createSignal(0)
  const [buy, setBuy] = createSignal<Buy>()
  const [games, setGames] = createSignal<Games>()
  const [chips, setChips] = createSignal(0)
  const [bank, setBank] = createSignal<number>()
  // the map: opened()[n] is the tile the nth find went to
  const [opened, setOpened] = createSignal<number[]>([])
  // järnnäven: both teams' victory points and level in the free spins
  const [teams, setTeams] = createSignal<NonNullable<Step['teams']>>()
  const [cursor, setCursor] = createSignal(0)
  let exploring: Step | undefined

  let timers: number[] = []
  let frame = 0
  const later = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms))

  const [rest, setRest] = createSignal(true)
  let restTimer = 0
  createEffect(
    on(phase, p => {
      clearTimeout(restTimer)
      setRest(p === 'idle')
      if (p === 'done') restTimer = setTimeout(() => setRest(true), 5000)
    }),
  )
  onCleanup(() => clearTimeout(restTimer))

  const attract = () => !seated() && phase() === 'idle'
  const maxed = () => payout() >= bet() * config.max

  // the screen flashes when a lot is won at once, and the win in the corner pulses while it counts
  const [flash, setFlash] = createSignal(0)
  const [counting, setCounting] = createSignal(false)
  let countTimer = 0

  // counts the win in the corner up to the new total
  const show = (to: number) => {
    const from = win()
    if (to - from >= bet() * 10) setFlash(n => n + 1)
    clearTimeout(countTimer)
    setCounting(true)
    countTimer = setTimeout(() => setCounting(false), 700)
    const start = performance.now()
    cancelAnimationFrame(frame)
    const tick = () => {
      const p = Math.min((performance.now() - start) / 600, 1)
      setWin(from + (to - from) * (1 - (1 - p) ** 3))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    tick()
  }

  const reset = () =>
    batch(() => {
      timers.forEach(clearTimeout)
      timers = []
      cancelAnimationFrame(frame)
      pace(false)
      setPhase('idle')
      setStep()
      setOverlay()
      setNote()
      setPayout(0)
      setWin(0)
      setBonus(-1)
      setBank()
      setPage()
      setExpanding([])
      setUpgrades([])
      setDealt(0)
      setTeams()
      exploring = undefined
    })

  // the next find goes to the tile under the cursor, or to any closed one
  const open = () => {
    const s = exploring
    const e = s?.explore
    if (!s || !e || opened().length > list(e.items).length) return
    const closed = Array.from({ length: 20 }, (_, i) => i).filter(i => !opened().includes(i))
    const tile = seated() && closed.includes(cursor()) ? cursor() : closed[Math.floor(Math.random() * closed.length)]
    const found = list(e.items).slice(0, opened().length + 1)
    found.length > opened().length ? sfx.pop(opened().length) : e.bonus === 'x' ? sfx.stop() : sfx.mult()
    setOpened(o => [...o, tile])
    show(Math.max(s.total - s.win, Math.min(s.total, s.total - e.win + found.reduce((sum, n) => sum + n, 0))))
  }

  const play = (round: Round) => {
    const steps = list(round.steps)
    let t = 0
    setVolume(round.volume ?? 1)
    setBet(round.bet)
    setAnte(!!round.ante)
    setPayout(round.payout)
    setChips(c => c - round.cost)
    setPhase('play')

    for (const s of steps) {
      // the times of a free spin are its own, faster ones: while it is planned here and while it is on screen
      pace(s.free)
      const end = t + s.time - (s.last ? T.Outro : 0)
      later(t, () =>
        batch(() => {
          pace(s.free)
          setOverlay()
          setNote()
          setStep(s)
        }),
      )
      // the multiplier of the free spins grows when the duels of the spin have landed
      if (config.kind === 'lines' && s.bank) later(t + stopAt(reels - 1, s.free) + 100, () => setBank(s.bank))
      const intro = s.trigger || s.extra ? T.Intro : 0
      // olympen: the multiplier the orbs of the free spins have built, once this spin's have gone into it
      if (config.kind === 'tumble' && s.bank) later(end - intro - 100, () => setBank(s.bank))
      // farao: the book turns its pages faster and faster, then slows down and stops on the new expanding symbol
      const book = s.expand ? T.Book : 0
      if (s.expand) {
        const at = end - intro - book
        later(at, () =>
          batch(() => {
            sfx.bonus()
            setPage({ id: pages[0], found: false })
            setOverlay('book')
          }),
        )
        let flip = 0
        for (let n = 0, gap = 60; flip + gap < book - 1100; n++, gap *= 1.09) {
          flip += gap
          const id = pages[n % pages.length]
          later(at + flip, () => (sfx.pop(0), setPage({ id, found: false })))
        }
        later(at + book - 1000, () =>
          batch(() => {
            sfx.mult()
            setPage({ id: s.expand!, found: true })
            setExpanding(e => [...e, s.expand!])
          }),
        )
      }
      // andjakten: the upgrade wheel spins once for every upgrade the free spins get, then they are all shown together
      const ups = list(s.upgrades)
      const deal = s.upgrades ? ups.length * T.Upgrade + 1500 : 0
      const all = list(config.upgrades)
      ups.forEach((id, i) =>
        later(end - intro - deal + i * T.Upgrade, () => {
          setUpgrades(ups.slice(0, i))
          spinWheel({
            title: `Uppgradering ${i + 1} av ${ups.length}`,
            items: all.map(u => ({ icon: `up-${u.id}` })),
            index: all.findIndex(u => u.id === id),
            ms: T.Upgrade - 900,
            result: all.find(u => u.id === id)?.label ?? '',
          })
          later(T.Upgrade - 700, () => setUpgrades(ups.slice(0, i + 1)))
        }),
      )
      if (s.upgrades) {
        later(end - intro - 1500, () =>
          batch(() => {
            sfx.bonus()
            setDealt(ups.length)
            setOverlay('upgrades')
          }),
        )
      }
      // the lucky draw: the wheel picks which free spins were bought
      if (s.drawn) {
        const pick = s.drawn === 'hunt' ? Math.floor(Math.random() * 2) : draws.indexOf(s.drawn)
        later(end - intro - deal - T.Draw, () =>
          spinWheel({
            title: 'Lyckodragningen',
            items: draws.map(id => ({ icon: 'scatter', label: wheel.find(m => m.id === id)?.label })),
            index: pick,
            ms: T.Draw - 1300,
            result: wheel.find(m => m.id === s.drawn)?.label ?? '',
          }),
        )
      }
      // järnnäven: the teams start on the level of their free spins, and the points of a spin count once its fists are up
      if (config.kind === 'fist' && s.trigger) {
        const level = wheel.find(m => m.id === s.mode)?.level ?? 3
        later(end - intro, () => setTeams({ red: [0, level], blue: [0, level] }))
      }
      if (s.teams) {
        const up = list(s.fists).reduce((sum, f) => sum + T.Fist + list(f.punches).length * T.Punch, 0)
        later(t + stopAt(reels - 1, s.free) + 100 + (s.drop ? T.Drop : 0) + up, () => setTeams(s.teams))
      }
      const map = (s.explore ? end - intro - s.explore.time : end - intro) - book - deal - (s.drawn ? T.Draw : 0)
      if (s.bonus) {
        later(map - T.Wheel, () => {
          const index = wheel.findIndex(b => b.id === s.bonus)
          setBonus(index)
          spinWheel({ title: config.bonus.name, items: wheel.map(b => ({ icon: b.id, label: b.label })), index, ms: T.Wheel - 900, result: wheel[index]?.label ?? '' })
        })
      }
      // a tile opens by itself when its time is up and you have not opened it
      if (s.explore) {
        later(map, () =>
          batch(() => {
            exploring = s
            setOpened([])
            setCursor(0)
            setOverlay('explore')
          }),
        )
        for (let n = 0; n <= list(s.explore.items).length; n++) later(map + (n + 1) * T.Pick, () => opened().length <= n && open())
      }
      if (intro) {
        later(end - intro, () => {
          sfx.bonus()
          const id = s.explore?.bonus ?? s.mode
          if (id) setBonus(wheel.findIndex(b => b.id === id))
          setOverlay('intro')
        })
      }
      if (s.last) {
        later(end, () => {
          maxed() ? sfx.bell() : sfx.fanfare()
          setOverlay('outro')
        })
      }
      t += s.time
    }
    pace(false)

    later(t, () =>
      batch(() => {
        pace(false)
        setPhase('done')
        show(round.payout)
        const big = steps.length === 1 && round.payout >= round.bet * 20
        if (big) maxed() ? sfx.bell() : sfx.fanfare()
        setOverlay(big ? 'big' : undefined)
        if (big) later(5500, () => overlay() === 'big' && setOverlay())
        if (!seated()) later(6000, reset)
      }),
    )
  }

  const onMessage = ({ data }: MessageEvent<Message>) =>
    batch(() => {
      // a hidden screen is silent too, its sound stops running until the next round sets the volume again
      if (data.type === 'sleep') return setVolume(0)
      if (data.type === 'chips') return setChips(data.chips)
      if (data.type === 'volume') return setVolume(data.volume)
      if (data.type === 'pick') {
        if (overlay() !== 'explore') return
        setCursor(c => ((c % 5) + (data.dx ?? 0) + 5) % 5 + 5 * ((Math.floor(c / 5) + (data.dy ?? 0) + 4) % 4))
        return data.open && open()
      }
      // the buy menu opens over whatever the screen shows
      setBuy(data.type === 'buy' && data.index ? data : undefined)
      setGames(data.type === 'games' && data.index ? data : undefined)
      if (data.type === 'buy' || data.type === 'games') return
      reset()
      if (data.type === 'spin') return play(data)
      setSeated(data.seated)
      if (data.bet) setBet(data.bet)
      setAnte(!!data.ante)
    })

  // the reels turn now and then while nobody is playing
  const idle = setInterval(() => attract() && !config.scale && setDemo(n => n + 1), 9000)

  window.addEventListener('message', onMessage)
  onCleanup(() => {
    window.removeEventListener('message', onMessage)
    clearInterval(idle)
    reset()
  })

  const status = () => {
    if (phase() === 'idle') return tr('press_spin')
    if (phase() === 'done') return payout() ? tr('win_amount', { amount: format(payout()) }) : tr('no_win')
    return step()?.free ? tr('free_of', { n: step()!.free!, of: step()!.of! }) : tr('good_luck')
  }

  return (
    <div class="screen" classList={{ attract: attract(), bonus: !!step()?.free, rest: rest(), quake: maxed() && (overlay() === 'outro' || overlay() === 'big') }}>
      <Backdrop />
      <div class="glow" />

      <header>
        <h1>{title}</h1>
        <Show when={step()?.free} fallback={<p>{ante() ? tr('ante_tag') : config.tag}</p>}>
          <div class="pills">
            <Show when={wheel[bonus()]}>
              {b => (
                <span>
                  {b().label}
                  {config.wheel && ` · ${b().text}`}
                </span>
              )}
            </Show>
            <Show when={bank()}>
              <span>×{bank()}</span>
            </Show>
            {/* andjakten: the upgrades of these free spins */}
            <Show when={upgrades().length}>
              <span class="ups">
                <For each={upgrades()}>{id => <Icon id={`up-${id}`} />}</For>
              </span>
            </Show>
            <For each={expanding()}>
              {id => (
                <span class="symbol">
                  <Icon id={id} />
                </span>
              )}
            </For>
            {/* how close the gold is to a full screen */}
            <Show when={config.kind === 'cluster'}>
              <span>
                {tr('gold', { n: list(step()!.gold).length, of: reels * config.rows })}
              </span>
            </Show>
            <b>
              {tr('free_short', { n: step()!.free!, of: step()!.of! })}
            </b>
          </div>
        </Show>
      </header>

      <main>
        <Show when={config.kind === 'fist'}>
          <Team id="red" fighter="blonde" teams={teams()} />
        </Show>
        <Show when={config.rows > 3 && config.kind !== 'fist'}>
          <aside>
            <Icon id="scatter" />
            <b>{tr('scatters', { count: config.bonus.scatters })}</b>
            <span>{config.bonus.spins ? tr('free_spins', { count: config.bonus.spins }) : config.bonus.name}</span>
          </aside>
        </Show>
        <div class="frame">
          <Board step={step()} demo={demo()} bet={bet()} show={show} say={setNote} />
        </div>
        <Show when={config.kind === 'fist'}>
          <Team id="blue" fighter="masked" teams={teams()} />
        </Show>
        <Show when={config.rows > 3 && config.kind !== 'fist'}>
          <aside>
            <Icon id={feature[0]} />
            <b>{feature[1]}</b>
            <span>{feature[2]}</span>
          </aside>
        </Show>
      </main>

      <footer>
        <div class="stat">
          <span>{tr('bet')}</span>
          <b>{format(Math.ceil(bet() * (ante() ? config.bonus.ante : 1)))}</b>
          <Show when={seated()}>
            <small>
              <span>{tr('chips')}</span> {format(chips())}
            </small>
          </Show>
        </div>
        <div class="status" classList={{ won: phase() === 'done' && payout() > 0 }}>
          <Show when={note()} fallback={<p>{status()}</p>} keyed>
            {n => (
              <p class="note">
                <Show when={n.icon}>{icon => <Icon id={icon()} />}</Show>
                {n.text}
              </p>
            )}
          </Show>
          <Show when={seated() && phase() !== 'play'}>
            <span>
              {tr('footer_keys', { buy: format(Math.ceil(bet() * config.bonus.buy)), ante: tr(ante() ? 'on' : 'off') })}
            </span>
          </Show>
        </div>
        <div class="stat">
          <span>{tr('win')}</span>
          <b classList={{ counting: counting() }}>{format(win())}</b>
        </div>
      </footer>

      <Show when={overlay() === 'wheel' && spinning()} keyed>
        {w => (
          <div class="overlay spin">
            <p>{w.title}</p>
            <Wheel items={w.items} index={w.index} ms={w.ms} />
            <h3 classList={{ shown: stopped() }}>{w.result}</h3>
            <Show when={upgrades().length}>
              <div class="chips">
                <For each={upgrades()}>
                  {id => (
                    <span>
                      <Icon id={`up-${id}`} />
                      {config.upgrades?.find(u => u.id === id)?.label}
                    </span>
                  )}
                </For>
              </div>
            </Show>
          </div>
        )}
      </Show>

      <Show when={overlay() === 'explore' && exploring?.explore}>
        {e => (
          <div class="overlay explore">
            <p>{wheel[bonus()]?.label}</p>
            <div class="tiles">
              <Index each={Array(20)}>
                {(_, tile) => {
                  const found = () => opened().indexOf(tile)
                  return (
                    <div classList={{ on: seated() && cursor() === tile, open: found() >= 0 }}>
                      <Show when={found() >= 0} fallback={<Icon id="binoculars" />}>
                        <Show when={found() < list(e().items).length} fallback={e().bonus === 'x' ? <strong>✕</strong> : <Icon id={e().bonus} />}>
                          <b>{format(e().items[found()])}</b>
                        </Show>
                      </Show>
                    </div>
                  )
                }}
              </Index>
            </div>
            <Show when={seated()}>
              <small>{tr('map_help')}</small>
            </Show>
          </div>
        )}
      </Show>

      <Show when={overlay() === 'upgrades'}>
        <div class="overlay upgrades">
          <p>{tr('upgrades')}</p>
          <div class="deck">
            <For each={upgrades()}>
              {(id, i) => {
                const u = config.upgrades?.find(u => u.id === id)
                return (
                  <div classList={{ up: i() < dealt() }} style={{ 'animation-delay': `${i() * 120}ms` }}>
                    <div class="back">
                      <Icon id="scatter" />
                    </div>
                    <div class="face">
                      <Icon id={`up-${id}`} />
                      <b>{u?.label}</b>
                      <span>{u?.text}</span>
                    </div>
                  </div>
                )
              }}
            </For>
          </div>
        </div>
      </Show>

      <Show when={overlay() === 'book' && page()}>
        {p => (
          <div class="overlay book">
            <p>{p().found ? tr('expanding') : tr('book_picks')}</p>
            <div class="pages" classList={{ found: p().found }}>
              <Icon id={p().id} />
            </div>
          </div>
        )}
      </Show>

      {/* the free spins start: light bursts out of the scatter, the name drops in and the spins are stamped on */}
      <Show when={overlay() === 'intro'}>
        <div class="overlay intro">
          <Rays />
          <div class="rings">
            <i />
            <i />
            <i />
          </div>
          <Show
            when={step()?.trigger}
            fallback={
              <>
                <Icon id="scatter" />
                <Letters text={tr('extra_spins', { count: step()?.extra ?? 0 })} />
                <Show when={step()?.mode}>
                  <p class="rise">{wheel[bonus()]?.label}</p>
                </Show>
                <Rain count={18} />
              </>
            }
          >
            <Icon id={wheel[bonus()]?.icon ?? wheel[bonus()]?.id ?? 'scatter'} />
            <Letters text={wheel[bonus()]?.label ?? config.bonus.name} wait={350} />
            <p class="rise">{wheel[bonus()]?.text}</p>
            <span class="stamp">{tr('free_spins', { count: step()!.trigger })}</span>
          </Show>
        </div>
      </Show>

      <Show when={overlay() === 'outro' || overlay() === 'big'}>
        <Celebrate amount={payout()} bet={bet()} label={overlay() === 'outro' ? tr('total_win') : tr('win')} maxed={maxed()} ms={overlay() === 'outro' ? 2600 : 2200} />
      </Show>

      <Show when={flash()} keyed>
        {n => <div class="flash" data-n={n} />}
      </Show>

      <Show when={games()}>
        {g => (
          <div class="overlay lobby">
            <button class="close" onClick={() => act('close')}>
              ✕
            </button>
            <Show when={list(g().options)[g().index! - 1]} keyed>
              {o => <img class="backdrop-dim" src={`${pictures}${o.id}_screen.png`} />}
            </Show>
            <Show when={list(g().options)[g().index! - 1]} keyed>
              {o => (
                <div class="feature">
                  <div class="preview">
                    <img src={`${pictures}${o.id}_screen.png`} />
                    <Show when={o.id === config.id}>
                      <em>{tr('playing_now')}</em>
                    </Show>
                  </div>
                  <div class="info">
                    <h3>{o.label}</h3>
                    <p>{o.tag}</p>
                    <ul>
                      <li>
                        <span>{tr('bonus')}</span> {o.bonus}
                      </li>
                      <li>
                        <span>{tr('rtp')}</span> {o.rtp}%
                      </li>
                      <li>
                        <span>{tr('max_win')}</span> ×{format(config.max)}
                      </li>
                    </ul>
                    <button class="play" onClick={() => act('game', o.id)}>
                      {o.id === config.id ? tr('keep_playing') : tr('play_game')}
                    </button>
                  </div>
                </div>
              )}
            </Show>
            <div class="dock">
              <For each={list(g().options)}>
                {(o, i) => (
                  <div classList={{ on: i() + 1 === g().index, now: o.id === config.id }} onClick={() => (i() + 1 === g().index ? act('game', o.id) : act('select', i() + 1))}>
                    <img src={`${pictures}${o.id}_screen.png`} />
                    <b>{o.label}</b>
                  </div>
                )}
              </For>
            </div>
            <small>{tr('menu_help')}</small>
          </div>
        )}
      </Show>

      <Show when={buy()}>
        {b => (
          <div class="overlay buy">
            <button class="close" onClick={() => act('close')}>
              ✕
            </button>
            <p>{tr('buy_title')}</p>
            <div class="cards">
              <For each={list(b().options)}>
                {(o, i) => (
                  <div classList={{ on: i() + 1 === b().index }} onClick={() => act('buy', i() + 1)}>
                    <b>{o.label}</b>
                    <span>{o.text}</span>
                    <strong>{format(o.cost)}</strong>
                  </div>
                )}
              </For>
            </div>
            <small>{tr('buy_help')}</small>
          </div>
        )}
      </Show>

      <div class="idle">
        <h1 ref={fit(1180)}>{title}</h1>
        <i />
        <p ref={fit(1180)}>{tr('sit_to_play')}</p>
        <small>{tr('responsible')}</small>
      </div>
    </div>
  )
}
