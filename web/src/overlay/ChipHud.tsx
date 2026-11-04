import { For, Show, createSignal, onCleanup } from 'solid-js'
import { onMessage } from '../shared/nui'
import { t } from '../shared/i18n'
import { number } from '../shared/format'
import { Icon } from '../shared/icons'

type Bar = { delta: number; game: string; at: number; id: number }

const MERGE_MS = 1500

const compact = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (a >= 1e4) return `${(n / 1e3).toFixed(1)}k`
  return number(n)
}

export const ChipHud = () => {
  const [show, setShow] = createSignal(false)
  const [pos, setPos] = createSignal({ left: '1.5', bottom: '14' })
  const [chips, setChips] = createSignal(0)
  const [start, setStart] = createSignal(0)
  const [shown, setShown] = createSignal(0)
  const [flash, setFlash] = createSignal<'up' | 'down' | ''>('')
  const [bars, setBars] = createSignal<Bar[]>([])
  const [game, setGame] = createSignal('')
  let max = 24
  let frame = 0
  let flashTimer = 0
  let nextId = 0

  const animate = (to: number) => {
    const from = shown()
    if (from === to) return
    cancelAnimationFrame(frame)
    clearTimeout(flashTimer)
    setFlash(to > from ? 'up' : 'down')
    flashTimer = window.setTimeout(() => setFlash(''), 600)
    const began = performance.now()
    const duration = Math.min(600, 200 + Math.abs(to - from) / 50)
    const step = (now: number) => {
      const p = Math.min(1, (now - began) / duration)
      setShown(from + (to - from) * (1 - Math.pow(1 - p, 3)))
      if (p < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
  }

  onMessage('hud', (d) => {
    if (d.action === 'reset') {
      cancelAnimationFrame(frame)
      max = d.bars || 24
      setChips(d.chips)
      setStart(d.start)
      setShown(d.chips)
      setBars([])
      setGame('')
    } else if (d.action === 'update') {
      setShow(!!d.show)
      if (d.left !== undefined) setPos({ left: d.left, bottom: d.bottom })
      if (d.chips === undefined) return
      setStart(d.start)
      if (d.chips !== chips()) {
        setChips(d.chips)
        animate(d.chips)
      }
    } else if (d.action === 'round') {
      const delta = Number(d.delta) || 0
      const name = String(d.game || '')
      const now = Date.now()
      setBars((list) => {
        const last = list[list.length - 1]
        if (last && last.game === name && now - last.at < MERGE_MS) {
          return [...list.slice(0, -1), { ...last, delta: last.delta + delta, at: now }]
        }
        return [...list, { delta, game: name, at: now, id: ++nextId }].slice(-max)
      })
      setGame(name)
    }
  })

  onCleanup(() => cancelAnimationFrame(frame))

  const net = () => chips() - start()
  const top = () => Math.max(1, ...bars().map((b) => Math.abs(b.delta)))

  return (
    <div class="chiphud panel" classList={{ show: show() }} style={{ left: `${pos().left}%`, bottom: `calc(${pos().bottom}% + 1vh)` }}>
      <div class="chiphud-top">
        <span class="chiphud-tag">{t('common.casino')}</span>
        <span class="chiphud-start">
          {t('hud.start')}
          <b>{compact(start())}</b>
        </span>
        <span class="chiphud-game">{game()}</span>
      </div>
      <div class="chiphud-main">
        <Icon name="chip" class="chiphud-chip" />
        <span class="chiphud-count" classList={{ up: flash() === 'up', down: flash() === 'down' }}>
          {number(shown())}
        </span>
      </div>
      <div class="chiphud-bottom">
        <div class="chiphud-bars" classList={{ none: bars().length === 0 }}>
          <Show when={bars().length > 0} fallback={<span class="chiphud-empty">{t('hud.no_rounds')}</span>}>
            <For each={bars()}>
              {(b) => (
                <div class="chiphud-slot">
                  <div
                    class={`chiphud-bar ${b.delta > 0 ? 'win' : b.delta < 0 ? 'loss' : 'even'}`}
                    style={b.delta !== 0 ? { height: `${Math.max(6, Math.sqrt(Math.abs(b.delta) / top()) * 48)}%` } : undefined}
                  />
                </div>
              )}
            </For>
          </Show>
        </div>
        <div class="chiphud-net">
          <span>{t('hud.net')}</span>
          <b classList={{ pos: net() > 0, neg: net() < 0 }}>
            {net() > 0 ? '+' : ''}
            {number(net())}
          </b>
        </div>
      </div>
    </div>
  )
}
