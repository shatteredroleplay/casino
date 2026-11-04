import { Bonus, Face, Framed, ink, type Look, Sparkle } from './shared'

// the tiles every symbol sits on
const look: Look = { dark: '#24140a', glow: '#c8902a', frame: '#d8a03a', texture: 'planks' }
const glow: Record<string, string> = { raven: '#b0a0f0', wild: '#ff6a1f', duel: '#ff3a1a', helmet: '#8ab0d8', axe: '#c8d4e0', shield: '#e0341f', rune: '#ffa83a', tankard: '#e8a23a', meat: '#c8582a', horn: '#e8c890', coin: '#ffc21f', hammer: '#7aa0c8' }

const steel = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#f4f7fb" />
    <stop offset=".5" stop-color="#a9b6c6" />
    <stop offset="1" stop-color="#5d6878" />
  </linearGradient>
)

const gold = (id: string) => (
  <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#fff0a8" />
    <stop offset=".5" stop-color="#ffc21f" />
    <stop offset="1" stop-color="#d07a08" />
  </linearGradient>
)

// vikings: everything a warrior brings to a duel, and to the feast after it
export default function Holmgang() {
  return (
    <>
      <Bonus look={look} from="#ffe07a" to="#e0341f" band="#7a1420">
        <path d="M50 10C58 22 66 26 62 40C70 36 72 28 70 22C80 32 80 48 68 54H32C20 48 20 32 30 22C28 28 30 36 38 40C34 26 42 22 50 10Z" fill="#ffd23d" {...ink} stroke-width="3" />
      </Bonus>

      {/* the duel: two crossed swords */}
      <Bonus look={look} id="duelscatter" from="#e6ecf2" to="#3f5a8a" band="#14248a">
        <path d="M24 12L66 54M76 12L34 54" stroke="#1b1220" stroke-width="11" stroke-linecap="round" />
        <path d="M24 12L66 54M76 12L34 54" stroke="#e6ecf2" stroke-width="5" stroke-linecap="round" />
        <path d="M58 48L72 62M42 48L28 62" stroke="#c8902a" stroke-width="8" stroke-linecap="round" />
      </Bonus>

      {/* the valkyrie: a winged helmet */}
      <Bonus look={look} id="handscatter" from="#f2e6ff" to="#6a2aa8" band="#3a0a5a">
        <path d="M30 46C30 26 70 26 70 46Z" fill="#c8d4e0" {...ink} stroke-width="3" />
        <path d="M30 40C18 34 12 22 14 10C22 20 28 26 34 30ZM70 40C82 34 88 22 86 10C78 20 72 26 66 30Z" fill="#fff" {...ink} stroke-width="3" />
        <path d="M46 46V54H54V46" fill="#ffd23d" {...ink} stroke-width="2.5" />
      </Bonus>

      <Framed id="raven" look={look} glow={glow.raven}>
        <path d="M20 60C20 40 40 30 60 34C78 38 88 52 86 66C70 60 56 64 44 76C36 70 24 70 20 60Z" fill="#2a2a3a" {...ink} />
        <path d="M60 34C66 22 80 18 88 24C80 26 74 32 72 40Z" fill="#2a2a3a" {...ink} stroke-width="3" />
        <path d="M88 24L98 28L88 32Z" fill="#c8902a" {...ink} stroke-width="2.5" />
        <circle cx="80" cy="26" r="2.5" fill="#ffd23d" />
        <path d="M30 58C40 52 52 52 62 58" fill="none" stroke="#5a5a7a" stroke-width="3" />
        <path d="M40 76L36 90M48 74L48 90" stroke="#c8902a" stroke-width="3" stroke-linecap="round" />
      </Framed>

      {/* a furious viking */}
      <Framed id="wild" look={look} glow={glow.wild}>
        <defs>
          {steel('wild-steel')}
          {gold('wild-gold')}
        </defs>
        <path d="M26 30C10 30 2 16 6 2C12 14 22 18 34 18Z" fill="#fff3d6" {...ink} />
        <path d="M74 30C90 30 98 16 94 2C88 14 78 18 66 18Z" fill="#fff3d6" {...ink} />
        <path d="M24 60C22 84 36 98 50 98C64 98 78 84 76 60Z" fill="#f2792b" {...ink} />
        <path d="M26 40H74V58C74 68 64 72 50 72C36 72 26 68 26 58Z" fill="#ffcf9e" {...ink} />
        <path d="M22 44C22 20 36 10 50 10C64 10 78 20 78 44Z" fill="url(#wild-steel)" {...ink} />
        <rect x="20" y="38" width="60" height="9" rx="3" fill="url(#wild-gold)" {...ink} stroke-width="3" />
        <rect x="45" y="10" width="10" height="46" rx="4" fill="url(#wild-gold)" {...ink} stroke-width="3" />
        <path d="M30 50L43 54M70 50L57 54" {...ink} fill="none" />
        <circle cx="38" cy="58" r="4" fill="#1b1220" />
        <circle cx="62" cy="58" r="4" fill="#1b1220" />
        <path d="M28 66C36 60 44 62 50 67C56 62 64 60 72 66C66 76 56 74 50 71C44 74 34 76 28 66Z" fill="#ff9a45" {...ink} stroke-width="3" />
        <rect x="14" y="76" width="72" height="22" rx="7" fill="#7a1420" {...ink} stroke-width="3.5" />
        <text x="50" y="93" text-anchor="middle" font-size="17" font-weight="700" letter-spacing="2" fill="#ffd23d">
          WILD
        </text>
      </Framed>

      <Framed id="duel" look={look} glow={glow.duel}>
        <defs>
          {steel('duel-steel')}
          {gold('duel-gold')}
          <radialGradient id="duel-glow">
            <stop offset="0" stop-color="#ffb347" stop-opacity=".95" />
            <stop offset="1" stop-color="#e0341f" stop-opacity="0" />
          </radialGradient>
          <g id="duel-sword">
            <path d="M82 8L92 18L42 68L32 58Z" fill="url(#duel-steel)" {...ink} />
            <path d="M82 8L88 14L40 62" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8" />
            <path d="M20 52L48 80" stroke="#1b1220" stroke-width="13" stroke-linecap="round" />
            <path d="M20 52L48 80" stroke="url(#duel-gold)" stroke-width="7" stroke-linecap="round" />
            <path d="M30 70L15 85" stroke="#1b1220" stroke-width="13" stroke-linecap="round" />
            <path d="M30 70L15 85" stroke="#9a4a22" stroke-width="7" stroke-linecap="round" />
            <circle cx="12" cy="88" r="7" fill="url(#duel-gold)" {...ink} stroke-width="3" />
          </g>
        </defs>
        <circle cx="50" cy="50" r="50" fill="url(#duel-glow)" />
        <use href="#duel-sword" />
        <use href="#duel-sword" transform="matrix(-1 0 0 1 100 0)" />
        <Sparkle x={50} y={36} size={10} />
      </Framed>

      <Framed id="helmet" look={look} glow={glow.helmet}>
        <defs>
          {steel('helmet-steel')}
          {gold('helmet-gold')}
        </defs>
        <path d="M26 38C10 38 2 22 6 6C12 20 22 24 36 24Z" fill="#fff3d6" {...ink} />
        <path d="M74 38C90 38 98 22 94 6C88 20 78 24 64 24Z" fill="#fff3d6" {...ink} />
        <path d="M20 62C20 32 34 16 50 16C66 16 80 32 80 62V90C70 92 64 86 62 74H38C36 86 30 92 20 90Z" fill="url(#helmet-steel)" {...ink} />
        <rect x="17" y="52" width="66" height="11" rx="4" fill="url(#helmet-gold)" {...ink} stroke-width="3.5" />
        <rect x="44" y="16" width="12" height="72" rx="5" fill="url(#helmet-gold)" {...ink} stroke-width="3.5" />
        <circle cx="27" cy="57.5" r="2.5" fill="#1b1220" />
        <circle cx="73" cy="57.5" r="2.5" fill="#1b1220" />
        <path d="M30 34C32 28 36 24 40 22" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".8" />
      </Framed>

      <Framed id="axe" look={look} glow={glow.axe}>
        <defs>
          {steel('axe-steel')}
          {gold('axe-gold')}
        </defs>
        <rect x="44" y="6" width="12" height="90" rx="5" fill="#a8602c" {...ink} />
        <path d="M56 18C78 8 94 24 96 52C84 42 70 44 56 50Z" fill="url(#axe-steel)" {...ink} />
        <path d="M44 18C22 8 6 24 4 52C16 42 30 44 44 50Z" fill="url(#axe-steel)" {...ink} />
        <path d="M88 44C88 30 80 20 66 18M12 44C12 30 20 20 34 18" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85" />
        <rect x="40" y="14" width="20" height="40" rx="5" fill="url(#axe-gold)" {...ink} stroke-width="3.5" />
        <path d="M45 66H55M45 76H55M45 86H55" stroke="#1b1220" stroke-width="3" stroke-linecap="round" />
      </Framed>

      <Framed id="shield" look={look} glow={glow.shield}>
        <defs>{steel('shield-steel')}</defs>
        <circle cx="50" cy="50" r="42" fill="#fff0c9" />
        <path d="M50 50V8A42 42 0 0 1 92 50ZM50 50V92A42 42 0 0 1 8 50Z" fill="#e0341f" />
        <circle cx="50" cy="50" r="42" fill="none" {...ink} stroke-width="11" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#shield-steel)" stroke-width="5" />
        <circle cx="50" cy="50" r="13" fill="url(#shield-steel)" {...ink} stroke-width="3.5" />
        <path d="M22 30C28 20 38 14 48 14" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none" opacity=".7" />
      </Framed>

      <Framed id="rune" look={look} glow={glow.rune}>
        <defs>
          <linearGradient id="rune-stone" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a7b0bd" />
            <stop offset="1" stop-color="#4c5563" />
          </linearGradient>
        </defs>
        <path d="M30 8L70 6L88 34L82 90L22 94L12 40Z" fill="url(#rune-stone)" {...ink} />
        <path d="M30 8L70 6L62 20L34 22Z" fill="#fff" opacity=".25" />
        <path d="M44 78V28M44 36L66 22M44 54L64 40" stroke="#ff8a1f" stroke-width="14" stroke-linecap="round" opacity=".35" fill="none" />
        <path d="M44 78V28M44 36L66 22M44 54L64 40" stroke="#ffe07a" stroke-width="6.5" stroke-linecap="round" fill="none" />
      </Framed>

      {/* the feast */}
      <Framed id="tankard" look={look} glow={glow.tankard}>
        <path d="M68 46H80C90 46 90 76 80 76H68" fill="none" stroke="#1b1220" stroke-width="15" stroke-linecap="round" />
        <path d="M68 46H80C90 46 90 76 80 76H68" fill="none" stroke="#b56a2e" stroke-width="7" stroke-linecap="round" />
        <rect x="22" y="34" width="48" height="58" rx="7" fill="#d28a3c" {...ink} />
        <path d="M34 36V90M46 36V90M58 36V90" stroke="#1b1220" stroke-width="2.5" opacity=".45" />
        <rect x="20" y="46" width="52" height="8" rx="3" fill="#ffc21f" {...ink} stroke-width="3" />
        <rect x="20" y="74" width="52" height="8" rx="3" fill="#ffc21f" {...ink} stroke-width="3" />
        <path d="M18 36C12 28 20 18 28 22C30 10 46 8 50 18C58 10 72 16 68 26C78 26 78 38 70 38C70 46 60 46 58 40C52 44 46 42 44 38C40 52 30 50 30 40C24 42 18 40 18 36Z" fill="#fff" {...ink} />
      </Framed>

      <Framed id="meat" look={look} glow={glow.meat}>
        <defs>
          <radialGradient id="meat-fill" cx=".4" cy=".35" r=".8">
            <stop offset="0" stop-color="#e58a4a" />
            <stop offset="1" stop-color="#a8431c" />
          </radialGradient>
        </defs>
        <path d="M58 58L80 80" stroke="#1b1220" stroke-width="18" stroke-linecap="round" />
        <path d="M58 58L80 80" stroke="#fff3d6" stroke-width="10" stroke-linecap="round" />
        <circle cx="78" cy="88" r="8" fill="#fff3d6" {...ink} />
        <circle cx="88" cy="78" r="8" fill="#fff3d6" {...ink} />
        <path d="M80 80L84 84" stroke="#fff3d6" stroke-width="10" stroke-linecap="round" />
        <ellipse cx="40" cy="42" rx="34" ry="28" fill="url(#meat-fill)" {...ink} transform="rotate(38 40 42)" />
        <ellipse cx="56" cy="58" rx="13" ry="9" fill="#ffd0a8" {...ink} stroke-width="3" transform="rotate(-48 56 58)" />
        <path d="M18 34C22 24 32 18 42 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".55" />
      </Framed>

      <Framed id="horn" look={look} glow={glow.horn}>
        <defs>
          <linearGradient id="horn-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#fff3d6" />
            <stop offset="1" stop-color="#b9824a" />
          </linearGradient>
          {gold('horn-gold')}
        </defs>
        <path d="M12 26C48 16 84 44 92 90C70 70 46 60 20 58Z" fill="url(#horn-fill)" {...ink} />
        <path d="M62 50C70 58 76 66 80 74M48 42C42 40 36 38 30 38" stroke="#1b1220" stroke-width="2.5" stroke-linecap="round" opacity=".4" fill="none" />
        <ellipse cx="17" cy="42" rx="9" ry="18" fill="#7a3a12" {...ink} transform="rotate(-10 17 42)" />
        <path d="M24 22L34 60" stroke="#1b1220" stroke-width="13" stroke-linecap="round" />
        <path d="M24 22L34 60" stroke="url(#horn-gold)" stroke-width="6" stroke-linecap="round" />
        <path d="M84 70L72 80" stroke="#1b1220" stroke-width="11" stroke-linecap="round" />
        <path d="M84 70L72 80" stroke="url(#horn-gold)" stroke-width="5" stroke-linecap="round" />
      </Framed>

      <Framed id="coin" look={look} glow={glow.coin}>
        <defs>{gold('coin-gold')}</defs>
        <circle cx="50" cy="50" r="40" fill="url(#coin-gold)" {...ink} />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#b86a08" stroke-width="3.5" />
        <path d="M50 30L66 62H34ZM50 70L34 40H66Z" fill="none" stroke="#b86a08" stroke-width="5" stroke-linejoin="round" />
        <path d="M22 36C26 26 34 20 44 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".85" />
        <Sparkle x={74} y={24} size={10} />
      </Framed>

      <Framed id="hammer" look={look} glow={glow.hammer}>
        <defs>
          {steel('hammer-steel')}
          {gold('hammer-gold')}
        </defs>
        <rect x="43" y="42" width="14" height="44" rx="4" fill="#a8602c" {...ink} />
        <path d="M43 56H57M43 66H57M43 76H57" stroke="#1b1220" stroke-width="3" />
        <circle cx="50" cy="90" r="8" fill="url(#hammer-gold)" {...ink} stroke-width="3.5" />
        <path d="M16 12H84L90 22V40L84 50H16L10 40V22Z" fill="url(#hammer-steel)" {...ink} />
        <path d="M30 12V50M70 12V50" stroke="#1b1220" stroke-width="3" opacity=".5" />
        <path d="M40 24L50 38L60 24" fill="none" stroke="#ffc21f" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M18 20H26" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85" />
      </Framed>
    </>
  )
}
