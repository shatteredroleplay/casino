import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LuaFactory } from 'wasmoon'

const root = fileURLToPath(new URL('..', import.meta.url))
const skip = new Set(['node_modules', 'web', 'tools', '.git'])

const walk = (dir, out = []) => {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (name.endsWith('.lua')) out.push(path)
  }
  return out
}

const factory = new LuaFactory()
let failed = 0
const files = walk(root)

for (const file of files) {
  const lua = await factory.createEngine()
  lua.global.set('source', readFileSync(file, 'utf8'))
  lua.global.set('chunk', '=' + relative(root, file))
  const error = await lua.doString('local _, err = load(source, chunk) return err')
  lua.global.close()
  if (error) {
    failed++
    console.log(`\x1b[31m${error}\x1b[0m`)
  }
}

console.log(failed ? `\x1b[31m${failed} of ${files.length} Lua files failed\x1b[0m` : `\x1b[32m${files.length} Lua files compile\x1b[0m`)
process.exit(failed ? 1 : 0)
