import { For, type JSX } from 'solid-js'
import { ring, Sparkle } from './shared'

export const teams = {
  red: { main: '#ff4a1a', dark: '#5a0e04', light: '#ffb07a', glow: '#ff7a2a' },
  blue: { main: '#1a7aff', dark: '#041a5a', light: '#8ac8ff', glow: '#3aa0ff' },
}

const line = { stroke: '#0a0610', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const

// every symbol sits on a tile: dark concrete with a halftone glow in its colour, a bevelled frame and a shine over the top
const Tile = (props: { id: string; glow: string; frame: string; dark?: string }) => (
  <>
    <defs>
      <radialGradient id={`bg-${props.id}`} cx="50%" cy="38%" r="70%">
        <stop offset="0" stop-color={props.glow} stop-opacity=".85" />
        <stop offset=".55" stop-color={props.dark ?? '#14101c'} />
        <stop offset="1" stop-color="#06040a" />
      </radialGradient>
      <pattern id={`dots-${props.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
        <circle cx="3" cy="3" r="1.2" fill="#fff" opacity=".13" />
      </pattern>
      <linearGradient id={`frame-${props.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" />
        <stop offset=".25" stop-color={props.frame} />
        <stop offset="1" stop-color="#1a1020" />
      </linearGradient>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="11" fill={`url(#bg-${props.id})`} />
    <rect x="2" y="2" width="96" height="96" rx="11" fill={`url(#dots-${props.id})`} />
    <rect x="3.5" y="3.5" width="93" height="93" rx="10" fill="none" stroke={`url(#frame-${props.id})`} stroke-width="4" />
  </>
)

const Shine = () => <path d="M6 14Q8 6 16 5H84Q92 6 94 14Q60 8 6 30Z" fill="#fff" opacity=".14" />

// a fist seen from the front, knuckles up: four curled fingers, the thumb across them, the wrap round the wrist.
// colour: the glove, light: its highlights
export const FistShape = (props: { color: string; light: string; dark: string }) => (
  <>
    <path d="M30 74H70V97H30Z" fill="#ece6dc" {...line} />
    <path d="M30 80H70M30 87H70M30 93H70" stroke="#b8ae9e" stroke-width="2" />
    <path d="M22 50V34Q22 24 31 24Q36 24 38 28Q40 18 48 18Q55 18 57 25Q60 18 67 19Q75 21 75 30Q80 28 82 33Q84 38 82 48L80 66Q78 78 64 80H38Q24 78 22 64Z" fill={props.color} {...line} />
    <path d="M38 28V50M57 25V48M75 30V48" stroke={props.dark} stroke-width="3" stroke-linecap="round" />
    <path d="M26 32Q28 27 33 27M42 23Q46 20 51 22M61 22Q66 21 69 24M77 32Q79 31 80 34" fill="none" stroke={props.light} stroke-width="3.5" stroke-linecap="round" />
    <path d="M14 58Q12 46 24 45L56 46Q66 47 66 56Q66 65 56 66L26 67Q16 67 14 58Z" fill={props.color} {...line} />
    <path d="M22 52Q36 50 54 51" stroke={props.light} stroke-width="3" stroke-linecap="round" fill="none" />
    <path d="M30 72Q50 76 74 70" stroke={props.dark} stroke-width="3" fill="none" stroke-linecap="round" opacity=".7" />
  </>
)

// a fighter's head: the jaw, shading on the far side, eyes with a glare in them, brows pulled down and the mouth set hard
const Head = (props: { skin: string; shade: string; eyes: string; grin?: boolean; children?: JSX.Element }) => (
  <>
    <path d="M44 62H56V74H44Z" fill={props.shade} {...line} />
    <ellipse cx="30.5" cy="45" rx="4" ry="6" fill={props.skin} {...line} />
    <ellipse cx="69.5" cy="45" rx="4" ry="6" fill={props.shade} {...line} />
    <path d="M31 40Q31 18 50 17Q69 18 69 40Q69 56 61 64Q55 69 50 69Q45 69 39 64Q31 56 31 40Z" fill={props.skin} {...line} />
    <path d="M58 20Q69 24 69 40Q69 56 61 64Q55 69 50 69Q60 60 61 46Q62 30 58 20Z" fill={props.shade} opacity=".75" />
    <For each={[[42, -1], [58, 1]]}>
      {([x, d]) => (
        <>
          <path d={`M${x - 6} 43Q${x} 38 ${x + 6} 43Q${x} 46 ${x - 6} 43Z`} fill="#fff" stroke="#0a0610" stroke-width="1.6" />
          <circle cx={x + d * 0.5} cy="42.6" r="2.4" fill={props.eyes} />
          <circle cx={x + d * 0.5} cy="42.6" r="1.1" fill="#0a0610" />
          <circle cx={x + d * 0.5 - 0.8} cy="41.8" r=".6" fill="#fff" />
          <path d={`M${x - 7 * d * -1} 35L${x + 7 * d * -1} 38.5`} stroke="#2a1608" stroke-width="3.4" stroke-linecap="round" />
        </>
      )}
    </For>
    <path d="M50 44L47 53Q50 55 53 53" fill="none" stroke="#0a0610" stroke-width="1.6" stroke-linecap="round" opacity=".6" />
    {props.grin ? (
      <>
        <path d="M43 59Q50 63 58 58Q56 62 50 63Q45 63 43 59Z" fill="#fff" stroke="#0a0610" stroke-width="1.6" />
        <path d="M47 59.5V62M51 60V62.6M54.5 59.5V62" stroke="#0a0610" stroke-width=".8" />
      </>
    ) : (
      <path d="M44 60Q50 58 56 60" fill="none" stroke="#5a1a14" stroke-width="2.4" stroke-linecap="round" />
    )}
    {props.children}
  </>
)

// a fighter from the chest up in the team's colour, a fist up in front
const Fighter = (props: { id: string; team: 'red' | 'blue'; skin: string; shade: string; children: JSX.Element; outfit: JSX.Element; behind?: JSX.Element }) => {
  const t = teams[props.team]
  return (
    <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
      <Tile id={props.id} glow={t.glow} frame={t.main} dark={t.dark} />
      <defs>
        <clipPath id={`clip-${props.id}`}>
          <rect x="4" y="4" width="92" height="92" rx="9" />
        </clipPath>
      </defs>
      <g clip-path={`url(#clip-${props.id})`}>
        {props.behind}
        <path d="M2 104Q4 78 26 72L44 68H56L74 72Q96 78 98 104Z" fill={props.skin} {...line} />
        <path d="M74 72Q96 78 98 104H70Q72 86 74 72Z" fill={props.shade} opacity=".7" />
        {props.outfit}
        {props.children}
        <g transform="translate(-2 58) scale(.42)">
          <FistShape color={t.main} light={t.light} dark={t.dark} />
        </g>
      </g>
      <Shine />
    </symbol>
  )
}

// the ranks: letters sprayed in neon on the wall, the paint running down from them
const Rank = (props: { id: string; rank: string; color: string }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <Tile id={props.id} glow="#2a2440" frame="#7a7090" />
    <path d={props.rank === '10' ? 'M32 70V84M64 72V90M70 70V80' : 'M40 72V88M58 74V84'} stroke={props.color} stroke-width="3.5" stroke-linecap="round" opacity=".8" />
    <text
      x="50"
      y={props.rank === '10' ? 70 : 74}
      text-anchor="middle"
      font-size={props.rank === '10' ? '50' : '66'}
      font-weight="900"
      font-style="italic"
      fill={props.color}
      stroke="#0a0610"
      stroke-width="6"
      paint-order="stroke"
      style={{ filter: `drop-shadow(0 0 5px ${props.color})` }}
    >
      {props.rank}
    </text>
    <text x="50" y={props.rank === '10' ? 70 : 74} text-anchor="middle" font-size={props.rank === '10' ? '50' : '66'} font-weight="900" font-style="italic" fill="none" stroke="#fff" stroke-width="1.2" opacity=".55">
      {props.rank}
    </text>
    <Shine />
  </symbol>
)

// the backstreet: two teams of fighters, red against blue, and fists that punch through the reels
export default function Jarnnave() {
  return (
    <>
      {/* the scatter: a championship belt, gold plate with FS on red, rubies at the sides and studs along the strap */}
      <symbol id="s-scatter" viewBox="0 0 100 100">
        <Tile id="scatter" glow="#ffb81f" frame="#ffd23d" dark="#3a2404" />
        <defs>
          <linearGradient id="belt-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#fff6c0" />
            <stop offset=".45" stop-color="#ffc83d" />
            <stop offset="1" stop-color="#a8640a" />
          </linearGradient>
        </defs>
        <For each={ring(14, 47, 47)}>{([x, y]) => <path d={`M50 50L${x} ${y}`} stroke="#ffe27a" stroke-width="3" opacity=".3" />}</For>
        <path d="M2 40Q50 34 98 40V62Q50 56 2 62Z" fill="#2a1a10" {...line} />
        <For each={[9, 17, 83, 91]}>{x => <circle cx={x} cy="51" r="2.6" fill="url(#belt-gold)" stroke="#0a0610" stroke-width="1" />}</For>
        <path d="M24 30Q50 14 76 30L84 51L76 72Q50 88 24 72L16 51Z" fill="url(#belt-gold)" {...line} stroke-width="3" />
        <path d="M30 35Q50 23 70 35L76 51L70 67Q50 79 30 67L24 51Z" fill="#b8141a" {...line} />
        <path d="M30 35Q50 23 70 35L72 41Q50 30 28 41Z" fill="#fff" opacity=".25" />
        <For each={[22, 78]}>{x => <path d={`M${x} 45L${x + 4} 51L${x} 57L${x - 4} 51Z`} fill="#ff3a5a" stroke="#0a0610" stroke-width="1.4" />}</For>
        <text x="50" y="62" text-anchor="middle" font-size="30" font-weight="900" font-style="italic" fill="url(#belt-gold)" stroke="#0a0610" stroke-width="2.5" paint-order="stroke">
          FS
        </text>
        <Sparkle x={74} y={24} size={8} />
        <Sparkle x={26} y={76} size={5} />
        <Shine />
      </symbol>

      {/* the wild: WILD tagged in spray paint over a burst, the paint running */}
      <symbol id="s-wild" viewBox="0 0 100 100">
        <Tile id="wild" glow="#ff3a8a" frame="#ffe23d" dark="#3a0a2a" />
        <polygon points={ring(18, 46, 46).map(([x, y], i) => (i % 2 ? [50 + (x - 50) * 0.62, 50 + (y - 50) * 0.62] : [x, y]).join(',')).join(' ')} fill="#ffe23d" {...line} />
        <polygon points={ring(18, 34, 34, 0.03).map(([x, y], i) => (i % 2 ? [50 + (x - 50) * 0.6, 50 + (y - 50) * 0.6] : [x, y]).join(',')).join(' ')} fill="#fff6a0" />
        <path d="M30 60V74M46 62V82M62 60V70M70 60V78" stroke="#ff2a7a" stroke-width="4" stroke-linecap="round" />
        <g transform="rotate(-10 50 52)">
          <text x="50" y="62" text-anchor="middle" font-size="31" font-weight="900" font-style="italic" fill="#ff2a7a" stroke="#0a0610" stroke-width="6" paint-order="stroke">
            WILD
          </text>
          <text x="50" y="62" text-anchor="middle" font-size="31" font-weight="900" font-style="italic" fill="none" stroke="#fff" stroke-width="1.2" opacity=".8">
            WILD
          </text>
        </g>
        <Shine />
      </symbol>

      {/* the fists: a gloved fist in the team's colour, burning with its colour and white sparks round it */}
      <For each={['red', 'blue'] as const}>
        {team => {
          const t = teams[team]
          return (
            <symbol id={`s-${team}fist`} viewBox="0 0 100 100">
              <Tile id={`${team}fist`} glow={t.glow} frame="#ffffff" dark={t.dark} />
              <path
                d="M50 4Q62 14 66 6Q70 18 82 12Q80 26 94 26Q84 36 92 48Q80 50 84 64Q70 58 66 74H34Q30 58 16 64Q20 50 8 48Q16 36 6 26Q20 26 18 12Q30 18 34 6Q38 14 50 4Z"
                fill={t.light}
                opacity=".55"
              />
              <path d="M50 14Q58 22 62 16Q64 26 74 22Q72 32 82 36Q74 42 78 52H22Q26 42 18 36Q28 32 26 22Q36 26 38 16Q42 22 50 14Z" fill="#fff" opacity=".35" />
              <g transform="translate(6 2) scale(.88)">
                <FistShape color={t.main} light={t.light} dark={t.dark} />
              </g>
              <Sparkle x={14} y={18} size={6} />
              <Sparkle x={86} y={30} size={5} />
              <Shine />
            </symbol>
          )
        }}
      </For>

      {/* blue team, the champion: a wrestling mask in blue with silver flames round the eyes and a cape collar */}
      <Fighter
        id="masked"
        team="blue"
        skin="#c08050"
        shade="#8a5430"
        outfit={
          <>
            <path d="M14 82Q30 70 50 72Q70 70 86 82L90 104H10Z" fill="#0a3aa8" {...line} />
            <path d="M14 82Q30 70 50 72Q70 70 86 82L84 90Q66 80 50 82Q34 80 16 90Z" fill="#c8d4e8" {...line} />
          </>
        }
      >
        <Head skin="#c08050" shade="#8a5430" eyes="#3a2010">
          <path d="M31 40Q31 18 50 17Q69 18 69 40Q69 56 61 64Q55 69 50 69Q45 69 39 64Q31 56 31 40Z" fill="#1a5ae8" {...line} />
          <path d="M58 20Q69 24 69 40Q69 56 61 64Q55 69 50 69Q60 60 61 46Q62 30 58 20Z" fill="#0a2a8a" opacity=".6" />
          <ellipse cx="50" cy="60" rx="8" ry="5.5" fill="#c08050" stroke="#e8eef8" stroke-width="2.4" />
          <path d="M44 60Q50 58 56 60" fill="none" stroke="#5a1a14" stroke-width="2.2" stroke-linecap="round" />
          <For each={[[42, -1], [58, 1]]}>
            {([x, d]) => (
              <path d={`M${x - 8 * d} 47Q${x - 9 * d} 36 ${x + 2 * d} 33L${x + 10 * d} 28L${x + 7 * d} 37Q${x + 9 * d} 44 ${x + 7 * d} 47Q${x} 51 ${x - 8 * d} 47Z`} fill="#e8eef8" stroke="#0a0610" stroke-width="1.6" />
            )}
          </For>
          <For each={[42, 58]}>
            {x => (
              <>
                <path d={`M${x - 5} 42Q${x} 38 ${x + 5} 42Q${x} 45.5 ${x - 5} 42Z`} fill="#fff" stroke="#0a0610" stroke-width="1.4" />
                <circle cx={x} cy="41.8" r="2" fill="#3a2010" />
                <circle cx={x - 0.6} cy="41" r=".6" fill="#fff" />
              </>
            )}
          </For>
          <path d="M50 18V31M45 22L50 31L55 22" fill="none" stroke="#e8eef8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
        </Head>
      </Fighter>

      {/* red team, the champion: spiked blonde hair, a red headband with its tails flying, a grin */}
      <Fighter
        id="blonde"
        team="red"
        skin="#f0c098"
        shade="#c88a68"
        behind={<path d="M66 30Q84 22 96 30Q86 34 96 40Q82 40 70 36Z" fill="#e8222a" {...line} />}
        outfit={
          <>
            <path d="M18 84Q34 72 50 76Q66 72 82 84L88 104H12Z" fill="#c8141a" {...line} />
            <path d="M38 74L50 96L62 74" fill="#f0c098" {...line} />
            <path d="M18 84Q34 72 50 76L44 80Q30 78 20 90Z" fill="#fff" opacity=".18" />
          </>
        }
      >
        <Head skin="#f0c098" shade="#c88a68" eyes="#2a6a3a" grin>
          <path d="M28 40L18 22L32 26L28 8L42 18L48 2L56 16L68 4L68 20L84 16L74 30L72 40Q66 26 50 26Q34 26 28 40Z" fill="#ffd23d" {...line} />
          <path d="M34 22L42 18M52 10L56 16M64 14L68 20M42 26L48 14" stroke="#fff6a0" stroke-width="2.4" stroke-linecap="round" />
          <path d="M60 16L68 20L74 30L70 36Q66 26 58 24Z" fill="#c89a14" opacity=".6" />
          <path d="M29 33Q50 26 71 33L71 39Q50 32 29 39Z" fill="#e8222a" {...line} />
        </Head>
      </Fighter>

      {/* blue team: the kicker, black hair in two buns with blue ribbons and a high collar */}
      <Fighter
        id="kicker"
        team="blue"
        skin="#f0c8a8"
        shade="#c8987a"
        behind={
          <For each={[[31, 22], [69, 22]]}>
            {([x, y]) => (
              <>
                <circle cx={x} cy={y} r="8.5" fill="#14101c" {...line} />
                <path d={`M${x - 4} ${y - 4}Q${x} ${y - 7} ${x + 4} ${y - 4}`} stroke="#4a4a6a" stroke-width="2" fill="none" stroke-linecap="round" />
                <path d={`M${x - 6} ${y + 6}L${x - 10} ${y + 14}M${x + 6} ${y + 6}L${x + 10} ${y + 14}`} stroke="#1a7aff" stroke-width="3.5" stroke-linecap="round" />
              </>
            )}
          </For>
        }
        outfit={
          <>
            <path d="M18 84Q34 74 50 76Q66 74 82 84L88 104H12Z" fill="#1a5ae8" {...line} />
            <path d="M40 68H60L62 80Q50 84 38 80Z" fill="#1a5ae8" {...line} />
            <path d="M50 80V104M44 88H56M44 96H56" stroke="#ffd23d" stroke-width="2.4" stroke-linecap="round" />
          </>
        }
      >
        <Head skin="#f0c8a8" shade="#c8987a" eyes="#4a2a1a">
          <path d="M30 44Q26 16 50 14Q74 16 70 44Q66 30 56 26Q48 34 32 34Z" fill="#14101c" {...line} />
          <path d="M40 20Q48 16 56 18" stroke="#4a4a6a" stroke-width="2.4" stroke-linecap="round" fill="none" />
          <path d="M44 59.5Q50 62 56 59.5" fill="none" stroke="#c8303a" stroke-width="3" stroke-linecap="round" />
        </Head>
      </Fighter>

      {/* red team: the brawler, brown hair tied back, stubble, a plaster on the cheek and a scar over the eye */}
      <Fighter
        id="brawler"
        team="red"
        skin="#d89868"
        shade="#a86a44"
        behind={<path d="M66 28Q84 30 86 50Q80 44 72 42Z" fill="#4a2a14" {...line} />}
        outfit={
          <>
            <path d="M24 86Q36 76 50 78Q64 76 76 86L80 104H20Z" fill="#e85a1a" {...line} />
            <path d="M36 74Q50 82 64 74" fill="none" stroke="#a86a44" stroke-width="2.6" />
          </>
        }
      >
        <Head skin="#d89868" shade="#a86a44" eyes="#3a2010">
          <path d="M34 54Q36 66 50 69Q64 66 66 54Q62 62 50 64Q38 62 34 54Z" fill="#3a2414" opacity=".45" />
          <path d="M30 42Q26 14 50 14Q74 14 70 40Q64 26 50 26Q40 26 30 42Z" fill="#5a3418" {...line} />
          <path d="M38 20Q44 16 50 18M54 18Q60 18 64 22" stroke="#8a5a30" stroke-width="2.4" stroke-linecap="round" fill="none" />
          <path d="M55 33L62 49" stroke="#8a2a1a" stroke-width="2" stroke-linecap="round" />
          <rect x="34" y="49" width="10" height="5" rx="1.5" fill="#f2dcc0" stroke="#0a0610" stroke-width="1.2" transform="rotate(-20 39 51)" />
        </Head>
      </Fighter>

      <For each={[['ace', 'A', '#ff3a8a'], ['king', 'K', '#3ad8ff'], ['queen', 'Q', '#b06aff'], ['jack', 'J', '#5aff7a'], ['ten', '10', '#ffb83a']]}>
        {([id, rank, color]) => <Rank id={id} rank={rank} color={color} />}
      </For>
    </>
  )
}
