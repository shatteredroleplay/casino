import { For, Match, Show, Switch, createSignal, onCleanup, onMount } from 'solid-js'
import { onMessage, post, isBrowser } from '../shared/nui'
import { t } from '../shared/i18n'
import { Icon } from '../shared/icons'
import { type Feed, type Session, busy, say, toast, unsaved } from './api'
import { Dashboard } from './Dashboard'
import { Games } from './Games'
import { Players } from './Players'
import { Rigging } from './Rigging'
import { Economy } from './Economy'
import { Settings } from './Settings'
import { Audit } from './Audit'

const TABS = [
  { id: 'dashboard', perm: 'view' },
  { id: 'games', perm: 'view' },
  { id: 'players', perm: 'view' },
  { id: 'rigging', perm: 'rig' },
  { id: 'economy', perm: 'economy' },
  { id: 'settings', perm: 'settings' },
  { id: 'audit', perm: 'view' },
] as const

export type Tab = (typeof TABS)[number]['id']

export const Admin = () => {
  const [session, setSession] = createSignal<Session | null>(null)
  const [tab, setTab] = createSignal<Tab>('dashboard')
  const [feed, setFeed] = createSignal<Feed[]>([])
  const [focus, setFocus] = createSignal<string | null>(null)
  const [closing, setClosing] = createSignal(false)
  const [leaving, setLeaving] = createSignal(false)
  let closeTimer = 0
  let leaveTimer = 0

  const allowed = () => TABS.filter((x) => session()?.perms.includes(x.perm))

  const finish = () => {
    clearTimeout(closeTimer)
    setClosing(true)
    closeTimer = window.setTimeout(() => {
      setSession(null)
      setClosing(false)
    }, 150)
  }

  const guard = () => {
    if (!unsaved() || leaving()) {
      setLeaving(false)
      return true
    }
    setLeaving(true)
    say(false, t('admin.unsaved_leave'))
    clearTimeout(leaveTimer)
    leaveTimer = window.setTimeout(() => setLeaving(false), 3000)
    return false
  }

  const go = (id: Tab) => {
    if (id === tab() || guard()) setTab(id)
  }

  onMessage('admin:open', (data: Session) => {
    clearTimeout(closeTimer)
    setClosing(false)
    setSession(data)
    setFeed(data.feed ?? [])
    const first = TABS.find((x) => data.perms.includes(x.perm))
    if (first) setTab(first.id)
  })
  onMessage('admin:close', finish)
  onMessage('admin:feed', (data) => setFeed((list) => [data.entry, ...list].slice(0, 100)))

  const close = () => {
    if (closing() || !guard()) return
    finish()
    post('admin', { call: 'close' })
  }

  const openPlayer = (id: string) => {
    setFocus(id)
    setTab('players')
  }

  const onKey = (e: KeyboardEvent) => {
    if (session() && e.key === 'Escape' && !document.querySelector('.backdrop .dialog')) close()
  }
  onMount(() => window.addEventListener('keydown', onKey))
  onCleanup(() => window.removeEventListener('keydown', onKey))

  if (import.meta.env.DEV && isBrowser && location.search.includes('admin')) setTimeout(async () => {
    const { mock } = await import('./mock')
    const data = mock('open', []) as Session
    setSession(data)
    setFeed(data.feed)
  }, 200)

  return (
    <Show when={session()}>
      {(s) => (
        <div class="a-backdrop" classList={{ out: closing() }}>
          <div class="a-panel panel" classList={{ busy: busy() }}>
            <nav class="a-nav">
              <div class="a-brand">
                <Icon name="chip" class="a-brand-icon" />
                <div>
                  <b>{t('common.casino')}</b>
                  <span>{t('admin.title')}</span>
                </div>
              </div>
              <For each={allowed()}>
                {(x) => (
                  <button class="a-tab" classList={{ on: tab() === x.id }} onClick={() => go(x.id)}>
                    <Icon name={x.id} class="a-tab-icon" />
                    {t(`admin.tab_${x.id}`)}
                  </button>
                )}
              </For>
              <div class="a-nav-foot">{t('admin.esc')}</div>
            </nav>
            <main class="a-main">
              <header class="a-head">
                <h2>{t(`admin.tab_${tab()}`)}</h2>
                <button class="dialog-close" onClick={close}>
                  <Icon name="close" />
                </button>
              </header>
              <div class="a-body">
                <Switch>
                  <Match when={tab() === 'dashboard'}>
                    <Dashboard feed={feed()} />
                  </Match>
                  <Match when={tab() === 'games'}>
                    <Games />
                  </Match>
                  <Match when={tab() === 'players'}>
                    <Players session={s()} focus={focus()} onFocus={setFocus} />
                  </Match>
                  <Match when={tab() === 'rigging'}>
                    <Rigging session={s()} onPlayer={openPlayer} />
                  </Match>
                  <Match when={tab() === 'economy'}>
                    <Economy />
                  </Match>
                  <Match when={tab() === 'settings'}>
                    <Settings />
                  </Match>
                  <Match when={tab() === 'audit'}>
                    <Audit />
                  </Match>
                </Switch>
              </div>
            </main>
            <Show when={toast()}>
              {(m) => <div class="a-toast" classList={{ ok: m().ok, bad: !m().ok, out: m().out }}>{m().text}</div>}
            </Show>
          </div>
        </div>
      )}
    </Show>
  )
}
