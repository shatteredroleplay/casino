import { createStore } from 'solid-js/store'

type Vars = Record<string, string | number>

const [state, setState] = createStore<{ lang: string; strings: Record<string, string> }>({ lang: 'en', strings: {} })

export const setLocale = (lang: string, strings: Record<string, string>) => setState({ lang, strings })

export const lang = () => state.lang

export const t = (key: string, vars?: Vars) => {
  const text = state.strings[key]
  if (!text) return key
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] !== undefined ? String(vars[name]) : match))
}
