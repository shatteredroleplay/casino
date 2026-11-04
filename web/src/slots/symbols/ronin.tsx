import { For, type JSX } from 'solid-js'
import { Face, ink, ring, Sparkle } from './shared'

// a samurai animal: a round head with its ears, a helmet or a headband in its colour, and the muzzle on top
const Samurai = (props: { id: string; fur: string; ears: JSX.Element; helmet: string; crest?: string; tile: string; children?: JSX.Element }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <Tile color={props.tile} gold />
    <g transform="translate(8 8) scale(.84)">
    <path d="M14 98C14 78 30 70 50 70C70 70 86 78 86 98Z" fill={props.helmet} {...ink} />
    <path d="M40 70L50 86L60 70" fill="#f2e6d0" {...ink} stroke-width="3" />
    {props.ears}
    <circle cx="50" cy="50" r="30" fill={props.fur} {...ink} />
    <path d="M18 38C18 18 82 18 82 38L90 44H10Z" fill={props.helmet} {...ink} />
    {props.crest && <path d="M50 22C38 8 26 6 20 10C32 12 40 18 46 26ZM50 22C62 8 74 6 80 10C68 12 60 18 54 26Z" fill={props.crest} {...ink} stroke-width="3" />}
    <circle cx="50" cy="30" r="5" fill={props.crest ?? '#ffd23d'} {...ink} stroke-width="2.5" />
    {props.children}
    </g>
  </symbol>
)

// every symbol sits on a square tile: a gradient in its colour, a light from the top, and a frame (gold for the animals)
const Tile = (props: { color: string; gold?: boolean }) => {
  const id = `tile-${props.color.slice(1)}`
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color={props.color} />
          <stop offset="1" stop-color="#140818" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="12" fill={`url(#${id})`} />
      <path d="M8 10Q50 -2 92 10V40Q50 26 8 40Z" fill="#fff" opacity=".1" />
      <rect x="2" y="2" width="96" height="96" rx="12" fill="none" stroke={props.gold ? '#ffcf5a' : '#9a8aa8'} stroke-width={props.gold ? 5 : 3} />
      <rect x="7" y="7" width="86" height="86" rx="8" fill="none" stroke="#1b1220" stroke-width="2" opacity=".6" />
    </>
  )
}

// the bamboo valley: samurai animals and brush-painted ranks
export default function Ronin() {
  return (
    <>
      {/* the scatter: a gold coin with FS on it, two blades crossed behind */}
      <symbol id="s-scatter" viewBox="0 0 100 100">
        <Tile color="#ffb81f" gold />
        <path d="M14 86L86 14M14 14L86 86" stroke="#c8d4e0" stroke-width="7" stroke-linecap="round" />
        <path d="M14 86L86 14M14 14L86 86" fill="none" {...ink} stroke-width="2" />
        <circle cx="50" cy="50" r="34" fill="#ffc83d" {...ink} />
        <circle cx="50" cy="50" r="26" fill="none" stroke="#b8781a" stroke-width="3" />
        <text x="50" y="62" text-anchor="middle" font-size="32" font-weight="700" fill="#8a1a1a" stroke="#1b1220" stroke-width="1.5">
          FS
        </text>
        <Sparkle x={74} y={24} size={7} />
      </symbol>

      {/* stackways: a lacquered box of stacked tiles, the revealing one in gold with a question on it */}
      <symbol id="s-stack" viewBox="0 0 100 100">
        <Tile color="#8a1a2a" gold />
        <rect x="12" y="10" width="76" height="80" rx="10" fill="#8a1a2a" {...ink} />
        <For each={[22, 42, 62]}>{y => <rect x="22" y={y} width="56" height="16" rx="4" fill="#ffc83d" {...ink} stroke-width="3" />}</For>
        <path d="M22 26H78M22 46H78M22 66H78" stroke="#fff" stroke-width="2" opacity=".5" />
      </symbol>
      <symbol id="s-reveal" viewBox="0 0 100 100">
        <For each={ring(12, 46, 46)}>{([x, y]) => <path d={`M50 50L${x} ${y}`} stroke="#ffe27a" stroke-width="5" stroke-linecap="round" opacity=".6" />}</For>
        <Tile color="#ffc83d" gold />
        <rect x="14" y="12" width="72" height="76" rx="12" fill="#ffc83d" {...ink} />
        <rect x="22" y="20" width="56" height="60" rx="8" fill="#5a1a6a" {...ink} stroke-width="3" />
        <text x="50" y="68" text-anchor="middle" font-size="48" font-weight="700" fill="#ffe27a" stroke="#1b1220" stroke-width="2">
          ?
        </text>
      </symbol>

      <Samurai
        id="monkey"
        tile="#c83a3a"
        fur="#8a5a3a"
        helmet="#c8202a"
        crest="#ffd23d"
        ears={
          <For each={[18, 82]}>{x => <circle cx={x} cy="54" r="11" fill="#f2c8a0" {...ink} />}</For>
        }
      >
        <ellipse cx="50" cy="60" rx="20" ry="16" fill="#f2c8a0" />
        <Face x={50} y={54} gap={9} mouth="M43 66C47 70 53 70 57 66" />
      </Samurai>

      <Samurai
        id="tiger"
        tile="#d8782a"
        fur="#f08a24"
        helmet="#2a2a3a"
        crest="#e8322f"
        ears={
          <For each={[24, 76]}>{x => <circle cx={x} cy="30" r="10" fill="#f08a24" {...ink} />}</For>
        }
      >
        <path d="M22 50L32 52M22 58L32 58M78 50L68 52M78 58L68 58" {...ink} stroke-width="4" />
        <ellipse cx="50" cy="64" rx="15" ry="11" fill="#fff" />
        <path d="M45 60L50 64L55 60Z" fill="#1b1220" />
        <Face x={50} y={50} gap={11} mouth="M44 70C47 73 53 73 56 70" />
      </Samurai>

      <Samurai
        id="fox"
        tile="#3a6ac8"
        fur="#e8702a"
        helmet="#2a5aa8"
        ears={
          <For each={[[20, 1], [80, -1]]}>{([x, d]) => <path d={`M${x} 46L${x + d * 4} 12L${x + d * 26} 30Z`} fill="#e8702a" {...ink} />}</For>
        }
      >
        <path d="M24 56C34 76 66 76 76 56C66 64 34 64 24 56Z" fill="#fff" />
        <circle cx="50" cy="64" r="4" fill="#1b1220" />
        <Face x={50} y={50} gap={11} mouth="M45 70C48 72 52 72 55 70" />
      </Samurai>

      {/* the bear wears the straw hat of a wandering ronin */}
      <symbol id="s-bear" viewBox="0 0 100 100">
        <Tile color="#6a8a2a" gold />
        <g transform="translate(8 8) scale(.84)">
        <path d="M14 98C14 78 30 70 50 70C70 70 86 78 86 98Z" fill="#3a3a4a" {...ink} />
        <For each={[22, 78]}>{x => <circle cx={x} cy="40" r="11" fill="#7a4a2a" {...ink} />}</For>
        <circle cx="50" cy="54" r="30" fill="#7a4a2a" {...ink} />
        <ellipse cx="50" cy="66" rx="15" ry="11" fill="#d8a878" />
        <ellipse cx="50" cy="61" rx="6" ry="4" fill="#1b1220" />
        <Face x={50} y={50} gap={11} mouth="M45 72C48 74 52 74 55 72" />
        <path d="M6 34L50 8L94 34Q50 26 6 34Z" fill="#d8b860" {...ink} />
        <path d="M30 22L50 10L70 22" fill="none" stroke="#a88a3a" stroke-width="3" />
        </g>
      </symbol>

      <Samurai
        id="panda"
        tile="#2a9a6a"
        fur="#f8f8f8"
        helmet="#2a8a4a"
        ears={
          <For each={[22, 78]}>{x => <circle cx={x} cy="32" r="11" fill="#1b1220" {...ink} />}</For>
        }
      >
        <For each={[39, 61]}>{x => <ellipse cx={x} cy="51" rx="9" ry="11" fill="#1b1220" transform={`rotate(${x < 50 ? 20 : -20} ${x} 51)`} />}</For>
        <For each={[39, 61]}>{x => <circle cx={x} cy="50" r="3.5" fill="#fff" />}</For>
        <ellipse cx="50" cy="63" rx="5" ry="3.5" fill="#1b1220" />
        <path d="M45 70C48 72 52 72 55 70" fill="none" {...ink} stroke-width="3" />
      </Samurai>

      {/* the low symbols: the ranks painted with a brush on paper charms */}
      <For each={[['ace', 'A', '#c8202a'], ['king', 'K', '#2a5aa8'], ['queen', 'Q', '#8a2a8a'], ['jack', 'J', '#2a8a4a'], ['ten', '10', '#c86a1a']]}>
        {([id, rank, color]) => (
          <symbol id={`s-${id}`} viewBox="0 0 100 100">
            <Tile color="#4a3a5a" />
            <circle cx="50" cy="50" r="34" fill="none" stroke={color} stroke-width="6" stroke-dasharray="180 40" stroke-linecap="round" opacity=".55" />
            <text x="50" y={rank === '10' ? 66 : 70} text-anchor="middle" font-size={rank === '10' ? '44' : '58'} font-weight="700" fill={color} stroke="#1b1220" stroke-width="3" paint-order="stroke">
              {rank}
            </text>
          </symbol>
        )}
      </For>
    </>
  )
}
