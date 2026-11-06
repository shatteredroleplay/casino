// coin: the value of the cell is written on it
export type Sym = { id: string; pays?: number[]; wild?: boolean; scatter?: boolean; valued?: boolean; reels?: number[]; coin?: boolean }

export type Step = {
  grid: string[][]
  win: number
  total: number
  time: number
  // free spins
  free?: number
  of?: number
  last?: boolean
  trigger?: number
  extra?: number
  // the free spins the bonus wheel stopped on, or the ones the number of scatters gave
  bonus?: string
  mode?: string
  // lines
  // lines: the line of every win. ways: the symbol and in how many ways
  wins?: { line: number; symbol?: string; count: number; ways?: number; amount: number }[]
  duels?: { reel: number; mult: number }[]
  megas?: { reel: number; row: number; size: number; id: string }[]
  // the map: what the coins pay in the order they are found, and the tile that ends it, x or the free spins it starts
  explore?: { items: number[]; win: number; bonus: string; time: number }
  mult?: number
  // lines: the expanding symbol the book picked, and every one that expanded with the reels it filled and what it paid on all lines
  expand?: string
  expands?: { symbol: string; reels: number[]; amount: number }[]
  // what the scatters paid wherever they landed
  scatter?: number
  // tumble: the orbs on the board at the end, they multiply the win by step.mult
  orbs?: number[]
  // ways: a crate opened as the reels landed
  crate?: boolean
  // valhall: the valkyrie's respins, every respin: what landed and the respins left after it, and the wilds and multiplier she collected
  dead?: { rounds: { cells: { key: number; kind: string; value: number }[]; left: number }[]; wilds: number; mult: number }
  // andjakten: the multipliers on the board before the spin, after the shots (aim) and after every drop, the xways that turned
  // (by what, infectious ones spread), the extra shots that landed and the upgrades the free spins were dealt
  spots?: { key: number; value: number }[]
  aim?: { key: number; by: number }[]
  aimed?: { key: number; value: number }[]
  turned?: { key: number; value: number }[]
  xways?: { key: number; by: number; infected?: boolean }[]
  shots?: number
  upgrades?: string[]
  // the kind of free spins the lucky draw picked
  drawn?: string
  // spins added without the free spins intro (extra shots), a respin (vildmark)
  more?: number
  respin?: boolean
  // vildmark: the bear's multiplier, shown before the reels stop
  boost?: number
  // ronin: the reels once the stackways have opened, every reel as tall as what it holds
  after?: string[][]
  // gruvan: every reel dug, why, and the multiplier after it. deeper: the mine was as deep as it goes and the multiplier went up anyway
  digs?: { column: string[]; why: 'win' | 'blast'; mult: number }[]
  deeper?: boolean
  // ways: the symbol every crate opens into, the reels a submarine or the periscope turn wild from row `from` down, and the multiplier at the end
  reveal?: string
  nudges?: { reel: number; mult: number; id: string; from: number }[]
  x?: number
  // the multiplier kept between free spins. lines: the one the duels have built
  bank?: number
  // tyst jakt: the periscope's torpedo, fired from its row, and the multiplier after a hit
  attack?: { row: number; hit: boolean; mult?: number }
  // vargflocken: the torpedo wilds that loaded the tube, after so many collapses, and what their section holds now
  loads?: { reel: number; row: number; at: number; size: number }[]
  // vargflocken ended one section short of a launch
  nein?: boolean
  // wolf pack: what the torpedo holds before the spin, and every launch: after so many collapses, the cells it lands on and the multiplier after it
  tube?: number[]
  launches?: { at: number; cells: { reel: number; row: number; cell: string }[]; mult: number }[]
  // cluster: every collapse in turn, mark: the cells a cluster turns gold. ways: every round of mines going off
  drops?: {
    wins?: { symbol: string; count: number; amount: number; mult?: number; keys?: number[] }[]
    gone: number[][]
    fill: string[][]
    mult: number
    // ways: how many mines went off. spots: the bombs that did, the multipliers after the drop and the xways that turned in it
    bombs?: number | number[]
    spots?: { key: number; value: number }[]
    xways?: { key: number; by: number; infected?: boolean }[]
    mark?: number[]
  }[]
  // cluster: the gold cells from before the spin, what the rainbow finds in them, and whether they are gone after it
  gold?: number[]
  // base: a coin, or what a held pot holds, before the clovers. held: a pot from an earlier round. collect: the pot the coins of the round go to
  rainbow?: {
    // a clover: order is its turn among the clovers, hits the cells it multiplies in the order it reaches them
    items: { key: number; kind: 'coin' | 'clover' | 'pot'; base?: number; amount?: number; tier?: number; mult?: number; order?: number; hits?: number[]; held?: boolean }[]
    total: number
    time: number
    collect?: number
    // every new pot of the round in the order they collect
    collects?: number[]
  }[]
  clear?: boolean
  // cluster: a full screen of gold, what the rainbow over it pays times. tease: the first reel that takes its time, one scatter short of the free spins
  full?: number
  tease?: number
  // järnnäven: every fist that went up, from its row, with what it punched on the way and the multiplier of its reel.
  // drop: this spin is an epic drop. won: the teams that won one with it. teams: [victory points, level] after the spin
  fists?: { reel: number; row: number; team: 'red' | 'blue'; punches: { row: number; value: number }[]; mult?: number }[]
  drop?: { team: 'red' | 'blue'; fists: number }
  won?: ('red' | 'blue')[]
  teams?: { red: [number, number]; blue: [number, number] }
}

export type Game = { id: string; label: string; tag: string; rtp?: number; bonus?: string }

export type Message =
  | { type: 'seat'; seated: boolean; bet?: number; ante?: boolean }
  | { type: 'chips'; chips: number }
  | { type: 'volume'; volume: number }
  | { type: 'pick'; dx?: number; dy?: number; open?: boolean }
  | { type: 'buy'; index?: number; options?: { label: string; text: string; cost: number }[] }
  // the game menu: every game the machine can play, index is the one picked in it, none while it is closed
  | { type: 'games'; index?: number; options?: Game[] }
  | { type: 'spin'; steps: Step[]; payout: number; bet: number; cost: number; ante: boolean; time: number; volume: number }
  // a screen nobody is watching any more: hidden so it draws nothing until its next message
  | { type: 'sleep' }

type Config = {
  // any: the page the model shows for every game, under the screens of the machines near you
  id: 'holmgang' | 'vildmark' | 'fyllekak' | 'ubaten' | 'farao' | 'olympen' | 'andjakt' | 'ronin' | 'gruvan' | 'jarnnave' | 'any'
  view: 'screen' | 'plate'
  kind: 'lines' | 'cluster' | 'ways' | 'tumble' | 'spots' | 'stack' | 'infinity' | 'fist'
  label: string
  t?: Record<string, string>
  sep?: string
  tag: string
  reels: number
  rows: number
  lines?: number[][]
  symbols: Sym[]
  shape?: number[]
  bonus: { name: string; scatters: number; spins?: number; ante: number; buy: number }
  wheel?: { id: string; label: string; text: string; spins: number }[]
  modes?: { id: string; icon?: string; label: string; text: string; spins: number; torpedo?: { reels: number[]; wilds: number[]; first: number; max: number }; expand?: boolean; start?: number; depth?: number; level?: number }[]
  // ronin: how tall a reel gets. gruvan: how many reels the mine gets
  most?: number
  // andjakten: what the free spins can be dealt
  upgrades?: { id: string; label: string; text: string }[]
  max: number
  // the screen of someone else's machine is a smaller page, the game is drawn at this size in it
  scale?: number
  idle?: string
  // what the max win screen says
  maxLabel?: string
  time: Record<
    | 'First' | 'Gap' | 'FreeFirst' | 'FreeGap' | 'Rest' | 'Win' | 'Expand' | 'Tumble' | 'Attack' | 'Launch' | 'Reveal' | 'Clover' | 'Hit' | 'Pot' | 'Full' | 'Tease' | 'Pick' | 'Nudge'
    | 'Crate' | 'Orbs' | 'Book' | 'Respin' | 'Collect' | 'Stack' | 'Dig' | 'Aim' | 'Upgrade' | 'Draw' | 'Infect' | 'Bomb' | 'Fist' | 'Punch' | 'Drop' | 'Bonus' | 'Wheel' | 'Intro' | 'Outro',
    number
  >
}

// client/slots.lua puts the game from config.lua in the url
export const config: Config = JSON.parse(decodeURIComponent(location.hash.slice(1)))

const strings: Record<string, string> = config.t ?? {}

export const tr = (key: string, vars?: Record<string, string | number | undefined>) => {
  const text = strings[`slots.ui.${key}`] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : text
}

export const { reels, rows, time: T } = config

// the free spins run faster: every time is T.Bonus of what it is in the base game while one is on screen
const base = { ...T }
export const pace = (free: unknown) => {
  for (const k in base) if (k !== 'Bonus') T[k as keyof typeof T] = Math.round(base[k as keyof typeof T] * (free ? base.Bonus : 1))
}

export const title = config.label.toUpperCase()

// a cell is a symbol id, valued symbols carry their value as 'orb:25'
export const idOf = (cell: string) => cell.split(':')[0]
export const valueOf = (cell: string) => Number(cell.split(':')[1])

// an empty lua table can arrive as {} instead of []
export const list = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : [])

// tease: the first reel that takes its time, one scatter short of the free spins. it and every reel after it land Tease later each
export const teased = (reel: number, tease?: number) => (tease && reel + 1 >= tease ? (reel + 2 - tease) * T.Tease : 0)

export const stopAt = (reel: number, free?: unknown, tease?: number) => (free ? T.FreeFirst + reel * T.FreeGap : T.First + reel * T.Gap) + teased(reel, tease)

const filler = list(config.symbols).filter(s => s.pays && !s.scatter)

export const randomCell = () => filler[Math.floor(Math.random() * filler.length)].id

export const randomGrid = () => Array.from({ length: reels }, (_, r) => Array.from({ length: config.shape?.[r] ?? rows }, randomCell))

// what the bar under the board says about the win or the feature on screen right now
export type Note = { icon?: string; text: string }

// every symbol's name, for the bar under the board
export const nameOf = (id: string) => strings[`slots.sym.${id}`] ?? id


export const format = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, config.sep ?? ' ')
