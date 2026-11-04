import { For } from 'solid-js'
import { Bonus, Framed, ink, Sparkle } from './shared'

// the food is drawn like the late-night menu board: a fine dark outline, a shadow down one side and a shine on top
const line = { stroke: '#1a0a14', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const

// a vertical gradient from light to dark
const shade = (id: string, top: string, bottom: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color={top} />
    <stop offset="1" stop-color={bottom} />
  </linearGradient>
)

const Coin = (props: { tier: number; from: string; to: string }) => (
  <symbol id={`s-coin${props.tier}`} viewBox="0 0 100 100">
    <defs>
      <linearGradient id={`coin${props.tier}-fill`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color={props.from} />
        <stop offset="1" stop-color={props.to} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="42" fill={`url(#coin${props.tier}-fill)`} {...ink} />
    <circle cx="50" cy="50" r="32" fill="none" stroke="#1b1220" stroke-width="3" opacity=".35" />
    <path d="M22 36C26 26 34 20 44 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8" />
  </symbol>
)

// three in the morning outside the kiosk: everything you order on the way home, the raccoon that steals it,
// and what the rainbow finds in the gold cells
export default function Fyllekak() {
  return (
    <>
      <Bonus from="#fff3c4" to="#ff5fa2" band="#5a1040">
        <circle cx="50" cy="30" r="17" fill="#fff" {...ink} stroke-width="3" />
        <circle cx="50" cy="30" r="10" fill="#ffd9ea" />
      </Bonus>

      {/* the raccoon: the bandit of the night, mask over his eyes, a sly grin and a stolen fry in his teeth */}
      <Framed id="wild">
        <defs>{shade('wild-fur', '#c4c9d4', '#7a808e')}</defs>
        <path d="M14 36L10 8L38 20Z" fill="#7a808e" {...line} />
        <path d="M86 36L90 8L62 20Z" fill="#7a808e" {...line} />
        <path d="M16 30L14 14L30 22Z" fill="#ffb8c8" />
        <path d="M84 30L86 14L70 22Z" fill="#ffb8c8" />
        <path d="M8 46C8 24 28 14 50 14C72 14 92 24 92 46C92 62 74 74 50 74C26 74 8 62 8 46Z" fill="url(#wild-fur)" {...line} />
        <path d="M66 18C82 24 92 34 92 46C92 62 74 74 50 74C70 66 76 52 74 40Z" fill="#5a606e" opacity=".45" />
        <path d="M44 16L50 28L56 16" fill="#3a3e48" />
        <path d="M8 42C20 30 38 32 50 42C62 32 80 30 92 42C90 56 74 60 62 55C56 52 53 48 50 48C47 48 44 52 38 55C26 60 10 56 8 42Z" fill="#1e2028" {...line} stroke-width="2" />
        <For each={[[34, -1], [66, 1]]}>
          {([x, d]) => (
            <>
              <path d={`M${x - 7} 45Q${x} 38 ${x + 7} 45Q${x} 49 ${x - 7} 45Z`} fill="#fff" stroke="#0a0610" stroke-width="1.4" />
              <circle cx={x + d} cy="44.5" r="3" fill="#ffc83d" />
              <circle cx={x + d} cy="44.5" r="1.5" fill="#0a0610" />
              <path d={`M${x - 8 * d} 37L${x + 8 * d} 40`} stroke="#0a0610" stroke-width="3" stroke-linecap="round" />
            </>
          )}
        </For>
        <path d="M32 62Q50 50 68 62Q66 72 50 72Q34 72 32 62Z" fill="#f2f2f6" {...line} />
        <ellipse cx="50" cy="57" rx="6" ry="4.5" fill="#0a0610" />
        <circle cx="48.5" cy="55.5" r="1.4" fill="#fff" />
        <path d="M42 65Q50 70 60 64" fill="none" stroke="#0a0610" stroke-width="2.2" stroke-linecap="round" />
        <path d="M54 66L56 70L58 65.6" fill="#fff" stroke="#0a0610" stroke-width="1.2" />
        <rect x="58" y="60" width="26" height="6" rx="2" fill="#ffd23a" {...line} stroke-width="2" transform="rotate(-18 58 63)" />
        <rect x="12" y="76" width="76" height="20" rx="6" fill="#5a1040" {...line} stroke-width="3" />
        <text x="50" y="92" text-anchor="middle" font-size="17" font-weight="900" font-style="italic" letter-spacing="2" fill="#ffd9ea" stroke="#0a0610" stroke-width="3" paint-order="stroke">
          WILD
        </text>
      </Framed>

      <Framed id="rainbow">
        <path d="M14 76A36 36 0 0 1 86 76" fill="none" stroke="#1b1220" stroke-width="34" />
        <For each={[['#e8322f', 47], ['#ffc83d', 39], ['#3ddc6a', 31], ['#3f8cff', 23]] as const}>
          {([color, r]) => <path d={`M${50 - r} 76A${r} ${r} 0 0 1 ${50 + r} 76`} fill="none" stroke={color} stroke-width="8.5" />}
        </For>
        <path d="M8 76A42 42 0 0 1 30 39" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".55" />
        <For each={[14, 86]}>
          {x => (
            <>
              <circle cx={x - 8} cy="80" r="10" fill="#fff" {...ink} stroke-width="3" />
              <circle cx={x + 8} cy="80" r="10" fill="#fff" {...ink} stroke-width="3" />
              <circle cx={x} cy="72" r="11" fill="#fff" {...ink} stroke-width="3" />
              <rect x={x - 12} y="74" width="24" height="12" fill="#fff" />
            </>
          )}
        </For>
        <Sparkle x={50} y={18} size={8} />
      </Framed>

      {/* what a gold cell can hold */}
      <Coin tier={1} from="#f0b070" to="#8a4a1f" />
      <Coin tier={2} from="#f4f7fb" to="#7d8a9a" />
      <Coin tier={3} from="#fff0a8" to="#d07a08" />

      <symbol id="s-clover" viewBox="0 0 100 100">
        <path d="M52 56C56 72 64 84 76 92" fill="none" {...ink} stroke-width="7" />
        <For each={[[34, 34], [66, 34], [34, 66], [66, 66]]}>{([x, y]) => <circle cx={x} cy={y} r="19" fill="#3ddc6a" {...ink} />}</For>
        <circle cx="50" cy="50" r="12" fill="#3ddc6a" />
        <path d="M24 28C28 22 34 20 40 20" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".6" />
      </symbol>

      <symbol id="s-pot" viewBox="0 0 100 100">
        <For each={[[34, 34], [66, 34], [50, 26]]}>{([x, y]) => <circle cx={x} cy={y} r="13" fill="#ffc83d" {...ink} stroke-width="3.5" />}</For>
        <path d="M14 46C10 72 26 94 50 94C74 94 90 72 86 46Z" fill="#2a2a34" {...ink} />
        <ellipse cx="50" cy="46" rx="40" ry="9" fill="#4a4d5c" {...ink} stroke-width="3.5" />
        <path d="M24 62C24 74 30 82 38 86" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".35" />
      </symbol>

      {/* a kebab in bread: shaved meat, lettuce, tomato and onion piled out of the top, garlic sauce over it, wrapped in paper */}
      <Framed id="kebab">
        <defs>
          {shade('kebab-bread', '#f6cf8a', '#c88a3e')}
          {shade('kebab-paper', '#ffffff', '#c8c4bc')}
        </defs>
        <path d="M18 48Q16 20 50 16Q84 20 82 48Z" fill="url(#kebab-bread)" {...line} />
        <For each={[[30, 30, -20], [42, 24, -5], [56, 24, 10], [68, 30, 25], [36, 38, -10], [62, 38, 15]]}>
          {([x, y, r]) => <path d={`M${x - 9} ${y}Q${x} ${y - 7} ${x + 9} ${y}Q${x} ${y + 5} ${x - 9} ${y}Z`} fill="#8a4a22" {...line} stroke-width="1.8" transform={`rotate(${r} ${x} ${y})`} />}
        </For>
        <path d="M22 40L28 32L34 40L40 30L46 40L52 30L58 40L64 30L70 40L76 32L80 42" fill="#5fd03a" {...line} stroke-width="1.8" />
        <circle cx="34" cy="36" r="5" fill="#e8322f" {...line} stroke-width="1.6" />
        <circle cx="64" cy="35" r="5" fill="#e8322f" {...line} stroke-width="1.6" />
        <path d="M46 34A5 5 0 1 1 56 34" fill="none" stroke="#b06aff" stroke-width="2.4" />
        <path d="M26 26Q36 34 44 26T62 26T76 30" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" />
        <path d="M18 48H82L74 96H26Z" fill="url(#kebab-paper)" {...line} />
        <path d="M18 48L50 66L82 48" fill="none" stroke="#1a0a14" stroke-width="1.6" opacity=".35" />
        <path d="M70 52L64 94" stroke="#1a0a14" stroke-width="2" opacity=".15" />
        <rect x="34" y="72" width="32" height="12" rx="3" fill="#e8322f" {...line} stroke-width="1.8" />
        <path d="M38 78H62" stroke="#fff" stroke-width="2" stroke-linecap="round" />
      </Framed>

      {/* a slice of pepperoni pizza, the cheese running off it */}
      <Framed id="pizza">
        <defs>{shade('pizza-cheese', '#ffe27a', '#f0a830')}</defs>
        <path d="M10 22Q50 4 90 22L50 96Z" fill="url(#pizza-cheese)" {...line} />
        <path d="M32 52Q30 62 34 66Q38 62 36 54ZM62 60Q60 70 64 74Q68 70 66 62Z" fill="#ffd23a" {...line} stroke-width="1.6" />
        <path d="M10 22Q50 4 90 22L86 32Q50 16 14 32Z" fill="#c8742a" {...line} />
        <path d="M20 22Q50 10 80 22" fill="none" stroke="#f0b060" stroke-width="2.4" stroke-linecap="round" />
        <For each={[[34, 38, 8], [64, 38, 8], [50, 60, 7], [48, 80, 5]]}>
          {([x, y, r]) => (
            <>
              <circle cx={x} cy={y} r={r} fill="#d8282a" {...line} stroke-width="1.8" />
              <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.3} fill="#fff" opacity=".45" />
            </>
          )}
        </For>
        <path d="M44 44Q48 40 52 44Q48 48 44 44ZM70 50Q74 46 78 50Q74 54 70 50Z" fill="#3aa83a" {...line} stroke-width="1.4" />
      </Framed>

      {/* a double cheeseburger: sesame bun, lettuce, tomato, melting cheese and two patties */}
      <Framed id="burger">
        <defs>{shade('burger-bun', '#ffc870', '#c87a2a')}</defs>
        <path d="M14 78H86Q86 92 70 92H30Q14 92 14 78Z" fill="url(#burger-bun)" {...line} />
        <rect x="10" y="66" width="80" height="12" rx="6" fill="#6a3418" {...line} />
        <path d="M10 64H90L80 72L70 66L58 76L46 66L34 74L22 66Z" fill="#ffc83a" {...line} stroke-width="2" />
        <rect x="10" y="54" width="80" height="12" rx="6" fill="#6a3418" {...line} />
        <path d="M18 58H30M42 60H56M66 58H80" stroke="#3a1a08" stroke-width="2" stroke-linecap="round" />
        <rect x="16" y="46" width="68" height="9" rx="4" fill="#e8322f" {...line} stroke-width="2" />
        <path d="M8 46Q18 38 28 46T48 46T68 46T92 46L88 52H12Z" fill="#5fd03a" {...line} stroke-width="2" />
        <path d="M10 44C10 12 90 12 90 44Z" fill="url(#burger-bun)" {...line} />
        <path d="M20 30Q30 18 46 16" fill="none" stroke="#fff6d6" stroke-width="4" stroke-linecap="round" opacity=".7" />
        <For each={[[34, 26], [50, 22], [64, 28], [44, 34], [72, 36], [26, 36]]}>{([x, y]) => <ellipse cx={x} cy={y} rx="2.6" ry="1.5" fill="#fff6d6" stroke="#8a4a14" stroke-width=".8" />}</For>
      </Framed>

      {/* a hot dog with ketchup and mustard */}
      <Framed id="hotdog">
        <defs>
          {shade('hotdog-bun', '#ffd08a', '#d08a3a')}
          {shade('hotdog-sausage', '#ff7a4a', '#a8301a')}
        </defs>
        <g transform="rotate(-20 50 50)">
          <path d="M8 46Q8 34 20 34H80Q92 34 92 46Z" fill="url(#hotdog-bun)" {...line} />
          <rect x="0" y="40" width="100" height="20" rx="10" fill="url(#hotdog-sausage)" {...line} />
          <path d="M10 44H80" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".45" />
          <path d="M12 50Q18 44 24 50T36 50T48 50T60 50T72 50T84 50" fill="none" stroke="#ffd23a" stroke-width="4" stroke-linecap="round" />
          <path d="M14 54Q22 50 30 54T46 54T62 54T78 54" fill="none" stroke="#c8141a" stroke-width="3" stroke-linecap="round" />
          <path d="M6 56H94Q94 72 80 72H20Q6 72 6 56Z" fill="url(#hotdog-bun)" {...line} />
          <path d="M16 64H70" stroke="#fff6d6" stroke-width="2.4" stroke-linecap="round" opacity=".5" />
        </g>
      </Framed>

      {/* fries in a red carton */}
      <Framed id="fries">
        <defs>
          {shade('fries-box', '#ff4a4a', '#a8141a')}
          {shade('fries-fry', '#fff08a', '#e8b02a')}
        </defs>
        <For each={[[22, 22, -12], [32, 10, -6], [44, 6, -2], [54, 4, 3], [64, 10, 7], [74, 20, 13], [38, 18, -4], [60, 16, 5]]}>
          {([x, y, turn]) => <rect x={x} y={y} width="10" height="52" rx="2" fill="url(#fries-fry)" {...line} stroke-width="1.8" transform={`rotate(${turn} ${x + 5} 66)`} />}
        </For>
        <path d="M16 44Q50 56 84 44L74 96H26Z" fill="url(#fries-box)" {...line} />
        <path d="M66 52L60 92" stroke="#000" stroke-width="3" opacity=".15" />
        <path d="M24 52Q50 62 76 52" fill="none" stroke="#fff" stroke-width="2" opacity=".35" />
        <path d="M50 64L54 72L62 73L56 78L58 86L50 82L42 86L44 78L38 73L46 72Z" fill="#ffd23a" {...line} stroke-width="1.6" />
      </Framed>

      {/* a donut with pink icing running down it, sprinkles and a bite taken out */}
      <Framed id="donut">
        <defs>
          <mask id="donut-bite">
            <rect width="100" height="100" fill="#fff" />
            <circle cx="90" cy="28" r="10" fill="#000" />
            <circle cx="96" cy="44" r="9" fill="#000" />
          </mask>
        </defs>
        <g mask="url(#donut-bite)">
          <circle cx="50" cy="52" r="42" fill="#d8903e" {...line} />
          <path d="M50 14C72 12 90 28 90 48C92 58 82 60 80 70C74 86 60 78 54 86C44 92 34 80 26 76C12 68 10 50 12 40C16 22 32 14 50 14Z" fill="#ff7ab8" {...line} />
          <path d="M22 34Q32 20 50 18" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" />
          <For each={[[28, 40, 30, '#fff'], [70, 66, -20, '#7ad7ff'], [34, 66, 60, '#ffd23a'], [72, 34, -40, '#fff'], [50, 26, 0, '#7ad7ff'], [62, 76, 20, '#3ddc6a'], [24, 54, 80, '#ffd23a']] as const}>
            {([x, y, r, c]) => <rect x={x - 4} y={y - 1.5} width="8" height="3" rx="1.5" fill={c} transform={`rotate(${r} ${x} ${y})`} />}
          </For>
        </g>
        <circle cx="50" cy="52" r="11" fill="#3a1030" {...line} />
      </Framed>

      {/* a cone with two scoops, mint and strawberry, dripping, a cherry on top */}
      <Framed id="icecream">
        <defs>
          <clipPath id="icecream-cone">
            <path d="M28 56H72L50 98Z" />
          </clipPath>
        </defs>
        <path d="M28 56H72L50 98Z" fill="#e8a04a" {...line} />
        <g clip-path="url(#icecream-cone)">
          <path d="M20 50L70 100M34 50L84 100M48 50L98 100M80 50L30 100M66 50L16 100M52 50L2 100" stroke="#a8601e" stroke-width="2.2" />
        </g>
        <circle cx="50" cy="44" r="22" fill="#ff9ac4" {...line} />
        <path d="M28 50Q34 60 40 52Q44 62 50 54Q56 62 60 52Q66 60 72 50" fill="#ff9ac4" {...line} stroke-width="2" />
        <circle cx="50" cy="24" r="18" fill="#9ff0d0" {...line} />
        <path d="M34 30Q40 36 46 30Q52 38 58 30Q62 34 66 30" fill="none" stroke="#1a0a14" stroke-width="2" />
        <circle cx="44" cy="20" r="2" fill="#3a2010" />
        <circle cx="56" cy="16" r="2" fill="#3a2010" />
        <path d="M38 16Q42 10 48 10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" />
        <path d="M52 8Q56 0 62 -2" fill="none" stroke="#3a6a1a" stroke-width="2" />
        <circle cx="52" cy="7" r="6" fill="#e8322f" {...line} stroke-width="2" />
        <circle cx="50" cy="5" r="1.6" fill="#fff" />
      </Framed>

      {/* a big soda: paper cup with a lid and a bent straw, ice cold and sweating */}
      <Framed id="soda">
        <defs>{shade('soda-cup', '#5aa8ff', '#1a4ab8')}</defs>
        <path d="M56 20L62 2H76" fill="none" stroke="#1a0a14" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M56 20L62 2H76" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M58 14L60 8" stroke="#e8322f" stroke-width="4.5" />
        <path d="M24 28H76L68 96H32Z" fill="url(#soda-cup)" {...line} />
        <path d="M27 50Q40 42 50 50T73 48L71 64Q60 58 50 64T29 66Z" fill="#fff" {...line} stroke-width="1.6" />
        <path d="M64 32L58 92" stroke="#000" stroke-width="3" opacity=".15" />
        <path d="M32 34L36 90" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".4" />
        <For each={[[40, 74], [58, 80], [44, 86], [62, 70]]}>{([x, y]) => <ellipse cx={x} cy={y} rx="1.6" ry="2.4" fill="#cfe8ff" />}</For>
        <rect x="18" y="20" width="64" height="11" rx="4" fill="#f2f2f6" {...line} />
        <path d="M24 24H76" stroke="#fff" stroke-width="2" opacity=".8" />
      </Framed>

      {/* a swirl lollipop on its stick, wrapped in cellophane tied with a ribbon */}
      <Framed id="candy">
        <rect x="47" y="56" width="6" height="40" rx="3" fill="#f2f2f6" {...line} stroke-width="2" />
        <circle cx="50" cy="38" r="32" fill="#b47aff" {...line} />
        <path d="M50 38m0 -4a4 4 0 1 1 -4 6a8 8 0 1 1 12 -10a12 12 0 1 1 -18 14a16 16 0 1 1 24 -18a20 20 0 1 1 -30 22a24 24 0 1 1 36 -26" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" />
        <path d="M50 38m0 -4a4 4 0 1 1 -4 6a8 8 0 1 1 12 -10a12 12 0 1 1 -18 14a16 16 0 1 1 24 -18a20 20 0 1 1 -30 22a24 24 0 1 1 36 -26" fill="none" stroke="#ff5fa2" stroke-width="2.2" stroke-linecap="round" />
        <circle cx="50" cy="38" r="32" fill="none" {...line} />
        <path d="M28 22Q36 10 50 8" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7" />
        <path d="M42 70L50 64L58 70L54 74L50 70L46 74Z" fill="#ff5fa2" {...line} stroke-width="1.8" />
        <Sparkle x={74} y={16} size={6} />
      </Framed>
    </>
  )
}
