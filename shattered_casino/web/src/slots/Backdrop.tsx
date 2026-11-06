import { For } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { config } from './config'
import { ring } from './symbols/shared'

const ink = '#1b1220'

// the same every time: the scenes are drawn from a fixed sequence, not Math.random
const spread = (n: number, seed: number) => Array.from({ length: n }, (_, i) => [(i * 7919 * seed) % 1280, (i * 104729 * seed) % 1000] as const)

const sky = (stops: string[]) => (
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <For each={stops}>{(c, i) => <stop offset={i() / (stops.length - 1)} stop-color={c} />}</For>
  </linearGradient>
)

// a fjord at sunset, the longship on its way home from the brawl
const Holmgang = () => (
  <>
    <defs>{sky(['#2a1030', '#8a2f3c', '#ff9a3c'])}</defs>
    <rect width="1280" height="440" fill="url(#sky)" />
    <circle cx="640" cy="430" r="130" fill="#ffd76a" />
    <path d="M0 440V300L110 210L200 300L300 170L430 330L520 280L640 440Z" fill="#5a2440" />
    <path d="M1280 440V280L1170 190L1080 290L980 200L860 340L760 300L640 440Z" fill="#5a2440" />
    <path d="M0 440V360L90 300L180 380L260 330L360 440ZM1280 440V350L1200 300L1110 390L1020 340L930 440Z" fill="#33122a" />
    <rect y="440" width="1280" height="280" fill="#3a1428" />

    <g transform="translate(34 496) scale(.8)">
      <rect x="112" y="-170" width="8" height="250" fill={ink} />
      <path d="M40 -160H192Q210 -80 192 0H40Q22 -80 40 -160Z" fill="#f2e6d0" stroke={ink} stroke-width="5" />
      <path d="M70 -160Q54 -80 70 0H100Q84 -80 100 -160ZM132 -160Q116 -80 132 0H162Q146 -80 162 -160Z" fill="#c8322c" />
      <path d="M-30 50C-34 20 -20 -10 6 -6C-6 0 -8 14 0 22L10 70Q116 120 222 70L232 22C240 14 238 0 226 -6C252 -10 266 20 262 50Q250 120 200 130H32Q-18 120 -30 50Z" fill="#2a1020" stroke={ink} stroke-width="5" />
      <For each={[40, 78, 116, 154, 192]}>{x => <circle cx={x} cy="92" r="16" fill={x % 76 === 40 ? '#f5a623' : '#c8322c'} stroke={ink} stroke-width="4" />}</For>
    </g>

    <g transform="translate(1100 500) scale(.5)">
      <rect x="112" y="-170" width="8" height="250" fill={ink} />
      <path d="M40 -160H192Q210 -80 192 0H40Q22 -80 40 -160Z" fill="#c8322c" stroke={ink} stroke-width="6" />
      <path d="M-30 50Q116 120 262 50Q250 120 200 130H32Q-18 120 -30 50Z" fill="#2a1020" stroke={ink} stroke-width="6" />
    </g>

  </>
)

// a winter night up north: northern lights over the mountains, a camp on one side and a moose on the other
const Vildmark = () => (
  <>
    <defs>{sky(['#030a1e', '#0c2a4a', '#1f6a6a'])}</defs>
    <rect width="1280" height="480" fill="url(#sky)" />
    <For each={spread(50, 7)}>{([x, y], i) => <circle cx={x} cy={y % 280} r={1.5 + (i() % 3)} fill="#fff" opacity=".7" />}</For>
    <circle cx="1170" cy="150" r="42" fill="#f2f8ff" />
    <path d="M0 150Q200 50 420 140T860 100T1280 80V150Q1060 190 860 170T420 220T0 240Z" fill="#5df0b0" opacity=".3" />
    <path d="M0 210Q240 120 460 200T900 160T1280 150V200Q1080 240 900 220T460 270T0 290Z" fill="#b07aff" opacity=".22" />
    <path d="M0 110Q260 40 520 90T1280 30V70Q900 120 520 130T0 170Z" fill="#5df0b0" opacity=".16" />

    <path d="M0 480V330L130 220L250 330L380 200L520 360L640 300L760 370L900 210L1040 340L1160 240L1280 340V480Z" fill="#1d4466" />
    <For each={[20, 90, 170, 250, 1030, 1110, 1180, 1250]}>
      {(x, i) => {
        const h = 150 + ((i() * 53) % 70)
        return (
          <path d={`M${x} ${490 - h}L${x + 44} ${490 - h * 0.55}H${x + 20}L${x + 56} ${490 - h * 0.2}H${x + 8}V490H${x - 8}V${490 - h * 0.2}H${x - 56}L${x - 20} ${490 - h * 0.55}H${x - 44}Z`} fill="#061a26" />
        )
      }}
    </For>
    <path d="M0 480Q320 450 640 474T1280 460V720H0Z" fill="#35587a" />

    <g transform="translate(40 470)">
      <path d="M0 124L72 0L144 124Z" fill="#e8702a" stroke={ink} stroke-width="5" stroke-linejoin="round" />
      <path d="M48 124L72 60L96 124Z" fill="#3a1a10" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <circle cx="176" cy="96" r="56" fill="#ffb24a" opacity=".2" />
      <path d="M158 120L196 108M158 108L196 120" stroke="#5a3418" stroke-width="9" stroke-linecap="round" />
      <path d="M162 108Q154 84 176 62Q198 84 190 108Z" fill="#ffb24a" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <path d="M170 108Q166 94 176 84Q186 94 182 108Z" fill="#fff0a8" />
    </g>

    <g transform="translate(1090 470)" fill="#061a26">
      <ellipse cx="86" cy="62" rx="58" ry="28" />
      <path d="M40 54L10 22L28 14L62 44ZM46 80H58V130H46ZM66 84H76V130H66ZM108 84H118V130H108ZM126 80H138V130H126Z" />
      <ellipse cx="6" cy="22" rx="24" ry="12" transform="rotate(20 6 22)" />
      <path d="M14 10C6 -4 -8 -18 -30 -16C-22 -12 -20 -6 -22 0C-14 -6 -8 -2 -6 4C0 -2 6 2 8 12ZM22 8C24 -8 36 -22 58 -24C52 -18 52 -12 56 -6C46 -10 42 -4 42 2C36 -4 30 0 30 10Z" />
    </g>
  </>
)

// three in the morning: the kiosk is the only thing still open
const Fyllekak = () => (
  <>
    <defs>{sky(['#0a0620', '#2a1450', '#b03a8a'])}</defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <For each={spread(40, 5)}>{([x, y], i) => <circle cx={x} cy={y % 300} r={1.5 + (i() % 3)} fill="#fff" opacity=".7" />}</For>
    <circle cx="120" cy="156" r="46" fill="#fff3c4" />
    <circle cx="104" cy="144" r="9" fill="#e6d49a" />
    <circle cx="134" cy="172" r="12" fill="#e6d49a" />

    <For each={[[0, 150, 300], [140, 120, 400], [250, 170, 260], [410, 130, 360], [530, 180, 290], [700, 140, 420], [830, 160, 310], [980, 120, 380], [1090, 190, 280]]}>
      {([x, w, h]) => (
        <>
          <rect x={x} y={600 - h} width={w} height={h} fill="#140a2a" />
          <For each={spread(Math.floor((w * h) / 2600), w + h)}>
            {([a, b], i) => <rect x={x + 14 + (a % Math.floor((w - 28) / 26)) * 26} y={616 - h + (b % Math.floor((h - 40) / 34)) * 34} width="14" height="20" fill={i() % 3 ? '#ffd76a' : '#7ad7ff'} opacity=".45" />}
          </For>
        </>
      )}
    </For>

    <rect y="600" width="1280" height="120" fill="#0c0716" />

    <g transform="translate(46 446) scale(.56)">
      <rect x="0" y="60" width="250" height="240" fill="#3a1f5a" stroke={ink} stroke-width="5" />
      <rect x="28" y="110" width="194" height="100" fill="#ffe08a" stroke={ink} stroke-width="5" />
      <rect x="118" y="110" width="8" height="100" fill={ink} />
      <path d="M96 124H148L138 196H106Z" fill="#8a4a22" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <path d="M100 150H144M102 172H142" stroke="#5a2a10" stroke-width="4" />
      <path d="M-14 60H264L250 104H0Z" fill="#fff" stroke={ink} stroke-width="5" stroke-linejoin="round" />
      <For each={[0, 2, 4, 6]}>{i => <path d={`M${-14 + i * 34.75} 60h34.75l-3.5 44h-31.25Z`} fill="#e8322f" />}</For>
      <rect x="20" y="-16" width="210" height="62" rx="10" fill="#1a0a2a" stroke="#ff5fa2" stroke-width="5" />
      <text x="125" y="30" text-anchor="middle" font-size="44" font-weight="700" letter-spacing="4" fill="#ff7ab8">
        KEBAB
      </text>
      <circle cx="125" cy="16" r="150" fill="#ff5fa2" opacity=".1" />
    </g>

    <g transform="translate(1196 108)">
      <path d="M-22 40L-150 500H110Z" fill="#ffe08a" opacity=".13" />
      <rect x="30" y="50" width="12" height="450" fill={ink} />
      <path d="M36 54Q36 20 -20 22" fill="none" stroke={ink} stroke-width="12" stroke-linecap="round" />
      <ellipse cx="-22" cy="32" rx="26" ry="12" fill="#ffe08a" stroke={ink} stroke-width="5" />
    </g>

    <g transform="translate(1160 560)">
      <path d="M-4 44V30M10 44V30" stroke="#ff8a1f" stroke-width="5" stroke-linecap="round" />
      <ellipse cx="4" cy="12" rx="38" ry="22" fill="#fff" stroke={ink} stroke-width="5" />
      <path d="M-6 6Q14 -2 40 10Q20 26 -2 20Z" fill="#aab4c4" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <circle cx="-34" cy="-12" r="18" fill="#fff" stroke={ink} stroke-width="5" />
      <circle cx="-40" cy="-16" r="4" fill={ink} />
      <path d="M-50 -10H-74L-52 0Z" fill="#ff8a1f" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <rect x="-84" y="-10" width="30" height="8" rx="3" fill="#ffd23a" stroke={ink} stroke-width="3" transform="rotate(24 -70 -6)" />
    </g>
  </>
)

// the deep: the boat on patrol, a mine that has been waiting a long time, and a fish that has seen too much
const Ubaten = () => (
  <>
    <defs>{sky(['#0f5a8a', '#06304e', '#010a14'])}</defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <For each={[[200, 180], [520, 140], [800, 200], [1080, 160]]}>{([x, w]) => <path d={`M${x} 0L${x - 260} 720H${x - 260 + w * 2}L${x + w} 0Z`} fill="#fff" opacity=".04" />}</For>
    <For each={spread(34, 11)}>{([x, y], i) => <circle cx={x} cy={(y * 7) % 620} r={3 + (i() % 5) * 2} fill="none" stroke="#bfe8ff" stroke-width="2" opacity=".3" />}</For>
    <path d="M0 720V640Q120 600 260 630T560 620T860 640T1130 610T1280 630V720Z" fill="#04121e" />
    <For each={[30, 250, 1010, 1240]}>
      {(x, i) => <path d={`M${x} 660Q${x - 24} ${600 - i() * 6} ${x} ${550 - i() * 10}Q${x + 24} ${500 - i() * 6} ${x + 4} ${450 - i() * 14}`} fill="none" stroke="#0f6a5a" stroke-width="12" stroke-linecap="round" />}
    </For>

    <g transform="translate(26 500)">
      <path d="M176 44L204 22V66Z" fill="#2a3644" stroke={ink} stroke-width="5" stroke-linejoin="round" />
      <path d="M92 16V-14H114" fill="none" stroke={ink} stroke-width="7" stroke-linecap="round" />
      <rect x="70" y="4" width="44" height="28" rx="7" fill="#3f4e60" stroke={ink} stroke-width="5" />
      <path d="M0 48C0 24 40 20 90 20C140 20 184 28 184 48C184 68 140 76 90 76C40 76 0 72 0 48Z" fill="#3f4e60" stroke={ink} stroke-width="5" />
      <For each={[52, 92, 132]}>{x => <circle cx={x} cy="48" r="10" fill="#ffe08a" stroke={ink} stroke-width="4" />}</For>
      <path d="M-70 48H-8" stroke="#ffe08a" stroke-width="30" stroke-linecap="round" opacity=".12" />
      <For each={[[214, 30, 6], [226, 12, 9], [218, -12, 5]]}>{([x, y, r]) => <circle cx={x} cy={y} r={r} fill="none" stroke="#bfe8ff" stroke-width="2.5" opacity=".7" />}</For>
    </g>

    <g transform="translate(1166 520)">
      <path d="M0 40V130" stroke={ink} stroke-width="5" stroke-dasharray="10 6" />
      <For each={ring(8, 44, 44).map(([x, y]) => [x - 50, y - 50])}>{([x, y]) => <path d={`M${x * 0.7} ${y * 0.7}L${x * 1.25} ${y * 1.25}`} stroke={ink} stroke-width="11" stroke-linecap="round" />}</For>
      <circle r="36" fill="#3a4250" stroke={ink} stroke-width="5" />
      <circle cx="-12" cy="-6" r="6" fill="#fff" />
      <circle cx="12" cy="-6" r="6" fill="#fff" />
      <circle cx="-12" cy="-5" r="2.5" fill={ink} />
      <circle cx="12" cy="-5" r="2.5" fill={ink} />
      <path d="M-10 12Q0 6 10 12" fill="none" stroke={ink} stroke-width="4" stroke-linecap="round" />
    </g>

    <g transform="translate(1110 150)">
      <path d="M44 0L72 -22Q66 0 72 22Z" fill="#ff8a1f" stroke={ink} stroke-width="4" stroke-linejoin="round" />
      <path d="M-30 0C-18 -26 26 -30 48 0C26 30 -18 26 -30 0Z" fill="#ffb347" stroke={ink} stroke-width="4" />
      <circle cx="-8" cy="-6" r="9" fill="#fff" stroke={ink} stroke-width="3" />
      <circle cx="-10" cy="-6" r="3.5" fill={ink} />
      <circle cx="-22" cy="10" r="4" fill={ink} />
    </g>
  </>
)

// the desert at night: the pyramids under a full moon, a palm and the entrance of the tomb
const Farao = () => (
  <>
    <defs>{sky(['#0a0a2e', '#2a1a5a', '#c8643a'])}</defs>
    <rect width="1280" height="520" fill="url(#sky)" />
    <For each={spread(46, 3)}>{([x, y], i) => <circle cx={x} cy={y % 300} r={1.5 + (i() % 3)} fill="#fff" opacity=".7" />}</For>
    <circle cx="1060" cy="140" r="64" fill="#fff3d6" />
    <circle cx="1040" cy="124" r="10" fill="#ead6aa" />
    <circle cx="1080" cy="158" r="14" fill="#ead6aa" />

    <path d="M220 520L470 220L720 520Z" fill="#b8743a" />
    <path d="M470 220L720 520H560Z" fill="#7a4420" />
    <path d="M640 520L820 300L1000 520Z" fill="#a8682e" />
    <path d="M820 300L1000 520H880Z" fill="#6a3a1a" />
    <path d="M0 520L120 380L240 520Z" fill="#8a5428" />
    <path d="M0 540Q320 500 640 530T1280 510V720H0Z" fill="#d89a52" />
    <path d="M0 620Q300 580 700 610T1280 600V720H0Z" fill="#b87a3a" />

    <g transform="translate(70 640)">
      <path d="M40 0Q30 -120 56 -230" fill="none" stroke="#5a3418" stroke-width="16" stroke-linecap="round" />
      <For each={[[-80, -20], [-60, 30], [10, -50], [70, -10], [80, 40]]}>
        {([dx, dy]) => <path d={`M56 -230Q${56 + dx / 2} ${-250 + dy / 2} ${56 + dx} ${-200 + dy}Q${56 + dx / 2} ${-230 + dy / 3} 56 -230Z`} fill="#1f5a3a" stroke={ink} stroke-width="4" stroke-linejoin="round" />}
      </For>
    </g>

    <g transform="translate(1190 470) scale(.7)">
      <rect x="-70" y="-110" width="140" height="130" fill="#c8884a" stroke={ink} stroke-width="5" />
      <path d="M-30 20V-60Q0 -90 30 -60V20Z" fill="#1a0e08" stroke={ink} stroke-width="5" />
      <rect x="-86" y="-128" width="172" height="22" fill="#e0a868" stroke={ink} stroke-width="5" />
      <path d="M-12 -118H12" stroke="#14248a" stroke-width="8" />
      <circle cx="0" cy="-30" r="40" fill="#ffd23d" opacity=".12" />
    </g>
  </>
)

// the top of the mountain: a temple in the clouds at sunset, with lightning far off
const Olympen = () => (
  <>
    <defs>{sky(['#1a0a3a', '#6a2a7a', '#ffb05a'])}</defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <For each={spread(30, 13)}>{([x, y], i) => <circle cx={x} cy={y % 200} r={1.5 + (i() % 2)} fill="#fff" opacity=".6" />}</For>
    <path d="M1150 30L1110 120H1140L1100 220" fill="none" stroke="#fff6c8" stroke-width="7" stroke-linejoin="round" opacity=".8" />
    <path d="M120 60L150 130H126L160 200" fill="none" stroke="#fff6c8" stroke-width="5" stroke-linejoin="round" opacity=".5" />

    <path d="M0 720V560L180 420L330 520L520 360L700 500L860 380L1060 520L1280 430V720Z" fill="#4a2a5a" />

    <g transform="translate(640 400)">
      <path d="M-260 -60L0 -150L260 -60Z" fill="#f2e6d0" stroke={ink} stroke-width="6" stroke-linejoin="round" />
      <rect x="-250" y="-62" width="500" height="20" fill="#e0d0b0" stroke={ink} stroke-width="5" />
      <For each={[-220, -150, -80, -10, 60, 130, 200]}>{x => <rect x={x} y="-42" width="22" height="150" fill="#f2e6d0" stroke={ink} stroke-width="4" />}</For>
      <rect x="-270" y="106" width="540" height="22" fill="#e0d0b0" stroke={ink} stroke-width="5" />
    </g>

    <For each={[[-40, 600, 1.4], [260, 640, 1], [560, 610, 1.6], [900, 640, 1.2], [1160, 600, 1.5]]}>
      {([x, y, k]) => (
        <g transform={`translate(${x} ${y}) scale(${k})`} fill="#fff" opacity=".9">
          <circle cx="60" cy="40" r="50" />
          <circle cx="130" cy="20" r="62" />
          <circle cx="200" cy="44" r="46" />
          <rect x="10" y="40" width="240" height="60" />
        </g>
      )}
    </For>
    <rect y="680" width="1280" height="40" fill="#fff" opacity=".9" />
  </>
)

// the marsh at dawn: reeds, a hunting tower, and the ducks taking off over the water
const Andjakt = () => (
  <>
    <defs>{sky(['#2a2a5a', '#c86a3a', '#ffc86a'])}</defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <circle cx="980" cy="420" r="90" fill="#ffe8a0" opacity=".9" />
    <path d="M0 440Q320 400 640 430T1280 410V720H0Z" fill="#3a4a3a" />
    <path d="M0 470H1280V720H0Z" fill="#5a7a8a" opacity=".7" />
    <For each={spread(18, 23)}>{([x, y]) => <path d={`M${x} ${480 + (y % 200)}h${30 + (y % 40)}`} stroke="#bfe8ff" stroke-width="3" opacity=".25" />}</For>
    <For each={Array.from({ length: 34 }, (_, i) => i)}>
      {i => {
        const x = i < 17 ? i * 14 : 1280 - (i - 17) * 14
        const h = 160 + ((i * 37) % 90)
        return (
          <>
            <path d={`M${x} 720Q${x + 8} ${720 - h / 2} ${x + 4} ${720 - h}`} fill="none" stroke="#3a4a1a" stroke-width="5" />
            <ellipse cx={x + 4} cy={720 - h} rx="5" ry="16" fill="#6a4a2a" />
          </>
        )
      }}
    </For>
    <g transform="translate(1100 250)" fill="none" stroke={ink} stroke-width="8" stroke-linecap="round">
      <path d="M-40 230L-20 40M40 230L20 40M-36 160H36M-28 100H28" />
      <rect x="-50" y="0" width="100" height="44" fill="#6a4a2a" stroke-width="6" />
      <path d="M-60 0L0 -40L60 0Z" fill="#3a2a1a" stroke-width="6" />
    </g>
    <For each={[[180, 150, 1], [260, 110, 0.8], [340, 170, 0.9], [560, 90, 0.7], [640, 130, 0.6]]}>
      {([x, y, k]) => (
        <g transform={`translate(${x} ${y}) scale(${k})`} fill="#1a1a2a">
          <path d="M-30 0Q-16 -22 0 -4Q16 -22 30 0Q16 -10 0 4Q-16 -10 -30 0Z" />
        </g>
      )}
    </For>
    {/* the free spins: the woods are on fire, the ducks are fighting back */}
    <g class="fire">
      <rect width="1280" height="720" fill="#ff4a10" opacity=".22" />
      <For each={Array.from({ length: 26 }, (_, i) => i)}>
        {i => {
          const x = i * 52 - 10
          const h = 110 + ((i * 71) % 120)
          return (
            <path
              class="flame"
              d={`M${x} 470Q${x + 10} ${470 - h * 0.6} ${x + 26} ${470 - h}Q${x + 40} ${470 - h * 0.5} ${x + 52} 470Z`}
              fill={i % 2 ? '#ff8a1f' : '#ffc21f'}
              style={{ 'animation-delay': `${(i * 137) % 900}ms` }}
            />
          )
        }}
      </For>
      <For each={spread(20, 43)}>{([x, y], i) => <circle class="ember" cx={x} cy={300 + (y % 200)} r={2 + (i() % 3)} fill="#ffd26a" style={{ 'animation-delay': `${(i() * 290) % 2600}ms` }} />}</For>
    </g>
  </>
)

// a mountain valley in the evening: waterfalls off the cliffs, a pagoda, cherry blossom, fireflies and a monkey meditating on a rock
const Ronin = () => (
  <>
    <defs>{sky(['#1a1440', '#6a3a6a', '#f2a07a'])}</defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <circle cx="640" cy="250" r="120" fill="#ffe2c4" opacity=".85" />
    <path d="M0 420L120 200L220 330L330 150L460 400H0Z" fill="#4a2a5a" />
    <path d="M1280 420L1170 180L1060 320L960 160L820 400H1280Z" fill="#4a2a5a" />
    <path d="M300 160L330 150L360 175L340 190Z M935 175L960 160L990 185L965 195Z" fill="#f2e6f0" opacity=".8" />
    <For each={[[250, 300, 90], [1015, 280, 110]]}>
      {([x, y, h]) => (
        <g class="falls">
          <path d={`M${x} ${y}h36v${h + 260}h-36Z`} fill="#bfe8ff" opacity=".55" />
          <path d={`M${x + 6} ${y}v${h + 260}M${x + 18} ${y}v${h + 260}M${x + 30} ${y}v${h + 260}`} stroke="#fff" stroke-width="3" stroke-dasharray="18 22" opacity=".7" />
          <ellipse cx={x + 18} cy={y + h + 262} rx="70" ry="16" fill="#fff" opacity=".35" />
        </g>
      )}
    </For>
    <path d="M0 520Q320 470 640 500T1280 480V720H0Z" fill="#2a1a3a" />
    <path d="M0 600Q300 560 700 590T1280 570V720H0Z" fill="#1a1028" />

    <g transform="translate(1110 470)">
      <For each={[0, 1, 2]}>
        {i => (
          <g transform={`translate(0 ${-i * 52}) scale(${1 - i * 0.18})`}>
            <rect x="-34" y="-34" width="68" height="40" fill="#8a2a2a" stroke={ink} stroke-width="5" />
            <path d="M-70 -30Q0 -60 70 -30L54 -46Q0 -66 -54 -46Z" fill="#2a1a2a" stroke={ink} stroke-width="5" stroke-linejoin="round" />
            <rect x="-10" y="-24" width="20" height="30" fill="#ffd27a" />
          </g>
        )}
      </For>
      <path d="M0 -180V-150" stroke={ink} stroke-width="6" />
    </g>

    <g transform="translate(70 360)">
      <path d="M40 260Q30 140 80 60Q110 20 150 10" fill="none" stroke="#3a2420" stroke-width="16" stroke-linecap="round" />
      <path d="M80 60Q50 40 30 50" fill="none" stroke="#3a2420" stroke-width="9" stroke-linecap="round" />
      <For each={[[150, 10, 40], [110, -10, 34], [40, 40, 32], [180, 40, 30], [80, 20, 26]]}>{([x, y, r]) => <circle cx={x} cy={y} r={r} fill="#f7a6c8" opacity=".9" />}</For>
      <For each={spread(14, 5)}>{([x, y]) => <circle cx={(x % 220) - 10} cy={(y % 90) - 40} r="5" fill="#ffd6e8" />}</For>
    </g>

    <g transform="translate(250 600)">
      <ellipse cx="0" cy="30" rx="80" ry="30" fill="#4a3a4a" stroke={ink} stroke-width="5" />
      <ellipse cx="0" cy="-6" rx="34" ry="30" fill="#8a5a3a" stroke={ink} stroke-width="5" />
      <path d="M-34 10Q0 30 34 10" fill="none" stroke={ink} stroke-width="5" />
      <circle cx="0" cy="-44" r="24" fill="#8a5a3a" stroke={ink} stroke-width="5" />
      <ellipse cx="0" cy="-38" rx="16" ry="13" fill="#f2c8a0" />
      <path d="M-8 -42h5M3 -42h5" stroke={ink} stroke-width="3" stroke-linecap="round" />
      <path d="M-5 -32Q0 -29 5 -32" fill="none" stroke={ink} stroke-width="2.5" stroke-linecap="round" />
      <circle cx="-24" cy="-48" r="8" fill="#f2c8a0" stroke={ink} stroke-width="4" />
      <circle cx="24" cy="-48" r="8" fill="#f2c8a0" stroke={ink} stroke-width="4" />
    </g>

    <For each={spread(26, 17)}>
      {([x, y], i) => <circle class="firefly" cx={x} cy={380 + (y % 300)} r={2.5 + (i() % 3)} fill="#fff6a0" style={{ 'animation-delay': `${(i() * 370) % 3000}ms` }} />}
    </For>
  </>
)

// deep in the mountain: timber props holding up the rock, a vein of gold in the wall, rails running into the dark and the cart full of ore
const Gruvan = () => (
  <>
    <defs>
      {sky(['#0a0604', '#24160e', '#3a2414'])}
      <radialGradient id="lamp">
        <stop offset="0" stop-color="#ffc86a" stop-opacity=".55" />
        <stop offset="1" stop-color="#ffc86a" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <path d="M0 0H1280V170Q1100 120 960 190T640 150T300 200T0 160Z" fill="#1a100a" />
    <For each={spread(40, 31)}>{([x, y], i) => <path d={`M${x} ${y % 160}l${14 + (i() % 4) * 6} ${8 + (i() % 3) * 5}l-${10 + (i() % 5) * 3} 10Z`} fill="#3a2a1e" />}</For>
    <path d="M0 260Q160 300 300 250T620 300T980 240T1280 290" fill="none" stroke="#ffd23d" stroke-width="7" stroke-linecap="round" opacity=".55" />
    <For each={spread(16, 37)}>{([x], i) => <circle cx={x} cy={262 + Math.sin(x / 90) * 22} r={4 + (i() % 3) * 2} fill="#ffe27a" />}</For>
    <For each={[60, 1220]}>
      {x => (
        <g>
          <rect x={x - 14} y="120" width="28" height="600" fill="#6a4424" stroke={ink} stroke-width="5" />
          <circle cx={x} cy="330" r="120" fill="url(#lamp)" />
          <path d={`M${x} 290v16`} stroke={ink} stroke-width="4" />
          <rect x={x - 12} y="306" width="24" height="30" rx="5" fill="#ffd27a" stroke={ink} stroke-width="4" />
        </g>
      )}
    </For>
    <rect x="0" y="108" width="1280" height="26" fill="#6a4424" stroke={ink} stroke-width="5" />
    <path d="M0 600Q640 560 1280 600V720H0Z" fill="#1e140c" />
    <g stroke={ink} stroke-width="5">
      <path d="M0 668L1280 668M0 700L1280 700" stroke="#8a8a96" stroke-width="7" />
      <For each={Array.from({ length: 22 }, (_, i) => i * 62)}>{x => <rect x={x} y="660" width="30" height="50" fill="#5a3a20" stroke-width="3" />}</For>
    </g>
    <g transform="translate(1080 610)">
      <path d="M-70 -50H70L56 20H-56Z" fill="#7a5a3a" stroke={ink} stroke-width="5" stroke-linejoin="round" />
      <For each={[[-40, -58, 18], [-10, -66, 20], [24, -60, 18], [48, -54, 12]]}>{([x, y, r], i) => <circle cx={x} cy={y} r={r} fill={i() % 2 ? '#4a3a30' : '#ffd23d'} stroke={ink} stroke-width="4" />}</For>
      <circle cx="-36" cy="30" r="16" fill="#3a3a44" stroke={ink} stroke-width="5" />
      <circle cx="36" cy="30" r="16" fill="#3a3a44" stroke={ink} stroke-width="5" />
    </g>
    <g transform="translate(170 640) rotate(-25)">
      <path d="M0 0V-120" stroke="#6a4424" stroke-width="12" stroke-linecap="round" />
      <path d="M-50 -110Q0 -150 50 -110" fill="none" stroke="#a8b0bc" stroke-width="14" stroke-linecap="round" />
    </g>
    <For each={spread(18, 41)}>{([x, y], i) => <circle class="dust" cx={x} cy={200 + (y % 400)} r={1.5 + (i() % 3)} fill="#ffe2b0" style={{ 'animation-delay': `${(i() * 530) % 4000}ms` }} />}</For>
  </>
)

// a backstreet at night where the fight is on: brick walls and fire escapes, neon over the doors, a chain-link fence, a fire in a
// barrel, steam from the drains and the crowd standing round in the dark
const Jarnnave = () => (
  <>
    <defs>
      {sky(['#07060f', '#1a1030', '#3a1838'])}
      <pattern id="bricks" width="60" height="30" patternUnits="userSpaceOnUse">
        <rect width="60" height="30" fill="#3a1e1e" />
        <path d="M0 0H60M0 15H60M30 0V15M0 15V30M60 15V30" stroke="#1e0e10" stroke-width="3" />
      </pattern>
      <pattern id="fence" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M0 0L24 24M24 0L0 24" stroke="#8a8aa0" stroke-width="1.5" opacity=".45" />
      </pattern>
      <radialGradient id="fire">
        <stop offset="0" stop-color="#ffb84a" stop-opacity=".6" />
        <stop offset="1" stop-color="#ff5a1f" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="1280" height="720" fill="url(#sky)" />
    <For each={spread(16, 7)}>{([x], i) => <rect x={x - 40} y={60 + (i() % 5) * 26} width={60 + (i() % 3) * 30} height="400" fill="#0e0a1a" />}</For>
    <For each={spread(40, 13)}>{([x, y], i) => <rect x={x} y={90 + (y % 120)} width="8" height="10" fill="#ffd27a" opacity={i() % 3 ? 0.25 : 0.7} />}</For>
    <rect x="0" y="0" width="300" height="720" fill="url(#bricks)" />
    <rect x="980" y="0" width="300" height="720" fill="url(#bricks)" />
    <g stroke={ink} stroke-width="5" fill="none">
      <For each={[140, 300]}>
        {y => (
          <>
            <path d={`M20 ${y}H270M20 ${y - 40}H270`} stroke="#4a4a5a" />
            <For each={[30, 80, 130, 180, 230, 260]}>{x => <path d={`M${x} ${y - 40}V${y}`} stroke="#4a4a5a" stroke-width="3" />}</For>
            <path d={`M1010 ${y}H1260M1010 ${y - 40}H1260`} stroke="#4a4a5a" />
            <For each={[1020, 1070, 1120, 1170, 1220, 1250]}>{x => <path d={`M${x} ${y - 40}V${y}`} stroke="#4a4a5a" stroke-width="3" />}</For>
          </>
        )}
      </For>
    </g>
    <g class="neon">
      <rect x="1075" y="120" width="180" height="56" rx="10" fill="#1a0a1a" stroke="#ff3a8a" stroke-width="4" />
      <text x="1165" y="160" text-anchor="middle" font-size="34" font-weight="800" fill="#ff7ab8" style={{ filter: 'drop-shadow(0 0 8px #ff3a8a)' }}>
        ARKAD
      </text>
    </g>
    <g class="neon slow">
      <rect x="25" y="120" width="180" height="56" rx="10" fill="#0a1a2a" stroke="#3ad8ff" stroke-width="4" />
      <text x="115" y="160" text-anchor="middle" font-size="34" font-weight="800" fill="#9ae8ff" style={{ filter: 'drop-shadow(0 0 8px #3ad8ff)' }}>
        FIGHT
      </text>
    </g>
    <rect x="300" y="430" width="680" height="200" fill="url(#fence)" />
    <path d="M300 430H980" stroke="#8a8aa0" stroke-width="5" opacity=".6" />
    <path d="M0 630H1280V720H0Z" fill="#141018" />
    <For each={spread(7, 19)}>{([x], i) => <ellipse cx={x} cy={672 + (i() % 3) * 14} rx={60 + (i() % 3) * 30} ry="6" fill="#ff5a8a" opacity=".12" />}</For>
    <For each={spread(26, 23)}>
      {([x], i) => (
        <g transform={`translate(${x} ${650 + (i() % 4) * 8})`}>
          <circle cx="0" cy="-58" r="14" fill="#07060c" />
          <path d="M-22 0V-30Q-22 -44 0 -44Q22 -44 22 -30V0Z" fill="#07060c" />
        </g>
      )}
    </For>
    <g transform="translate(200 610)">
      <circle cx="0" cy="-60" r="160" fill="url(#fire)" />
      <rect x="-34" y="-50" width="68" height="80" rx="6" fill="#4a3a30" stroke={ink} stroke-width="5" />
      <path d="M-34 -30H34M-34 0H34" stroke={ink} stroke-width="4" />
      <path class="flame" d="M-26 -50Q-20 -90 -6 -70Q0 -110 12 -76Q22 -96 26 -50Z" fill="#ff8a2a" stroke="#ffd23d" stroke-width="3" />
    </g>
    <For each={[[1080, 640], [520, 650]]}>
      {([x, y]) => (
        <g class="steam">
          <ellipse cx={x} cy={y - 40} rx="40" ry="30" fill="#cfc8e0" opacity=".12" />
          <ellipse cx={x + 20} cy={y - 90} rx="50" ry="36" fill="#cfc8e0" opacity=".08" />
        </g>
      )}
    </For>
    <For each={spread(18, 29)}>{([x, y], i) => <circle class="ember" cx={x} cy={300 + (y % 300)} r={1.5 + (i() % 3)} fill="#ffb84a" style={{ 'animation-delay': `${(i() * 310) % 2600}ms` }} />}</For>
  </>
)

const scenes = { holmgang: Holmgang, vildmark: Vildmark, fyllekak: Fyllekak, ubaten: Ubaten, farao: Farao, olympen: Olympen, andjakt: Andjakt, ronin: Ronin, gruvan: Gruvan, jarnnave: Jarnnave }

// the scene behind the board, darkened where the text sits
export default function Backdrop() {
  return (
    <svg class="backdrop" viewBox="0 0 1280 720">
      <Dynamic component={scenes[config.id as keyof typeof scenes]} />
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-opacity=".7" />
        <stop offset=".3" stop-opacity=".15" />
        <stop offset=".7" stop-opacity=".2" />
        <stop offset="1" stop-opacity=".8" />
      </linearGradient>
      <rect width="1280" height="720" fill="url(#shade)" />
    </svg>
  )
}
