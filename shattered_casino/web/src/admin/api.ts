import { createSignal } from 'solid-js'
import { isBrowser, post } from '../shared/nui'
import { t } from '../shared/i18n'
import { mock } from './mock'

export type Feed = { kind: 'rig' | 'bigwin' | 'audit'; text: string; time: number }
export type Session = { perms: string[]; games: { id: string; label: string }[]; rate: number; feed: Feed[] }

export const [toast, setToast] = createSignal<{ ok: boolean; text: string; out?: boolean } | null>(null)
export const [busy, setBusy] = createSignal(false)
export const [unsaved, setUnsaved] = createSignal(false)
let toastTimer = 0
let toastFade = 0

export const say = (ok: boolean, text: string) => {
  setToast({ ok, text })
  clearTimeout(toastTimer)
  clearTimeout(toastFade)
  toastFade = window.setTimeout(() => setToast((m) => m && { ...m, out: true }), 3300)
  toastTimer = window.setTimeout(() => setToast(null), 3500)
}

export const call = async <T = any>(name: string, ...args: unknown[]): Promise<T | undefined> => {
  if (isBrowser) return mock(name, args) as T
  const res = await post<{ data?: T; error?: string }>('admin', { call: name, args })
  const data = res?.data as any
  if (!res || res.error || (data && typeof data === 'object' && data.error)) {
    say(false, res?.error ?? data?.error ?? t('error.generic'))
    return undefined
  }
  return data as T
}

export const act = async (name: string, ok: string, ...args: unknown[]) => {
  if (busy()) return false
  setBusy(true)
  try {
    const res = await call(name, ...args)
    if (res === true) say(true, ok)
    else if (typeof res === 'string') say(false, res)
    return res === true
  } finally {
    setBusy(false)
  }
}

export const ago = (time: number) => {
  const s = Math.max(0, Math.floor(Date.now() / 1000 - time))
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export const pct = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : '–')

export const whole = (value: string) => value.trim() !== '' && Number.isInteger(Number(value)) && Number(value) >= 0
