import { For } from 'solid-js'
import { Bonus, ink, ring, Sparkle } from './shared'

type Point = [number, number]

const gold = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff3b0" />
    <stop offset=".45" stop-color="#f2b632" />
    <stop offset="1" stop-color="#9a5a10" />
  </linearGradient>
)

const path = (points: Point[]) => points.map(p => p.join(',')).join(' ')

// a cut stone: an outline, a table in the middle and facets from it to every corner
const Gem = (props: { id: string; light: string; dark: string; outline: Point[]; table: Point[] }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <defs>
      <linearGradient id={`${props.id}-cut`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color={props.light} />
        <stop offset="1" stop-color={props.dark} />
      </linearGradient>
    </defs>
    <polygon points={path(props.outline)} fill={`url(#${props.id}-cut)`} {...ink} />
    <For each={props.outline}>{(p, i) => <path d={`M${p.join(' ')}L${props.table[i() % props.table.length].join(' ')}`} stroke="#1b1220" stroke-width="2" opacity=".35" />}</For>
    <polygon points={path(props.table)} fill={props.light} opacity=".75" {...ink} stroke-width="2.5" />
    <Sparkle x={36} y={30} size={8} />
  </symbol>
)

// the mountain of the gods: zeus, the orbs of his lightning, the treasure of the temple and its stones
export default function Olympen() {
  return (
    <>
      <Bonus from="#fff6c8" to="#e89a12" band="#3a1a6a">
        <path d="M56 6L30 40H48L38 62L70 26H52Z" fill="#fff" {...ink} stroke-width="3.5" />
      </Bonus>

      {/* the orb: its multiplier is written over it on the board */}
      <symbol id="s-orb" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="orb-fill" cx=".38" cy=".32" r=".75">
            <stop offset="0" stop-color="#ffffff" />
            <stop offset=".35" stop-color="#9ad8ff" />
            <stop offset="1" stop-color="#3a2aa8" />
          </radialGradient>
          <radialGradient id="orb-glow">
            <stop offset=".55" stop-color="#9ad8ff" stop-opacity=".8" />
            <stop offset="1" stop-color="#9ad8ff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#orb-glow)" />
        <circle cx="50" cy="50" r="36" fill="url(#orb-fill)" {...ink} />
        <path d="M30 34L44 46L38 56L56 70" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity=".8" />
        <path d="M70 30L58 44L66 52L52 60" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".6" />
      </symbol>

      <symbol id="s-crown" viewBox="0 0 100 100">
        <defs>{gold('crown-gold')}</defs>
        <path d="M10 34L28 56L50 20L72 56L90 34L82 80H18Z" fill="url(#crown-gold)" {...ink} />
        <rect x="16" y="76" width="68" height="14" rx="4" fill="url(#crown-gold)" {...ink} stroke-width="3.5" />
        <For each={[[10, 30], [50, 16], [90, 30]]}>{([x, y]) => <circle cx={x} cy={y} r="7" fill="#fff3b0" {...ink} stroke-width="3" />}</For>
        <circle cx="50" cy="62" r="8" fill="#e8322f" {...ink} stroke-width="3" />
        <circle cx="30" cy="70" r="5" fill="#3f8cff" {...ink} stroke-width="2.5" />
        <circle cx="70" cy="70" r="5" fill="#3ddc6a" {...ink} stroke-width="2.5" />
      </symbol>

      <symbol id="s-hourglass" viewBox="0 0 100 100">
        <defs>{gold('hourglass-gold')}</defs>
        <path d="M30 14H70C70 40 54 44 54 50C54 56 70 60 70 86H30C30 60 46 56 46 50C46 44 30 40 30 14Z" fill="#d6f2ff" opacity=".85" {...ink} />
        <path d="M36 24H64C62 36 52 40 50 48C48 40 38 36 36 24ZM34 84C36 70 46 66 50 62C54 66 64 70 66 84Z" fill="#ffc83d" />
        <rect x="20" y="6" width="60" height="10" rx="4" fill="url(#hourglass-gold)" {...ink} stroke-width="3.5" />
        <rect x="20" y="84" width="60" height="10" rx="4" fill="url(#hourglass-gold)" {...ink} stroke-width="3.5" />
        <path d="M24 16V84M76 16V84" {...ink} stroke-width="5" />
      </symbol>

      <symbol id="s-ring" viewBox="0 0 100 100">
        <defs>{gold('ring-gold')}</defs>
        <ellipse cx="50" cy="64" rx="32" ry="28" fill="none" stroke="#1b1220" stroke-width="18" />
        <ellipse cx="50" cy="64" rx="32" ry="28" fill="none" stroke="url(#ring-gold)" stroke-width="10" />
        <path d="M30 30L38 14H62L70 30L50 46Z" fill="#e8322f" {...ink} />
        <path d="M30 30H70M38 14L44 30L50 46L56 30L62 14" fill="none" stroke="#1b1220" stroke-width="2" opacity=".5" />
        <Sparkle x={42} y={22} size={6} />
      </symbol>

      <symbol id="s-chalice" viewBox="0 0 100 100">
        <defs>{gold('chalice-gold')}</defs>
        <path d="M16 12H84C84 44 68 58 50 58C32 58 16 44 16 12Z" fill="url(#chalice-gold)" {...ink} />
        <path d="M44 58H56V78H44Z" fill="url(#chalice-gold)" {...ink} stroke-width="3.5" />
        <path d="M24 92C24 80 76 80 76 92Z" fill="url(#chalice-gold)" {...ink} />
        <circle cx="50" cy="34" r="8" fill="#3f8cff" {...ink} stroke-width="3" />
        <path d="M22 18C30 22 70 22 78 18" fill="none" stroke="#7a1f3a" stroke-width="5" stroke-linecap="round" />
      </symbol>

      <Gem id="ruby" light="#ff8a8a" dark="#a0101c" outline={ring(6, 42, 42, 1 / 12)} table={ring(6, 20, 20, 1 / 12)} />
      <Gem id="amethyst" light="#e0a8ff" dark="#5a1a9a" outline={[[50, 8], [88, 40], [50, 94], [12, 40]]} table={[[50, 30], [66, 42], [50, 62], [34, 42]]} />
      <Gem id="topaz" light="#fff0a0" dark="#c07a10" outline={ring(8, 42, 42, 1 / 16)} table={ring(8, 22, 22, 1 / 16)} />
      <Gem id="emerald" light="#a8ffcc" dark="#0a7a3a" outline={[[30, 10], [70, 10], [90, 30], [90, 70], [70, 90], [30, 90], [10, 70], [10, 30]]} table={[[38, 30], [62, 30], [70, 38], [70, 62], [62, 70], [38, 70], [30, 62], [30, 38]]} />
      <Gem id="sapphire" light="#a8d4ff" dark="#1a3aa8" outline={[[50, 92], [10, 40], [26, 14], [74, 14], [90, 40]]} table={[[50, 70], [30, 40], [38, 28], [62, 28], [70, 40]]} />
    </>
  )
}
