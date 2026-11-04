import { For } from 'solid-js'
import { Dynamic } from 'solid-js/web'
import { config } from '../config'
import Andjakt from './andjakt'
import Farao from './farao'
import Fyllekak from './fyllekak'
import Gruvan from './gruvan'
import Holmgang from './holmgang'
import Jarnnave from './jarnnave'
import Olympen from './olympen'
import Ronin from './ronin'
import Ubaten from './ubaten'
import Vildmark from './vildmark'

const sets = { holmgang: Holmgang, vildmark: Vildmark, fyllekak: Fyllekak, ubaten: Ubaten, farao: Farao, olympen: Olympen, andjakt: Andjakt, ronin: Ronin, gruvan: Gruvan, jarnnave: Jarnnave }

// painted artwork: web/slots/art/<game>/<symbol id>.png (or .webp), square with a transparent background.
// a picture there takes the place of the drawn symbol everywhere, the build picks them up
const files = import.meta.glob('../../art/*/*.{png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const art = Object.entries(files)
  .map(([path, url]) => ({ game: path.split('/').at(-2), id: path.split('/').at(-1)!.replace(/\.(png|webp)$/, ''), url }))
  .filter(a => a.game === config.id)

// every symbol is drawn once here and reused on the board with <use href="#s-id">. a picture comes first, so <use> finds it before the drawing
export default function Symbols() {
  return (
    <svg class="symbols">
      <For each={art}>
        {a => (
          <symbol id={`s-${a.id}`} viewBox="0 0 100 100">
            <image href={a.url} width="100" height="100" preserveAspectRatio="xMidYMid meet" />
          </symbol>
        )}
      </For>
      <Dynamic component={sets[config.id as keyof typeof sets]} />
    </svg>
  )
}
