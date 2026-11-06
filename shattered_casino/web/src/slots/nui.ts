// a tap on the machine's screen goes to client/slots.lua as a nui callback. the dev page answers it itself
const resource = (window as any).GetParentResourceName?.() ?? location.hostname.replace(/^cfx-nui-/, '')

export const act = (action: string, value?: unknown) => {
  const dev = (window as any).slotsAction
  if (dev) return dev(action, value)
  fetch(`https://${resource}/slots`, { method: 'POST', body: JSON.stringify({ action, value }) }).catch(() => {})
}
