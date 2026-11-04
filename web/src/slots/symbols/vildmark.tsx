import { For } from 'solid-js'
import { Bonus, Face, ink, Sparkle } from './shared'

// two eyes with a glint, for the animals
const Eyes = (props: { y: number; gap: number; fill?: string }) => (
  <For each={[50 - props.gap, 50 + props.gap]}>
    {x => (
      <>
        <path d={`M${x - 7} ${props.y + 1}Q${x} ${props.y - 6} ${x + 7} ${props.y - 1}Q${x} ${props.y + 5} ${x - 7} ${props.y + 1}Z`} fill={props.fill ?? '#c89a3a'} stroke="#000" stroke-opacity=".5" stroke-width="1.2" />
        <ellipse cx={x} cy={props.y} rx="1.6" ry="3.4" fill="#120a08" />
      </>
    )}
  </For>
)

// the far north: the four animals the bonus wheel can stop on, and what you carry with you out there
export default function Vildmark() {
  return (
    <>
      <Bonus from="#1f6a8a" to="#0c1a4a" band="#0f3a4a">
        <path d="M22 34Q34 14 50 28T80 18" fill="none" stroke="#7df0c0" stroke-width="7" stroke-linecap="round" />
        <path d="M24 46Q38 28 52 40T78 34" fill="none" stroke="#c89aff" stroke-width="5" stroke-linecap="round" />
      </Bonus>

      <symbol id="s-wild" viewBox="0 0 100 100">
        <g transform="translate(9 -8) scale(.82)">
          <path d="M16 44L12 10L42 26Z" fill="#e0a050" {...ink} />
          <path d="M84 44L88 10L58 26Z" fill="#e0a050" {...ink} />
          <path d="M14 14L8 2M86 14L92 2" fill="none" {...ink} stroke-width="6" />
          <path d="M10 50C10 28 30 18 50 18C70 18 90 28 90 50C97 62 90 74 80 77C72 89 60 94 50 94C40 94 28 89 20 77C10 74 3 62 10 50Z" fill="#e8b060" {...ink} />
          <path d="M20 77C28 89 40 94 50 94C60 94 72 89 80 77L66 60H34Z" fill="#fff3d6" {...ink} stroke-width="3" />
          <For each={[[38, 30], [50, 26], [62, 30], [44, 36], [56, 36]]}>{([x, y]) => <circle cx={x} cy={y} r="2.6" fill="#7a4a22" />}</For>
          <path d="M44 66H56L50 74Z" fill="#e8607a" {...ink} stroke-width="3" />
          <path d="M50 74V79M42 81Q50 87 58 81M30 72L12 68M30 78L12 82M70 72L88 68M70 78L88 82" fill="none" {...ink} stroke-width="2.5" />
          <Eyes y={50} gap={16} fill="#8fe06a" />
        </g>
        <rect x="12" y="68" width="76" height="24" rx="7" fill="#0f3a4a" {...ink} stroke-width="3.5" />
        <text x="50" y="86" text-anchor="middle" font-size="18" font-weight="700" letter-spacing="2" fill="#7df0c0">
          WILD
        </text>
      </symbol>

      <symbol id="s-owl" viewBox="0 0 100 100">
        <path d="M18 32L10 4L38 18ZM82 32L90 4L62 18Z" fill="#6a4a2a" {...ink} />
        <path d="M10 52C10 26 30 14 50 14C70 14 90 26 90 52C90 78 72 97 50 97C28 97 10 78 10 52Z" fill="#8a6a3e" {...ink} />
        <ellipse cx="50" cy="74" rx="24" ry="19" fill="#e6d0a0" {...ink} stroke-width="3" />
        <path d="M38 70l6 5 6-5 6 5 6-5M38 81l6 5 6-5 6 5 6-5" fill="none" stroke="#8a6a3e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <For each={[32, 68]}>
          {x => (
            <>
              <circle cx={x} cy="42" r="18" fill="#fff3d6" {...ink} />
              <circle cx={x} cy="42" r="10" fill="#ffb21f" {...ink} stroke-width="3" />
              <circle cx={x} cy="42" r="5" fill="#1b1220" />
              <circle cx={x + 2.5} cy="39" r="2" fill="#fff" />
            </>
          )}
        </For>
        <path d="M43 52H57L50 65Z" fill="#ffb21f" {...ink} stroke-width="3" />
      </symbol>

      <symbol id="s-bear" viewBox="0 0 100 100">
        <circle cx="20" cy="24" r="15" fill="#7a4a22" {...ink} />
        <circle cx="80" cy="24" r="15" fill="#7a4a22" {...ink} />
        <circle cx="20" cy="24" r="6" fill="#d9a066" />
        <circle cx="80" cy="24" r="6" fill="#d9a066" />
        <path d="M8 54C8 28 28 14 50 14C72 14 92 28 92 54C92 78 72 94 50 94C28 94 8 78 8 54Z" fill="#8a5428" {...ink} />
        <ellipse cx="50" cy="70" rx="23" ry="18" fill="#e6c08a" {...ink} stroke-width="3" />
        <path d="M41 60H59L50 71Z" fill="#1b1220" {...ink} stroke-width="3" />
        <path d="M50 71V77M41 79Q50 86 59 79" fill="none" {...ink} stroke-width="3" />
        <Eyes y={46} gap={17} />
      </symbol>

      <symbol id="s-wolf" viewBox="0 0 100 100">
        <path d="M14 42L8 4L42 22Z" fill="#8a96a8" {...ink} />
        <path d="M86 42L92 4L58 22Z" fill="#8a96a8" {...ink} />
        <path d="M17 30L15 14L30 22ZM83 30L85 14L70 22Z" fill="#3a4250" />
        <path d="M10 40C22 16 78 16 90 40L82 68L50 97L18 68Z" fill="#8a96a8" {...ink} />
        <path d="M18 68L50 97L82 68L64 50L50 64L36 50Z" fill="#f2f5fa" {...ink} stroke-width="3" />
        <path d="M42 80H58L50 91Z" fill="#1b1220" {...ink} stroke-width="3" />
        <path d="M24 36L42 42M76 36L58 42" fill="none" {...ink} stroke-width="3.5" />
        <Eyes y={47} gap={17} fill="#ffd23a" />
      </symbol>

      {/* vargflocken: a wolf that has turned wild and stays */}
      <symbol id="s-wolfwild" viewBox="0 0 100 100">
        <circle cx="50" cy="44" r="44" fill="#7df0c0" opacity=".25" />
        <use href="#s-wolf" x="9" y="-6" width="82" height="82" />
        <rect x="12" y="68" width="76" height="24" rx="7" fill="#0f3a4a" {...ink} stroke-width="3.5" />
        <text x="50" y="86" text-anchor="middle" font-size="18" font-weight="700" letter-spacing="2" fill="#7df0c0">
          WILD
        </text>
      </symbol>

      <symbol id="s-reindeer" viewBox="0 0 100 100">
        <defs>
          <path id="reindeer-antler" d="M36 30C28 24 24 14 26 2M31 20C24 20 16 14 14 4M27 12C20 12 12 10 6 4" fill="none" stroke-linecap="round" stroke-linejoin="round" />
        </defs>
        <For each={['', 'matrix(-1 0 0 1 100 0)']}>
          {flip => (
            <g transform={flip}>
              <use href="#reindeer-antler" stroke="#1b1220" stroke-width="11" />
              <use href="#reindeer-antler" stroke="#e6c08a" stroke-width="5" />
            </g>
          )}
        </For>
        <ellipse cx="22" cy="42" rx="12" ry="7" fill="#6a3f1e" {...ink} transform="rotate(-20 22 42)" />
        <ellipse cx="78" cy="42" rx="12" ry="7" fill="#6a3f1e" {...ink} transform="rotate(20 78 42)" />
        <path d="M30 32C30 20 70 20 70 32L75 64C79 82 66 96 50 96C34 96 21 82 25 64Z" fill="#7a4a22" {...ink} />
        <ellipse cx="50" cy="78" rx="23" ry="17" fill="#a8703a" {...ink} stroke-width="3" />
        <circle cx="41" cy="76" r="4" fill="#1b1220" />
        <circle cx="59" cy="76" r="4" fill="#1b1220" />
        <path d="M42 87Q50 91 58 87" fill="none" {...ink} stroke-width="3" />
        <Eyes y={48} gap={13} />
      </symbol>

      {/* the gear */}
      <symbol id="s-binoculars" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="binoculars-glass" cx=".35" cy=".3" r=".8">
            <stop offset="0" stop-color="#e6fbff" />
            <stop offset=".5" stop-color="#3fc0f0" />
            <stop offset="1" stop-color="#0f5a9a" />
          </radialGradient>
        </defs>
        <rect x="20" y="10" width="20" height="38" rx="6" fill="#4a5361" {...ink} />
        <rect x="60" y="10" width="20" height="38" rx="6" fill="#4a5361" {...ink} />
        <rect x="36" y="40" width="28" height="18" rx="5" fill="#ff8a1f" {...ink} />
        <circle cx="28" cy="64" r="25" fill="#4a5361" {...ink} />
        <circle cx="72" cy="64" r="25" fill="#4a5361" {...ink} />
        <circle cx="28" cy="64" r="16" fill="url(#binoculars-glass)" {...ink} stroke-width="3" />
        <circle cx="72" cy="64" r="16" fill="url(#binoculars-glass)" {...ink} stroke-width="3" />
        <Sparkle x={22} y={58} size={8} />
        <Sparkle x={66} y={58} size={8} />
      </symbol>

      <symbol id="s-boot" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="boot-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#3f9a4a" />
            <stop offset=".4" stop-color="#6fd06a" />
            <stop offset="1" stop-color="#2f7a3a" />
          </linearGradient>
        </defs>
        <path d="M30 10H60V54C74 56 90 62 90 76V84H30Z" fill="url(#boot-fill)" {...ink} />
        <rect x="26" y="6" width="38" height="12" rx="5" fill="#ffc21f" {...ink} stroke-width="3.5" />
        <rect x="26" y="80" width="68" height="12" rx="5" fill="#3a2a22" {...ink} stroke-width="3.5" />
        <path d="M38 26V50" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".55" />
        <path d="M62 62C70 64 78 68 82 74" stroke="#1b1220" stroke-width="2.5" stroke-linecap="round" opacity=".4" fill="none" />
      </symbol>

      {/* on the forest floor */}
      <symbol id="s-mushroom" viewBox="0 0 100 100">
        <path d="M36 50H64C62 66 66 80 72 90H28C34 80 38 66 36 50Z" fill="#fff3d6" {...ink} />
        <path d="M6 54C6 24 28 8 50 8C72 8 94 24 94 54C80 60 20 60 6 54Z" fill="#e8402f" {...ink} />
        <circle cx="30" cy="30" r="8" fill="#fff" />
        <circle cx="56" cy="22" r="6" fill="#fff" />
        <circle cx="74" cy="38" r="8" fill="#fff" />
        <circle cx="46" cy="44" r="5" fill="#fff" />
        <circle cx="18" cy="46" r="4" fill="#fff" />
        <Face x={50} y={68} gap={8} mouth="M45 78C48 82 52 82 55 78" />
      </symbol>

      <symbol id="s-acorn" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="acorn-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#e09a4a" />
            <stop offset=".4" stop-color="#ffc98a" />
            <stop offset="1" stop-color="#c47a2a" />
          </linearGradient>
        </defs>
        <path d="M50 16C50 10 54 6 60 4" fill="none" {...ink} stroke-width="6" />
        <path d="M24 44H76C76 72 62 90 50 96C38 90 24 72 24 44Z" fill="url(#acorn-fill)" {...ink} />
        <path d="M16 46C16 24 34 14 50 14C66 14 84 24 84 46Z" fill="#8a4a1f" {...ink} />
        <path d="M30 24L40 44M46 18L52 44M62 20L64 44M76 30L74 44M22 34L28 44" stroke="#1b1220" stroke-width="2.5" stroke-linecap="round" opacity=".45" />
        <Face x={50} y={62} gap={9} mouth="M44 74C48 79 52 79 56 74" />
      </symbol>

      <symbol id="s-feather" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="feather-fill" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stop-color="#0f7a8a" />
            <stop offset=".6" stop-color="#3de0c6" />
            <stop offset="1" stop-color="#c8fff2" />
          </linearGradient>
        </defs>
        <path d="M22 84C12 46 38 12 88 8C90 52 60 82 22 84Z" fill="url(#feather-fill)" {...ink} />
        <path d="M10 96L80 18" fill="none" {...ink} />
        <path d="M34 66L22 60M46 54L32 44M58 42L46 30M44 62L52 76M56 50L68 62M68 38L80 46" stroke="#1b1220" stroke-width="3" stroke-linecap="round" opacity=".55" />
        <Sparkle x={74} y={24} size={9} />
      </symbol>
    </>
  )
}
