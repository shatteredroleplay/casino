import { Show, createSignal } from 'solid-js'
import { onMessage } from '../shared/nui'

export const Snackbar = () => {
  const [snack, setSnack] = createSignal<{ title: string; text?: string } | null>(null)

  onMessage('snackbar', (data) => {
    setSnack(data.title ? { title: String(data.title), text: data.text ? String(data.text) : undefined } : null)
  })

  return (
    <Show when={snack()} keyed>
      {(s) => (
        <div class="snackbar panel">
          <b>{s.title}</b>
          <Show when={s.text}>
            <span>{s.text}</span>
          </Show>
        </div>
      )}
    </Show>
  )
}
