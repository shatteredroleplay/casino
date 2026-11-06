import { For, Show, createResource, createSignal } from 'solid-js'
import { lang, t } from '../shared/i18n'
import { money, number } from '../shared/format'
import { call, pct } from './api'
import { Bars, Card, Empty, Stat, Status } from './ui'

type Row = { game: string; label: string; wagered: number; won: number; rounds: number; biggest: number }
type Data = { days: number; list: Row[]; series: { day: string; wagered: number; won: number; rounds: number }[] }

const RANGES = [1, 7, 30, 90]

export const Games = () => {
  const [days, setDays] = createSignal(30)
  const [data, { refetch }] = createResource(days, (d) => call<Data>('games', d))

  const totals = () => (data()?.list ?? []).reduce((s, r) => ({ wagered: s.wagered + r.wagered, won: s.won + r.won, rounds: s.rounds + r.rounds }), { wagered: 0, won: 0, rounds: 0 })
  const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(lang(), { month: 'numeric', day: 'numeric' })

  return (
    <div class="a-stack">
      <div class="a-toolbar">
        <div class="segments">
          <For each={RANGES}>
            {(r) => (
              <button class="segment" classList={{ on: days() === r }} onClick={() => setDays(r)}>
                {t('admin.days', { count: r })}
              </button>
            )}
          </For>
        </div>
      </div>

      <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
        {(d) => (
          <div class="a-stack" classList={{ stale: data.loading }}>
            <div class="a-stats">
              <Stat label={t('log.wagered')} value={money(totals().wagered)} />
              <Stat label={t('admin.paid_out')} value={money(totals().won)} />
              <Stat label={t('admin.house_profit')} value={money(totals().wagered - totals().won)} tone={totals().wagered >= totals().won ? 'up' : 'down'} />
              <Stat label={t('admin.rtp')} value={pct(totals().won, totals().wagered)} />
              <Stat label={t('admin.rounds_label')} value={number(totals().rounds)} />
            </div>

            <div class="a-grid two">
              <Card title={t('admin.profit_per_day')}>
                <Show when={d().series.length} fallback={<Empty text={t('admin.none_yet')} />}>
                  <Bars signed format={money} data={d().series.map((s) => ({ label: day(s.day), value: s.wagered - s.won, note: t('admin.rtp_value', { value: pct(s.won, s.wagered) }) }))} />
                </Show>
              </Card>
              <Card title={t('admin.wagered_per_day')}>
                <Show when={d().series.length} fallback={<Empty text={t('admin.none_yet')} />}>
                  <Bars format={money} data={d().series.map((s) => ({ label: day(s.day), value: s.wagered, note: t('admin.rounds', { count: number(s.rounds) }) }))} />
                </Show>
              </Card>
            </div>

            <Card title={t('admin.per_game')}>
              <Show when={d().list.length} fallback={<Empty text={t('admin.none_yet')} />}>
                <table class="a-table">
                  <thead>
                    <tr>
                      <th>{t('log.game')}</th>
                      <th class="num">{t('admin.rounds_label')}</th>
                      <th class="num">{t('log.wagered')}</th>
                      <th class="num">{t('admin.paid_out')}</th>
                      <th class="num">{t('admin.house_profit')}</th>
                      <th class="num">{t('admin.rtp')}</th>
                      <th class="num">{t('admin.biggest')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={d().list}>
                      {(r) => (
                        <tr>
                          <td>{r.label}</td>
                          <td class="num">{number(r.rounds)}</td>
                          <td class="num">{money(r.wagered)}</td>
                          <td class="num">{money(r.won)}</td>
                          <td class="num" classList={{ up: r.wagered >= r.won, down: r.wagered < r.won }}>{money(r.wagered - r.won)}</td>
                          <td class="num">{pct(r.won, r.wagered)}</td>
                          <td class="num muted">{money(r.biggest)}</td>
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
    </div>
  )
}
