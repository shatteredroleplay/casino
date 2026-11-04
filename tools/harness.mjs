import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LuaFactory } from 'wasmoon'

export const root = fileURLToPath(new URL('..', import.meta.url))
const factory = new LuaFactory()
export const state = { failures: 0 }

const adapters = (side) => {
  const files = []
  for (const kind of ['framework', 'inventory']) {
    for (const name of readdirSync(join(root, 'bridge', kind))) {
      const file = join('bridge', kind, name, `${side}.lua`)
      if (existsSync(join(root, file))) files.push(file)
    }
  }
  const flat = side === 'server' ? ['vehiclekeys', 'society', 'logs'] : ['target', 'notify']
  for (const kind of flat) {
    for (const name of readdirSync(join(root, 'bridge', kind))) files.push(join('bridge', kind, name))
  }
  return files
}

export const boot = async ({ side, running = [], locale = 'en', config = '', extra = [] }) => {
  const lua = await factory.createEngine()
  lua.global.set('IS_SERVER', side === 'server')
  lua.global.set('RUNNING', running.join(','))
  lua.global.set('readFile', (path) => {
    const full = join(root, path)
    return existsSync(full) ? readFileSync(full, 'utf8') : ''
  })
  lua.global.set('decodeJson', (text) => JSON.stringify(JSON.parse(text)))
  await lua.doString(`
    printed = {}
    print = function(s) printed[#printed + 1] = s end
    vec2 = function(x, y) return { x = x, y = y } end
    vec3 = function(x, y, z) return { x = x, y = y, z = z } end
    vec4 = function(x, y, z, w) return { x = x, y = y, z = z, w = w, xyz = { x = x, y = y, z = z } } end
    GetCurrentResourceName = function() return 'casino' end
    IsDuplicityVersion = function() return IS_SERVER end
    GetResourceState = function(name)
      for r in RUNNING:gmatch('[^,]+') do if r == name then return 'started' end end
      return 'missing'
    end
    LoadResourceFile = function(_, path) local s = readFile(path) if s == '' then return nil end return s end
    local function parse(s)
      local pos = 1
      local function ws() pos = s:find('%S', pos) or #s + 1 end
      local value
      local function str()
        local out, i = {}, pos + 1
        while true do
          local c = s:sub(i, i)
          if c == '"' then pos = i + 1 return table.concat(out) end
          if c == '\\\\' then
            local n = s:sub(i + 1, i + 1)
            local map = { n = '\\n', t = '\\t', ['"'] = '"', ['\\\\'] = '\\\\', ['/'] = '/' }
            out[#out + 1] = map[n] or n
            i = i + 2
          else out[#out + 1] = c i = i + 1 end
        end
      end
      value = function()
        ws()
        local c = s:sub(pos, pos)
        if c == '{' then
          local t = {} pos = pos + 1 ws()
          if s:sub(pos, pos) == '}' then pos = pos + 1 return t end
          while true do
            ws() local k = str() ws() pos = pos + 1 t[k] = value() ws()
            local d = s:sub(pos, pos) pos = pos + 1
            if d == '}' then return t end
          end
        elseif c == '"' then return str()
        else
          local lit = s:match('^[%w%.%-]+', pos) pos = pos + #lit
          if lit == 'true' then return true elseif lit == 'false' then return false elseif lit == 'null' then return nil end
          return tonumber(lit)
        end
      end
      return value()
    end
    json = { decode = function(text) return parse(decodeJson(text)) end, encode = function() return '{}' end }
    local noop = function() end
    AddEventHandler, RegisterNetEvent, TriggerEvent, CreateThread, SetTimeout = noop, noop, noop, noop, noop
    exports = setmetatable({}, { __index = function() return setmetatable({}, { __index = function() return noop end }) end })
  `)
  const files = ['config/main.lua', 'config/economy.lua', 'config/locations.lua', 'shared/lib/util.lua', 'shared/lib/locale.lua', 'shared/lib/format.lua', 'bridge/init.lua', ...adapters(side), 'bridge/resolve.lua', ...extra]
  for (const file of files) {
    let source = readFileSync(join(root, file), 'utf8')
    if (file === 'config/main.lua') source += `\nConfig.Locale = '${locale}'\nConfig.Bridge = { Framework = 'auto', Inventory = 'auto', Target = 'auto', Notify = 'builtin', VehicleKeys = 'none', Society = 'none', Logs = 'none' }\n${config}`
    await lua.doString(source)
  }
  return lua
}

export const expect = async (name, lua, code, want) => {
  let got
  try {
    got = await lua.doString(code)
  } catch (e) {
    got = `error: ${String(e.message).split(/\r?\n/)[0]}`
  }
  const ok = got === want
  if (!ok) state.failures++
  console.log(`${ok ? '\x1b[32m✓' : '\x1b[31m✗'} ${name}${ok ? '' : ` — got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`}\x1b[0m`)
}

export const finish = (label) => {
  console.log(state.failures ? `[31m${state.failures} failed[0m` : `[32mall ${label} passed[0m`)
  process.exit(state.failures ? 1 : 0)
}
