import { render } from 'solid-js/web'
import '@fontsource/poppins/latin-400.css'
import '@fontsource/poppins/latin-500.css'
import '@fontsource/poppins/latin-600.css'
import '@fontsource/poppins/latin-700.css'
import './index.css'
import { config, title, tr } from './config'
import Screen from './Screen'
import { fit } from './fit'
import Plate from './Plate'
import Symbols from './symbols'

document.documentElement.dataset.game = config.id

// every game writes its calls in a typeface of its own, only that one is loaded
const fonts: Record<string, () => Promise<unknown>> = {
  holmgang: () => import('@fontsource/pirata-one/latin-400.css'),
  vildmark: () => import('@fontsource/cormorant-garamond/latin-700.css'),
  fyllekak: () => import('@fontsource/pacifico/latin-400.css'),
  ubaten: () => import('@fontsource/black-ops-one/latin-400.css'),
  farao: () => import('@fontsource/cinzel/latin-900.css'),
  olympen: () => import('@fontsource/cinzel/latin-700.css'),
  andjakt: () => import('@fontsource/special-elite/latin-400.css'),
  ronin: () => import('@fontsource/shojumaru/latin-400.css'),
  gruvan: () => import('@fontsource/rye/latin-400.css'),
}
fonts[config.id]?.()

// any: the screen the model shows for every game, only seen from further away than the machines draw their own
const Any = () => (
  <div class="screen attract">
    <div class="idle">
      <h1 ref={fit(1180)}>{title}</h1>
      <i />
      <p ref={fit(1180)}>{config.tag}</p>
      <small>{tr('responsible')}</small>
    </div>
  </div>
)

const root = document.getElementById('root')!
// someone else's machine: a small page, and a light one so your own screen gets the power
if (config.scale) {
  root.style.zoom = String(config.scale)
  document.documentElement.dataset.lite = ''
}
// a hidden page paints nothing, every message but sleep shows it again
window.addEventListener('message', ({ data }) => {
  root.style.display = data?.type === 'sleep' ? 'none' : ''
})

render(
  () => (
    <>
      <Symbols />
      {config.view === 'plate' ? <Plate /> : config.id === 'any' ? <Any /> : <Screen />}
    </>
  ),
  root,
)
