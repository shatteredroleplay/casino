import { For, Show, createResource, onCleanup } from 'solid-js'
import { t } from '../shared/i18n'
import { money, number } from '../shared/format'
import { type Feed, ago, call, pct } from './api'
import { Card, Empty, Meter, Stat, Status } from './ui'

type Sums = { wagered: number; won: number; rounds: number }
type Data = {
  pool: number; cap: number; maxBet: number; fund: number; carValue: number; car: string; inside: number
  today: Sums; week: Sums; month: Sums
  seated: { game: string; label: string; seated: number; seats?: number }[]
  bigwins: { name: string; label: string; bet: number; payout: number; time: number }[]
}

const profit = (s?: Sums) => (s ? s.wagered - s.won : 0)

export const Dashboard = (props: { feed: Feed[] }) => {
  const [data, { refetch }] = createResource(() => call<Data>('dashboard'))
  const timer = window.setInterval(refetch, 15000)
  onCleanup(() => clearInterval(timer))

  return (
    <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
      {(d) => (
        <div class="a-grid dash">
          <div class="a-stats">
            <Stat label={t('admin.profit_today')} value={money(profit(d().today))} tone={profit(d().today) >= 0 ? 'up' : 'down'} sub={t('admin.rounds', { count: number(d().today.rounds) })} />
            <Stat label={t('admin.profit_week')} value={money(profit(d().week))} tone={profit(d().week) >= 0 ? 'up' : 'down'} sub={t('admin.wagered_amount', { amount: money(d().week.wagered) })} />
            <Stat label={t('admin.profit_month')} value={money(profit(d().month))} tone={profit(d().month) >= 0 ? 'up' : 'down'} sub={t('admin.wagered_amount', { amount: money(d().month.wagered) })} />
            <Stat label={t('admin.rtp_month')} value={pct(d().month.won, d().month.wagered)} sub={t('admin.rtp_hint')} />
            <Stat label={t('admin.inside')} value={number(d().inside)} sub={t('admin.players_now')} />
          </div>

          <Card title={t('admin.bank')}>
            <div class="a-stack">
              <Meter label={t('admin.pool')} value={d().pool} max={d().cap} text={`${money(d().pool)} / ${money(d().cap)}`} />
              <div class="a-kv">
                <span>{t('admin.max_bet')}</span>
                <b>{t('common.chips', { amount: number(d().maxBet) })}</b>
              </div>
              <Meter label={t('admin.car_fund', { car: d().car })} value={d().fund} max={d().carValue} text={`${money(d().fund)} / ${money(d().carValue)}`} />
            </div>
          </Card>

          <Card title={t('admin.occupancy')}>
            <div class="a-list">
              <For each={d().seated}>
                {(s) => (
                  <div class="a-line">
                    <span>{s.label}</span>
                    <b>{s.seats ? `${s.seated} / ${s.seats}` : number(s.seated)}</b>
                  </div>
                )}
              </For>
            </div>
          </Card>

          <Card title={t('admin.big_wins')} class="wide">
            <Show when={d().bigwins.length} fallback={<Empty text={t('admin.none_yet')} />}>
              <table class="a-table">
                <thead>
                  <tr>
                    <th>{t('log.player')}</th>
                    <th>{t('log.game')}</th>
                    <th class="num">{t('log.wagered')}</th>
                    <th class="num">{t('log.won')}</th>
                    <th class="num">{t('admin.when')}</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={d().bigwins}>
                    {(w) => (
                      <tr>
                        <td>{w.name}</td>
                        <td>{w.label}</td>
                        <td class="num">{money(w.bet)}</td>
                        <td class="num up">{money(w.payout)}</td>
                        <td class="num muted">{ago(w.time)}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </Show>
          </Card>

          <Card title={t('admin.live')} class="feed">
            <Show when={props.feed.length} fallback={<Empty text={t('admin.none_yet')} />}>
              <div class="a-feed">
                <For each={props.feed.slice(0, 30)}>
                  {(f) => (
                    <div class={`a-feed-row ${f.kind}`}>
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
      )}
    </Show>
  )
}
