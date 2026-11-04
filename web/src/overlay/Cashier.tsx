import { Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js'
import { onMessage, post } from '../shared/nui'
import { t } from '../shared/i18n'
import { chips as formatChips, money, number } from '../shared/format'
import { Icon } from '../shared/icons'

type Info = { ok?: boolean; message?: string; chips: number; money: number; account: string; rate: number; max: number }
type Tab = 'buy' | 'sell'

export const Cashier = () => {
  const [info, setInfo] = createSignal<Info | null>(null)
  const [tab, setTab] = createSignal<Tab>('buy')
  const [amount, setAmount] = createSignal<number | ''>('')
  const [busy, setBusy] = createSignal(false)
  const [result, setResult] = createSignal<{ ok: boolean; text: string } | null>(null)

  onMessage('cashier:open', (data: Info) => {
    setInfo(data)
    setTab('buy')
    setAmount('')
    setResult(null)
  })
  onMessage('cashier:close', () => setInfo(null))

  const limit = createMemo(() => {
    const i = info()
    if (!i) return 0
    return tab() === 'buy' ? Math.min(i.max, Math.floor(i.money / i.rate)) : Math.min(i.max, i.chips)
  })

  const value = () => (amount() === '' ? 0 : Math.floor(Number(amount())))

  const close = () => {
    setInfo(null)
    post('cashier', { action: 'close' })
  }

  const send = async (all = false) => {
    const i = info()
    if (!i || busy()) return
    if (!all && (value() < 1 || value() > limit())) {
      setResult({ ok: false, text: t('cashier.limit', { max: number(i.max) }) })
      return
    }
    setBusy(true)
    const res = await post<Info>('cashier', { action: tab(), amount: all ? 'all' : value() })
    setBusy(false)
    if (!res || typeof res !== 'object') return
    setInfo((current) => (current ? { ...current, ...res } : current))
    if (res.message) setResult({ ok: res.ok === true, text: res.message })
    if (res.ok) setAmount('')
  }

  const add = (n: number) => setAmount(Math.min(limit(), value() + n))

  const onKey = (event: KeyboardEvent) => {
    if (!info()) return
    if (event.key === 'Escape') close()
    if (event.key === 'Enter') send()
  }
  onMount(() => window.addEventListener('keydown', onKey))
  onCleanup(() => window.removeEventListener('keydown', onKey))

  return (
    <Show when={info()}>
      {(i) => (
        <div class="backdrop">
          <div class="dialog cashier panel">
            <div class="dialog-head">
              <div class="cashier-title">
                <Icon name="chip" class="cashier-logo" />
                <div>
                  <div>{t('cashier.title')}</div>
                  <div class="cashier-rate">{t('cashier.welcome', { price: money(i().rate) })}</div>
                </div>
              </div>
              <button class="dialog-close" onClick={close}>
                <Icon name="close" />
              </button>
            </div>

            <div class="dialog-body">
              <div class="balances">
                <div class="balance">
                  <span class="field-label">{t(i().account === 'bank' ? 'cashier.bank' : 'cashier.cash')}</span>
                  <span class="balance-value">{money(i().money)}</span>
                </div>
                <div class="balance">
                  <span class="field-label">{t('cashier.chips')}</span>
                  <span class="balance-value accent">{number(i().chips)}</span>
                </div>
              </div>

              <div class="segments">
                <button class="segment" classList={{ on: tab() === 'buy' }} onClick={() => (setTab('buy'), setResult(null))}>
                  {t('cashier.buy')}
                </button>
                <button class="segment" classList={{ on: tab() === 'sell' }} onClick={() => (setTab('sell'), setResult(null))}>
                  {t('cashier.sell')}
                </button>
              </div>

              <div class="amount">
                <div class="amount-input">
                  <Icon name="chip" class="amount-chip" />
                  <input
                    type="number"
                    autofocus
                    placeholder="0"
                    value={amount()}
                    min={1}
                    max={limit()}
                    onInput={(e) => setAmount(e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
                  />
                </div>
                <div class="amount-quick">
                  <button class="btn" onClick={() => add(100)}>+{number(100)}</button>
                  <button class="btn" onClick={() => add(1000)}>+{number(1000)}</button>
                  <button class="btn" onClick={() => add(10000)}>+{number(10000)}</button>
                  <button class="btn" onClick={() => setAmount(limit())}>
                    {t('input.max')}
                  </button>
                </div>
                <span class="field-hint">
                  {t(tab() === 'buy' ? 'cashier.you_pay' : 'cashier.you_get', { amount: money(value() * i().rate) })}
                </span>
              </div>

              <Show when={result()}>
                {(r) => <div class={r().ok ? 'dialog-success' : 'dialog-error'}>{r().text}</div>}
              </Show>
            </div>

            <div class="dialog-foot">
              <Show when={tab() === 'sell'}>
                <button class="btn" disabled={busy() || i().chips < 1} onClick={() => send(true)}>
                  {t('cashier.sell_all')}
                </button>
              </Show>
              <button class="btn primary" disabled={busy() || value() < 1} onClick={() => send()}>
                {t(tab() === 'buy' ? 'cashier.buy' : 'cashier.sell')} {value() > 0 ? formatChips(value()) : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </Show>
  )
}
