export const fit = (max: number) => (el: HTMLElement) => {
  const run = () => {
    el.style.whiteSpace = 'nowrap'
    let size = parseFloat(getComputedStyle(el).fontSize)
    while (el.scrollWidth > max && size > 12) {
      size -= 1
      el.style.fontSize = `${size}px`
    }
  }
  requestAnimationFrame(() => document.fonts.ready.then(run))
}
