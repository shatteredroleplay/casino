import { For } from 'solid-js'
import { Face, Framed, ink, type Look, Sparkle } from './shared'

// the tiles every symbol sits on
const look: Look = { dark: '#2a1a08', glow: '#e8a23a', frame: '#ffc83d', texture: 'bricks' }
const glow: Record<string, string> = { scatter: '#ffe07a', pharaoh: '#ffc21f', anubis: '#5a5ac8', falcon: '#3a8cff', scarab: '#3ad8a0', ankh: '#ffd23d', eye: '#3a6aff', lotus: '#ff7ac8', jar: '#e8c890' }

const gold = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff3b0" />
    <stop offset=".45" stop-color="#f2b632" />
    <stop offset="1" stop-color="#9a5a10" />
  </linearGradient>
)

const lapis = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#4a7aff" />
    <stop offset="1" stop-color="#14248a" />
  </linearGradient>
)

// the tomb: the book that is wild and scatter, the gods who guard it and what was buried with the king
export default function Farao() {
  return (
    <>
      {/* the book: wild and scatter at once */}
      <Framed id="scatter" look={look} glow={glow.scatter}>
        <defs>
          {gold('book-gold')}
          <radialGradient id="book-glow">
            <stop offset="0" stop-color="#ffe9a0" stop-opacity=".9" />
            <stop offset="1" stop-color="#ffe9a0" stop-opacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#book-glow)" />
        <path d="M14 22L50 30L86 22V82L50 90L14 82Z" fill="#7a2a12" {...ink} />
        <path d="M20 18L50 26V86L20 78Z" fill="url(#book-gold)" {...ink} stroke-width="3.5" />
        <path d="M80 18L50 26V86L80 78Z" fill="url(#book-gold)" {...ink} stroke-width="3.5" />
        <path d="M35 44C30 40 30 33 35 31C38 30 40 32 40 35M35 44V64M28 50H42" fill="none" {...ink} stroke-width="3.5" />
        <path d="M58 44H74M60 50C64 46 70 46 72 50C70 54 64 54 60 50ZM66 54V64" fill="none" {...ink} stroke-width="3.5" />
        <rect x="16" y="64" width="68" height="20" rx="6" fill="#14248a" {...ink} stroke-width="3.5" />
        <text x="50" y="80" text-anchor="middle" font-size="15" font-weight="700" letter-spacing="1.5" fill="#ffd23d">
          WILD
        </text>
        <Sparkle x={78} y={14} size={8} />
      </Framed>

      <Framed id="pharaoh" look={look} glow={glow.pharaoh} bust>
        <defs>
          {gold('pharaoh-gold')}
          {lapis('pharaoh-lapis')}
        </defs>
        <path d="M50 6C24 6 14 26 12 48L8 92H92L88 48C86 26 76 6 50 6Z" fill="url(#pharaoh-gold)" {...ink} />
        <For each={[30, 44, 58, 72]}>{y => <path d={`M${12 - (y - 30) * 0.08} ${y}H${88 + (y - 30) * 0.08}`} stroke="url(#pharaoh-lapis)" stroke-width="7" />}</For>
        <path d="M30 30C30 20 40 16 50 16C60 16 70 20 70 30V58C70 72 60 80 50 80C40 80 30 72 30 58Z" fill="#c87a3a" {...ink} />
        <path d="M30 30H70" {...ink} />
        <path d="M44 16L50 6L56 16" fill="url(#pharaoh-gold)" {...ink} stroke-width="3" />
        <path d="M34 42L46 44M66 42L54 44" {...ink} stroke-width="4" />
        <path d="M36 50C39 47 43 47 46 50M54 50C57 47 61 47 64 50" fill="none" {...ink} stroke-width="3.5" />
        <path d="M46 50L38 54M54 50L62 54" {...ink} stroke-width="3" />
        <path d="M50 52V62M44 68H56" fill="none" {...ink} stroke-width="3" />
        <path d="M44 80H56V96H44Z" fill="url(#pharaoh-lapis)" {...ink} stroke-width="3" />
      </Framed>

      <Framed id="anubis" look={look} glow={glow.anubis} bust>
        <defs>{gold('anubis-gold')}</defs>
        <path d="M28 40L22 4L46 30ZM72 40L78 4L54 30Z" fill="#232030" {...ink} />
        <path d="M30 36L26 14L40 30ZM70 36L74 14L60 30Z" fill="#ffd23d" opacity=".5" />
        <path d="M26 40C26 26 74 26 74 40L72 60L94 70C96 78 90 84 82 82L60 78L50 96H34L28 74Z" fill="#2c2838" {...ink} />
        <path d="M30 76L22 96H48" fill="url(#anubis-gold)" {...ink} stroke-width="3.5" />
        <path d="M38 50C43 46 49 46 52 50C49 54 43 54 38 50Z" fill="#ffd23d" {...ink} stroke-width="3" />
        <circle cx="46" cy="50" r="2.5" fill="#1b1220" />
        <path d="M54 50L64 48" {...ink} stroke-width="3" />
        <circle cx="88" cy="74" r="4" fill="#1b1220" />
      </Framed>

      <Framed id="falcon" look={look} glow={glow.falcon}>
        <defs>{gold('falcon-gold')}</defs>
        <path d="M50 30C20 30 6 50 4 76C20 66 34 66 44 70ZM50 30C80 30 94 50 96 76C80 66 66 66 56 70Z" fill="url(#falcon-gold)" {...ink} />
        <For each={[14, 24, 34]}>{x => <path d={`M${x} ${74 - (x - 14) * 0.4}L${x + 4} ${56 - (x - 14) * 0.6}M${100 - x} ${74 - (x - 14) * 0.4}L${96 - x} ${56 - (x - 14) * 0.6}`} {...ink} stroke-width="2.5" />}</For>
        <path d="M38 40C38 22 62 22 62 40V70L50 90L38 70Z" fill="#4a7aff" {...ink} />
        <path d="M38 40C38 22 62 22 62 40L56 46H44Z" fill="#f2f2f2" {...ink} stroke-width="3" />
        <path d="M42 40C45 37 49 38 50 41C47 43 44 43 42 40Z" fill="#1b1220" />
        <path d="M44 44L40 54" stroke="#1b1220" stroke-width="3" stroke-linecap="round" />
        <path d="M58 36L66 42L60 46" fill="#ffd23d" {...ink} stroke-width="3" />
        <circle cx="50" cy="16" r="10" fill="#e8322f" {...ink} stroke-width="3.5" />
      </Framed>

      <Framed id="scarab" look={look} glow={glow.scarab}>
        <defs>
          {gold('scarab-gold')}
          <linearGradient id="scarab-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#5df0b0" />
            <stop offset="1" stop-color="#0f6a5a" />
          </linearGradient>
        </defs>
        <path d="M34 52L8 40L4 22M66 52L92 40L96 22M32 64L8 70L6 86M68 64L92 70L94 86M36 76L22 94M64 76L78 94" fill="none" {...ink} stroke-width="5" />
        <circle cx="50" cy="14" r="11" fill="#e8322f" {...ink} stroke-width="3.5" />
        <path d="M36 30C36 20 64 20 64 30Z" fill="url(#scarab-gold)" {...ink} stroke-width="3.5" />
        <path d="M30 40C30 30 70 30 70 40V64C70 80 60 88 50 88C40 88 30 80 30 64Z" fill="url(#scarab-shell)" {...ink} />
        <path d="M50 38V88M30 44H70" {...ink} stroke-width="3" />
        <path d="M38 52C40 60 40 70 44 78M62 52C60 60 60 70 56 78" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5" />
      </Framed>

      <Framed id="ankh" look={look} glow={glow.ankh}>
        <defs>{gold('ankh-gold')}</defs>
        <path d="M50 52C30 40 32 6 50 6C68 6 70 40 50 52ZM50 40C60 30 58 16 50 16C42 16 40 30 50 40Z" fill="url(#ankh-gold)" fill-rule="evenodd" {...ink} />
        <path d="M16 46H84V60H58V94H42V60H16Z" fill="url(#ankh-gold)" {...ink} />
        <Sparkle x={74} y={24} size={7} />
      </Framed>

      <Framed id="eye" look={look} glow={glow.eye}>
        <defs>{lapis('eye-lapis')}</defs>
        <path d="M6 44C26 18 74 18 94 44C74 64 26 64 6 44Z" fill="#fff8e6" {...ink} />
        <circle cx="50" cy="42" r="15" fill="url(#eye-lapis)" {...ink} stroke-width="3.5" />
        <circle cx="50" cy="42" r="6" fill="#1b1220" />
        <circle cx="45" cy="37" r="3" fill="#fff" />
        <path d="M4 26C30 10 70 10 96 26" fill="none" stroke="#1b1220" stroke-width="7" stroke-linecap="round" />
        <path d="M40 62L34 90C32 96 24 96 22 90M56 62L66 80C70 86 78 84 80 78" fill="none" stroke="#1b1220" stroke-width="7" stroke-linecap="round" />
      </Framed>

      <Framed id="lotus" look={look} glow={glow.lotus}>
        <path d="M50 86C30 86 12 72 8 50C24 50 38 58 50 86ZM50 86C70 86 88 72 92 50C76 50 62 58 50 86Z" fill="#3ddc9a" {...ink} />
        <path d="M50 84C38 70 34 48 50 18C66 48 62 70 50 84Z" fill="#ff8ac0" {...ink} />
        <path d="M48 84C32 76 22 58 24 36C40 44 48 62 48 84ZM52 84C68 76 78 58 76 36C60 44 52 62 52 84Z" fill="#ffb3d6" {...ink} />
        <path d="M50 30V70" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6" />
      </Framed>

      <Framed id="jar" look={look} glow={glow.jar}>
        <defs>{gold('jar-gold')}</defs>
        <path d="M34 42C18 50 20 84 34 94H66C80 84 82 50 66 42Z" fill="#e6d2a8" {...ink} />
        <path d="M24 62H76M26 74H74" stroke="#4a7aff" stroke-width="5" />
        <path d="M32 44C32 22 68 22 68 44Z" fill="url(#jar-gold)" {...ink} />
        <Face x={50} y={34} gap={8} mouth="M45 41C48 43 52 43 55 41" />
        <path d="M30 26L34 8L44 20M70 26L66 8L56 20" fill="url(#jar-gold)" {...ink} stroke-width="3" />
      </Framed>
    </>
  )
}
