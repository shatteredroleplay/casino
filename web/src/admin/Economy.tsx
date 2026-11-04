import { Show, createEffect, createResource, createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'
import { t } from '../shared/i18n'
import { money, number } from '../shared/format'
import { act, call, whole } from './api'
import { Card, Meter, Status } from './ui'

type Protection = { Bias: { Max: number; Curve: number }; HighRoller: { Loss: number; Chance: number } }
type Data = { pool: number; cap: number; fund: number; rate: number; maxBetPct: number; income: number; incomeMode: string; protection: Protection }

export const Economy = () => {
  const [data, { refetch }] = createResource(() => call<Data>('economy'))
  const [pool, setPool] = createSignal('')
  const [fund, setFund] = createSignal('')
  const [p, setP] = createStore({ max: 30, curve: 2, loss: 5000, chance: 25 })

  const apply = async (what: 'pool' | 'fund', value: string, clear: () => void) => {
    if (!whole(value)) return
    if (await act('economy:set', t('admin.saved'), what, Number(value))) {
      clear()
      refetch()
    }
  }

  createEffect(() => {
    const d = data()
    if (!d) return
    setP({ max: Math.round(d.protection.Bias.Max * 100), curve: d.protection.Bias.Curve, loss: d.protection.HighRoller.Loss, chance: Math.round(d.protection.HighRoller.Chance * 100) })
  })

  return (
    <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
      {(d) => (
        <div class="a-grid two">
          <div class="a-stack">
            <Card title={t('admin.pool')}>
              <div class="a-stack">
                <Meter label={t('admin.pool_chips')} value={d().pool} max={d().cap} text={`${number(d().pool)} / ${number(d().cap)}`} />
                <p class="a-note">{t('admin.pool_hint', { value: money(d().pool * d().rate), pct: (d().maxBetPct * 100).toFixed(1) })}</p>
                <div class="a-row">
                  <input class="text" type="number" min="0" placeholder={t('admin.new_pool')} value={pool()} onInput={(e) => setPool(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && apply('pool', pool(), () => setPool(''))} />
                  <button class="btn primary" disabled={!whole(pool())} onClick={() => apply('pool', pool(), () => setPool(''))}>
                    {t('admin.set')}
                  </button>
                </div>
              </div>
            </Card>
            <Card title={t('admin.car_fund_title')}>
              <div class="a-stack">
                <div class="a-kv">
                  <span>{t('admin.fund_now')}</span>
                  <b>{money(d().fund)}</b>
                </div>
                <div class="a-row">
                  <input class="text" type="number" min="0" placeholder={t('admin.new_fund')} value={fund()} onInput={(e) => setFund(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && apply('fund', fund(), () => setFund(''))} />
                  <button class="btn primary" disabled={!whole(fund())} onClick={() => apply('fund', fund(), () => setFund(''))}>
                    {t('admin.set')}
                  </button>
                </div>
              </div>
            </Card>
            <Card title={t('admin.income')}>
              <div class="a-kv">
                <span>{t('admin.income_mode')}</span>
                <b>{t(`admin.income_mode_${d().incomeMode}`) === `admin.income_mode_${d().incomeMode}` ? d().incomeMode : t(`admin.income_mode_${d().incomeMode}`)}</b>
              </div>
              <div class="a-kv">
                <span>{t('admin.income_pending')}</span>
                <b>{money(d().income)}</b>
              </div>
            </Card>
          </div>

          <Card title={t('admin.protection')}>
            <div class="a-stack">
              <p class="a-note">{t('admin.protection_hint')}</p>
              <div class="a-field">
                <span class="field-label">{t('admin.bias')}</span>
                <div class="slider">
                  <input type="range" min="0" max="100" step="1" value={p.max} onInput={(e) => setP('max', Number(e.currentTarget.value))} />
                  <span class="slider-value">{p.max}%</span>
                </div>
              </div>
              <div class="a-field">
                <span class="field-label">{t('admin.curve')}</span>
                <div class="slider">
                  <input type="range" min="0.5" max="6" step="0.5" value={p.curve} onInput={(e) => setP('curve', Number(e.currentTarget.value))} />
                  <span class="slider-value">{p.curve.toFixed(1)}</span>
                </div>
              </div>
              <label class="a-field">
                <span class="field-label">{t('admin.high_roller_loss')}</span>
                <input class="text" type="number" min="0" value={p.loss} onInput={(e) => setP('loss', Number(e.currentTarget.value))} />
              </label>
              <div class="a-field">
                <span class="field-label">{t('admin.high_roller_chance')}</span>
                <div class="slider">
                  <input type="range" min="0" max="100" step="1" value={p.chance} onInput={(e) => setP('chance', Number(e.currentTarget.value))} />
                  <span class="slider-value">{p.chance}%</span>
                </div>
              </div>
              <button class="btn primary" onClick={async () => { if (await act('protection', t('admin.saved'), { max: p.max / 100, curve: p.curve, loss: p.loss, chance: p.chance / 100 })) refetch() }}>
                {t('admin.save')}
              </button>
            </div>
          </Card>
        </div>
      )}
    </Show>
  )
}
