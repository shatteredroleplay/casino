import { For, type JSX } from 'solid-js'
import { Bonus, Head, ink, Sparkle } from './shared'

// drawn like järnnäven's fighters but loose on the board, no tiles: a fine dark outline, shade down one side and a shine
const line = { stroke: '#0a0610', 'stroke-width': '2.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round' } as const

const shade = (id: string, top: string, bottom: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color={top} />
    <stop offset="1" stop-color={bottom} />
  </linearGradient>
)

// one of the hunting party from the chest up, a little bigger than a fighter so they fill the low cells
const Hunter = (props: { id: string; skin: string; shade: string; eyes: string; coat: string; stern?: boolean; mouth?: 'smile' | 'grin' | 'flat'; front?: JSX.Element; hat: JSX.Element; behind?: JSX.Element }) => (
  <symbol id={`s-${props.id}`} viewBox="0 0 100 100">
    <g transform="translate(50 54) scale(1.08) translate(-50 -54)">
      {props.behind}
      <path d="M8 100Q10 78 28 72L44 68H56L72 72Q90 78 92 100Z" fill={props.coat} {...line} />
      <path d="M72 72Q90 78 92 100H70Q72 86 72 72Z" fill="#000" opacity=".25" />
      {props.front}
      <Head skin={props.skin} shade={props.shade} eyes={props.eyes} stern={props.stern} mouth={props.mouth}>
        {props.hat}
      </Head>
    </g>
  </symbol>
)

// the marsh at dawn: the hunting party, what they are after and what they brought along
export default function Andjakt() {
  return (
    <>
      <Bonus from="#ffe9a0" to="#e8702a" band="#2a4a1a">
        <circle cx="50" cy="30" r="17" fill="#fff" {...ink} stroke-width="3" />
        <circle cx="50" cy="30" r="10" fill="none" stroke="#e8322f" stroke-width="3" />
        <circle cx="50" cy="30" r="3.5" fill="#e8322f" />
      </Bonus>

      {/* the wild: a camouflage badge with WILD stamped across it and a feather tucked in */}
      <symbol id="s-wild" viewBox="0 0 100 100">
        <defs>
          <clipPath id="wild-badge">
            <path d="M50 4L90 18V52Q90 80 50 96Q10 80 10 52V18Z" />
          </clipPath>
        </defs>
        <path d="M50 4L90 18V52Q90 80 50 96Q10 80 10 52V18Z" fill="#5a6a2a" />
        <g clip-path="url(#wild-badge)">
          <For each={[[22, 22, 16, '#3a4a1a'], [64, 18, 14, '#8a7a3a'], [40, 50, 18, '#2a3a12'], [80, 56, 14, '#8a7a3a'], [24, 76, 14, '#8a7a3a'], [60, 86, 12, '#3a4a1a']] as const}>
            {([x, y, r, c]) => <path d={`M${x - r} ${y}Q${x - r / 2} ${y - r * 0.8} ${x} ${y - r * 0.5}Q${x + r} ${y - r} ${x + r} ${y}Q${x + r / 2} ${y + r * 0.7} ${x} ${y + r * 0.6}Q${x - r} ${y + r * 0.8} ${x - r} ${y}Z`} fill={c} />}
          </For>
        </g>
        <path d="M50 4L90 18V52Q90 80 50 96Q10 80 10 52V18Z" fill="none" {...line} stroke-width="3" />
        <path d="M50 10L84 22V52Q84 76 50 90Q16 76 16 52V22Z" fill="none" stroke="#ffd23d" stroke-width="2" opacity=".7" />
        <path d="M70 8Q86 2 92 14Q82 12 74 20Z" fill="#f2e6d0" {...line} stroke-width="1.8" />
        <rect x="6" y="40" width="88" height="24" rx="4" fill="#ffd23d" {...line} stroke-width="2.6" transform="rotate(-6 50 52)" />
        <text x="50" y="59" text-anchor="middle" font-size="21" font-weight="900" letter-spacing="2" fill="#0a0610" transform="rotate(-6 50 52)">
          WILD
        </text>
      </symbol>

      {/* xways: an ammo crate tied with rope, turns into the symbol of the spin and puts a multiplier under it */}
      <symbol id="s-xways" viewBox="0 0 100 100">
        <defs>{shade('xways-wood', '#c89058', '#6a4220')}</defs>
        <rect x="8" y="16" width="84" height="70" rx="4" fill="url(#xways-wood)" {...line} />
        <path d="M8 39H92M8 62H92" stroke="#3a2008" stroke-width="2.2" />
        <path d="M28 16V86M72 16V86" stroke="#d8b070" stroke-width="5" />
        <path d="M28 16V86M72 16V86" stroke="#0a0610" stroke-width="1.2" stroke-dasharray="3 5" />
        <rect x="30" y="34" width="40" height="32" rx="3" fill="#ffd23d" {...line} stroke-width="2" />
        <text x="50" y="57" text-anchor="middle" font-size="17" font-weight="900" fill="#0a0610">
          MULTI
        </text>
        <path d="M12 20H40" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".3" />
      </symbol>

      {/* the bomb: a molotov cocktail, the rag in its neck already burning */}
      <symbol id="s-bomb" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="bomb-glass" cx=".35" cy=".4" r=".8">
            <stop offset="0" stop-color="#6ad87a" />
            <stop offset="1" stop-color="#1a5a2a" />
          </radialGradient>
          <linearGradient id="bomb-fire" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stop-color="#ffe27a" />
            <stop offset=".5" stop-color="#ff8a1f" />
            <stop offset="1" stop-color="#e8322f" />
          </linearGradient>
        </defs>
        <path d="M50 0Q36 12 44 22Q38 14 44 8Q46 16 50 18Q48 8 56 4Q54 12 60 16Q64 8 62 4Q72 16 58 26H42Z" fill="url(#bomb-fire)" {...line} stroke-width="2" />
        <path d="M44 22L40 32H60L56 22Z" fill="#e8d8b8" {...line} stroke-width="2" />
        <path d="M42 32H58V40Q74 48 74 70Q74 94 50 94Q26 94 26 70Q26 48 42 40Z" fill="url(#bomb-glass)" {...line} />
        <path d="M28 70Q30 92 50 92Q70 92 72 70Z" fill="#e8a21f" opacity=".85" />
        <path d="M30 70Q50 64 70 70" fill="none" stroke="#fff3b0" stroke-width="2" opacity=".7" />
        <path d="M34 50Q30 60 32 72" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6" />
        <rect x="38" y="58" width="24" height="12" rx="2" fill="#f2e6d0" {...line} stroke-width="1.6" />
        <path d="M44 62L56 66M44 66L56 62" stroke="#e8322f" stroke-width="2" />
      </symbol>

      {/* an extra shot: a red shotgun shell with a brass head, one more free spin */}
      <symbol id="s-shot" viewBox="0 0 100 100">
        <defs>
          {shade('shot-paper', '#ff5a5a', '#a8141a')}
          {shade('shot-brass', '#fff0a8', '#b8781a')}
        </defs>
        <rect x="32" y="6" width="36" height="64" rx="6" fill="url(#shot-paper)" {...line} />
        <path d="M38 12V64" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".45" />
        <path d="M32 18H68" stroke="#0a0610" stroke-width="1.4" opacity=".4" />
        <rect x="28" y="68" width="44" height="26" rx="3" fill="url(#shot-brass)" {...line} />
        <path d="M28 78H72" stroke="#8a5a10" stroke-width="2" />
        <circle cx="50" cy="86" r="4" fill="#c8a040" {...line} stroke-width="1.4" />
        <text x="50" y="48" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" stroke="#0a0610" stroke-width="3" paint-order="stroke">
          +1
        </text>
      </symbol>

      {/* the hunter: orange cap and vest, a red beard and squinting down the barrel */}
      <Hunter
        id="hunter"
        skin="#f0c098"
        shade="#c88a68"
        eyes="#2a5a3a"
        coat="#e8702a"
        stern
        front={
          <>
            <path d="M40 70V100M60 70V100" stroke="#3a4a1a" stroke-width="6" />
            <rect x="62" y="82" width="12" height="10" rx="2" fill="#c8402a" {...line} stroke-width="1.6" />
          </>
        }
        hat={
          <>
            <path d="M34 50Q34 70 50 74Q66 70 66 50Q62 62 50 62Q38 62 34 50Z" fill="#c8602a" {...line} />
            <path d="M42 59Q50 56 58 59" fill="none" stroke="#8a3a12" stroke-width="2.4" stroke-linecap="round" />
            <path d="M28 34Q28 12 50 12Q72 12 72 34Z" fill="#ff7a1a" {...line} />
            <path d="M24 34H78Q80 40 72 40H28Q22 40 24 34Z" fill="#e8601a" {...line} stroke-width="2" />
            <path d="M34 20Q42 14 52 14" fill="none" stroke="#ffb070" stroke-width="3" stroke-linecap="round" />
          </>
        }
      />

      {/* the dog: a hound with long ears, its tongue out and a red collar */}
      <symbol id="s-dog" viewBox="0 0 100 100">
        <defs>{shade('dog-fur', '#e0a868', '#a86a30')}</defs>
        <path d="M14 98Q16 80 34 76H66Q84 80 86 98Z" fill="url(#dog-fur)" {...line} />
        <path d="M30 78Q50 86 70 78L70 84Q50 92 30 84Z" fill="#e8322f" {...line} stroke-width="2" />
        <circle cx="50" cy="88" r="4" fill="#ffc83d" {...line} stroke-width="1.4" />
        <path d="M22 26Q6 30 8 56Q10 72 22 70Q28 50 30 34Z" fill="#7a4a1e" {...line} />
        <path d="M78 26Q94 30 92 56Q90 72 78 70Q72 50 70 34Z" fill="#6a3e18" {...line} />
        <path d="M26 40Q26 14 50 14Q74 14 74 40V58Q74 78 50 80Q26 78 26 58Z" fill="url(#dog-fur)" {...line} />
        <path d="M60 18Q74 22 74 40V58Q74 78 50 80Q66 70 66 52Q66 32 60 18Z" fill="#8a5220" opacity=".4" />
        <path d="M42 16Q50 24 58 16Q56 30 50 34Q44 30 42 16Z" fill="#f2e6d0" opacity=".9" />
        <path d="M34 60Q34 50 50 50Q66 50 66 60Q66 74 50 76Q34 74 34 60Z" fill="#f2e6d0" {...line} />
        <ellipse cx="50" cy="55" rx="7" ry="5" fill="#0a0610" />
        <circle cx="48" cy="53.5" r="1.6" fill="#fff" />
        <path d="M42 66Q50 70 58 66" fill="none" stroke="#0a0610" stroke-width="2" stroke-linecap="round" />
        <path d="M50 68Q48 80 54 80Q60 80 56 68Z" fill="#ff6a8a" {...line} stroke-width="1.6" />
        <For each={[[40, -1], [60, 1]]}>
          {([x, d]) => (
            <>
              <path d={`M${x - 6} 38Q${x} 32 ${x + 6} 38Q${x} 42 ${x - 6} 38Z`} fill="#fff" stroke="#0a0610" stroke-width="1.4" />
              <circle cx={x + d * 0.5} cy="37.5" r="2.6" fill="#4a2a10" />
              <circle cx={x + d * 0.5} cy="37.5" r="1.2" fill="#0a0610" />
              <circle cx={x + d * 0.5 - 0.8} cy="36.6" r=".6" fill="#fff" />
              <path d={`M${x - 6} 31Q${x} 28 ${x + 6} 31`} fill="none" stroke="#5a3010" stroke-width="2.4" stroke-linecap="round" />
            </>
          )}
        </For>
      </symbol>

      {/* the duck: a mallard drake with his green head, white collar and a shotgun of his own under the wing */}
      <symbol id="s-duck" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="duck-head" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#5ae08a" />
            <stop offset="1" stop-color="#0a5a3a" />
          </radialGradient>
          {shade('duck-body', '#c8a080', '#7a5a3a')}
        </defs>
        <path d="M14 74Q14 54 40 52Q72 50 88 64Q96 76 84 88Q64 98 40 96Q14 94 14 74Z" fill="url(#duck-body)" {...line} />
        <path d="M32 70Q50 60 80 72Q66 82 44 82Q34 80 32 70Z" fill="#8a6a50" {...line} stroke-width="2" />
        <path d="M44 72L76 74M48 78L74 78" stroke="#5a4030" stroke-width="1.4" />
        <path d="M84 62L96 54L92 70Z" fill="#2a2a34" {...line} stroke-width="2" />
        <path d="M30 56H54" stroke="#fff" stroke-width="5" />
        <circle cx="42" cy="34" r="20" fill="url(#duck-head)" {...line} />
        <path d="M26 30Q16 28 6 34Q4 40 10 42Q20 42 26 38Z" fill="#ffc83d" {...line} stroke-width="2" />
        <path d="M8 38H22" stroke="#c8901a" stroke-width="1.4" />
        <path d="M34 28Q38 22 46 26Q42 32 34 28Z" fill="#fff" stroke="#0a0610" stroke-width="1.4" />
        <circle cx="40" cy="27" r="2.2" fill="#3a1a08" />
        <circle cx="39.4" cy="26.4" r=".7" fill="#fff" />
        <path d="M32 22L48 24" stroke="#0a0610" stroke-width="3" stroke-linecap="round" />
        <path d="M34 20Q42 14 54 18" fill="none" stroke="#9affc0" stroke-width="2.4" stroke-linecap="round" opacity=".7" />
        <g transform="rotate(-14 64 66)">
          <rect x="38" y="62" width="58" height="6" rx="2" fill="#6a7686" {...line} stroke-width="1.8" />
          <path d="M52 64H70L76 78H62Z" fill="#8a5a2a" {...line} stroke-width="1.8" />
        </g>
      </symbol>

      {/* the goose: a canada goose, black neck and white cheek, honking */}
      <symbol id="s-goose" viewBox="0 0 100 100">
        <defs>{shade('goose-body', '#c8b8a0', '#6a5a48')}</defs>
        <path d="M22 72Q22 54 46 54Q76 54 92 66Q96 80 82 90Q62 98 42 96Q22 92 22 72Z" fill="url(#goose-body)" {...line} />
        <path d="M40 66Q60 58 86 70M44 76Q62 70 84 80" fill="none" stroke="#4a3a28" stroke-width="1.8" />
        <path d="M42 96Q50 90 60 96" fill="#f2f2f2" />
        <path d="M44 60Q44 40 34 28Q30 22 30 16" fill="none" stroke="#0a0610" stroke-width="15" stroke-linecap="round" />
        <path d="M44 60Q44 40 34 28Q30 22 30 16" fill="none" stroke="#2a2a2e" stroke-width="10" stroke-linecap="round" />
        <circle cx="30" cy="14" r="11" fill="#2a2a2e" {...line} />
        <path d="M24 18Q30 26 38 20Q36 14 30 14Z" fill="#fff" />
        <path d="M20 10L4 12L6 18L20 18Z" fill="#2a2a2e" {...line} stroke-width="2" />
        <path d="M6 15H18" stroke="#ff6a8a" stroke-width="2" />
        <circle cx="28" cy="10" r="2" fill="#fff" />
        <circle cx="28" cy="10" r="1" fill="#0a0610" />
      </symbol>

      {/* a double-barrelled shotgun, walnut stock and blued barrels */}
      <symbol id="s-shotgun" viewBox="0 0 100 100">
        <defs>
          {shade('shotgun-steel', '#a8b8c8', '#3a4656')}
          {shade('shotgun-wood', '#c8783a', '#6a3a14')}
        </defs>
        <g transform="rotate(-35 50 50)">
          <rect x="-2" y="42" width="66" height="7" rx="3" fill="url(#shotgun-steel)" {...line} stroke-width="2" />
          <rect x="-2" y="49" width="66" height="7" rx="3" fill="url(#shotgun-steel)" {...line} stroke-width="2" />
          <path d="M2 45H58" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6" />
          <rect x="54" y="40" width="16" height="18" rx="3" fill="#5a6676" {...line} stroke-width="2" />
          <path d="M68 40H76L100 46L98 66L74 60H68Z" fill="url(#shotgun-wood)" {...line} />
          <path d="M70 58Q70 70 80 68" fill="none" {...line} stroke-width="2.4" />
          <path d="M78 46L96 50" stroke="#ffb070" stroke-width="2" stroke-linecap="round" opacity=".6" />
          <path d="M20 56H48V62Q34 66 20 62Z" fill="url(#shotgun-wood)" {...line} stroke-width="2" />
        </g>
      </symbol>

      {/* granny: a knitted cap with a bobble, round glasses, a cardigan and a grin, she has done this before */}
      <Hunter
        id="granny"
        skin="#ffd8b8"
        shade="#d8a888"
        eyes="#3a5a8a"
        coat="#8a3a6a"
        mouth="grin"
        front={
          <>
            <path d="M40 70L50 86L60 70" fill="#f2e6d0" {...line} stroke-width="2" />
            <For each={[[44, 92], [56, 92]]}>{([x, y]) => <circle cx={x} cy={y} r="2.4" fill="#f2e6d0" {...line} stroke-width="1.2" />}</For>
          </>
        }
        hat={
          <>
            <path d="M30 46Q26 56 30 64M70 46Q74 56 70 64" fill="none" stroke="#e8e8f0" stroke-width="5" stroke-linecap="round" />
            <path d="M28 36Q28 12 50 12Q72 12 72 36Z" fill="#c8402a" {...line} />
            <path d="M28 32H72V38H28Z" fill="#f2e6d0" {...line} stroke-width="2" />
            <path d="M36 18L36 30M44 14V30M52 13V30M60 15V30M66 20V30" stroke="#a8301a" stroke-width="1.4" />
            <circle cx="50" cy="10" r="7" fill="#f2e6d0" {...line} stroke-width="2" />
            <For each={[42, 58]}>{x => <circle cx={x} cy="43" r="7.5" fill="#fff" fill-opacity=".25" stroke="#0a0610" stroke-width="2.2" />}</For>
            <path d="M49.5 43H50.5" stroke="#0a0610" stroke-width="2.2" />
          </>
        }
      />

      {/* a duck egg, speckled */}
      <symbol id="s-egg" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="egg-shell" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#fffaf0" />
            <stop offset="1" stop-color="#c8b898" />
          </radialGradient>
        </defs>
        <path d="M50 6C28 6 16 42 16 60C16 82 32 94 50 94C68 94 84 82 84 60C84 42 72 6 50 6Z" fill="url(#egg-shell)" {...line} />
        <For each={[[36, 40, 4], [60, 32, 3], [66, 60, 5], [40, 72, 3.5], [54, 50, 2.5], [28, 58, 2.5], [58, 80, 3]]}>{([x, y, r]) => <circle cx={x} cy={y} r={r} fill="#a88a5a" opacity=".8" />}</For>
        <path d="M30 34Q28 44 30 54" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8" />
        <Sparkle x={66} y={22} size={6} />
      </symbol>

      {/* a tin of duck pâté, the key on its lid */}
      <symbol id="s-can" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="can-tin" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#8a1a14" />
            <stop offset=".35" stop-color="#e8402a" />
            <stop offset="1" stop-color="#6a0a0a" />
          </linearGradient>
        </defs>
        <path d="M18 28V80Q18 92 50 92Q82 92 82 80V28Z" fill="url(#can-tin)" {...line} />
        <ellipse cx="50" cy="28" rx="32" ry="10" fill="#d8e2ec" {...line} />
        <ellipse cx="50" cy="28" rx="24" ry="6" fill="none" stroke="#8a98a8" stroke-width="1.6" />
        <path d="M62 24L76 16L80 22L70 26" fill="#c8d4e0" {...line} stroke-width="1.8" />
        <path d="M18 46H82V70H18Z" fill="#f2e6d0" {...line} stroke-width="2" />
        <path d="M34 62Q34 54 46 54Q50 48 56 50Q62 50 60 56Q66 58 62 62Q50 66 34 62Z" fill="#7a5a3a" />
        <path d="M58 52L64 50" stroke="#ffc83d" stroke-width="2.4" stroke-linecap="round" />
        <path d="M24 34V84" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35" />
      </symbol>

      {/* a slingshot cut from a branch, the rubber pulled back with a stone in it */}
      <symbol id="s-slingshot" viewBox="0 0 100 100">
        <defs>{shade('slingshot-wood', '#c8884a', '#6a3a14')}</defs>
        <path d="M50 96V56L24 14M50 56L76 14" fill="none" stroke="#0a0610" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M50 96V56L24 14M50 56L76 14" fill="none" stroke="url(#slingshot-wood)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M46 70V92" stroke="#ffb070" stroke-width="2" stroke-linecap="round" opacity=".6" />
        <rect x="43" y="72" width="14" height="14" rx="2" fill="#5a3a1a" {...line} stroke-width="1.6" />
        <path d="M24 16Q40 46 50 48Q60 46 76 16" fill="none" stroke="#c8402a" stroke-width="4" stroke-linecap="round" />
        <circle cx="50" cy="46" r="8" fill="#8a8a96" {...line} stroke-width="2" />
        <circle cx="47" cy="43" r="2" fill="#fff" opacity=".6" />
      </symbol>

      {/* the upgrades of the free spins, as badges on the upgrade wheel */}
      <For each={[['xways', '#3ddc6a', 'xways'], ['bomb', '#ff8a1f', 'bomb'], ['shots', '#e8322f', 'shot'], ['more', '#b06aff', ''], ['mults', '#ffd23d', ''], ['spin', '#5fd0ff', '']]}>
        {([id, color, art]) => (
          <symbol id={`s-up-${id}`} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="#1b1220" stroke={color} stroke-width="6" />
            <circle cx="50" cy="50" r="38" fill={color} opacity=".22" />
            {art ? (
              <use href={`#s-${art}`} x="18" y="14" width="64" height="64" />
            ) : (
              <text x="50" y={id === 'mults' ? 66 : 64} text-anchor="middle" font-size={id === 'mults' ? '48' : '40'} font-weight="700" fill={color} stroke="#1b1220" stroke-width="2" paint-order="stroke">
                {id === 'more' ? '+2' : id === 'mults' ? '×5' : '+1'}
              </text>
            )}
            {id === 'xways' && <path d="M22 80Q50 96 78 80" fill="none" stroke={color} stroke-width="5" stroke-linecap="round" />}
            {id === 'bomb' && <path d="M50 92V80M30 86L38 76M70 86L62 76" stroke={color} stroke-width="5" stroke-linecap="round" />}
            {id === 'shots' && (
              <text x="76" y="88" text-anchor="middle" font-size="26" font-weight="700" fill="#fff" stroke="#1b1220" stroke-width="2" paint-order="stroke">
                +2
              </text>
            )}
          </symbol>
        )}
      </For>
    </>
  )
}
