const HASH = (() => {
  try {
    return JSON.parse(decodeURIComponent(location.hash.slice(1)))
  } catch {
    return {}
  }
})()
const STRINGS = HASH.t || {}
const SEP = HASH.sep ?? ','
if (/^#[0-9a-f]{6}$/i.test(HASH.accent || '')) document.documentElement.style.setProperty('--gold', HASH.accent)

window.t = (key, vars) => {
  const text = STRINGS[key] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)) : text
}

window.fmt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+$)/g, SEP)

window.list = (v) => (Array.isArray(v) ? v : [])

window.board = (render) => {
  let deadline = null
  let total = 1
  let last = null

  const tick = () => {
    const left = Math.max(0, (deadline ?? 0) - Date.now()) / 1000
    document.querySelectorAll('.bar').forEach((bar) => {
      bar.style.visibility = deadline ? 'visible' : 'hidden'
      bar.classList.toggle('low', left <= 5)
      if (bar.firstChild) bar.firstChild.style.width = Math.min(100, (left / total) * 100) + '%'
    })
  }

  window.addEventListener('message', (e) => {
    const d = e.data
    if (!d || typeof d !== 'object') return
    deadline = d.timer != null ? Date.now() + d.timer * 1000 : null
    total = d.total || 1
    const sig = JSON.stringify(Object.assign({}, d, { timer: d.timer != null }))
    if (sig !== last) {
      last = sig
      render(d, deadline)
    }
    tick()
  })

  setInterval(tick, 250)
}
