import { For } from 'solid-js'
import { Bonus, Face, Framed, ink, type Look, Sparkle } from './shared'

// the tiles every symbol sits on
const look: Look = { dark: '#1a120a', glow: '#c87a2a', frame: '#d88a4a', texture: 'rock' }
const glow: Record<string, string> = { wild: '#ffd23d', dynamite: '#ff3a1a', miner: '#ffc83d', canary: '#ffe03a', cart: '#ffc21f', lantern: '#ffb03a', pickaxe: '#a8b0c0', shovel: '#8a9aaa', helmet: '#ffc83d', coal: '#a8b8e0' }

// the gold mine: the miner and his canary, what he digs with and what he finds
export default function Gruvan() {
  return (
    <>
      <Bonus look={look} from="#fff3b0" to="#e8a21f" band="#5a3418">
        <path d="M30 40L50 14L70 40L58 48H42Z" fill="#ffd23d" {...ink} stroke-width="3" />
        <path d="M42 26L50 18L54 30" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" />
      </Bonus>

      {/* wild: a block of rock cracked open with gold inside */}
      <Framed id="wild" look={look} glow={glow.wild}>
        <path d="M10 30L30 10H72L92 32L86 84L60 94H24L8 74Z" fill="#5a4a3e" {...ink} />
        <path d="M26 30L44 20L64 34L76 26M18 60L38 54L50 66L72 58" fill="none" stroke="#ffd23d" stroke-width="6" stroke-linecap="round" />
        <rect x="12" y="38" width="76" height="24" rx="6" fill="#1b1220" stroke="#ffd23d" stroke-width="3" />
        <text x="50" y="57" text-anchor="middle" font-size="19" font-weight="700" letter-spacing="2" fill="#ffd23d">
          WILD
        </text>
        <Sparkle x={78} y={20} size={7} />
      </Framed>

      {/* dynamite: blasts one more reel open */}
      <Framed id="dynamite" look={look} glow={glow.dynamite}>
        <path d="M50 24C50 12 60 6 70 10" fill="none" {...ink} stroke-width="4" />
        <path d="M70 10L80 2M70 10L84 12M70 10L74 0" stroke="#ffc21f" stroke-width="4" stroke-linecap="round" />
        <circle cx="70" cy="10" r="5" fill="#fff3b0" />
        <For each={[28, 50, 72]}>{x => <rect x={x - 12} y="24" width="24" height="68" rx="8" fill="#e8322f" {...ink} stroke-width="3.5" />}</For>
        <rect x="10" y="48" width="80" height="14" rx="4" fill="#3a2a1a" {...ink} stroke-width="3" />
        <text x="50" y="59" text-anchor="middle" font-size="10" font-weight="700" fill="#ffd23d">
          TNT
        </text>
      </Framed>

      <Framed id="miner" look={look} glow={glow.miner} bust>
        <path d="M16 98C16 76 32 68 50 68C68 68 84 76 84 98Z" fill="#3a5a8a" {...ink} />
        <path d="M38 70V98M62 70V98" stroke="#ffc83d" stroke-width="6" />
        <path d="M28 42C28 26 72 26 72 42V56C72 70 62 76 50 76C38 76 28 70 28 56Z" fill="#ffcf9e" {...ink} />
        <path d="M30 56C30 80 70 80 70 56C64 66 36 66 30 56Z" fill="#c8c8d0" {...ink} stroke-width="3" />
        <path d="M22 40C22 18 78 18 78 40H22Z" fill="#ffc83d" {...ink} />
        <rect x="18" y="38" width="64" height="8" rx="4" fill="#e8a21f" {...ink} stroke-width="3" />
        <circle cx="50" cy="28" r="8" fill="#fff3b0" {...ink} stroke-width="3" />
        <path d="M50 20L50 6M44 22L36 10M56 22L64 10" stroke="#fff3b0" stroke-width="3" stroke-linecap="round" opacity=".8" />
        <Face x={50} y={52} gap={10} mouth="M45 62C48 64 52 64 55 62" />
      </Framed>

      <Framed id="canary" look={look} glow={glow.canary}>
        <path d="M20 90V40C20 16 80 16 80 40V90" fill="none" stroke="#c8a040" stroke-width="5" />
        <For each={[34, 50, 66]}>{x => <path d={`M${x} 22V90`} stroke="#c8a040" stroke-width="3" />}</For>
        <rect x="14" y="86" width="72" height="10" rx="3" fill="#c8a040" {...ink} stroke-width="3" />
        <circle cx="50" cy="10" r="6" fill="none" stroke="#c8a040" stroke-width="4" />
        <ellipse cx="52" cy="62" rx="20" ry="16" fill="#ffd23d" {...ink} />
        <circle cx="40" cy="46" r="13" fill="#ffd23d" {...ink} />
        <path d="M27 46L18 50L28 52Z" fill="#e8702a" {...ink} stroke-width="2.5" />
        <circle cx="38" cy="43" r="3" fill="#1b1220" />
        <path d="M54 60C62 56 70 60 72 66" fill="none" {...ink} stroke-width="3" />
        <path d="M30 76H76" stroke="#8a5a2a" stroke-width="5" />
      </Framed>

      <Framed id="cart" look={look} glow={glow.cart}>
        <For each={[[26, 30, 13], [46, 24, 15], [66, 30, 13], [36, 18, 9]]}>{([x, y, r], i) => <circle cx={x} cy={y} r={r} fill={i() === 1 ? '#ffd23d' : '#ffc21f'} {...ink} stroke-width="3" />}</For>
        <path d="M8 34H92L82 74H18Z" fill="#8a5a3a" {...ink} />
        <path d="M14 46H86M16 58H84" stroke="#1b1220" stroke-width="3" opacity=".5" />
        <For each={[30, 70]}>{x => <circle cx={x} cy="80" r="11" fill="#4a4a56" {...ink} />}</For>
        <path d="M4 94H96" stroke="#8a8a96" stroke-width="5" />
        <Sparkle x={58} y={14} size={6} />
      </Framed>

      <Framed id="lantern" look={look} glow={glow.lantern}>
        <circle cx="50" cy="56" r="34" fill="#ffd27a" opacity=".3" />
        <path d="M36 18C36 6 64 6 64 18" fill="none" {...ink} stroke-width="4" />
        <rect x="30" y="18" width="40" height="10" rx="3" fill="#3a3a44" {...ink} stroke-width="3" />
        <path d="M32 28H68L64 82H36Z" fill="#fff3b0" {...ink} />
        <path d="M50 44C44 54 46 64 50 68C54 64 56 54 50 44Z" fill="#ff8a1f" />
        <path d="M32 28L36 82M68 28L64 82M50 28V44" stroke="#3a3a44" stroke-width="3" />
        <rect x="28" y="82" width="44" height="10" rx="3" fill="#3a3a44" {...ink} stroke-width="3" />
      </Framed>

      <Framed id="pickaxe" look={look} glow={glow.pickaxe}>
        <path d="M26 88L66 32" stroke="#8a5a2a" stroke-width="10" stroke-linecap="round" />
        <path d="M26 88L66 32" fill="none" {...ink} stroke-width="2.5" />
        <path d="M30 18Q66 6 92 40Q66 26 52 30Q40 22 30 18Z" fill="#a8b0bc" {...ink} />
      </Framed>

      <Framed id="shovel" look={look} glow={glow.shovel}>
        <path d="M70 16L40 64" stroke="#8a5a2a" stroke-width="8" stroke-linecap="round" />
        <path d="M60 10H84V18H60Z" fill="#3a3a44" {...ink} stroke-width="3" transform="rotate(32 72 14)" />
        <path d="M30 56L50 70L34 94Q12 92 12 74Z" fill="#a8b0bc" {...ink} />
      </Framed>

      <Framed id="helmet" look={look} glow={glow.helmet}>
        <path d="M14 70C14 30 86 30 86 70Z" fill="#e8a21f" {...ink} />
        <rect x="6" y="68" width="88" height="12" rx="6" fill="#c8801a" {...ink} stroke-width="3" />
        <path d="M50 34V70" stroke="#c8801a" stroke-width="6" />
        <circle cx="50" cy="48" r="10" fill="#fff3b0" {...ink} stroke-width="3" />
      </Framed>

      <Framed id="coal" look={look} glow={glow.coal}>
        <path d="M16 54L30 26L60 18L84 40L80 72L54 86L22 78Z" fill="#2a2a32" {...ink} />
        <path d="M30 26L46 46L60 18M46 46L84 40M46 46L54 86M46 46L16 54" fill="none" stroke="#4a4a56" stroke-width="3" />
        <Sparkle x={66} y={34} size={5} />
      </Framed>
    </>
  )
}
