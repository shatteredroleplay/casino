export const setAccent = (hex: string) => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return
  const value = parseInt(match[1], 16)
  const rgb = `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`
  const root = document.documentElement.style
  root.setProperty('--accent', `#${match[1]}`)
  root.setProperty('--accent-soft', `rgba(${rgb}, 0.18)`)
}
