const now = () => Math.floor(Date.now() / 1000)
const games = [
  ['blackjack', 'Blackjack'], ['roulette', 'Roulette'], ['baccarat', 'Baccarat'], ['track', 'Horse racing'], ['slots', 'Slots'],
]
const names = ['Lena Holm', 'Marcus Vale', 'Ivy Chen', 'Dario Ruiz', 'Sam Okafor', 'Noor Haddad']

const series = (days: number) =>
  Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000)
    const wagered = 180000 + Math.round(Math.sin(i * 1.3) * 60000 + i * 4000)
    const won = Math.round(wagered * (0.9 + Math.cos(i * 2.1) * 0.12))
    return { day: d.toISOString().slice(0, 10), wagered, won, rounds: Math.round(wagered / 90) }
  })

const rig = {
  global: null as any,
  players: names.slice(0, 4).map((name, i) => ({
    id: `char${i + 1}`, src: i + 1, name, chips: 1200 * (i + 1), inside: i < 3,
    rig: i === 1 ? { mode: 'lose', chance: 60, games: ['slots', 'roulette'], net: -2400, limit: 5000, text: 'Loss 60% (Roulette, Slots) · until 5,000 chips' } : undefined,
  })),
  pool: 482000, games: games.map(([id, label]) => ({ id, label })),
  prizes: ['50 chips', '1× gold_ring', '70 chips', '$1,000', '1× repair_kit', '250 chips', '150 chips', '1× diamond_ring', '$500', '4,000 chips', '100 chips', '1× diamond_necklace', 'Pegassi Zentorno'],
  feed: [{ id: 1, time: now() - 120, text: 'Slots: outcome steered (Marcus Vale (2) loss)' }],
  protection: { Bias: { Max: 0.3, Curve: 2 }, HighRoller: { Loss: 5000, Chance: 0.25 } },
}

export const mock = (name: string, args: unknown[]): unknown => {
  switch (name) {
    case 'open':
      return { perms: ['view', 'rig', 'economy', 'settings'], games: rig.games, rate: 10, feed: [
        { kind: 'bigwin', text: 'Ivy Chen won $64,200 on Slots · Valhalla', time: now() - 40 },
        { kind: 'rig', text: 'Slots: outcome steered (Marcus Vale (2) loss)', time: now() - 120 },
        { kind: 'audit', text: 'Console: economy.pool on -', time: now() - 600 },
      ] }
    case 'dashboard':
      return {
        pool: 4820000, cap: 50000000, maxBet: 7230, fund: 512000, carValue: 700000, car: 'Pegassi Zentorno', inside: 7,
        today: { wagered: 214500, won: 198100, rounds: 2381 }, week: { wagered: 1520000, won: 1391000, rounds: 16840 },
        month: { wagered: 6330000, won: 5880000, rounds: 70120 },
        seated: [['baccarat', 'Baccarat', 1, 8], ['blackjack', 'Blackjack', 3, 16], ['track', 'Horse racing', 1], ['poker', 'Poker', 2, 8], ['roulette', 'Roulette', 4, 16], ['slots', 'Slots', 6]]
          .map(([game, label, seated, seats]) => ({ game, label, seated, seats })),
        bigwins: [
          { name: 'Ivy Chen', label: 'Slots · Valhalla', bet: 500, payout: 64700, time: now() - 40 },
          { name: 'Dario Ruiz', label: 'Roulette', bet: 2000, payout: 72000, time: now() - 5400 },
        ],
      }
    case 'games': {
      const days = Number(args[0]) || 30
      return {
        days, series: series(days),
        list: [
          ['slots:holmgang', 'Slots · Valhalla', 2400000, 2330000, 31000], ['blackjack', 'Blackjack', 1600000, 1555000, 9100],
          ['roulette', 'Roulette', 1200000, 1131000, 6400], ['slots:farao', 'Slots · Pharaoh', 520000, 515000, 7300],
          ['track', 'Horse racing', 310000, 287000, 2100], ['baccarat', 'Baccarat', 280000, 272000, 1500], ['poker', 'Poker', 90000, 88000, 420],
        ].map(([game, label, wagered, won, rounds]) => ({ game, label, wagered, won, rounds, biggest: 64200 })),
      }
    }
    case 'players':
      return {
        online: rig.players,
        results: names.map((name, i) => ({ identifier: `char${i + 1}`, name, wagered: 400000 - i * 50000, won: 420000 - i * 70000, rounds: 900 - i * 100, biggest_win: 60000 - i * 8000, banned: i === 5 ? 1 : 0, last_seen: now() - i * 7200 })),
      }
    case 'player':
      return {
        id: args[0], name: 'Marcus Vale', src: 2, chips: 2400, wagered: 350000, won: 310000, rounds: 820, biggest: 52000, banned: false, wheel: now() - 3600, seen: now(),
        rig: rig.players[1].rig, prizes: rig.prizes,
        history: Array.from({ length: 12 }, (_, i) => ({ label: i % 3 ? 'Blackjack' : 'Slots · Valhalla', bet: 200, payout: i % 4 === 0 ? 500 : i % 2 ? 0 : 200, time: now() - i * 300 })),
      }
    case 'rig':
      return rig
    case 'economy':
      return { pool: 482000, cap: 5000000, fund: 512000, rate: 10, maxBetPct: 0.015, income: 1240, incomeMode: 'turnover', protection: rig.protection }
    case 'settings':
      return {
        games: [['blackjack', 'Blackjack'], ['roulette', 'Roulette'], ['baccarat', 'Baccarat'], ['poker', 'Poker'], ['slots', 'Slots'], ['track', 'Horse racing'], ['wheel', 'Lucky wheel']].map(([id, label]) => ({ id, label, disabled: id === 'poker' })),
        tables: ['Blackjack 1', 'Blackjack 2', 'Roulette 1', 'Baccarat 1', 'Poker 1'].map((label, i) => ({ key: `t${i}`, label, min: 25, max: 5000, baseMin: 25, baseMax: 5000 })),
        cooldown: 86400, baseCooldown: 86400,
      }
    case 'audit':
      return {
        page: 1,
        rows: Array.from({ length: 8 }, (_, i) => ({ id: i, time: now() - i * 900, admin_name: 'Edvin (1)', action: ['rig.set', 'economy.pool', 'chips', 'settings'][i % 4], target: i % 2 ? 'char2' : '', data: '{"mode":"lose","chance":60}' })),
      }
    default:
      return true
  }
}
