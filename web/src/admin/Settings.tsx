import { For, Show, createEffect, createResource, createSignal, onCleanup } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { t } from '../shared/i18n'
import { number } from '../shared/format'
import { act, call, setUnsaved } from './api'
import { Card, Status } from './ui'

type Data = {
  games: { id: string; label: string; disabled: boolean }[]
  tables: { key: string; label: string; min: number; max: number; baseMin: number; baseMax: number }[]
  cooldown: number
  baseCooldown: number
}

export const Settings = () => {
  const [data, { refetch }] = createResource(() => call<Data>('settings'))
  const [form, setForm] = createStore<{ disabled: Record<string, boolean>; limits: Record<string, { min: number; max: number }>; hours: number }>({ disabled: {}, limits: {}, hours: 24 })
  const [base, setBase] = createSignal('')
  const dirty = () => base() !== '' && JSON.stringify(form) !== base()
  createEffect(() => setUnsaved(dirty()))
  onCleanup(() => setUnsaved(false))

  createEffect(() => {
    const d = data()
    if (!d) return
    const disabled: Record<string, boolean> = {}
    const limits: Record<string, { min: number; max: number }> = {}
    d.games.forEach((g) => (disabled[g.id] = g.disabled))
    d.tables.forEach((x) => (limits[x.key] = { min: x.min, max: x.max }))
    const next = { disabled, limits, hours: Math.round((d.cooldown / 3600) * 10) / 10 }
    setForm(reconcile(next))
    setBase(JSON.stringify(next))
  })

  const save = async () => {
    if (await act('settings:set', t('admin.saved'), { disabled: form.disabled, limits: form.limits, cooldown: Math.round(form.hours * 3600) })) refetch()
  }

  return (
    <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
      {(d) => (
        <div class="a-stack" onKeyDown={(e) => e.key === 'Enter' && e.target instanceof HTMLInputElement && dirty() && save()}>
          <div class="a-grid two">
            <Card title={t('admin.games_open')}>
              <div class="a-list">
                <For each={d().games}>
                  {(g) => (
                    <button class="toggle-row a-line" onClick={() => setForm('disabled', g.id, !form.disabled[g.id])}>
                      <span class="toggle" classList={{ on: !form.disabled[g.id] }} />
                      <span>{g.label}</span>
                      <small class="a-muted">{form.disabled[g.id] ? t('admin.closed') : t('admin.open')}</small>
                    </button>
                  )}
                </For>
              </div>
            </Card>
            <Card title={t('admin.wheel_title')}>
              <label class="a-field">
                <span class="field-label">{t('admin.cooldown_hours')}</span>
                <input class="text" type="number" min="0" step="0.5" value={form.hours} onInput={(e) => setForm('hours', Number(e.currentTarget.value))} />
              </label>
              <p class="a-note">{t('admin.default_value', { value: number(d().baseCooldown / 3600) })}</p>
            </Card>
          </div>

          <Card title={t('admin.limits')}>
            <table class="a-table">
              <thead>
                <tr>
                  <th>{t('admin.table')}</th>
                  <th class="num">{t('input.min')}</th>
                  <th class="num">{t('input.max')}</th>
                  <th class="num">{t('admin.default')}</th>
                </tr>
              </thead>
              <tbody>
                <For each={d().tables}>
                  {(x) => (
                    <tr>
                      <td>{x.label}</td>
                      <td class="num">
                        <input class="text small" type="number" min="1" value={form.limits[x.key]?.min} onInput={(e) => setForm('limits', x.key, 'min', Number(e.currentTarget.value))} />
                      </td>
                      <td class="num">
                        <input class="text small" type="number" min="1" value={form.limits[x.key]?.max} onInput={(e) => setForm('limits', x.key, 'max', Number(e.currentTarget.value))} />
                      </td>
                      <td class="num muted">
                        {number(x.baseMin)} – {number(x.baseMax)}
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Card>

          <div class="a-savebar">
            <Show when={dirty()}>
              <span>{t('admin.unsaved')}</span>
            </Show>
            <button class="btn primary" disabled={!dirty()} onClick={save}>
              {t('admin.save_settings')}
            </button>
          </div>
        </div>
      )}
    </Show>
  )
}
