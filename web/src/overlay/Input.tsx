import { For, Match, Show, Switch, createSignal, onCleanup, onMount } from 'solid-js'
import { createStore } from 'solid-js/store'
import { onMessage, post } from '../shared/nui'
import { t } from '../shared/i18n'
import { number as formatNumber } from '../shared/format'
import { Icon } from '../shared/icons'

type Option = { value: string; label: string }
type Field = {
  name: string
  type: 'amount' | 'number' | 'text' | 'select' | 'slider' | 'checkbox'
  label?: string
  min?: number
  max?: number
  step?: number
  default?: unknown
  placeholder?: string
  options?: Option[]
}
type Spec = { title?: string; submit?: string; fields: Field[] }
type Values = Record<string, unknown>

const initial = (field: Field): unknown => {
  if (field.default !== undefined) return field.default
  if (field.type === 'checkbox') return false
  if (field.type === 'select') return field.options?.[0]?.value ?? ''
  if (field.type === 'amount' || field.type === 'slider') return field.min ?? 0
  return ''
}

const clamp = (value: number, field: Field) => {
  let n = Math.floor(value)
  if (field.min !== undefined) n = Math.max(field.min, n)
  if (field.max !== undefined) n = Math.min(field.max, n)
  return n
}

export const Input = () => {
  const [open, setOpen] = createSignal<{ id: number; spec: Spec } | null>(null)
  const [values, setValues] = createStore<Values>({})
  const [error, setError] = createSignal('')

  onMessage('input', (data) => {
    const spec: Spec = data.spec ?? { fields: [] }
    const start: Values = {}
    for (const field of spec.fields ?? []) start[field.name] = initial(field)
    setValues(start)
    setError('')
    setOpen({ id: data.id, spec })
  })

  onMessage('input:close', (data) => {
    if (open()?.id === data.id) setOpen(null)
  })

  const finish = (result: Values | null) => {
    const current = open()
    if (!current) return
    setOpen(null)
    post('input', { id: current.id, values: result })
  }

  const submit = () => {
    const current = open()
    if (!current) return
    const result: Values = {}
    for (const field of current.spec.fields) {
      const value = values[field.name]
      if (field.type === 'amount' || field.type === 'number' || field.type === 'slider') {
        const n = Number(value)
        const outside = (field.min !== undefined && n < field.min) || (field.max !== undefined && n > field.max)
        if (value === '' || !Number.isFinite(n) || outside) {
          setError(t('error.invalid_amount'))
          return
        }
        result[field.name] = field.type === 'amount' ? Math.floor(n) : n
      } else {
        result[field.name] = value
      }
    }
    finish(result)
  }

  const onKey = (event: KeyboardEvent) => {
    if (!open()) return
    if (event.key === 'Escape') finish(null)
    if (event.key === 'Enter') submit()
  }
  onMount(() => window.addEventListener('keydown', onKey))
  onCleanup(() => window.removeEventListener('keydown', onKey))

  const set = (name: string, value: unknown) => {
    setError('')
    setValues(name, value)
  }

  return (
    <Show when={open()}>
      {(current) => (
        <div class="backdrop">
          <div class="dialog panel">
            <div class="dialog-head">
              <span>{current().spec.title}</span>
              <button class="dialog-close" onClick={() => finish(null)}>
                <Icon name="close" />
              </button>
            </div>
            <div class="dialog-body">
              <For each={current().spec.fields}>
                {(field) => (
                  <div class="field">
                    <Show when={field.type !== 'checkbox' && field.label}>
                      <span class="field-label">{field.label}</span>
                    </Show>
                    <Switch>
                      <Match when={field.type === 'amount'}>
                        <div class="amount">
                          <div class="amount-input">
                            <Icon name="chip" class="amount-chip" />
                            <input
                              type="number"
                              autofocus
                              value={values[field.name] as number}
                              min={field.min}
                              max={field.max}
                              onInput={(e) => set(field.name, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
                            />
                          </div>
                          <div class="amount-quick">
                            <Show when={field.min !== undefined}>
                              <button type="button" class="btn" onClick={() => set(field.name, field.min)}>
                                {t('input.min')}
                              </button>
                            </Show>
                            <button type="button" class="btn" onClick={() => set(field.name, clamp(Number(values[field.name]) / 2, field))}>
                              {t('input.half')}
                            </button>
                            <button type="button" class="btn" onClick={() => set(field.name, clamp(Number(values[field.name]) * 2, field))}>
                              {t('input.double')}
                            </button>
                            <Show when={field.max !== undefined}>
                              <button type="button" class="btn" onClick={() => set(field.name, field.max)}>
                                {t('input.max')}
                              </button>
                            </Show>
                          </div>
                          <Show when={field.min !== undefined && field.max !== undefined}>
                            <span class="field-hint">{t('input.range', { min: formatNumber(field.min!), max: formatNumber(field.max!) })}</span>
                          </Show>
                        </div>
                      </Match>
                      <Match when={field.type === 'number'}>
                        <input
                          class="text"
                          type="number"
                          value={values[field.name] as number}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          onInput={(e) => set(field.name, e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
                        />
                      </Match>
                      <Match when={field.type === 'text'}>
                        <input
                          class="text"
                          type="text"
                          value={values[field.name] as string}
                          placeholder={field.placeholder}
                          onInput={(e) => set(field.name, e.currentTarget.value)}
                        />
                      </Match>
                      <Match when={field.type === 'select' && (field.options?.length ?? 0) <= 4}>
                        <div class="segments">
                          <For each={field.options}>
                            {(option) => (
                              <button
                                type="button"
                                class="segment"
                                classList={{ on: values[field.name] === option.value }}
                                onClick={() => set(field.name, option.value)}
                              >
                                {option.label}
                              </button>
                            )}
                          </For>
                        </div>
                      </Match>
                      <Match when={field.type === 'select'}>
                        <select class="text" value={values[field.name] as string} onChange={(e) => set(field.name, e.currentTarget.value)}>
                          <For each={field.options}>{(option) => <option value={option.value}>{option.label}</option>}</For>
                        </select>
                      </Match>
                      <Match when={field.type === 'slider'}>
                        <div class="slider">
                          <input
                            type="range"
                            value={values[field.name] as number}
                            min={field.min ?? 0}
                            max={field.max ?? 100}
                            step={field.step ?? 1}
                            onInput={(e) => set(field.name, Number(e.currentTarget.value))}
                          />
                          <span class="slider-value">{formatNumber(values[field.name] as number)}</span>
                        </div>
                      </Match>
                      <Match when={field.type === 'checkbox'}>
                        <button type="button" class="toggle-row" onClick={() => set(field.name, !values[field.name])}>
                          <span class="toggle" classList={{ on: values[field.name] === true }} />
                          <span>{field.label}</span>
                        </button>
                      </Match>
                    </Switch>
                  </div>
                )}
              </For>
              <Show when={error()}>
                <div class="dialog-error">{error()}</div>
              </Show>
            </div>
            <div class="dialog-foot">
              <button class="btn" onClick={() => finish(null)}>
                {t('common.cancel')}
              </button>
              <button class="btn primary" onClick={submit}>
                {current().spec.submit ?? t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}
