import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const dir = join(root, 'locales')
const skip = new Set(['node_modules', 'dist', 'tools', '.git', 'locales'])

const read = (code) => JSON.parse(readFileSync(join(dir, `${code}.json`), 'utf8'))
const en = read('en')
const keys = Object.keys(en)
let problems = 0

const walk = (path, out = []) => {
  for (const name of readdirSync(path)) {
    if (skip.has(name)) continue
    const full = join(path, name)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(lua|ts|tsx)$/.test(name)) out.push(full)
  }
  return out
}

const used = new Set()
const prefixes = new Set()
for (const file of walk(root)) {
  const text = readFileSync(file, 'utf8')
  for (const match of text.matchAll(/\b(?:L|t)\(\s*['"]([\w.]+)['"]\s*([,)])/g)) used.add(match[1])
  for (const match of text.matchAll(/\b(?:L|t)\(\s*['"]([\w.]+)['"]\s*\.\./g)) prefixes.add(match[1])
  for (const match of text.matchAll(/\btr\(\s*'(\w+)'/g)) used.add('slots.ui.' + match[1])
  for (const match of text.matchAll(/'(slots\.ui\.\w+)'/g)) used.add(match[1])
}
for (const prefix of ['slots.sym.', 'slots.holmgang.', 'slots.vildmark.', 'slots.ubaten.', 'slots.fyllekak.', 'slots.farao.', 'slots.olympen.', 'slots.andjakt.', 'slots.ronin.', 'slots.gruvan.', 'slots.jarnnave.', 'slots.ui.on', 'slots.ui.off']) prefixes.add(prefix)

for (const key of used) {
  if (!(key in en)) {
    problems++
    console.log(`\x1b[31mused but missing in en.json: ${key}\x1b[0m`)
  }
}

for (const key of keys) {
  const dynamic = [...prefixes].some((prefix) => key.startsWith(prefix))
  if (!used.has(key) && !dynamic) console.log(`\x1b[33munused: ${key}\x1b[0m`)
}

for (const file of readdirSync(dir)) {
  const code = file.replace(/\.json$/, '')
  if (code === 'en') continue
  const strings = read(code)
  for (const key of keys) {
    if (!(key in strings)) {
      problems++
      console.log(`\x1b[31m${code}: missing ${key}\x1b[0m`)
    }
    const want = (en[key].match(/\{\w+\}/g) ?? []).sort().join()
    const have = ((strings[key] ?? '').match(/\{\w+\}/g) ?? []).sort().join()
    if (key in strings && want !== have) {
      problems++
      console.log(`\x1b[31m${code}: ${key} has placeholders ${have || 'none'}, expected ${want}\x1b[0m`)
    }
  }
  for (const key of Object.keys(strings)) {
    if (!(key in en)) console.log(`\x1b[33m${code}: extra key ${key}\x1b[0m`)
  }
}

console.log(problems ? `\x1b[31m${problems} locale problems\x1b[0m` : `\x1b[32mlocales ok (${keys.length} keys, ${readdirSync(dir).length} languages)\x1b[0m`)
process.exit(problems ? 1 : 0)
