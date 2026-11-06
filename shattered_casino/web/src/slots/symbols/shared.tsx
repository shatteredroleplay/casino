import { For, type JSX, Show } from 'solid-js'

type Point = [number, number]

// the outline every symbol is drawn with
export const ink = { stroke: '#1b1220', 'stroke-width': '4', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const

export const ring = (n: number, rx: number, ry: number, turn = 0): Point[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n + turn) * 2 * Math.PI
    return [50 + rx * Math.sin(a), 50 - ry * Math.cos(a)]
  })

const path = (points: Point[]) => points.map(p => p.join(',')).join(' ')

// a little four-pointed glint
export const Sparkle = (props: { x: number; y: number; size: number }) => (
  <path
    d={`M${props.x} ${props.y - props.size}Q${props.x} ${props.y} ${props.x + props.size} ${props.y}Q${props.x} ${props.y} ${props.x} ${props.y + props.size}Q${props.x} ${props.y} ${props.x - props.size} ${props.y}Q${props.x} ${props.y} ${props.x} ${props.y - props.size}Z`}
    fill="#fff"
  />
)

// a face drawn plainly: narrow eyes under a brow, a shadow for the nose and a closed mouth, no cartoon eyes or grins.
// mouth: kept for the callers, only its width is used
export const Face = (props: { x: number; y: number; gap: number; mouth: string }) => (
  <>
    <For each={[props.x - props.gap, props.x + props.gap]}>
      {x => (
        <>
          <path d={`M${x - 5} ${props.y - 5}Q${x} ${props.y - 8} ${x + 5} ${props.y - 5}`} fill="none" stroke="#3a2418" stroke-width="2.2" stroke-linecap="round" />
          <path d={`M${x - 4.5} ${props.y}Q${x} ${props.y - 3} ${x + 4.5} ${props.y}Q${x} ${props.y + 2} ${x - 4.5} ${props.y}Z`} fill="#2a1a14" />
        </>
      )}
    </For>
    <path d={`M${props.x - 2} ${props.y + 3}Q${props.x - 3} ${props.y + 9} ${props.x + 1} ${props.y + 10}`} fill="none" stroke="#000" stroke-opacity=".25" stroke-width="2" stroke-linecap="round" />
    <path d={`M${props.x - 5} ${props.y + 15}H${props.x + 5}`} stroke="#5a2a20" stroke-width="2" stroke-linecap="round" />
  </>
)

// what the tiles of a game look like: the dark at the edges, the glow behind a symbol, the frame and what the tile is made of
export type Look = {
  dark: string
  glow: string
  frame: string
  texture: 'dots' | 'planks' | 'stars' | 'checker' | 'plate' | 'bricks' | 'marble' | 'grain' | 'rock'
}

// the stars of a night tile, the same every time
const stars = Array.from({ length: 22 }, (_, i) => [((i * 37 + 11) % 92) + 4, ((i * 53 + 7) % 92) + 4, i % 5 ? 0.5 : 1.1])

const Texture = (props: { id: string; look: Look }) => {
  const line = { fill: 'none', stroke: '#fff', 'stroke-linecap': 'round' } as const
  switch (props.look.texture) {
    case 'dots':
      return (
        <>
          <pattern id={`tx-${props.id}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="3" cy="3" r="1.2" fill="#fff" opacity=".13" />
          </pattern>
          <rect width="100" height="100" fill={`url(#tx-${props.id})`} />
        </>
      )
    case 'planks':
      return (
        <>
          <path d="M0 26H100M0 52H100M0 78H100" stroke="#000" stroke-width="2.5" opacity=".45" />
          <path d="M0 28H100M0 54H100M0 80H100" stroke="#fff" stroke-width="1" opacity=".1" />
          <path d="M8 12Q30 8 52 13T96 12M4 40Q26 36 50 41T98 39M6 66Q34 62 56 67T96 66M2 92Q30 88 50 93T98 92" {...line} stroke-width=".8" opacity=".09" />
          <For each={[[10, 18], [90, 18], [10, 70], [90, 70]]}>{([x, y]) => <circle cx={x} cy={y} r="1.6" fill="#000" opacity=".5" />}</For>
        </>
      )
    case 'stars':
      return <For each={stars}>{([x, y, r]) => <circle cx={x} cy={y} r={r} fill="#fff" opacity={r > 1 ? 0.55 : 0.35} />}</For>
    case 'checker':
      return (
        <>
          <pattern id={`tx-${props.id}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" fill="#fff" opacity=".07" />
            <rect x="8" y="8" width="8" height="8" fill="#fff" opacity=".07" />
          </pattern>
          <rect width="100" height="100" fill={`url(#tx-${props.id})`} />
        </>
      )
    case 'plate':
      return (
        <>
          <rect x="9" y="9" width="82" height="82" rx="6" {...line} stroke-width="1.2" opacity=".14" />
          <For each={[[9, 9], [91, 9], [9, 91], [91, 91], [50, 9], [50, 91]]}>
            {([x, y]) => (
              <>
                <circle cx={x} cy={y} r="2.4" fill="#000" opacity=".5" />
                <circle cx={x - 0.6} cy={y - 0.6} r="1.4" fill="#fff" opacity=".35" />
              </>
            )}
          </For>
        </>
      )
    case 'bricks':
      return (
        <path
          d="M0 20H100M0 40H100M0 60H100M0 80H100M24 0V20M64 0V20M8 20V40M44 20V40M84 20V40M28 40V60M68 40V60M12 60V80M50 60V80M88 60V80M30 80V100M72 80V100"
          stroke="#000"
          stroke-width="1.6"
          opacity=".3"
        />
      )
    case 'marble':
      return (
        <>
          <path d="M-4 30Q20 24 30 40T62 46Q80 40 104 58M10 104Q24 80 44 78T76 62Q90 56 104 30M30 -4Q34 14 26 26" {...line} stroke-width="1.4" opacity=".16" />
          <path d="M-4 34Q22 30 32 44T64 50" {...line} stroke-width=".6" opacity=".2" />
        </>
      )
    case 'grain':
      return (
        <>
          <pattern id={`tx-${props.id}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)">
            <path d="M0 0V7" stroke="#fff" stroke-width="1.2" opacity=".07" />
          </pattern>
          <rect width="100" height="100" fill={`url(#tx-${props.id})`} />
        </>
      )
    case 'rock':
      return (
        <>
          <path d="M0 22L18 28L30 18L46 26M100 36L82 40L74 54L58 52M0 76L20 70L26 84L44 86M100 82L86 74L72 82" fill="none" stroke="#000" stroke-width="2" opacity=".45" />
          <path d="M0 23L18 29L30 19M100 37L82 41L74 55M0 77L20 71L26 85" fill="none" stroke="#fff" stroke-width=".8" opacity=".12" />
          <For each={[[14, 50, 3], [62, 14, 2], [88, 60, 2.5], [40, 94, 2]]}>{([x, y, r]) => <circle cx={x} cy={y} r={r} fill="#000" opacity=".3" />}</For>
        </>
      )
  }
}

// a symbol's tile: dark at the edges with a glow behind the symbol, the game's texture on it and a bevelled frame
export const Tile = (props: { id: string; look: Look; glow?: string }) => (
  <>
    <defs>
      <radialGradient id={`bg-${props.id}`} cx="50%" cy="38%" r="70%">
        <stop offset="0" stop-color={props.glow ?? props.look.glow} stop-opacity=".85" />
        <stop offset=".55" stop-color={props.look.dark} />
        <stop offset="1" stop-color="#06040a" />
      </radialGradient>
      <linearGradient id={`frame-${props.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" />
        <stop offset=".25" stop-color={props.look.frame} />
        <stop offset="1" stop-color="#1a1020" />
      </linearGradient>
      <clipPath id={`tile-${props.id}`}>
        <rect x="2" y="2" width="96" height="96" rx="11" />
      </clipPath>
    </defs>
    <rect x="2" y="2" width="96" height="96" rx="11" fill={`url(#bg-${props.id})`} />
    <g clip-path={`url(#tile-${props.id})`}>
      <Texture id={props.id} look={props.look} />
    </g>
    <rect x="3.5" y="3.5" width="93" height="93" rx="10" fill="none" stroke={`url(#frame-${props.id})`} stroke-width="4" />
  </>
)

// the light catching the top of a tile
export const Shine = () => <path d="M6 14Q8 6 16 5H84Q92 6 94 14Q60 8 6 30Z" fill="#fff" opacity=".14" />

// a symbol drawn on its tile: the drawing a little smaller in the middle. bust: a character fills the tile from the bottom edge
// up, cut off by the frame like a portrait. a game without a look has no tiles, the drawing fills the cell on its own
export const Framed = (props: { id: string; look?: Look; glow?: string; bust?: boolean; children: JSX.Element }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <Show when={props.look} fallback={props.children}>
      {look => (
        <>
          <Tile id={props.id} look={look()} glow={props.glow} />
          <g clip-path={props.bust ? `url(#tile-${props.id})` : undefined}>
            <g transform={props.bust ? 'translate(50 56) scale(1.02) translate(-50 -50)' : 'translate(50 51) scale(.8) translate(-50 -50)'}>{props.children}</g>
          </g>
          <Shine />
        </>
      )}
    </Show>
  </symbol>
)

// the card ranks: a big italic letter in its colour with a glow, outlined in black and with a fine light edge
export const Rank = (props: { id: string; rank: string; color: string; look?: Look }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <Show when={props.look}>{look => <Tile id={props.id} look={look()} glow={props.color} />}</Show>
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
    <Show when={props.look}>
      <Shine />
    </Show>
  </symbol>
)

// a character's head drawn like the fighters in järnnäven: a fine outline, shade down the far side, eyes with a colour and a
// glint, brows (stern pulls them down to the nose), a nose and a mouth (smile, grin or flat). children go on top: hair, hats
const edge = { stroke: '#0a0610', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const
export const Head = (props: { skin: string; shade: string; eyes: string; brows?: string; stern?: boolean; mouth?: 'smile' | 'grin' | 'flat'; children?: JSX.Element }) => (
  <>
    <path d="M44 62H56V74H44Z" fill={props.shade} {...edge} />
    <ellipse cx="30.5" cy="45" rx="4" ry="6" fill={props.skin} {...edge} />
    <ellipse cx="69.5" cy="45" rx="4" ry="6" fill={props.shade} {...edge} />
    <path d="M31 40Q31 18 50 17Q69 18 69 40Q69 56 61 64Q55 69 50 69Q45 69 39 64Q31 56 31 40Z" fill={props.skin} {...edge} />
    <path d="M58 20Q69 24 69 40Q69 56 61 64Q55 69 50 69Q60 60 61 46Q62 30 58 20Z" fill={props.shade} opacity=".7" />
    <For each={[[42, -1], [58, 1]]}>
      {([x, d]) => (
        <>
          <path d={`M${x - 6} 43Q${x} 38 ${x + 6} 43Q${x} 46 ${x - 6} 43Z`} fill="#fff" stroke="#0a0610" stroke-width="1.5" />
          <circle cx={x + d * 0.4} cy="42.6" r="2.3" fill={props.eyes} />
          <circle cx={x + d * 0.4} cy="42.6" r="1.1" fill="#0a0610" />
          <circle cx={x + d * 0.4 - 0.8} cy="41.8" r=".6" fill="#fff" />
          <path d={props.stern ? `M${x + 7 * d} 35L${x - 7 * d} 38.5` : `M${x - 6} 36.5Q${x} 34 ${x + 6} 36.5`} fill="none" stroke={props.brows ?? '#2a1608'} stroke-width="3.2" stroke-linecap="round" />
        </>
      )}
    </For>
    <path d="M50 44L47 53Q50 55 53 53" fill="none" stroke="#0a0610" stroke-width="1.6" stroke-linecap="round" opacity=".6" />
    {props.mouth === 'grin' ? (
      <path d="M43 59Q50 64 58 58Q56 63 50 63.5Q45 63 43 59Z" fill="#fff" stroke="#0a0610" stroke-width="1.6" />
    ) : props.mouth === 'smile' ? (
      <path d="M44 59Q50 63 56 59" fill="none" stroke="#5a1a14" stroke-width="2.2" stroke-linecap="round" />
    ) : (
      <path d="M45 60H55" stroke="#5a1a14" stroke-width="2.2" stroke-linecap="round" />
    )}
    {props.children}
  </>
)

// the scatter: light rays behind a burst with the game's emblem on it and BONUS on a band across, on its tile when the game
// has tiles
export function Bonus(props: { id?: string; look?: Look; from: string; to: string; band: string; children?: JSX.Element }) {
  const id = props.id ?? 'scatter'
  const burst = ring(20, 47, 47).map(([x, y], i): Point => (i % 2 ? [50 + (x - 50) * 0.78, 50 + (y - 50) * 0.78] : [x, y]))
  return (
    <symbol id={`s-${id}`} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={`${id}-fill`}>
          <stop offset="0" stop-color={props.from} />
          <stop offset="1" stop-color={props.to} />
        </radialGradient>
      </defs>
      <Show
        when={props.look}
        fallback={
          <>
            <polygon points={path(burst)} fill={`url(#${id}-fill)`} {...ink} stroke-width="3.5" />
            {props.children}
            <rect x="3" y="52" width="94" height="30" rx="8" fill={props.band} {...ink} stroke-width="3.5" />
            <text x="50" y="75" text-anchor="middle" font-size="23" font-weight="700" letter-spacing="1" fill="#fff">
              BONUS
            </text>
          </>
        }
      >
        {look => (
          <>
            <Tile id={id} look={look()} glow={props.from} />
            <For each={ring(14, 47, 47)}>{([x, y]) => <path d={`M50 50L${x} ${y}`} stroke={props.from} stroke-width="3" opacity=".3" />}</For>
            <g transform="translate(50 50) scale(.86) translate(-50 -50)">
              <polygon points={path(burst)} fill={`url(#${id}-fill)`} {...ink} stroke-width="3" />
              {props.children}
              <path d="M-2 56L8 52H92L102 56L96 66L102 76L92 82H8L-2 76L4 66Z" fill={props.band} {...ink} stroke-width="3" />
              <path d="M8 55H92" stroke="#fff" stroke-width="2" opacity=".3" />
              <text x="50" y="75" text-anchor="middle" font-size="22" font-weight="900" font-style="italic" letter-spacing="1" fill="#fff" stroke="#0a0610" stroke-width="3" paint-order="stroke">
                BONUS
              </text>
            </g>
            <Sparkle x={80} y={18} size={6} />
            <Shine />
          </>
        )}
      </Show>
    </symbol>
  )
}
