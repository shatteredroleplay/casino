import { For, Show, createResource } from 'solid-js'
import { t } from '../shared/i18n'
import { number } from '../shared/format'
import { type Session, act, ago, call } from './api'
import { Card, Confirm, Empty, RigForm, Status, signed } from './ui'

type Rig = { mode: string; chance: number; games?: string[]; net: number; wheel?: number; limit?: number; expires?: number; text: string }
type Data = {
  global?: Rig
  players: { id: string; src?: number; name?: string; chips?: number; inside?: boolean; rig?: Rig }[]
  prizes: string[]
  feed: { id: number; time: number; text: string }[]
}

export const Rigging = (props: { session: Session; onPlayer: (id: string) => void }) => {
  const [data, { refetch }] = createResource(() => call<Data>('rig'))
  const active = () => (data()?.players ?? []).filter((p) => p.rig && (p.rig.mode !== 'off' || p.rig.wheel))

  return (
    <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
      {(d) => (
        <div class="a-grid two">
          <div class="a-stack">
            <Card title={t('admin.rig_global')} side={<span class="a-muted">{d().global && d().global!.mode !== 'off' ? t('admin.net_value', { value: signed(d().global!.net) }) : ''}</span>}>
              <p class="a-note">{d().global?.text ?? t('admin.rig_global_hint')}</p>
              <RigForm
                games={props.session.games}
                initial={d().global}
                onSave={async (v) => {
                  if (await act('rig:set', t('admin.saved'), null, v.mode, v.chance, v.games, { minutes: v.minutes, limit: v.limit })) refetch()
                }}
              />
            </Card>
            <Card title={t('admin.rig_feed')}>
              <Show when={d().feed.length} fallback={<Empty text={t('admin.none_yet')} />}>
                <div class="a-feed">
                  <For each={[...d().feed].reverse()}>
                    {(f) => (
                      <div class="a-feed-row rig">
                        <i />
                        <span>{f.text}</span>
                        <small>{ago(f.time)}</small>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </Card>
          </div>

          <div class="a-stack">
            <Card
              title={t('admin.rig_active')}
              side={
                <Confirm class="danger" onConfirm={async () => { if (await act('rig:clear', t('admin.cleared'))) refetch() }}>
                  {t('admin.clear_all')}
                </Confirm>
              }
            >
              <Show when={active().length} fallback={<Empty text={t('admin.no_rigs')} />}>
                <div class="a-list">
                  <For each={active()}>
                    {(p) => (
                      <button class="a-person tall" onClick={() => props.onPlayer(p.id)}>
                        <i classList={{ win: p.rig!.mode === 'win', lose: p.rig!.mode === 'lose' }} />
                        <span>
                          {p.name ?? p.id}
                          <small>{p.rig!.text}{p.rig!.wheel ? ` · ${t('admin.prize_short', { prize: d().prizes[p.rig!.wheel - 1] ?? '' })}` : ''}</small>
                        </span>
                        <b classList={{ up: p.rig!.net > 0, down: p.rig!.net < 0 }}>{signed(p.rig!.net)}</b>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </Card>
            <Card title={t('admin.players_inside')}>
              <Show when={d().players.some((p) => p.inside)} fallback={<Empty text={t('admin.nobody')} />}>
                <div class="a-list">
                  <For each={d().players.filter((p) => p.inside)}>
                    {(p) => (
                      <button class="a-person" onClick={() => props.onPlayer(p.id)}>
                        <i class="inside" />
                        <span>
                          {p.name}
                          <small>#{p.src}</small>
                        </span>
                        <b>{t('common.chips', { amount: number(p.chips ?? 0) })}</b>
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </Card>
          </div>
        </div>
      )}
    </Show>
  )
}
