import { createStore } from 'solid-js/store'
import { t } from './i18n'

export type Currency = { Symbol: string; Position: 'before' | 'after'; Space: boolean; Thousands: string }

const [currency, setCurrencyStore] = createStore<Currency>({ Symbol: '$', Position: 'before', Space: false, Thousands: ',' })

export const setCurrency = (value: Currency) => setCurrencyStore(value)

export const number = (value: number) => {
  const n = Math.round(Number(value) || 0)
  const grouped = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, currency.Thousands)
  return (n < 0 ? '-' : '') + grouped
}

export const money = (value: number) => {
  const text = number(value)
  const gap = currency.Space ? ' ' : ''
  if (currency.Position === 'after') return text + gap + currency.Symbol
  return text.startsWith('-') ? `-${currency.Symbol}${gap}${text.slice(1)}` : currency.Symbol + gap + text
}

export const chips = (value: number) => t('common.chips', { amount: number(value) })
