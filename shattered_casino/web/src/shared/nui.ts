type Message = { type: string; [key: string]: any }
type Handler = (data: any) => void

declare global {
  interface Window {
    invokeNative?: unknown
    GetParentResourceName?: () => string
  }
}

export const isBrowser = !window.invokeNative
const resource = window.GetParentResourceName ? window.GetParentResourceName() : 'shattered_casino'
const handlers = new Map<string, Set<Handler>>()

export const post = async <T = unknown>(name: string, data: unknown = {}): Promise<T | undefined> => {
  if (isBrowser) return undefined
  try {
    const res = await fetch(`https://${resource}/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(data),
    })
    return (await res.json()) as T
  } catch {
    return undefined
  }
}

export const onMessage = (type: string, handler: Handler) => {
  let set = handlers.get(type)
  if (!set) handlers.set(type, (set = new Set()))
  set.add(handler)
  return () => set!.delete(handler)
}

export const emit = (data: Message) => window.postMessage(data, '*')

window.addEventListener('message', (event: MessageEvent<Message>) => {
  const data = event.data
  if (!data || typeof data.type !== 'string') return
  handlers.get(data.type)?.forEach((handler) => handler(data))
})
