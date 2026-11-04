import { For } from 'solid-js'
import { createStore, produce } from 'solid-js/store'
import { onMessage } from '../shared/nui'
import { Icon } from '../shared/icons'

type Kind = 'info' | 'success' | 'warning' | 'error'
type Note = { id: number; text: string; title?: string; kind: Kind; duration: number; leaving: boolean }

const MAX = 5
const KINDS: Kind[] = ['info', 'success', 'warning', 'error']
let nextId = 0

export const Notifications = () => {
  const [notes, setNotes] = createStore<Note[]>([])

  const dismiss = (id: number) => {
    setNotes((n) => n.id === id, 'leaving', true)
    setTimeout(() => setNotes((list) => list.filter((n) => n.id !== id)), 250)
  }

  onMessage('notify', (data) => {
    const note: Note = {
      id: ++nextId,
      text: String(data.text ?? ''),
      title: data.title || undefined,
      kind: KINDS.includes(data.kind) ? data.kind : 'info',
      duration: Number(data.duration) || 4000,
      leaving: false,
    }
    setNotes(
      produce((list) => {
        list.push(note)
        if (list.length > MAX) list.splice(0, list.length - MAX)
      }),
    )
    setTimeout(() => dismiss(note.id), note.duration)
  })

  return (
    <div class="notes">
      <For each={notes}>
        {(note) => (
          <div class={`note panel ${note.kind}`} classList={{ leaving: note.leaving }}>
            <Icon name={note.kind} class="note-icon" />
            <div class="note-body">
              {note.title && <div class="note-title">{note.title}</div>}
              <div class="note-text">{note.text}</div>
            </div>
            <div class="note-timer" style={{ 'animation-duration': `${note.duration}ms` }} />
          </div>
        )}
      </For>
    </div>
  )
}
