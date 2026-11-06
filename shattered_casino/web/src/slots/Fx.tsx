import { createSignal, For, Show } from 'solid-js'

// what flies off a hit: shards of glass, wood splinters, rock, water drops, feathers, petals, crumbs, sparks or coins
export type Bits = 'shard' | 'splinter' | 'rock' | 'drop' | 'feather' | 'petal' | 'crumb' | 'spark' | 'coin'

// a hit somewhere on the board, x and y in px: a flash in its tone, the bits flying out, a ring and maybe a word.
// every game draws the flash, the ring and the word its own way (index.css)
type Hit = { x: number; y: number; tone: string; bits: Bits; word?: string; size: number; id: number }

// where every bit of a hit flies and how far it turns, the same every time
const spread = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + (i % 3) * 0.3
  const d = 80 + (i % 4) * 32
  return { x: Math.cos(a) * d, y: Math.sin(a) * d + 30, r: (i % 2 ? 1 : -1) * (120 + i * 30), size: 0.7 + (i % 3) * 0.3 }
})

let next = 0

// the hits on a board: hit() adds one, it goes again by itself
export const impacts = () => {
  const [hits, setHits] = createSignal<Hit[]>([])
  const hit = (x: number, y: number, o: { tone: string; bits: Bits; word?: string; size?: number }) => {
    const h = { x, y, size: 1, ...o, id: next++ }
    setHits(all => [...all, h])
    setTimeout(() => setHits(all => all.filter(a => a !== h)), 1100)
  }
  return { hits, hit, clear: () => setHits([]) }
}

export const Impacts = (props: { hits: Hit[] }) => (
  <For each={props.hits}>
    {h => (
      <div class={`impact ${h.bits}`} style={{ left: `${h.x}px`, top: `${h.y}px`, '--tone': h.tone, '--size': h.size }}>
        <i class="star" />
        <i class="ring" />
        <For each={spread}>{s => <i class="bit" style={{ '--x': `${s.x * h.size}px`, '--y': `${s.y * h.size}px`, '--r': `${s.r}deg`, '--s': s.size }} />}</For>
        <Show when={h.word}>
          <em class="word">{h.word}</em>
        </Show>
      </div>
    )}
  </For>
)

// the board jolts, harder the bigger power is
export const shaker = (el: () => HTMLElement | undefined) => (power: number) =>
  el()?.animate(
    [
      { transform: 'translate(0, 0)' },
      { transform: `translate(${-power}px, ${power * 0.6}px)` },
      { transform: `translate(${power * 0.8}px, ${-power * 0.5}px)` },
      { transform: `translate(${-power * 0.4}px, ${power * 0.3}px)` },
      { transform: 'translate(0, 0)' },
    ],
    { duration: 320 + power * 10, easing: 'ease-out' },
  )

// a call across the board: what it is, the symbol it is about and a line under it. every game dresses it in its own way
// (index.css): a carved plank in valhall, the northern lights in vildmark, a neon sign in nattkäk and so on
// small: a short call kept at the top of the board so what happens under it stays in sight
export type Call = { label: string; text?: string; tone?: string; icon?: string; small?: boolean }

export const Callout = (props: { call?: Call }) => (
  <Show when={props.call} keyed>
    {c => (
      <div class="callout" classList={{ small: !!c.small }} style={c.tone ? { '--tone': c.tone } : undefined}>
        <div class="sign">
          <div class="plate" />
          <div class="call">
            <Show when={c.icon}>
              <svg viewBox="0 0 100 100">
                <use href={`#s-${c.icon}`} />
              </svg>
            </Show>
            <span>{c.label}</span>
          </div>
          <Show when={c.text}>{text => <em>{text()}</em>}</Show>
        </div>
      </div>
    )}
  </Show>
)
