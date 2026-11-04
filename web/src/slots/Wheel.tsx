import { For } from 'solid-js'

// a wheel of fortune: slices in two colours with an icon and a name on each, it spins a few turns and stops with `index` under the pointer
export default function Wheel(props: { items: { icon: string; label?: string }[]; index: number; ms?: number }) {
  const slice = () => 360 / props.items.length
  const disc = () => `conic-gradient(${props.items.map((_, i) => `${i % 2 ? 'var(--bg1)' : 'var(--bg2)'} ${i * slice()}deg ${(i + 1) * slice()}deg`)})`
  return (
    <div class="wheel">
      <div class="disc" style={{ background: disc(), '--turn': `${1800 - (props.index + 0.5) * slice()}deg`, 'animation-duration': `${props.ms ?? 2500}ms` }}>
        <For each={props.items}>
          {(item, i) => (
            <div class="slice" style={{ transform: `rotate(${(i() + 0.5) * slice()}deg)` }}>
              <svg viewBox="0 0 100 100">
                <use href={`#s-${item.icon}`} />
              </svg>
              {item.label && <b>{item.label}</b>}
            </div>
          )}
        </For>
      </div>
      <i />
    </div>
  )
}
