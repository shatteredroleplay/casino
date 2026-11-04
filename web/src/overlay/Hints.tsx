import { For, createMemo } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { onMessage } from '../shared/nui'

type Hint = { key: string; label: string; active?: boolean }

export const Hints = () => {
  const [groups, setGroups] = createStore<Record<string, Hint[] | undefined>>({})

  onMessage('hints', (data) => {
    setGroups(data.id, Array.isArray(data.keys) && data.keys.length > 0 ? reconcile(data.keys as Hint[]) : undefined)
  })

  const all = createMemo(() => Object.values(groups).flatMap((list) => list ?? []))

  return (
    <div class="hints" classList={{ show: all().length > 0 }}>
      <For each={all()}>
        {(hint) => (
          <div class="hint panel">
            <span class="key" classList={{ on: hint.active }}>
              {hint.key}
            </span>
            <span class="hint-label">{hint.label}</span>
          </div>
        )}
      </For>
    </div>
  )
}
