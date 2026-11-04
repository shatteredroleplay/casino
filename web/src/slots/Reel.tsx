import { createEffect, createSignal, Index, on, onCleanup, Show, untrack } from 'solid-js'
import Cell from './Cell'
import { randomCell, rows } from './config'

type Props = {
  column: string[]
  spin: number
  duration: number
  height: number
  duel?: number
  // one scatter short of the free spins: the reel glows and takes its time
  tease?: boolean
  state: (row: number) => string
}

// the duel's multiplier rolls through the values it could have been before it settles, faster then slower
const values = [2, 3, 4, 5, 6, 8, 10, 20, 25, 50, 100]
const Roll = (props: { to: number }) => {
  const [shown, setShown] = createSignal(values[0])
  let wait = 30
  let timer = 0
  const tick = () => {
    if (wait > 200) return setShown(props.to)
    setShown(values[Math.floor(Math.random() * values.length)])
    wait *= 1.3
    timer = setTimeout(tick, wait)
  }
  tick()
  onCleanup(() => clearTimeout(timer))
  return <b classList={{ settled: shown() === props.to && wait > 200 }}>×{shown()}</b>
}

export default function Reel(props: Props) {
  let strip!: HTMLDivElement
  let anim: Animation | undefined
  // one extra cell above the window, so the bounce at the stop never shows a gap
  const [cells, setCells] = createSignal([randomCell(), ...props.column])
  // the cells the reel runs through stay on the strip between spins, a spin only changes the ones that show what lands
  // and what was there. a new strip on every spin made the page stutter as the reels started
  const fill: string[] = []
  // the symbols stretch while the reel runs, and the reel flashes as it stops
  const [running, setRunning] = createSignal(false)
  const [landed, setLanded] = createSignal(0)
  const [still, setStill] = createSignal(true)

  createEffect(
    on(
      () => props.spin,
      () => {
        const run = Math.round((props.duration * 2.8) / props.height)
        while (fill.length < run + rows) fill.push(randomCell())
        const all = [randomCell(), ...props.column, ...fill]
        all.splice(rows + 1 + run, rows, ...untrack(cells).slice(1, rows + 1))
        setCells(all)
        setRunning(true)
        setStill(false)
        anim?.cancel()
        anim = strip.animate(
          [
            { transform: `translateY(${-(run + rows) * props.height}px)`, easing: 'cubic-bezier(.4,0,.8,.8)' },
            { transform: 'translateY(22px)', offset: 0.9, easing: 'ease-out' },
            { transform: 'translateY(0)' },
          ],
          { duration: props.duration },
        )
        setTimeout(() => setRunning(false), props.duration * 0.86)
        anim.onfinish = () => {
          setStill(true)
          setLanded(n => n + 1)
        }
      },
      { defer: true },
    ),
  )

  return (
    <div class="reel" classList={{ running: running(), still: still(), teasing: !!props.tease }}>
      <div class="strip" ref={strip} style={{ 'margin-top': `${-props.height}px` }}>
        <Index each={cells()}>
          {(cell, i) => (
            <div class={`cell ${i <= rows ? props.state(i - 1) : 'spare'}`} style={{ height: `${props.height}px` }}>
              <Cell cell={cell()} />
            </div>
          )}
        </Index>
      </div>
      <Show when={landed()} keyed>
        {n => <i class="thud" data-n={n} />}
      </Show>
      <Show when={props.duel}>
        <div class="duel">
          <svg viewBox="0 0 100 100">
            <use href="#s-duel" />
          </svg>
          <Roll to={props.duel!} />
        </div>
      </Show>
    </div>
  )
}
