import { emit, isBrowser } from '../shared/nui'
import en from '../../../locales/en.json'

if (isBrowser) {
  document.body.style.background = 'linear-gradient(135deg, #2b2f3a, #12141a)'

  emit({ type: 'init', lang: 'en', locale: en, currency: { Symbol: '$', Position: 'before', Space: false, Thousands: ',' }, accent: '#d6b25e' })

  setTimeout(() => {
    emit({ type: 'notify', text: 'You bought 500 chips for $5,000', kind: 'success', title: 'Cashier', duration: 6000 })
    emit({ type: 'notify', text: "You don't have enough chips", kind: 'error', duration: 8000 })
    emit({ type: 'hints', id: 'bj', keys: [
      { key: 'E', label: 'Hit' },
      { key: 'Space', label: 'Stand' },
      { key: 'D', label: 'Double', active: true },
      { key: 'Backspace', label: 'Leave table' },
    ] })
    emit({ type: 'hud', action: 'reset', chips: 2500, start: 2500, bars: 24 })
    emit({ type: 'hud', action: 'update', chips: 3120, start: 2500, show: true, left: '1.6', bottom: '24' })
    for (const [delta, game] of [[200, 'Blackjack'], [-100, 'Blackjack'], [-50, 'Roulette'], [850, 'Valhalla'], [-400, 'Valhalla'], [120, 'Horse racing']] as [number, string][])
      emit({ type: 'hud', action: 'round', delta, game })
    if (location.search.includes('admin')) return
    if (location.search.includes('cashier')) {
      emit({ type: 'cashier:open', chips: 1250, money: 48200, account: 'cash', rate: 10, max: 100000 })
      return
    }
    emit({ type: 'prompt', options: ['Play Blackjack', 'Watch table'], selected: 1 })
    emit({ type: 'input', id: 1, spec: { title: 'Place a bet', fields: [
      { name: 'amount', type: 'amount', label: 'Amount', min: 25, max: 5000, default: 100 },
      { name: 'side', type: 'select', label: 'Side', options: [{ value: 'player', label: 'Player' }, { value: 'bank', label: 'Bank' }, { value: 'tie', label: 'Tie' }] },
      { name: 'volume', type: 'slider', label: 'Volume', min: 0, max: 100, step: 5, default: 40 },
      { name: 'auto', type: 'checkbox', label: 'Repeat last bet' },
    ] } })
  }, 300)
}
