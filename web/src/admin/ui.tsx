import { For, Show, createSignal, onCleanup, type JSX } from 'solid-js'
import { createStore } from 'solid-js/store'
import { t } from '../shared/i18n'
import { money, number } from '../shared/format'

export const Card = (props: { title?: string; side?: JSX.Element; children: JSX.Element; class?: string }) => (
  <section class={`a-card ${props.class ?? ''}`}>
    <Show when={props.title || props.side}>
      <header>
        <h3>{props.title}</h3>
        {props.side}
      </header>
    </Show>
    {props.children}
  </section>
)

export const Stat = (props: { label: string; value: string; sub?: string; tone?: 'up' | 'down' | '' }) => (
  <div class="a-stat">
    <span>{props.label}</span>
    <b classList={{ up: props.tone === 'up', down: props.tone === 'down' }}>{props.value}</b>
    <Show when={props.sub}>
      <small>{props.sub}</small>
    </Show>
  </div>
)

export const Meter = (props: { value: number; max: number; label: string; text: string }) => (
  <div class="a-meter">
    <div class="a-meter-head">
      <span>{props.label}</span>
      <b>{props.text}</b>
    </div>
    <div class="a-meter-track">
      <i style={{ width: `${Math.max(0, Math.min(100, (props.value / Math.max(1, props.max)) * 100))}%` }} />
    </div>
  </div>
)

export const Empty = (props: { text: string; fill?: boolean }) => <div class="a-empty" classList={{ fill: props.fill }}>{props.text}</div>

export const Status = (props: { loading: boolean; retry: () => void }) => (
  <Show when={!props.loading} fallback={<Empty text={t('admin.loading')} />}>
    <div class="a-empty failed">
      <span>{t('admin.load_failed')}</span>
      <button class="btn" onClick={() => props.retry()}>
        {t('admin.retry')}
      </button>
    </div>
  </Show>
)

export const Confirm = (props: { class?: string; disabled?: boolean; onConfirm: () => void; children: JSX.Element }) => {
  const [armed, setArmed] = createSignal(false)
  let timer = 0
  onCleanup(() => clearTimeout(timer))
  const click = () => {
    clearTimeout(timer)
    if (armed()) {
      setArmed(false)
      props.onConfirm()
      return
    }
    setArmed(true)
    timer = window.setTimeout(() => setArmed(false), 3000)
  }
  return (
    <button class={['btn', props.class, armed() && 'armed'].filter(Boolean).join(' ')} disabled={props.disabled} onClick={click}>
      {armed() ? t('admin.confirm_again') : props.children}
    </button>
  )
}

type Bar = { label: string; value: number; note?: string }

export const Bars = (props: { data: Bar[]; format: (n: number) => string; signed?: boolean; height?: number }) => {
  const [hover, setHover] = createSignal<number | null>(null)
  const max = () => Math.max(1, ...props.data.map((d) => Math.abs(d.value)))
  const H = () => props.height ?? 150
  const zero = () => (props.signed ? H() / 2 : H())
  const w = () => (props.data.length ? 100 / props.data.length : 100)
  return (
    <div class="a-chart" onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 100 ${H()}`} preserveAspectRatio="none" style={{ height: `${H() / 10}vh` }}>
        <line x1="0" x2="100" y1={zero()} y2={zero()} class="a-axis" vector-effect="non-scaling-stroke" />
        <For each={props.data}>
          {(d, i) => {
            const h = () => (Math.abs(d.value) / max()) * (props.signed ? H() / 2 - 4 : H() - 4)
            const y = () => (d.value >= 0 ? zero() - h() : zero())
            return (
              <g onMouseEnter={() => setHover(i())}>
                <rect x={i() * w()} width={w()} y="0" height={H()} fill="transparent" />
                <rect
                  class="a-bar"
                  classList={{ neg: d.value < 0, on: hover() === i() }}
                  x={i() * w() + w() * 0.16}
                  width={w() * 0.68}
                  y={y()}
                  height={Math.max(h(), 0.6)}
                  rx="0.6"
                />
              </g>
            )
          }}
        </For>
      </svg>
      <Show when={hover() !== null && props.data[hover()!]}>
        {(d) => (
          <div class="a-tip" style={{ left: `${Math.min(86, Math.max(4, (hover()! + 0.5) * w()))}%` }}>
            <span>{d().label}</span>
            <b>{props.format(d().value)}</b>
            <Show when={d().note}>
              <small>{d().note}</small>
            </Show>
          </div>
        )}
      </Show>
      <div class="a-chart-axis">
        <span>{props.data[0]?.label}</span>
        <span>{props.data[props.data.length - 1]?.label}</span>
      </div>
    </div>
  )
}

export type RigValue = { mode: 'off' | 'win' | 'lose'; chance: number; games: string[]; minutes: string; limit: string }

export const RigForm = (props: {
  games: { id: string; label: string }[]
  initial?: { mode?: string; chance?: number; games?: string[] }
  onSave: (v: RigValue) => void
}) => {
  const [v, set] = createStore<RigValue>({
    mode: (props.initial?.mode as RigValue['mode']) ?? 'off',
    chance: props.initial?.chance ?? 100,
    games: props.initial?.games ?? props.games.map((g) => g.id),
    minutes: '',
    limit: '',
  })
  const toggle = (id: string) => set('games', (list) => (list.includes(id) ? list.filter((g) => g !== id) : [...list, id]))
  return (
    <div class="a-rig">
      <div class="segments">
        <For each={['off', 'win', 'lose'] as const}>
          {(m) => (
            <button class="segment" classList={{ on: v.mode === m, win: m === 'win' && v.mode === m, lose: m === 'lose' && v.mode === m }} onClick={() => set('mode', m)}>
              {t(`admin.mode_${m}`)}
            </button>
          )}
        </For>
      </div>
      <Show when={v.mode !== 'off'}>
        <div class="a-field">
          <span class="field-label">{t('admin.chance')}</span>
          <div class="slider">
            <input type="range" min="5" max="100" step="5" value={v.chance} onInput={(e) => set('chance', Number(e.currentTarget.value))} />
            <span class="slider-value">{v.chance}%</span>
          </div>
        </div>
        <div class="a-field">
          <span class="field-label">{t('admin.games')}</span>
          <div class="a-chips">
            <For each={props.games}>
              {(g) => (
                <button class="a-chip" classList={{ on: v.games.includes(g.id) }} onClick={() => toggle(g.id)}>
                  {g.label}
                </button>
              )}
            </For>
          </div>
        </div>
        <div class="a-row">
          <label class="a-field">
            <span class="field-label">{t('admin.minutes')}</span>
            <input class="text" type="number" min="1" placeholder={t('admin.forever')} value={v.minutes} onInput={(e) => set('minutes', e.currentTarget.value)} />
          </label>
          <label class="a-field">
            <span class="field-label">{t(v.mode === 'win' ? 'admin.until_won' : 'admin.until_lost')}</span>
            <input class="text" type="number" min="1" placeholder={t('admin.no_limit')} value={v.limit} onInput={(e) => set('limit', e.currentTarget.value)} />
          </label>
        </div>
      </Show>
      <button class="btn primary" onClick={() => props.onSave({ ...v, games: [...v.games] })}>
        {t('admin.save')}
      </button>
    </div>
  )
}

export const signed = (n: number) => (n > 0 ? '+' : '') + number(n)

export const signedMoney = (n: number) => (n > 0 ? '+' : '') + money(n)
