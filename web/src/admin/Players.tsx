import { For, Show, createResource, createSignal, onMount } from 'solid-js'
import { t } from '../shared/i18n'
import { Icon } from '../shared/icons'
import { money, number } from '../shared/format'
import { type Session, act, ago, call, pct } from './api'
import { Card, Confirm, Empty, RigForm, Stat, Status, signed, signedMoney } from './ui'

type Online = { id: string; src: number; name: string; chips: number; inside: boolean }
type Result = { identifier: string; name: string; wagered: number; won: number; rounds: number; biggest_win: number; banned: number | boolean; last_seen: number }
type Profile = {
  id: string; name: string; src?: number; chips?: number; wagered: number; won: number; rounds: number; biggest: number
  banned: boolean; wheel?: number; seen?: number; rig?: { mode: string; chance: number; games?: string[]; net: number; wheel?: number; text: string }
  prizes: string[]; history: { label: string; bet: number; payout: number; time: number }[]
}

export const Players = (props: { session: Session; focus: string | null; onFocus: (id: string | null) => void }) => {
  const [search, setSearch] = createSignal('')
  const [query, setQuery] = createSignal('')
  const [list, { refetch: refreshList }] = createResource(query, (q) => call<{ online: Online[]; results: Result[] }>('players', q))
  const [profile, { refetch }] = createResource(() => props.focus, (id) => call<Profile>('player', id))
  const [chips, setChips] = createSignal('')
  let timer = 0
  let field: HTMLInputElement | undefined

  onMount(() => {
    if (!props.focus) field?.focus()
  })

  const can = (perm: string) => props.session.perms.includes(perm)
  const amount = () => (Number.isInteger(Number(chips())) && Number(chips()) > 0 ? Number(chips()) : 0)

  const onSearch = (value: string) => {
    setSearch(value)
    clearTimeout(timer)
    const q = value.trim()
    timer = window.setTimeout(() => setQuery(q.length >= 2 ? q : ''), 350)
  }

  const reload = () => {
    refetch()
    refreshList()
  }

  const adjust = async (id: string, delta: number) => {
    if (!delta) return
    if (await act('chips', t('admin.saved'), id, delta)) {
      setChips('')
      reload()
    }
  }

  return (
    <div class="a-grid players">
      <div class="a-stack">
        <div class="a-search">
          <Icon name="search" />
          <input ref={field} class="text" placeholder={t('admin.search')} value={search()} onInput={(e) => onSearch(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Escape' && search() && (e.stopPropagation(), onSearch(''))} />
        </div>
        <Card title={t('admin.online')}>
          <Show when={list()?.online.length} fallback={<Empty text={t('admin.nobody')} />}>
            <div class="a-list">
              <For each={list()!.online}>
                {(p) => (
                  <button class="a-person" classList={{ on: props.focus === p.id }} onClick={() => props.onFocus(p.id)}>
                    <i classList={{ inside: p.inside }} title={p.inside ? t('admin.inside') : t('admin.outside')} />
                    <span>
                      {p.name}
                      <small>#{p.src}</small>
                    </span>
                    <b>{t('common.chips', { amount: number(p.chips) })}</b>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Card>
        <Card title={query() ? t('admin.results') : t('admin.top_winners')}>
          <Show when={list()?.results.length} fallback={<Empty text={t('admin.none_found')} />}>
            <div class="a-list">
              <For each={list()!.results}>
                {(r) => (
                  <button class="a-person" classList={{ on: props.focus === r.identifier }} onClick={() => props.onFocus(r.identifier)}>
                    <i classList={{ banned: r.banned === 1 || r.banned === true }} title={r.banned === 1 || r.banned === true ? t('admin.banned') : ''} />
                    <span>
                      {r.name || r.identifier}
                      <small>{ago(r.last_seen)}</small>
                    </span>
                    <b classList={{ up: r.won > r.wagered, down: r.won < r.wagered }}>{signedMoney(r.won - r.wagered)}</b>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </Card>
      </div>

      <Show when={props.focus} fallback={<Empty fill text={t('admin.pick_player')} />}>
        <Show when={profile()} fallback={<Status loading={profile.loading} retry={refetch} />}>
          {(p) => (
            <div class="a-stack">
              <div class="a-profile-head">
                <div>
                  <h3>{p().name}</h3>
                  <small>
                    {p().id} · {p().src ? t('admin.online_as', { src: p().src! }) : t('admin.offline')}
                    {p().banned ? ` · ${t('admin.banned')}` : ''}
                  </small>
                </div>
                <Show when={p().chips !== undefined}>
                  <span class="a-pill">{t('common.chips', { amount: number(p().chips!) })}</span>
                </Show>
              </div>

              <div class="a-stats">
                <Stat label={t('log.wagered')} value={money(p().wagered)} />
                <Stat label={t('log.won')} value={money(p().won)} />
                <Stat label={t('admin.net')} value={money(p().won - p().wagered)} tone={p().won >= p().wagered ? 'up' : 'down'} />
                <Stat label={t('admin.rtp')} value={pct(p().won, p().wagered)} sub={t('admin.rounds', { count: number(p().rounds) })} />
                <Stat label={t('admin.biggest')} value={money(p().biggest)} />
              </div>

              <div class="a-grid two">
                <Show when={can('rig')}>
                  <Card title={t('admin.rig_player')} side={<span class="a-muted">{p().rig?.mode && p().rig?.mode !== 'off' ? t('admin.net_value', { value: signed(p().rig!.net) }) : ''}</span>}>
                    <Show when={p().rig?.text}>
                      <p class="a-note">{p().rig!.text}</p>
                    </Show>
                    <RigForm
                      games={props.session.games}
                      initial={p().rig}
                      onSave={async (v) => {
                        if (await act('rig:set', t('admin.saved'), p().id, v.mode, v.chance, v.games, { minutes: v.minutes, limit: v.limit })) reload()
                      }}
                    />
                    <div class="a-field split">
                      <span class="field-label">{t('admin.next_prize')}</span>
                      <select
                        class="text"
                        value={String(p().rig?.wheel ?? 0)}
                        onChange={async (e) => {
                          if (await act('rig:wheel', t('admin.saved'), p().id, Number(e.currentTarget.value))) reload()
                        }}
                      >
                        <option value="0">{t('admin.random_prize')}</option>
                        <For each={p().prizes}>{(label, i) => <option value={String(i() + 1)}>{label}</option>}</For>
                      </select>
                    </div>
                  </Card>
                </Show>

                <Show when={can('economy')}>
                  <Card title={t('admin.manage')}>
                    <div class="a-stack">
                      <Show when={p().src} fallback={<p class="a-note">{t('admin.chips_online_only')}</p>}>
                        <div class="a-row">
                          <input class="text" type="number" min="1" placeholder={t('admin.chips_amount')} value={chips()} onInput={(e) => setChips(e.currentTarget.value)} />
                          <button class="btn" disabled={!amount()} onClick={() => adjust(p().id, -amount())}>{t('admin.take')}</button>
                          <button class="btn primary" disabled={!amount()} onClick={() => adjust(p().id, amount())}>{t('admin.give')}</button>
                        </div>
                      </Show>
                      <div class="a-kv">
                        <span>{t('admin.wheel_last')}</span>
                        <b>{p().wheel ? ago(p().wheel!) : t('admin.never')}</b>
                      </div>
                      <button class="btn" onClick={async () => { if (await act('wheel:reset', t('admin.saved'), p().id)) reload() }}>{t('admin.wheel_reset')}</button>
                      <Show
                        when={!p().banned}
                        fallback={
                          <button class="btn" onClick={async () => { if (await act('ban', t('admin.saved'), p().id, false)) reload() }}>
                            {t('admin.unban')}
                          </button>
                        }
                      >
                        <Confirm class="danger" onConfirm={async () => { if (await act('ban', t('admin.saved'), p().id, true)) reload() }}>
                          {t('admin.ban')}
                        </Confirm>
                      </Show>
                    </div>
                  </Card>
                </Show>
              </div>

              <Card title={t('admin.history')}>
                <Show when={p().history.length} fallback={<Empty text={t('admin.none_yet')} />}>
                  <table class="a-table">
                    <thead>
                      <tr>
                        <th>{t('log.game')}</th>
                        <th class="num">{t('log.wagered')}</th>
                        <th class="num">{t('admin.payout')}</th>
                        <th class="num">{t('admin.when')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={p().history}>
                        {(r) => (
                          <tr>
                            <td>{r.label}</td>
                            <td class="num">{money(r.bet)}</td>
                            <td class="num" classList={{ up: r.payout > r.bet, down: r.payout < r.bet }}>{money(r.payout)}</td>
                            <td class="num muted">{ago(r.time)}</td>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </Show>
              </Card>
            </div>
          )}
        </Show>
      </Show>
    </div>
  )
}
