import { For, Show, createSignal } from 'solid-js'
import { onMessage } from '../shared/nui'
import { t } from '../shared/i18n'

export const Prompt = () => {
  const [options, setOptions] = createSignal<string[]>([])
  const [selected, setSelected] = createSignal(1)

  onMessage('prompt', (data) => {
    setOptions(Array.isArray(data.options) ? data.options : [])
    setSelected(Number(data.selected) || 1)
  })

  return (
    <div class="prompt" classList={{ show: options().length > 0 }}>
      <For each={options()}>
        {(label, i) => (
          <div class="prompt-row panel" classList={{ active: i() + 1 === selected() }}>
            <span class="key" classList={{ on: i() + 1 === selected() }}>
              E
            </span>
            <span>{label}</span>
          </div>
        )}
      </For>
      <Show when={options().length > 1}>
        <div class="prompt-tip">{t('prompt.cycle')}</div>
      </Show>
    </div>
  )
}
