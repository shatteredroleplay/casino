// every sound is made here with the Web Audio API, so there are no audio files to ship
// every game has sounds of its own that go with its theme
import { config } from './config'

const ctx = new AudioContext()
const master = ctx.createGain()
master.connect(ctx.destination)

// every sound plays into a room: dry, and a soft tail of reverb behind it so nothing sounds like it comes straight off a chip
const room = ctx.createGain()
const verb = ctx.createConvolver()
const wet = ctx.createGain()
verb.buffer = (() => {
  const length = Math.floor(ctx.sampleRate * 2.2)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) buffer.getChannelData(c).forEach((_, i, data) => (data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.5))
  return buffer
})()
wet.gain.value = 0.28
room.connect(master)
room.connect(verb).connect(wet).connect(master)

// the volume glides to a new level instead of jumping, it follows the player walking around
export const setVolume = (volume: number) => {
  master.gain.setTargetAtTime(volume, ctx.currentTime, 0.15)
  // a silent screen stops its audio, the reverb of every page costs even when nothing plays
  volume > 0 ? ctx.resume() : ctx.suspend()
}

// lp: a low pass filter that takes the edge off, attack: seconds to swell in instead of starting at full
type Wave = { type?: OscillatorType; to?: number; gain?: number; at?: number; lp?: number; attack?: number }

// one note: from `freq` sliding to `to`, fading out over `length` seconds
const tone = (freq: number, length: number, { type = 'sine', to = freq, gain = 0.2, at = 0, lp, attack }: Wave = {}) => {
  const start = ctx.currentTime + at
  const osc = ctx.createOscillator()
  const amp = ctx.createGain()
  osc.type = type
  // a few cents off every time, like a hand playing it
  osc.detune.value = (Math.random() - 0.5) * 10
  osc.frequency.setValueAtTime(freq, start)
  osc.frequency.exponentialRampToValueAtTime(to, start + length)
  if (attack) {
    amp.gain.setValueAtTime(0.001, start)
    amp.gain.exponentialRampToValueAtTime(gain, start + attack)
  } else amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.001, start + length)
  let out: AudioNode = osc.connect(amp)
  if (lp) {
    const filter = ctx.createBiquadFilter()
    filter.frequency.value = lp
    out = out.connect(filter)
  }
  out.connect(room)
  osc.start(start)
  osc.stop(start + length)
}

const hiss = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
hiss.getChannelData(0).forEach((_, i, data) => (data[i] = Math.random() * 2 - 1))

// a burst of noise around `freq`, sliding to `to`: bandpass for clicks and hits, lowpass for wind, water and blasts
const noise = (freq: number, length: number, gain: number, at = 0, { to = freq, type = 'bandpass' as BiquadFilterType, attack = 0 } = {}) => {
  const start = ctx.currentTime + at
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const amp = ctx.createGain()
  source.buffer = hiss
  source.loop = true
  filter.type = type
  filter.frequency.setValueAtTime(freq, start)
  filter.frequency.exponentialRampToValueAtTime(to, start + length)
  if (attack) {
    amp.gain.setValueAtTime(0.001, start)
    amp.gain.exponentialRampToValueAtTime(gain, start + attack)
  } else amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.001, start + length)
  source.connect(filter).connect(amp).connect(room)
  source.start(start)
  source.stop(start + length)
}

// a plucked string (karplus-strong): a burst of noise going round a delay as long as the note, losing a little every time round.
// dark: how soft the pluck is, 0 bright to 1 muffled. the strings are worked out once and kept
const strings = new Map<string, AudioBuffer>()
const string = (freq: number, length: number, dark: number) => {
  const key = `${freq}:${length}:${dark}`
  const kept = strings.get(key)
  if (kept) return kept
  const n = Math.floor(ctx.sampleRate * length)
  const p = Math.max(2, Math.round(ctx.sampleRate / freq))
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  const line = Float32Array.from({ length: p }, () => Math.random() * 2 - 1)
  for (let i = 1; i < p; i++) line[i] = line[i] * (1 - dark) + line[i - 1] * dark
  for (let i = 0; i < n; i++) {
    const j = i % p
    data[i] = line[j]
    line[j] = 0.497 * (line[j] + line[(j + 1) % p])
  }
  strings.set(key, buffer)
  return buffer
}
const pluck = (freq: number, at = 0, gain = 0.2, length = 1.2, dark = 0.5) => {
  const source = ctx.createBufferSource()
  const amp = ctx.createGain()
  source.buffer = string(Math.round(freq), length, dark)
  source.detune.value = (Math.random() - 0.5) * 8
  amp.gain.value = gain
  source.connect(amp).connect(room)
  source.start(ctx.currentTime + at)
}

// struck metal: partials that do not line up like a string's, the high ones dying first. a bell, a coin, a pick on rock, a hatch
const metal = (freq: number, length: number, at = 0, gain = 0.1) => {
  for (const [mult, level, decay] of [[1, 1, 1], [2.76, 0.5, 0.6], [5.4, 0.28, 0.35], [8.93, 0.14, 0.2]]) tone(freq * mult, length * decay, { gain: gain * level, at })
}

// a wooden knock: a short low thump with a click on it. a marimba bar when it has a pitch to ring at
const wood = (freq: number, at = 0, gain = 0.2, length = 0.12) => {
  tone(freq, length, { gain, at, to: freq * 0.98 })
  tone(freq * 4, length * 0.3, { gain: gain * 0.25, at })
  noise(freq * 6, 0.02, gain * 0.4, at)
}

const notes = (freqs: number[], gap: number, length: number, wave: Wave = {}) =>
  freqs.forEach((freq, i) => tone(freq, length, { ...wave, at: (wave.at ?? 0) + i * gap }))

// how many notes a win gets: more the more it is worth compared to the bet
const size = (times: number, scale: number[]) => scale.slice(0, times >= 20 ? scale.length : times >= 5 ? 5 : 3)

type Sfx = {
  spin: (ms: number) => void
  stop: () => void
  win: (times: number) => void
  pop: (n: number) => void
  duel: () => void
  wheel: () => void
  mult: () => void
  bonus: () => void
  fanfare: () => void
  bell: () => void
  // a scatter landing, the nth of the spin. tease: one short of the free spins with reels still to land
  scatter?: (n: number) => void
  tease?: () => void
  // järnnäven: a fist landing a punch, the nth on its way up
  punch?: (n: number) => void
}

// the max win: a deep rumble that swells for six seconds, with booms rolling through it and a low chord on top. the same on every game, it is the casino's
const bell = () => {
  noise(90, 6, 0.9, 0, { to: 220, type: 'lowpass', attack: 1.2 })
  tone(42, 6, { to: 36, type: 'sawtooth', gain: 0.18, lp: 120, attack: 1 })
  tone(55, 6, { gain: 0.35, attack: 0.8 })
  for (let t = 0.3; t < 5.2; t += 0.55 + Math.random() * 0.4) {
    tone(80, 0.9, { to: 32, gain: 0.5, at: t })
    noise(160, 0.7, 0.4, t, { to: 50, type: 'lowpass' })
  }
  for (const freq of [110, 165, 220, 277]) tone(freq, 4.5, { type: 'triangle', gain: 0.07, at: 1.2, attack: 1.5 })
}

// valhall: a war horn, deep frame drums, a lyre and swords ringing, all in d minor. kept sparse and clean
const D = [147, 175, 196, 220, 262, 294, 349, 392, 440, 587]
// a horn made of a cow's horn: a few soft partials, no buzz. the note scoops up into pitch, swells, gets a slow vibrato
// once it is held and dies away with a breath in it
const horn = (freq: number, length: number, at = 0, gain = 0.14) => {
  const start = ctx.currentTime + at
  const end = start + length
  const swell = Math.min(0.18, length / 3)
  const amp = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.frequency.setValueAtTime(freq * 2, start)
  filter.frequency.linearRampToValueAtTime(freq * 5, start + swell + 0.1)
  filter.frequency.linearRampToValueAtTime(freq * 3, end)
  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + swell)
  amp.gain.setValueAtTime(gain, Math.max(start + swell, end - 0.35))
  amp.gain.exponentialRampToValueAtTime(0.0001, end)
  filter.connect(amp).connect(room)
  const lfo = ctx.createOscillator()
  const depth = ctx.createGain()
  lfo.frequency.value = 4.5
  depth.gain.setValueAtTime(0, start)
  depth.gain.linearRampToValueAtTime(freq * 0.007, start + 0.6)
  lfo.connect(depth)
  for (const [mult, level, type] of [[1, 1, 'triangle'], [2, 0.4, 'sine'], [3, 0.18, 'sine'], [4, 0.08, 'sine']] as const) {
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq * mult * 0.94, start)
    osc.frequency.exponentialRampToValueAtTime(freq * mult, start + 0.12)
    depth.connect(osc.frequency)
    g.gain.value = level
    osc.connect(g).connect(filter)
    osc.start(start)
    osc.stop(end)
  }
  lfo.start(start)
  lfo.stop(end)
  noise(freq * 3, length, gain * 0.06, at, { attack: 0.12 })
}
// a deep frame drum: a round low thump and the skin
const drum = (at = 0, gain = 0.6) => {
  tone(95, 0.45, { to: 52, gain, at })
  noise(320, 0.12, gain * 0.35, at, { type: 'lowpass' })
}
// two blades meeting: a clean ring that hangs
const steel = (at = 0) => {
  metal(1180, 1.4, at, 0.06)
  metal(1530, 1.1, at + 0.01, 0.04)
  noise(5000, 0.06, 0.2, at)
}
const lyre = (freq: number, at = 0, gain = 0.3) => pluck(freq, at, gain, 1.6, 0.35)

const valhall: Sfx = {
  // a slow heartbeat on the drum while the reels go round
  spin: ms => {
    for (let t = 0; t < ms / 1000; t += 0.5) drum(t, 0.14)
  },
  stop: () => {
    drum(0, 0.3)
    wood(180, 0, 0.12, 0.08)
  },
  win: times => size(times, D.slice(3)).forEach((f, i) => lyre(f, i * 0.12)),
  pop: n => {
    drum(0, 0.35)
    lyre(D[Math.min(n, D.length - 1)] * 2, 0.02, 0.25)
  },
  // a duel: two blades meeting over the drum
  duel: () => {
    drum(0, 0.6)
    steel(0.05)
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) wood(420, t, 0.14, 0.05)
    drum(2.4, 0.5)
  },
  mult: () => {
    drum(0, 0.5)
    horn(220, 0.9, 0.1, 0.12)
  },
  // the free spins: the horn calls, calls again a fifth higher, and the drums answer
  bonus: () => {
    horn(110, 1.4, 0, 0.18)
    horn(165, 1.8, 1.3, 0.16)
    for (let t = 1.3; t < 3.1; t += 0.45) drum(t, 0.4)
  },
  fanfare: () => {
    for (const freq of [147, 220, 294]) horn(freq, 2.2, 0, 0.07)
    D.slice(3, 9).forEach((f, i) => lyre(f, 0.2 + i * 0.1, 0.22))
    drum(0, 0.5)
    drum(0.9, 0.5)
  },
  bell,
  scatter: n => {
    drum(0, 0.4)
    lyre(D[Math.min(n + 4, D.length - 1)], 0.03, 0.3)
  },
}

// vildmark: plucked wood and a harp in the forest, wind, and the northern lights shimmering in a minor pentatonic
const A = [440, 523, 587, 659, 784, 880, 1047, 1175, 1319]
const harpString = (freq: number, at = 0, gain = 0.2) => pluck(freq, at, gain * 1.4, 1.8, 0.3)
const shimmer = (at = 0, length = 1.6) => {
  for (let i = 0; i < 10; i++) tone(A[5 + (i % 4)] * 2, length - i * 0.08, { gain: 0.03, at: at + i * 0.08, attack: 0.2 })
}

const vildmark: Sfx = {
  spin: ms => noise(500, ms / 1000 + 0.3, 0.08, 0, { to: 1400, type: 'lowpass', attack: 0.3 }),
  // a wooden block
  stop: () => {
    tone(820, 0.07, { gain: 0.3, to: 700 })
    noise(1200, 0.05, 0.15)
  },
  win: times => size(times, A).forEach((f, i) => harpString(f, i * 0.09)),
  pop: n => harpString(A[Math.min(n, A.length - 1)], 0, 0.25),
  // the lynx: a low growl
  duel: () => {
    tone(80, 0.6, { type: 'sawtooth', to: 60, gain: 0.25, lp: 400 })
    noise(300, 0.5, 0.2, 0, { type: 'lowpass' })
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) wood(900, t, 0.16, 0.05)
  },
  mult: () => {
    shimmer(0, 1.2)
    notes([659, 880, 1319], 0.1, 0.6, { type: 'triangle', gain: 0.15, at: 0.2 })
  },
  // wind rises, the northern lights come out
  bonus: () => {
    noise(300, 2.4, 0.18, 0, { to: 1800, type: 'lowpass', attack: 0.8 })
    shimmer(0.3, 2)
    A.slice(0, 7).forEach((f, i) => harpString(f, 0.4 + i * 0.12, 0.16))
  },
  fanfare: () => {
    for (const [i, chord] of [[440, 523, 659], [392, 587, 784], [523, 659, 880], [440, 659, 880, 1319]].entries()) {
      for (const freq of chord) harpString(freq, i * 0.25, 0.1)
    }
    shimmer(0.8, 2)
  },
  bell,
}

// nattkäk: a cartoon at night, a marimba, rubbery boings, coins and a slide whistle in c major
const C = [523, 659, 784, 1047, 1319, 1568, 2093]
// a coin dropping into the till: two short soft notes, no ring after them
const coin = (at = 0, gain = 0.1) => {
  tone(988, 0.07, { type: 'triangle', gain: gain * 1.4, at })
  tone(1319, 0.18, { type: 'triangle', gain: gain * 1.4, at: at + 0.07 })
}
const marimba = (freq: number, at = 0, gain = 0.2, length = 0.5) => wood(freq, at, gain, length)

const nattkak: Sfx = {
  // a shaker keeping time while the reels go round
  spin: ms => {
    for (let t = 0; t < ms / 1000; t += 0.11) noise(7000, 0.05, 0.035 + (Math.floor(t / 0.11) % 2) * 0.02, t, { type: 'highpass' })
  },
  // a column landing: a rubbery boing
  stop: () => {
    tone(180, 0.18, { to: 90, gain: 0.35 })
    tone(300, 0.15, { to: 520, type: 'triangle', gain: 0.08, at: 0.03 })
  },
  win: times => {
    size(times, C).forEach((f, i) => marimba(f, i * 0.07, 0.2))
    coin(size(times, C).length * 0.07)
  },
  // a gem popping like a bubble of soda, higher for every tumble in a row
  pop: n => {
    tone(400 * 1.12 ** n, 0.12, { to: 1400 * 1.12 ** n, gain: 0.25 })
    noise(3000 * 1.12 ** n, 0.04, 0.12, 0.04)
  },
  // a pot gulping the coins
  duel: () => {
    tone(260, 0.3, { to: 90, type: 'triangle', gain: 0.35 })
    for (let i = 0; i < 4; i++) coin(0.1 + i * 0.06, 0.05)
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) wood(1200, t, 0.12, 0.04)
  },
  // the rainbow and the clovers: a slide whistle up and a sparkle
  mult: () => {
    tone(400, 0.45, { to: 2000, gain: 0.18, attack: 0.05 })
    ;[1047, 1319, 1568].forEach((f, i) => marimba(f, 0.4 + i * 0.06, 0.14, 0.3))
  },
  bonus: () => {
    ;[523, 659, 784, 659, 784, 1047].forEach((f, i) => marimba(f, i * 0.1, 0.18, 0.35))
    ;[262, 330, 392, 330, 392, 523].forEach((f, i) => marimba(f, i * 0.1, 0.16, 0.4))
    for (let i = 0; i < 6; i++) coin(0.7 + i * 0.1, 0.06)
  },
  fanfare: () => {
    for (const [i, chord] of [[523, 659, 784], [587, 740, 880], [659, 831, 988], [784, 988, 1175, 1568]].entries()) {
      for (const freq of chord) marimba(freq, i * 0.18, 0.1, i === 3 ? 1.2 : 0.4)
    }
    for (let i = 0; i < 14; i++) coin(0.8 + i * 0.09, 0.05)
  },
  bell,
  // a camera flash going off, a step up the scale for every scatter
  scatter: n => {
    noise(6000, 0.12, 0.25)
    marimba(C[Math.min(n + 1, 6)], 0, 0.2)
    marimba(C[Math.min(n + 2, 6)] * 1.5, 0.07, 0.16)
  },
  // a drum roll that swells while the last reels take their time
  tease: () => {
    for (let t = 0; t < 2.4; t += 0.05) noise(300, 0.06, 0.05 + t * 0.08, t, { type: 'lowpass' })
    tone(200, 2.4, { to: 600, type: 'triangle', gain: 0.08, attack: 1.8 })
  },
}

// ubåten: sonar pings, steel hull, bubbles, depth charges and the dive klaxon
const sonar = (at = 0, gain = 0.2, freq = 1150) => {
  tone(freq, 1.2, { gain, at })
  tone(freq, 0.9, { gain: gain * 0.25, at: at + 0.35 })
}
const bubbles = (count: number, at = 0) => {
  for (let i = 0; i < count; i++) tone(300 + Math.random() * 500, 0.06, { to: 900 + Math.random() * 900, gain: 0.12, at: at + i * 0.04 + Math.random() * 0.02 })
}
const blast = (at = 0, gain = 0.7) => {
  tone(70, 1.1, { to: 30, gain, at })
  noise(800, 1.2, gain, at, { to: 60, type: 'lowpass' })
}

const ubaten: Sfx = {
  spin: ms => noise(150, ms / 1000 + 0.2, 0.15, 0, { type: 'lowpass', attack: 0.2 }),
  // a hatch slamming shut
  stop: () => {
    metal(140, 0.5, 0, 0.12)
    noise(450, 0.1, 0.3)
  },
  win: times => {
    sonar(0, 0.15, 880)
    size(times, [659, 784, 880, 1047, 1319, 1568, 1760]).forEach((f, i) => tone(f, 0.3, { type: 'triangle', gain: 0.12, at: 0.1 + i * 0.08 }))
  },
  pop: n => bubbles(4 + n * 2),
  // a mine or a torpedo going off
  duel: () => {
    noise(400, 0.4, 0.2, 0, { to: 3000 })
    blast(0.2)
    bubbles(10, 0.6)
  },
  wheel: () => {
    for (let t = 0, gap = 0.05; t < 2.4; t += gap, gap *= 1.13) metal(620, 0.12, t, 0.05)
  },
  mult: () => {
    sonar(0, 0.2)
    sonar(0.5, 0.15, 1400)
  },
  // dive, dive: the klaxon and the hull groaning
  bonus: () => {
    for (let i = 0; i < 3; i++) {
      tone(330, 0.32, { type: 'sawtooth', to: 440, gain: 0.14, at: i * 0.45, lp: 1500 })
    }
    tone(90, 1.8, { to: 55, type: 'sawtooth', gain: 0.12, at: 0.6, lp: 300, attack: 0.4 })
    sonar(1.6, 0.18)
  },
  fanfare: () => {
    for (const [i, chord] of [[196, 247, 294], [220, 277, 330], [247, 311, 370], [294, 370, 440, 587]].entries()) {
      for (const freq of chord) tone(freq, i === 3 ? 1.6 : 0.35, { type: 'sawtooth', gain: 0.05, at: i * 0.28, lp: 1200, attack: 0.05 })
    }
    sonar(1.0, 0.15, 1400)
    bubbles(14, 1.2)
  },
  bell,
}

// farao: an oud and a frame drum in the hijaz scale, sand pouring and the stone door of the tomb
const E = [330, 349, 415, 440, 494, 523, 587, 659, 698, 831, 880]
const oud = (freq: number, at = 0, gain = 0.16) => pluck(freq, at, gain * 1.6, 1, 0.55)
const frame = (at = 0, gain = 0.4) => {
  tone(140, 0.25, { to: 70, gain, at })
  noise(2500, 0.08, gain * 0.3, at)
}

const farao: Sfx = {
  spin: ms => noise(3000, ms / 1000 + 0.2, 0.05, 0, { to: 1200, attack: 0.2 }),
  stop: () => frame(0, 0.45),
  win: times => size(times, E).forEach((f, i) => oud(f, i * 0.09)),
  pop: n => oud(E[Math.min(n + 3, E.length - 1)], 0, 0.2),
  // a symbol growing over its reels: a gong and a rising run
  duel: () => {
    metal(98, 2.4, 0, 0.25)
    noise(400, 1.2, 0.2, 0, { type: 'lowpass' })
    E.slice(3, 9).forEach((f, i) => oud(f, 0.2 + i * 0.05, 0.08))
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) wood(700, t, 0.14, 0.05)
  },
  mult: () => {
    notes([880, 1047, 1319, 1760], 0.07, 0.6, { type: 'triangle', gain: 0.1 })
    noise(6000, 0.6, 0.08, 0, { attack: 0.1 })
  },
  // the stone door grinds open and the drums start
  bonus: () => {
    noise(120, 2.2, 0.45, 0, { to: 60, type: 'lowpass', attack: 0.3 })
    for (let i = 0; i < 6; i++) frame(0.6 + i * 0.22, 0.35)
    E.slice(0, 8).forEach((f, i) => oud(f, 0.8 + i * 0.1, 0.12))
  },
  fanfare: () => {
    for (const [i, chord] of [[330, 415, 494], [349, 440, 523], [415, 494, 659], [440, 523, 659, 880]].entries()) {
      for (const freq of chord) oud(freq, i * 0.22, 0.08)
      frame(i * 0.22, 0.3)
    }
    notes([1319, 1760], 0.1, 1, { type: 'triangle', gain: 0.06, at: 0.9 })
  },
  bell,
  scatter: n => {
    tone(98 * 1.12 ** n, 1.2, { type: 'triangle', gain: 0.25 })
    noise(5000, 0.3, 0.12)
  },
}

// olympen: a harp, a choir that swells and thunder rolling over the mountain
const G = [392, 440, 494, 587, 659, 784, 880, 988, 1175, 1319]
const harp = (freq: number, at = 0, gain = 0.15) => pluck(freq, at, gain * 1.5, 2, 0.25)
const choir = (freqs: number[], length: number, at = 0, gain = 0.05) => {
  for (const freq of freqs) {
    tone(freq, length, { type: 'sawtooth', gain, at, lp: 1100, attack: 0.4 })
    tone(freq * 1.006, length, { type: 'sawtooth', gain: gain * 0.7, at, lp: 900, attack: 0.5 })
  }
}
const thunder = (at = 0, gain = 0.7) => {
  noise(6000, 0.15, gain * 0.6, at)
  noise(300, 2, gain, at + 0.05, { to: 40, type: 'lowpass' })
  tone(55, 1.6, { to: 30, gain: gain * 0.5, at })
}

const olympen: Sfx = {
  spin: ms => noise(800, ms / 1000 + 0.2, 0.05, 0, { to: 2000, type: 'lowpass', attack: 0.2 }),
  stop: () => {
    tone(260, 0.12, { to: 180, gain: 0.25 })
    noise(1500, 0.05, 0.1)
  },
  win: times => size(times, G).forEach((f, i) => harp(f, i * 0.07)),
  // a tumble: crystals breaking, higher every time
  pop: n => {
    ;[1319, 1760, 2637].forEach((f, i) => metal(f * 1.06 ** n, 0.5, i * 0.03, 0.04))
    noise(7000, 0.15, 0.12)
  },
  duel: () => thunder(0, 0.6),
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) harp(G[Math.floor(t * 4) % G.length], t, 0.05)
  },
  // an orb: a crack of lightning and a bright chord
  mult: () => {
    noise(5000, 0.2, 0.3)
    tone(80, 0.6, { to: 40, gain: 0.3 })
    notes([784, 988, 1175, 1568], 0.03, 0.5, { type: 'triangle', gain: 0.08, at: 0.05 })
  },
  bonus: () => {
    thunder(0, 0.8)
    choir([196, 247, 294, 392], 2.6, 0.4)
    G.forEach((f, i) => harp(f, 0.6 + i * 0.08, 0.1))
  },
  fanfare: () => {
    choir([196, 294, 392, 494], 2.4, 0, 0.06)
    for (const [i, chord] of [[392, 494, 587], [440, 523, 659], [494, 587, 784], [587, 784, 988, 1175]].entries()) {
      for (const freq of chord) harp(freq, i * 0.24, 0.08)
    }
    thunder(1, 0.4)
  },
  bell,
  scatter: n => {
    thunder(0, 0.25)
    harp(G[Math.min(n + 3, G.length - 1)], 0.05, 0.2)
  },
}

// andjakten: the marsh at dawn, a hunting horn, shotguns, shells and tin cans. no strings
const B = [294, 370, 440, 494, 587, 740, 880, 988, 1175]
// the hunting horn: short open calls on the horn
const call = (freq: number, at = 0, gain = 0.12, length = 0.32) => horn(freq, length, at, gain)
const shot = (at = 0, gain = 0.6) => {
  noise(2400, 0.06, gain * 0.8, at)
  noise(900, 0.5, gain, at, { to: 120, type: 'lowpass' })
  tone(80, 0.35, { to: 38, gain: gain * 0.6, at })
}
// the pump of the shotgun racking a new shell
const pump = (at = 0) => {
  wood(900, at, 0.12, 0.04)
  wood(700, at + 0.12, 0.14, 0.05)
}
// a spent shell bouncing on the boards
const shell = (at = 0, gain = 0.05) => [0, 0.09, 0.15, 0.19].forEach((d, i) => metal(2200 + i * 90, 0.25, at + d, gain / (i + 1)))
const quack = (at = 0, gain = 0.14) => {
  // a duck call: a reedy nasal honk that drops
  for (let i = 0; i < 2; i++) {
    tone(520, 0.13, { type: 'sawtooth', to: 360, gain, at: at + i * 0.16, lp: 1200, attack: 0.015 })
    noise(1100, 0.12, gain * 0.5, at + i * 0.16, { to: 800 })
  }
}
const andjakt: Sfx = {
  // wind through the reeds
  spin: ms => noise(500, ms / 1000 + 0.3, 0.06, 0, { to: 900, type: 'lowpass', attack: 0.3 }),
  stop: () => {
    tone(120, 0.15, { to: 70, gain: 0.25 })
    noise(600, 0.08, 0.1, 0, { type: 'lowpass' })
  },
  win: times => size(times, B).forEach((f, i) => call(f, i * 0.13, 0.08)),
  // a tumble: a shot, the pump racks and the shell falls
  pop: n => {
    shot(0, 0.22 + Math.min(n, 4) * 0.03)
    pump(0.25)
    shell(0.45)
  },
  // a molotov going up
  duel: () => {
    noise(3000, 0.15, 0.3)
    noise(250, 1.4, 0.55, 0.05, { to: 60, type: 'lowpass', attack: 0.08 })
    noise(1800, 1, 0.08, 0.2, { to: 600, attack: 0.3 })
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) wood(600, t, 0.12, 0.04)
  },
  // a multiplier doubling: shells tinkling down
  mult: () => {
    shell(0, 0.07)
    call(B[5], 0.05, 0.07, 0.25)
  },
  // the hunt is on: the horn calls, the duck flies up, two shots
  bonus: () => {
    call(294, 0, 0.13, 0.3)
    call(370, 0.32, 0.13, 0.3)
    call(440, 0.64, 0.14, 0.9)
    quack(1.4, 0.12)
    shot(1.8, 0.6)
    shot(2.1, 0.6)
  },
  fanfare: () => {
    for (const [i, f] of [294, 370, 440, 587].entries()) call(f, i * 0.22, 0.1, i === 3 ? 1.4 : 0.3)
    shot(1.2, 0.5)
    shell(1.5, 0.07)
  },
  bell,
  scatter: n => {
    quack(0, 0.12)
    call(B[Math.min(n + 3, B.length - 1)], 0.1, 0.08, 0.3)
  },
}

// ronin: a koto in the japanese in-scale, taiko drums, a shakuhachi breathing and blades drawn
const K = [330, 349, 440, 494, 523, 659, 698, 880, 988]
const koto = (freq: number, at = 0, gain = 0.14) => pluck(freq, at, gain * 1.6, 1.6, 0.2)
const taiko = (at = 0, gain = 0.6) => {
  tone(70, 0.5, { to: 45, gain, at })
  noise(300, 0.2, gain * 0.4, at, { to: 80, type: 'lowpass' })
}
const flute = (freq: number, at = 0, length = 1) => {
  tone(freq, length, { gain: 0.07, at, attack: 0.15, lp: 2500 })
  noise(freq * 2, length, 0.03, at, { attack: 0.2 })
}
const blade = (at = 0) => noise(6000, 0.35, 0.18, at, { to: 2500 })
const ronin: Sfx = {
  spin: ms => noise(900, ms / 1000 + 0.2, 0.03, 0, { to: 1500, type: 'lowpass', attack: 0.2 }),
  stop: () => taiko(0, 0.25),
  win: times => size(times, K).forEach((f, i) => koto(f, i * 0.09)),
  pop: n => koto(K[Math.min(n + 2, K.length - 1)], 0, 0.16),
  // a stackways opening: a blade drawn and a big drum
  duel: () => {
    blade()
    taiko(0.1, 0.7)
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) koto(K[Math.floor(t * 5) % K.length], t, 0.05)
  },
  mult: () => {
    koto(880, 0, 0.12)
    koto(1319, 0.06, 0.1)
  },
  bonus: () => {
    taiko(0, 0.7)
    taiko(0.3, 0.7)
    taiko(0.5, 0.8)
    flute(659, 0.7, 1.4)
    K.forEach((f, i) => koto(f, 0.8 + i * 0.07, 0.08))
  },
  fanfare: () => {
    for (const [i, chord] of [[330, 440, 494], [349, 440, 523], [440, 523, 659], [494, 659, 880, 988]].entries()) {
      for (const freq of chord) koto(freq, i * 0.22, 0.07)
    }
    taiko(0.9, 0.6)
  },
  bell,
  scatter: n => {
    taiko(0, 0.35)
    koto(K[Math.min(n + 4, K.length - 1)], 0.05, 0.18)
  },
  tease: () => flute(494, 0, 1.6),
}

// gruvan: picks ringing on rock, the cart rumbling on the rails, dynamite and the glitter of gold
const M = [262, 294, 330, 392, 440, 523, 587, 659, 784]
const clink = (freq: number, at = 0, gain = 0.12) => {
  metal(freq * 4, 0.6, at, gain * 0.7)
  noise(4000, 0.05, gain * 0.6, at)
}
const rumble = (at = 0, length = 0.8, gain = 0.4) => noise(120, length, gain, at, { to: 60, type: 'lowpass', attack: 0.05 })
const dynamite = (at = 0) => {
  noise(800, 1.2, 0.8, at, { to: 60, type: 'lowpass' })
  tone(60, 0.8, { to: 30, gain: 0.5, at })
}
const gruvan: Sfx = {
  spin: ms => rumble(0, ms / 1000, 0.08),
  stop: () => {
    tone(140, 0.12, { to: 80, gain: 0.25 })
    noise(1500, 0.05, 0.1)
  },
  win: times => size(times, M).forEach((f, i) => clink(f, i * 0.08)),
  // a new reel dug open: the rock gives and the pick rings higher the deeper it goes
  pop: n => {
    rumble(0, 0.5, 0.3)
    clink(M[Math.min(n + 2, M.length - 1)], 0.15, 0.14)
  },
  duel: () => dynamite(),
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) clink(M[Math.floor(t * 6) % M.length], t, 0.05)
  },
  mult: () => {
    for (let i = 0; i < 5; i++) metal(1568 + i * 140, 0.4, i * 0.04, 0.03)
  },
  bonus: () => {
    dynamite()
    M.forEach((f, i) => clink(f, 0.6 + i * 0.07, 0.1))
  },
  fanfare: () => {
    for (const [i, chord] of [[262, 330, 392], [294, 370, 440], [330, 415, 494], [392, 494, 587, 784]].entries()) {
      for (const freq of chord) clink(freq / 2, i * 0.22, 0.06)
    }
    rumble(0.9, 1)
  },
  bell,
  scatter: n => clink(M[Math.min(n + 4, M.length - 1)], 0, 0.16),
}

// järnnäven: an arcade fighting game, square-wave synths in e minor, beeps and zaps, heavy hits
const F = [165, 196, 220, 247, 294, 330, 392, 440, 494, 587]
const chip = (freq: number, at = 0, gain = 0.07, length = 0.14) => tone(freq, length, { type: 'square', gain, at, lp: 3200 })
const hit = (at = 0, gain = 0.6) => {
  tone(120, 0.25, { to: 40, gain, at })
  noise(1800, 0.18, gain * 0.6, at, { to: 300 })
}
const zap = (at = 0) => tone(1800, 0.25, { type: 'sawtooth', to: 200, gain: 0.06, at, lp: 4000 })
const jarnnave: Sfx = {
  spin: ms => {
    for (let t = 0; t < ms / 1000; t += 0.12) chip(F[Math.floor(t * 8) % 4], t, 0.02, 0.06)
  },
  stop: () => {
    tone(90, 0.12, { to: 50, gain: 0.3 })
    noise(2500, 0.04, 0.08)
  },
  win: times => size(times, F).forEach((f, i) => chip(f * 2, i * 0.07)),
  // a fist landing on its reel, higher on every reel to the right
  pop: n => {
    hit(0, 0.35)
    chip(F[Math.min(n + 4, F.length - 1)], 0.04, 0.06)
  },
  // a fist going up: a charge that rises and a whoosh
  duel: () => {
    tone(220, 0.4, { type: 'square', to: 880, gain: 0.05, lp: 2500 })
    noise(1200, 0.35, 0.2, 0.05, { to: 5000 })
  },
  punch: n => {
    hit(0, 0.7)
    zap(0.02)
    chip(F[Math.min(n + 5, F.length - 1)] * 2, 0.05, 0.05)
  },
  wheel: () => {
    for (let t = 0, gap = 0.04; t < 2.4; t += gap, gap *= 1.13) chip(F[Math.floor(t * 6) % F.length] * 2, t, 0.03, 0.05)
  },
  mult: () => {
    chip(988, 0, 0.06)
    chip(1319, 0.07, 0.06)
    zap(0.12)
  },
  // ready... fight: two hits and a run up the scale
  bonus: () => {
    hit(0, 0.7)
    hit(0.35, 0.8)
    F.forEach((f, i) => chip(f * 2, 0.6 + i * 0.05, 0.05))
  },
  fanfare: () => {
    for (const [i, chord] of [[330, 392, 494], [294, 370, 440], [330, 415, 494], [392, 494, 587, 784]].entries()) {
      for (const freq of chord) chip(freq, i * 0.2, 0.04, 0.3)
    }
    hit(0.85, 0.6)
  },
  bell,
  scatter: n => {
    hit(0, 0.3)
    chip(F[Math.min(n + 5, F.length - 1)] * 2, 0.03, 0.08, 0.25)
  },
  tease: () => {
    for (let i = 0; i < 8; i++) chip(i % 2 ? 494 : 466, i * 0.12, 0.04, 0.1)
  },
}

export const sfx: Sfx = { holmgang: valhall, vildmark, fyllekak: nattkak, ubaten, farao, olympen, andjakt, ronin, gruvan, jarnnave, any: valhall }[config.id]
