import { For, type JSX } from 'solid-js'
import { Bonus, Framed, Head, ink, Rank, Sparkle } from './shared'

// drawn like järnnäven: a fine dark outline, shading down one side and a shine
const line = { stroke: '#0a0610', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const

const brass = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff0a8" />
    <stop offset=".5" stop-color="#e8b23a" />
    <stop offset="1" stop-color="#a86a12" />
  </linearGradient>
)

const steel = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#d8e2ec" />
    <stop offset=".5" stop-color="#7d8a9a" />
    <stop offset="1" stop-color="#2f3a4a" />
  </linearGradient>
)

// a crew member from the chest up: the coat in their colour, their head and what they wear on it
const Crew = (props: { id: string; skin: string; shade: string; eyes: string; coat: string; stern?: boolean; mouth?: 'smile' | 'grin' | 'flat'; front?: JSX.Element; hat: JSX.Element; behind?: JSX.Element }) => (
  <Framed id={props.id}>
    {props.behind}
    <path d="M2 104Q4 78 26 72L44 68H56L74 72Q96 78 98 104Z" fill={props.coat} {...line} />
    <path d="M74 72Q96 78 98 104H72Q74 86 74 72Z" fill="#000" opacity=".25" />
    {props.front}
    <Head skin={props.skin} shade={props.shade} eyes={props.eyes} stern={props.stern} mouth={props.mouth}>
      {props.hat}
    </Head>
  </Framed>
)

// life on board: the crew, what they fire and what they find down there
export default function Ubaten() {
  return (
    <>
      <Bonus from="#d6f6ff" to="#1f7ab8" band="#0a2a4a">
        <circle cx="50" cy="32" r="18" fill="#0a2a4a" {...ink} stroke-width="3" />
        <circle cx="50" cy="32" r="11" fill="none" stroke="#5fe0a0" stroke-width="2" />
        <path d="M50 32L62 20" stroke="#5fe0a0" stroke-width="3" stroke-linecap="round" />
        <circle cx="42" cy="28" r="2.5" fill="#5fe0a0" />
      </Bonus>

      {/* the crate: planks, a brace across, brass corners and a stencilled question mark. opens into 2 or 3 of one symbol */}
      <Framed id="xways">
        <defs>
          <linearGradient id="xways-wood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#e0a868" />
            <stop offset="1" stop-color="#8a5226" />
          </linearGradient>
          {brass('xways-brass')}
        </defs>
        <rect x="10" y="12" width="80" height="78" rx="4" fill="url(#xways-wood)" {...line} />
        <path d="M10 38H90M10 64H90" stroke="#4a2410" stroke-width="2.4" />
        <path d="M14 16L86 86" stroke="#4a2410" stroke-width="12" />
        <path d="M14 16L86 86" stroke="#c88a4a" stroke-width="8" />
        <For each={[[10, 12, 0], [90, 12, 90], [90, 90, 180], [10, 90, 270]]}>
          {([x, y, r]) => <path d="M0 0H16V6H6V16H0Z" fill="url(#xways-brass)" {...line} stroke-width="1.6" transform={`translate(${x} ${y}) rotate(${r})`} />}
        </For>
        <For each={[[20, 25], [80, 25], [20, 51], [80, 51], [20, 77], [80, 77]]}>{([x, y]) => <circle cx={x} cy={y} r="1.8" fill="#2a1408" />}</For>
        <text x="50" y="68" text-anchor="middle" font-size="46" font-weight="900" fill="#ffc83d" stroke="#0a0610" stroke-width="5" paint-order="stroke">
          ?
        </text>
      </Framed>

      {/* the crate wild: navy paint and WILD stencilled on, what the torpedo brings, 2 or 3 wilds in one cell */}
      <Framed id="xwild">
        <defs>{brass('xwild-brass')}</defs>
        <rect x="8" y="14" width="84" height="72" rx="5" fill="#123a6a" {...line} />
        <path d="M8 38H92M8 62H92" stroke="#06182e" stroke-width="2.4" />
        <For each={[[8, 14, 0], [92, 14, 90], [92, 86, 180], [8, 86, 270]]}>
          {([x, y, r]) => <path d="M0 0H16V6H6V16H0Z" fill="url(#xwild-brass)" {...line} stroke-width="1.6" transform={`translate(${x} ${y}) rotate(${r})`} />}
        </For>
        <text x="50" y="60" text-anchor="middle" font-size="27" font-weight="900" letter-spacing="2" fill="#ffc83d" stroke="#0a0610" stroke-width="4" paint-order="stroke">
          WILD
        </text>
      </Framed>

      {/* the mine: a horned contact mine on its chain, rivets round its middle and rust on the steel */}
      <Framed id="wild">
        <defs>
          <radialGradient id="wild-ball" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#8a98a8" />
            <stop offset=".5" stop-color="#3a4656" />
            <stop offset="1" stop-color="#141a24" />
          </radialGradient>
        </defs>
        <path d="M50 70V84" stroke="#0a0610" stroke-width="8" />
        <path d="M50 72V84" stroke="#6a7686" stroke-width="3" stroke-dasharray="4 3" />
        <For each={[[50, 6, 0], [20, 18, -50], [80, 18, 50], [10, 44, -90], [90, 44, 90]]}>
          {([x, y, r]) => (
            <g transform={`rotate(${r} ${x} ${y})`}>
              <rect x={x - 4} y={y} width="8" height="12" fill="#5a6676" {...line} stroke-width="2" />
              <rect x={x - 6} y={y - 3} width="12" height="5" rx="2" fill="#c8a040" {...line} stroke-width="2" />
            </g>
          )}
        </For>
        <circle cx="50" cy="42" r="30" fill="url(#wild-ball)" {...line} />
        <path d="M20 44Q50 54 80 44" fill="none" stroke="#0a0610" stroke-width="2" />
        <For each={[26, 36, 46, 56, 66, 75]}>{x => <circle cx={x} cy={46 + Math.sin((x - 20) / 19) * 4} r="1.6" fill="#c8d4e0" />}</For>
        <path d="M30 28Q36 18 48 16" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity=".55" />
        <circle cx="64" cy="56" r="4" fill="#a8501a" opacity=".6" />
        <circle cx="40" cy="60" r="2.5" fill="#a8501a" opacity=".5" />
        <rect x="12" y="74" width="76" height="20" rx="5" fill="#ffc83d" {...line} stroke-width="2.4" />
        <path d="M14 76L20 76L14 82ZM86 92L80 92L86 86Z" fill="#0a0610" />
        <text x="50" y="90" text-anchor="middle" font-size="16" font-weight="900" letter-spacing="2" fill="#0a0610">
          WILD
        </text>
      </Framed>

      {/* the submarine: a side view with its conning tower and periscope, lit portholes and the screw turning the water */}
      <Framed id="nudge">
        <defs>
          <linearGradient id="nudge-hull" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#a8b8c8" />
            <stop offset=".45" stop-color="#5a6a7c" />
            <stop offset="1" stop-color="#222a36" />
          </linearGradient>
        </defs>
        <path d="M56 30V12H66" fill="none" stroke="#0a0610" stroke-width="5" stroke-linecap="round" />
        <path d="M56 30V12H66" fill="none" stroke="#8a98a8" stroke-width="2" stroke-linecap="round" />
        <path d="M38 44L42 26H66L70 44Z" fill="url(#nudge-hull)" {...line} />
        <path d="M40 30H68" stroke="#0a0610" stroke-width="1.6" />
        <path d="M4 58Q4 44 30 44H80Q96 46 98 58Q96 70 80 72H30Q4 72 4 58Z" fill="url(#nudge-hull)" {...line} />
        <path d="M14 50Q20 47 34 47H78" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".5" />
        <path d="M10 64H92" stroke="#0a0610" stroke-width="1.4" opacity=".5" />
        <For each={[34, 50, 66, 80]}>
          {x => (
            <>
              <circle cx={x} cy="57" r="4.6" fill="#ffe27a" {...line} stroke-width="2" />
              <circle cx={x - 1.4} cy="55.6" r="1.2" fill="#fff" />
            </>
          )}
        </For>
        <path d="M4 58L-2 48V68Z" fill="#3a4656" {...line} stroke-width="2" />
        <For each={[[16, 52], [22, 66], [12, 74]]}>{([x, y]) => <circle cx={x - 10} cy={y + 6} r="2" fill="#bfeaff" opacity=".7" />}</For>
      </Framed>

      {/* the submarine standing on its reel: four cells tall, it nudges in until all of it shows */}
      <symbol id="s-sub" viewBox="0 0 100 400">
        <defs>
          <linearGradient id="sub-steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#2f3a4a" />
            <stop offset=".45" stop-color="#a8b8c8" />
            <stop offset="1" stop-color="#222a36" />
          </linearGradient>
          <radialGradient id="sub-glow">
            <stop offset="0" stop-color="#5fd0ff" stop-opacity=".8" />
            <stop offset="1" stop-color="#5fd0ff" stop-opacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="400" fill="#0a2a4a" />
        <rect width="100" height="400" fill="url(#sub-glow)" opacity=".5" />
        <path d="M50 14C78 14 86 60 86 110V330C86 360 70 380 50 386C30 380 14 360 14 330V110C14 60 22 14 50 14Z" fill="url(#sub-steel)" {...line} stroke-width="4" />
        <path d="M14 340L2 372L22 360M86 340L98 372L78 360" fill="#3f4a5a" {...line} />
        <path d="M50 386V398M38 394H62" {...line} stroke-width="5" />
        <rect x="70" y="220" width="26" height="64" rx="8" fill="url(#sub-steel)" {...line} stroke-width="3" />
        <path d="M90 220V196H98" fill="none" {...line} stroke-width="5" />
        <For each={[84, 260, 306]}>{y => <circle cx="44" cy={y} r="13" fill="#ffe27a" {...line} stroke-width="3" />}</For>
        <For each={[110, 200, 350]}>{y => <path d={`M18 ${y}H82`} stroke="#0a0610" stroke-width="1.6" opacity=".5" />}</For>
        <path d="M24 60C26 44 34 32 44 26" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6" />
        <rect x="16" y="140" width="68" height="40" rx="6" fill="#ffc83d" {...line} stroke-width="3" />
        <text x="50" y="169" text-anchor="middle" font-size="24" font-weight="900" letter-spacing="2" fill="#0a0610">
          WILD
        </text>
      </symbol>

      {/* the captain: white beard, peaked cap with the gold badge, navy coat with gold buttons and his pipe */}
      <Crew
        id="captain"
        skin="#f0c098"
        shade="#c88a68"
        eyes="#2a5a8a"
        coat="#1a2a5a"
        mouth="smile"
        front={
          <>
            <path d="M40 70L50 90L60 70" fill="#f2f2f2" {...line} />
            <For each={[[30, 86], [70, 86], [30, 98], [70, 98]]}>{([x, y]) => <circle cx={x} cy={y} r="2.6" fill="#ffc83d" {...line} stroke-width="1.4" />}</For>
            <path d="M14 82Q20 78 26 80" stroke="#ffc83d" stroke-width="3" stroke-linecap="round" />
          </>
        }
        hat={
          <>
            <path d="M32 50Q32 70 50 76Q68 70 68 50Q64 60 50 60Q36 60 32 50Z" fill="#f2f2f2" {...line} />
            <path d="M40 58Q45 54 50 57Q55 54 60 58Q56 61 50 59Q44 61 40 58Z" fill="#fff" {...line} stroke-width="1.6" />
            <path d="M24 32Q24 12 50 11Q76 12 76 32Z" fill="#f8f8f8" {...line} />
            <rect x="27" y="28" width="46" height="8" rx="2" fill="#1a2a5a" {...line} stroke-width="2" />
            <path d="M28 36Q50 44 72 36L74 39Q50 48 26 39Z" fill="#0a0610" />
            <circle cx="50" cy="30" r="5" fill="#ffc83d" {...line} stroke-width="1.6" />
            <path d="M58 62L72 68L74 62L80 62L80 70Q74 74 70 70" fill="#7a4a22" {...line} stroke-width="2" />
          </>
        }
      />

      {/* the gunner: a watch cap, a striped shirt, binoculars round the neck and a hard look */}
      <Crew
        id="gunner"
        skin="#e8b088"
        shade="#b87a58"
        eyes="#3a2010"
        coat="#f2f2f2"
        stern
        front={
          <>
            <path d="M8 86Q50 80 92 86M4 96Q50 90 96 96" stroke="#1a2a5a" stroke-width="5" fill="none" />
            <path d="M38 70Q36 84 44 88M62 70Q64 84 56 88" fill="none" stroke="#3a2010" stroke-width="2" />
            <rect x="38" y="84" width="10" height="12" rx="3" fill="#2a2a34" {...line} stroke-width="1.8" />
            <rect x="52" y="84" width="10" height="12" rx="3" fill="#2a2a34" {...line} stroke-width="1.8" />
          </>
        }
        hat={
          <>
            <path d="M29 36Q28 12 50 11Q72 12 71 36Z" fill="#c8202a" {...line} />
            <path d="M28 31H72V38H28Z" fill="#a8141a" {...line} stroke-width="2" />
            <path d="M36 16V30M44 13V30M52 12V30M60 14V30M66 18V30" stroke="#8a0a10" stroke-width="1.4" />
          </>
        }
      />

      {/* the engineer: orange overalls, brass goggles up on the forehead, oil on the cheek */}
      <Crew
        id="engineer"
        skin="#f0c8a0"
        shade="#c8987a"
        eyes="#2a6a3a"
        coat="#e8732a"
        mouth="grin"
        front={
          <>
            <path d="M34 72V104M66 72V104" stroke="#a8501a" stroke-width="5" />
            <circle cx="34" cy="86" r="2.6" fill="#c8d4e0" {...line} stroke-width="1.2" />
            <circle cx="66" cy="86" r="2.6" fill="#c8d4e0" {...line} stroke-width="1.2" />
          </>
        }
        hat={
          <>
            <path d="M30 40Q26 14 50 13Q74 14 70 38Q64 26 50 25Q38 25 30 40Z" fill="#6a3a1a" {...line} />
            <path d="M30 30H70" stroke="#3a2a1a" stroke-width="4" />
            <For each={[40, 60]}>
              {x => (
                <>
                  <circle cx={x} cy="29" r="7" fill="#c8a040" {...line} stroke-width="2" />
                  <circle cx={x} cy="29" r="4.5" fill="#5fd0ff" />
                  <circle cx={x - 1.5} cy="27.5" r="1.4" fill="#fff" />
                </>
              )}
            </For>
            <path d="M36 52Q40 50 42 54" stroke="#2a1a10" stroke-width="2.5" stroke-linecap="round" opacity=".7" />
          </>
        }
      />

      {/* the radio operator: headphones over the cap, the microphone in front of the mouth */}
      <Crew
        id="radio"
        skin="#f2c8a8"
        shade="#c89a7a"
        eyes="#4a2a1a"
        coat="#4a6a3a"
        front={<path d="M42 70L50 78L58 70" fill="none" stroke="#2a3a1a" stroke-width="2.4" />}
        hat={
          <>
            <path d="M30 36Q30 15 50 14Q70 15 70 36Q64 28 50 28Q36 28 30 36Z" fill="#2a1a10" {...line} />
            <path d="M26 44Q24 8 50 8Q76 8 74 44" fill="none" stroke="#0a0610" stroke-width="6" />
            <path d="M26 44Q24 8 50 8Q76 8 74 44" fill="none" stroke="#5a6676" stroke-width="2.4" />
            <rect x="20" y="38" width="12" height="18" rx="5" fill="#3a3e48" {...line} stroke-width="2" />
            <rect x="68" y="38" width="12" height="18" rx="5" fill="#3a3e48" {...line} stroke-width="2" />
            <path d="M26 54Q30 64 42 62" fill="none" stroke="#0a0610" stroke-width="2.4" />
            <circle cx="43" cy="62" r="3" fill="#3a3e48" {...line} stroke-width="1.4" />
            <circle cx="74" cy="47" r="1.6" fill="#3ddc6a" />
          </>
        }
      />

      {/* the cook: a tall chef's hat, a curled moustache, a white jacket and a red scarf */}
      <Crew
        id="cook"
        skin="#f0b890"
        shade="#c8886a"
        eyes="#3a2010"
        coat="#f8f8f8"
        mouth="smile"
        front={
          <>
            <path d="M38 70L50 80L62 70L58 66H42Z" fill="#e8322f" {...line} stroke-width="2" />
            <For each={[[40, 86], [60, 86], [40, 96], [60, 96]]}>{([x, y]) => <circle cx={x} cy={y} r="2.2" fill="#c8c0b0" {...line} stroke-width="1.2" />}</For>
          </>
        }
        hat={
          <>
            <path d="M30 30Q20 26 24 14Q30 4 40 10Q46 0 56 4Q64 0 70 8Q82 10 76 24Q74 30 70 30Z" fill="#fff" {...line} />
            <rect x="30" y="26" width="40" height="9" rx="2" fill="#f2f2f2" {...line} stroke-width="2" />
            <path d="M42 56Q38 54 34 58Q36 52 42 53Q46 52 50 55Q54 52 58 53Q64 52 66 58Q62 54 58 56Q54 58 50 56Q46 58 42 56Z" fill="#3a2010" {...line} stroke-width="1.2" />
          </>
        }
      />

      {/* the torpedo in the tube */}
      <symbol id="s-torpedo" viewBox="0 0 100 100">
        <defs>{steel('torpedo-steel')}</defs>
        <g transform="rotate(-32 50 50)">
          <path d="M-2 38L12 50L-2 62ZM2 50H14" fill="#c41f24" {...ink} />
          <path d="M10 38H66C82 38 96 44 100 50C96 56 82 62 66 62H10Z" fill="url(#torpedo-steel)" {...ink} />
          <path d="M66 38C82 38 96 44 100 50C96 56 82 62 66 62Z" fill="#e8322f" {...ink} />
          <path d="M26 38V62" stroke="#ffc21f" stroke-width="6" />
          <path d="M34 44H60" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" />
        </g>
      </symbol>

      {/* the periscope head: the hood, the glass catching the light and the handles */}
      <Framed id="scope">
        <defs>
          {steel('scope-steel')}
          <radialGradient id="scope-glass" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#e6fbff" />
            <stop offset=".5" stop-color="#3fc0f0" />
            <stop offset="1" stop-color="#0f5a9a" />
          </radialGradient>
        </defs>
        <rect x="40" y="26" width="20" height="72" fill="url(#scope-steel)" {...line} />
        <path d="M40 60H60M40 78H60" stroke="#0a0610" stroke-width="2" opacity=".5" />
        <path d="M36 34V14C36 8 40 4 46 4H82V34Z" fill="url(#scope-steel)" {...line} />
        <circle cx="72" cy="19" r="12" fill="url(#scope-glass)" {...line} />
        <path d="M20 70H40M20 70V62M60 70H80M80 70V62" fill="none" stroke="#0a0610" stroke-width="7" stroke-linecap="round" />
        <path d="M20 70H40M20 70V62M60 70H80M80 70V62" fill="none" stroke="#c8a040" stroke-width="3" stroke-linecap="round" />
        <Sparkle x={67} y={14} size={7} />
      </Framed>

      {/* the torpedo wild: wild in vargflocken, and it loads the section of the tube under its reel */}
      <Framed id="twild">
        <defs>{steel('twild-steel')}</defs>
        <g transform="rotate(-20 50 44)">
          <path d="M4 34L14 44L4 54Z" fill="#c41f24" {...line} />
          <path d="M14 34H66C80 34 92 39 96 44C92 49 80 54 66 54H14Z" fill="url(#twild-steel)" {...line} />
          <path d="M66 34C80 34 92 39 96 44C92 49 80 54 66 54Z" fill="#e8322f" {...line} />
          <path d="M28 34V54" stroke="#ffc21f" stroke-width="5" />
          <path d="M34 39H62" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" />
        </g>
        <rect x="14" y="66" width="72" height="20" rx="5" fill="#ffc83d" {...line} stroke-width="2.4" />
        <text x="50" y="81.5" text-anchor="middle" font-size="15" font-weight="900" letter-spacing="2" fill="#0a0610">
          WILD
        </text>
      </Framed>

      {/* the low symbols: the card ranks stencilled on riveted steel */}
      <For each={[['ace', 'A', '#ffc83d'], ['king', 'K', '#e8322f'], ['queen', 'Q', '#b06aff'], ['jack', 'J', '#3ddc6a'], ['ten', '10', '#5fd0ff']]}>
        {([id, rank, color]) => <Rank id={id} rank={rank} color={color} />}
      </For>
    </>
  )
}
