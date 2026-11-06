Slots = {}

local Cfg = Config.Slots
local T = Cfg.Time

Slots.Key = function(pos)
    return ('%d:%d:%d'):format(math.floor(pos.x * 10 + 0.5), math.floor(pos.y * 10 + 0.5), math.floor(pos.z * 10 + 0.5))
end

Slots.Default = function(key)
    local n = 0
    for i = 1, #key do n = (n * 31 + key:byte(i)) % 1000003 end
    return Cfg.Order[n % #Cfg.Order + 1]
end

local pick = function(bag)
    return bag[math.random(#bag)]
end

local expand = function(pairs)
    local bag = {}
    for _, v in ipairs(pairs or {}) do
        for _ = 1, v[2] do bag[#bag + 1] = v[1] end
    end
    return bag
end

for _, g in pairs(Cfg.Games) do
    g.reels = g.reels or #g.lines[1]
    g.byId, g.byMode, g.bags, g.paying, g.megas = {}, {}, { base = {}, free = {}, ante = {}, wheel = {} }, {}, {}
    g.bonuses = {}
    for _, m in ipairs(g.modes or {}) do
        g.byMode[m.id], g.bags[m.id] = m, {}
        if m.symbol then g.bonuses[m.symbol] = true end
        m.values = m.values and expand(m.values)
        m.on = {}
        for id, list in pairs(m.reels or {}) do
            m.on[id] = {}
            for _, r in ipairs(list) do m.on[id][r] = true end
        end
    end
    for _, s in ipairs(g.symbols) do
        g.byId[s.id] = s
        if s.wild then g.wild = g.wild or s end
        if s.scatter then g.scatter, g.bonuses[s.id] = s, true end
        if s.pays and not s.wild then
            table.insert(g.paying, s.id)
            for _ = 1, s.weight do table.insert(g.megas, s.id) end
        end
        for bag, ids in pairs(g.bags) do
            for _ = 1, bag ~= 'wheel' and (s[bag] or s.weight) or 0 do table.insert(ids, s.id) end
        end
        if s.reels then
            s.on = {}
            for _, r in ipairs(s.reels) do s.on[r] = true end
        end
        s.values = s.values and expand(s.values)
    end
    for _, b in ipairs(g.wheel or {}) do
        for _ = 1, b.weight do table.insert(g.bags.wheel, b) end
        b.mults = b.mults and expand(b.mults)
        if b.pick then b.pick.coins, b.pick.ends = expand(b.pick.coins), expand(b.pick.ends) end
    end
    g.values = expand(g.values)
    if g.spots then g.spots.values, g.spots.xways = expand(g.spots.values), expand(g.spots.xways) end
    if g.fist then g.fist.values, g.fist.rows = expand(g.fist.values), expand(g.fist.rows) end
    for _, m in ipairs(g.modes or {}) do
        if m.dead then m.dead.kinds = expand(m.dead.kinds) end
        m.draw = m.draw and expand(m.draw)
    end
    for name, list in pairs(g.gold or {}) do
        if type(list) == 'table' then g.gold[name] = expand(list) end
    end
    for _, m in ipairs(g.modes or {}) do
        if m.least then
            local coins = {}
            for _, v in ipairs(g.gold.coins) do
                if v >= m.least then coins[#coins + 1] = v end
            end
            g.gold[m.id] = coins
        end
    end
end

local idOf = function(cell)
    return cell:match('^[^:]+')
end

local valueOf = function(cell)
    return tonumber(cell:match(':(%d+)$'))
end

local symbol = function(g, bag, r, fill, column)
    local m, s, on, twice = g.byMode[bag]
    repeat
        s = g.byId[pick(g.bags[bag])]
        on = m and m.on[s.id] or s.on
        twice = false
        if g.bonuses[s.id] then
            for _, cell in ipairs(column or {}) do
                if cell:match('^[^:]+') == s.id then twice = true end
            end
        end
    until not (on and not on[r]) and not (fill and s.first) and not twice
    local values = s.values or s.valued and (m and m.values or g.values)
    return values and ('%s:%d'):format(s.id, pick(values)) or s.id
end

local roll = function(g, free, state)
    local bag = free and (state.mode or 'free') or state.bag
    local tall = g.byMode[bag] and g.byMode[bag].scope
    local grid = {}
    for r = 1, g.reels do
        grid[r] = {}
        for row = 1, tall and tall.reel == r and tall.rows or g.shape and g.shape[r] or g.rows do grid[r][row] = symbol(g, bag, r) end
    end

    local holds = function(column, id)
        for _, cell in ipairs(column) do
            if idOf(cell) == id then return true end
        end
    end
    for id in pairs(g.bonuses) do
        local on = g.byMode[bag] and g.byMode[bag].on[id] or g.byId[id] and g.byId[id].on
        for r, column in ipairs(grid) do
            local seen = false
            for row, cell in ipairs(column) do
                if idOf(cell) == id and seen then
                    local reels = {}
                    for x, other in ipairs(grid) do
                        if not (on and not on[x]) and not holds(other, id) then reels[#reels + 1] = other end
                    end
                    local other, rows = reels[math.random(math.max(#reels, 1))], {}
                    for y, c in ipairs(other or {}) do
                        if not g.bonuses[idOf(c)] and not (g.byId[idOf(c)] or {}).wild then rows[#rows + 1] = y end
                    end
                    if #rows > 0 then other[rows[math.random(#rows)]] = cell end
                    column[row] = symbol(g, bag, r, false, column)
                elseif idOf(cell) == id then
                    seen = true
                end
            end
        end
    end

    if state.buy and not free then
        local sc, reels, allowed = state.scatter or g.scatter, {}, {}
        for r = 1, g.reels do
            if not sc.on or sc.on[r] then reels[#reels + 1], allowed[#allowed + 1] = r, r end
        end
        for _ = 1, state.buy do
            local column, row
            if #reels > 0 then
                column = grid[table.remove(reels, math.random(#reels))]
                row = math.random(#column)
                for i, cell in ipairs(column) do
                    if idOf(cell) == sc.id then row = i end
                end
            else
                repeat
                    column = grid[allowed[math.random(#allowed)]]
                    row = math.random(#column)
                until idOf(column[row]) ~= sc.id
            end
            column[row] = sc.values and ('%s:%d'):format(sc.id, pick(sc.values)) or sc.id
        end
    end
    return grid, bag
end

local count = function(grid, id)
    local n, sum = 0, 0
    for _, column in ipairs(grid) do
        for _, cell in ipairs(column) do
            if idOf(cell) == id then
                n = n + 1
                sum = sum + (valueOf(cell) or 0)
            end
        end
    end
    return n, sum
end

local feature = function(g, grid, b, state, step)
    local m = b.mega
    for _ = 1, m and math.random(m.count or 1) or 0 do
        local size = m.size and math.random(m.size[1], m.size[2])
        local w, h = size or m.w, size or m.h
        local r, row, id = m.reel or math.random(g.reels - w + 1), math.random(g.rows - h + 1), m.id or pick(g.megas)
        for x = r, r + w - 1 do
            for y = row, row + h - 1 do grid[x][y] = id end
        end
        if size then
            step.megas = step.megas or {}
            table.insert(step.megas, { reel = r, row = row, size = size, id = id })
        end
    end
    if b.reels then
        for _ = 1, math.random(b.reels) do
            local r = math.random(g.reels)
            for row = 1, g.rows do grid[r][row] = g.wild.id end
        end
    end
    if b.dead then
        local cells = {}
        for r = 1, g.reels do
            for row = 1, g.rows do cells[#cells + 1] = { r, row } end
        end
        for _ = 1, state.hand.wilds do
            local c = table.remove(cells, math.random(#cells))
            grid[c[1]][c[2]] = g.wild.id
        end
    end
    local h = b.herd
    for _, r in ipairs(h and not state.herded and h.reels or {}) do
        local tall = math.random(g.rows)
        local from = math.random(g.rows - tall + 1)
        for row = from, from + tall - 1 do grid[r][row] = h.id end
    end
    for key, id in pairs(state.sticky) do grid[key // 10][key % 10] = id end
    local fresh = 0
    if b.wolves then
        for _, column in ipairs(grid) do
            for row, cell in ipairs(column) do
                if cell == 'wolf' then column[row], fresh = 'wolfwild', fresh + 1 end
            end
        end
        for _ = 1, state.wolfed and 0 or b.wolves do
            local r, row
            repeat r, row = math.random(g.reels), math.random(g.rows) until grid[r][row] ~= 'wolfwild'
            grid[r][row] = 'wolfwild'
        end
        state.wolfed = true
    end
    if b.owls and not state.owls then
        state.owls = {}
        while #state.owls < b.owls do
            local r, row, free = math.random(g.reels - 1), math.random(g.rows - 1), true
            for _, o in ipairs(state.owls) do
                if math.abs(o.reel - r) < 2 and math.abs(o.row - row) < 2 then free = false end
            end
            if free then table.insert(state.owls, { reel = r, row = row, size = 2, id = 'owl' }) end
        end
    end
    for _, o in ipairs(b.owls and state.owls or {}) do
        for x = o.reel, o.reel + 1 do
            for y = o.row, o.row + 1 do grid[x][y] = 'owl' end
        end
        step.megas = step.megas or {}
        table.insert(step.megas, o)
    end
    local keep = { [b.sticky and g.wild.id or ''] = true, wolfwild = b.wolves, [h and h.id or ''] = h }
    local cover, full = 0, true
    for r, column in ipairs(grid) do
        for row, cell in ipairs(column) do
            state.sticky[r * 10 + row] = keep[cell] and cell or nil
        end
    end
    if h then
        local block = false
        for _, r in ipairs(h.full) do
            for row = 1, g.rows do full = full and grid[r][row] == h.id end
        end
        for i, r in ipairs(h.reels) do
            for row = 1, g.rows do
                if grid[r][row] == h.id then cover = cover + 1 end
                local all = i <= #h.reels - 2 and row <= g.rows - 2
                for x = 0, 2 do
                    for y = 0, 2 do all = all and grid[h.reels[i + x]][row + y] == h.id end
                end
                block = block or all
            end
        end
        step.respin = (full or block) and cover > (state.cover or 0)
        state.cover, state.herded = cover, true
    end
    if fresh > 0 then step.respin = true end
end

local trigger = function(g, step, free, scatters, state, grid)
    if not free then
        for _, m in ipairs(g.modes) do
            if (m.symbol and count(grid, m.symbol) or scatters) >= m.scatters then step.mode, step.trigger = m.id, m.spins end
        end
    elseif scatters >= g.bonus.again then
        local extra = g.bonus.extra
        step.extra = g.bonus.each and scatters * g.bonus.each or extra == 'each' and scatters or type(extra) == 'table' and extra[math.min(scatters, #extra)] or extra
        for _, m in ipairs(g.modes) do
            if m.from == state.mode and scatters >= m.scatters then step.mode = m.id end
        end
    end
end

local valkyrie

local spread = function(g, bet, step, scatters)
    local pay = 0
    for _, p in ipairs(g.scatter.spread or {}) do
        if scatters >= p[1] then pay = p[2] end
    end
    if pay > 0 then
        step.scatter = math.floor(bet * pay + 0.5)
        step.win = step.win + step.scatter
    end
end

local fall = function(g, grid, bag, drop, gone)
    for r, column in ipairs(grid) do
        local kept = {}
        drop.gone[r], drop.fill[r] = {}, {}
        for row, cell in ipairs(column) do
            if gone(r, row, cell) then table.insert(drop.gone[r], row) else kept[#kept + 1] = cell end
        end
        local seen = { table.unpack(kept) }
        for i = 1, #column - #kept do
            drop.fill[r][i] = symbol(g, bag, r, true, seen)
            seen[#seen + 1] = drop.fill[r][i]
        end
        grid[r] = { table.unpack(drop.fill[r]) }
        for _, cell in ipairs(kept) do table.insert(grid[r], cell) end
    end
end

valkyrie = function(g, d)
    local taken, n, wilds, mult = {}, 0, 0, 1
    local out, left, size = { rounds = {} }, d.spins, g.reels * g.rows
    while left > 0 and n < size and (wilds < d.wilds or mult < d.mult) do
        local round = { cells = {}, acts = {} }
        for r = 1, g.reels do
            for row = 1, g.rows do
                local key = r * 10 + row
                if not taken[key] and math.random(1000) <= d.chance then
                    local kind = pick(d.kinds)
                    if kind == 'wild' and wilds < d.wilds then
                        wilds = wilds + 1
                    elseif kind == 'mult' and mult < d.mult then
                        mult = mult + 1
                    else
                        kind = nil
                    end
                    if kind then
                        taken[key], n = true, n + 1
                        table.insert(round.cells, { key = key, kind = kind, value = kind == 'mult' and 1 or 0 })
                    end
                end
            end
        end
        left = #round.cells > 0 and d.spins or left - 1
        round.left = left
        table.insert(out.rounds, round)
    end
    out.wilds, out.mult = wilds, mult
    return out
end

local Play = {}

Play.spots = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    local mode = free and g.byMode[state.mode]
    local sp, spots, up = g.spots, state.spots, state.up
    local step = { grid = {}, drops = {}, win = 0 }
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end

    local snapshot = function()
        local list = {}
        for key, v in pairs(spots) do list[#list + 1] = { key = key, value = v } end
        table.sort(list, function(a, b) return a.key < b.key end)
        return list
    end
    step.spots = snapshot()

    local times = function(key, by)
        spots[key] = math.min(sp.cap, (spots[key] or 1) * by)
    end
    local double = function(key, least)
        spots[key] = math.min(sp.cap, math.max(spots[key] and spots[key] * 2 or sp.first, least or 0))
    end

    local shots = mode and up.mults and not state.seeded and 5 or math.random(100) <= (mode and mode.random or sp.random) and math.random(sp.count) or 0
    if mode then state.seeded = true end
    for _ = 1, shots do
        local key, by = math.random(g.reels) * 10 + math.random(g.rows), pick(sp.values)
        double(key, by)
        step.aim = step.aim or {}
        table.insert(step.aim, { key = key, by = by })
    end
    if step.aim then step.aimed = snapshot() end

    local turn = function()
        local found = {}
        for r, column in ipairs(grid) do
            for row, cell in ipairs(column) do
                if cell == 'xways' then
                    step.reveal = step.reveal or pick(g.paying)
                    column[row] = step.reveal
                    local by = pick(sp.xways)
                    times(r * 10 + row, by)
                    found[#found + 1] = { key = r * 10 + row, by = by }
                end
            end
        end
        if #found == 0 then return end
        if up.xways then
            local turned = {}
            for _, f in ipairs(found) do turned[f.key] = true end
            for r, column in ipairs(grid) do
                for row, cell in ipairs(column) do
                    if cell == step.reveal and not turned[r * 10 + row] then
                        local by = pick(sp.xways)
                        times(r * 10 + row, by)
                        found[#found + 1] = { key = r * 10 + row, by = by, infected = true }
                    end
                end
            end
        end
        return found
    end
    step.xways = turn()
    if step.xways then step.turned = snapshot() end

    local stays = { [g.scatter.id] = true, shot = true }
    while true do
        local drop, gone = { wins = {}, gone = {}, fill = {} }, {}
        for _, id in ipairs(g.paying) do
            local keys, mult = {}, 0
            for r, column in ipairs(grid) do
                for row, cell in ipairs(column) do
                    if cell == id or cell == g.wild.id then
                        keys[#keys + 1] = r * 10 + row
                        mult = mult + (spots[r * 10 + row] or 0)
                    end
                end
            end
            if #keys >= g.least and count(grid, id) > 0 then
                local pays = g.byId[id].pays
                local amount = math.floor(bet * pays[math.min((#keys - g.least) // 2 + 1, #pays)] * math.max(mult, 1) + 0.5)
                step.win = step.win + amount
                table.insert(drop.wins, { symbol = id, count = #keys, amount = amount, mult = mult > 0 and mult or nil, keys = keys })
                for _, key in ipairs(keys) do gone[key] = true end
            end
        end
        if #drop.wins > 0 then
            for key in pairs(gone) do double(key) end
        else
            local bombs = {}
            for r, column in ipairs(grid) do
                for row, cell in ipairs(column) do
                    if cell == 'bomb' then
                        bombs[#bombs + 1] = r * 10 + row
                        for y, other in ipairs(column) do
                            local far = row - y
                            if (far >= 0 or up.bomb) and not stays[other] then
                                gone[r * 10 + y] = true
                                times(r * 10 + y, 1 << (math.abs(far) + 1))
                            end
                        end
                    end
                end
            end
            if #bombs == 0 then break end
            drop.bombs = bombs
        end
        fall(g, grid, bag, drop, function(r, row) return gone[r * 10 + row] end)
        drop.spots = snapshot()
        table.insert(step.drops, drop)
        drop.xways = turn()
        if drop.xways then drop.spots = snapshot() end
    end

    local scatters = count(grid, g.scatter.id)
    spread(g, bet, step, scatters)
    trigger(g, step, free, math.min(scatters, not free and state.buy or math.huge), state)
    local extra = free and count(grid, 'shot') or 0
    if extra > 0 then step.more, step.shots = extra * (up.shots and 2 or 1), extra end

    if step.mode and not free then
        local left = {}
        for _, u in ipairs(g.upgrades) do left[#left + 1] = u.id end
        local n = g.byMode[step.mode].upgrades
        step.upgrades = {}
        while n > 0 and #left > 0 do
            local id = table.remove(left, math.random(#left))
            table.insert(step.upgrades, id)
            up[id] = true
            n = n - 1 + (id == 'more' and 2 or 0)
            if id == 'spin' then step.trigger = step.trigger + 1 end
        end
    end
    return step
end

local stacks = { stack = true, reveal = true }

Play.stack = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    local step = { win = 0 }
    local plain = function(r)
        local cell
        repeat cell = symbol(g, bag, r) until g.byId[idOf(cell)].pays
        return cell
    end
    local any = false
    for r, column in ipairs(grid) do
        local seen = false
        for row, cell in ipairs(column) do
            if stacks[idOf(cell)] then
                if seen then column[row] = plain(r) end
                seen, any = true, true
            end
        end
    end

    local length = function(id)
        for r, column in ipairs(grid) do
            local found = false
            for _, cell in ipairs(column) do
                local c = idOf(cell)
                found = found or c == id or stacks[c]
            end
            if not found then return r - 1 end
        end
        return #grid
    end
    if any then
        local best, ids = 3, {}
        for _, id in ipairs(g.paying) do
            local n = length(id)
            if n > best then best, ids = n, {} end
            if n == best then ids[#ids + 1] = id end
        end
        step.reveal = #ids > 0 and pick(ids) or nil
        for r, column in ipairs(grid) do
            for row, cell in ipairs(column) do
                if stacks[idOf(cell)] and not step.reveal then column[row] = plain(r) end
            end
        end
    end
    step.grid = {}
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end

    for r, column in ipairs(grid) do
        for row, cell in ipairs(column) do
            if stacks[idOf(cell)] then
                local v = valueOf(cell)
                local keep, at = { table.unpack(column) }, row
                keep[at] = ('%s:%d'):format(step.reveal, v)
                while #keep - 1 + v > g.most do
                    if at - 1 > #keep - at then
                        table.remove(keep, 1)
                        at = at - 1
                    else
                        table.remove(keep)
                    end
                end
                grid[r] = keep
                break
            end
        end
    end
    if step.reveal then step.after = grid end

    step.wins = {}
    for _, id in ipairs(g.paying) do
        local ways, length = 1, 0
        for r, column in ipairs(grid) do
            local n = 0
            for _, cell in ipairs(column) do
                if idOf(cell) == id then n = n + (valueOf(cell) or 1) end
            end
            if n == 0 then break end
            ways, length = ways * n, r
        end
        local pay = g.byId[id].pays[length - 2]
        if pay then
            local amount = math.floor(bet * pay * ways + 0.5)
            step.win = step.win + amount
            table.insert(step.wins, { symbol = id, count = length, ways = ways, amount = amount })
        end
    end

    trigger(g, step, free, math.min(count(grid, g.scatter.id), not free and state.buy or math.huge), state)
    return step
end

Play.infinity = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    for r = #grid + 1, free and state.depth or 0 do
        grid[r] = {}
        for row = 1, g.rows do grid[r][row] = symbol(g, bag, r, false, grid[r]) end
    end
    local step = { grid = {}, digs = {}, win = 0 }
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end
    local mult = free and state.mult or 1
    if free then step.bank = mult end

    local evaluate = function()
        local wins, reach = {}, 0
        for _, id in ipairs(g.paying) do
            local ways, length = 1, 0
            for r, column in ipairs(grid) do
                local n = 0
                for _, cell in ipairs(column) do
                    if cell == id or cell == g.wild.id then n = n + 1 end
                end
                if n == 0 then break end
                ways, length = ways * n, r
            end
            local pay = g.byId[id].pays[length - 2]
            if pay then
                wins[#wins + 1] = { symbol = id, count = length, ways = ways, pay = pay * ways }
                reach = math.max(reach, length)
            end
        end
        return wins, reach
    end

    local blasts = count(grid, 'dynamite')
    while #grid < g.most do
        local _, reach = evaluate()
        local why = reach == #grid and 'win' or blasts > 0 and 'blast'
        if not why then break end
        if why == 'blast' then blasts = blasts - 1 end
        local r = #grid + 1
        grid[r] = {}
        for row = 1, g.rows do
            grid[r][row] = symbol(g, bag, r, false, grid[r])
            if grid[r][row] == 'dynamite' then blasts = blasts + 1 end
        end
        if free then mult = mult + 1 end
        table.insert(step.digs, { column = { table.unpack(grid[r]) }, why = why, mult = mult })
    end
    if free and #grid == g.most then
        local _, reach = evaluate()
        if reach == #grid or blasts > 0 then mult, step.deeper = mult + 1, true end
    end

    step.wins = {}
    for _, w in ipairs((evaluate())) do
        local amount = math.floor(bet * w.pay * mult + 0.5)
        step.win = step.win + amount
        table.insert(step.wins, { symbol = w.symbol, count = w.count, ways = w.ways, amount = amount })
    end
    step.x = mult
    if free then state.mult, state.depth = mult, #grid end

    trigger(g, step, free, math.min(count(grid, g.scatter.id), not free and state.buy or math.huge), state)
    if step.trigger then
        local m = g.byMode[step.mode]
        state.mult, state.depth = m.start or 1, m.depth or g.reels
    end
    return step
end

Play.fist = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    local f = g.fist
    local step = { win = 0, wins = {} }
    local plain = function(r)
        local cell
        repeat cell = symbol(g, bag, r) until g.byId[cell].pays and not g.byId[cell].wild
        return cell
    end

    local fists = {}
    for r, column in ipairs(grid) do
        for row, cell in ipairs(column) do
            if g.byId[cell].fist then
                if fists[r] then column[row] = plain(r) else fists[r] = { row = row, team = g.byId[cell].fist } end
            end
        end
        local fist = fists[r]
        if fist then
            local to = pick(f.rows)
            column[fist.row], column[to] = column[to], column[fist.row]
            fist.row = to
        end
    end

    local drop = free and table.remove(state.drops, 1)
    local least = drop and drop.fists or not free and state.fists
    if least then
        local reels, have = {}, 0
        for r = 1, g.reels do
            local fit = fists[r] and (not drop or fists[r].team == drop.team)
            if fit then have = have + 1 elseif not fists[r] then reels[#reels + 1] = r end
            if fists[r] and not fit then reels[#reels + 1] = r end
        end
        while have < least and #reels > 0 do
            local r = table.remove(reels, math.random(#reels))
            local team = drop and drop.team or pick({ 'red', 'blue' })
            if fists[r] then grid[r][fists[r].row] = plain(r) end
            fists[r] = { row = pick(f.rows), team = team }
            grid[r][fists[r].row] = team .. 'fist'
            have = have + 1
        end
        step.drop = drop
    end
    step.grid = {}
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end

    local on, mult = {}, {}
    local up = function(r, row) return on[r] and row <= fists[r].row end
    local evaluate = function(line)
        local run, n, wilds = nil, 0, 0
        for r = 1, g.reels do
            local s = up(r, line[r]) and g.wild or g.byId[grid[r][line[r]]]
            if s.wild then
                if not run then wilds = wilds + 1 end
            elseif not s.pays or (run and s ~= run) then
                break
            else
                run = s
            end
            n = n + 1
        end
        local best, most = 0, nil
        for s, length in pairs({ [g.wild] = wilds, [run or g.wild] = n }) do
            local pay = s.pays and s.pays[length - 2]
            if pay and pay > 0 then
                local m = 0
                for r = 1, length do
                    if up(r, line[r]) then m = m + (mult[r] or 0) end
                end
                pay = pay * math.max(m, 1)
                if pay > best then best, most = pay, length end
            end
        end
        return best, most
    end

    for r in pairs(fists) do on[r] = true end
    repeat
        local used, changed = {}, false
        for _, line in ipairs(g.lines) do
            local _, n = evaluate(line)
            for r = 1, n or 0 do
                if up(r, line[r]) then used[r] = true end
            end
        end
        for r in pairs(on) do
            if not used[r] then on[r], changed = nil, true end
        end
    until not changed

    local points = {}
    for r = 1, g.reels do
        if on[r] then
            local fist, punches = fists[r], {}
            for row = fist.row - 1, 1, -1 do
                local s = g.byId[grid[r][row]]
                if s.wild or (s.team and s.team ~= fist.team) then
                    local value = pick(f.values)
                    mult[r] = (mult[r] or 0) + value
                    punches[#punches + 1] = { row = row, value = value }
                end
            end
            points[fist.team] = (points[fist.team] or 0) + #punches
            step.fists = step.fists or {}
            table.insert(step.fists, { reel = r, row = fist.row, team = fist.team, punches = punches, mult = mult[r] })
        end
    end

    for i, line in ipairs(g.lines) do
        local best, n = evaluate(line)
        if n then
            local amount = math.floor(bet * best + 0.5)
            step.win = step.win + amount
            table.insert(step.wins, { line = i, count = n, amount = amount })
        end
    end

    trigger(g, step, free, math.min(count(grid, g.scatter.id), not free and state.buy or math.huge), state)
    if step.trigger then
        local level = g.byMode[step.mode].level
        state.teams, state.drops = { red = { points = 0, level = level }, blue = { points = 0, level = level } }, {}
    end

    if free then
        for _, team in ipairs({ 'red', 'blue' }) do
            local t = state.teams[team]
            t.points = t.points + (drop and 0 or points[team] or 0)
            if t.points >= f.points then
                table.insert(state.drops, { team = team, fists = t.level })
                step.won = step.won or {}
                table.insert(step.won, team)
                t.points, t.level = 0, math.min(t.level + 1, g.reels)
            end
        end
        step.teams = { red = { state.teams.red.points, state.teams.red.level }, blue = { state.teams.blue.points, state.teams.blue.level } }
        step.respin = #state.drops > 0 or nil
    end
    return step
end

Play.lines = function(g, bet, free, state)
    local grid = roll(g, free, state)
    local step = { grid = grid, wins = {}, win = 0 }
    local b = free and (state.bonus or g.byMode[state.mode])
    if b then feature(g, grid, b, state, step) end

    local mult = {}
    local evaluate = function(line, wild)
        local run, n, wilds = nil, 0, 0
        for r = 1, g.reels do
            local s = wild(r, line[r]) and g.wild or g.byId[idOf(grid[r][line[r]])]
            if s.wild then
                if not run then wilds = wilds + 1 end
            elseif not s.pays or (run and s ~= run) then
                break
            else
                run = s
            end
            n = n + 1
        end
        local best, count = 0, nil
        for s, length in pairs({ [g.wild] = wilds, [run or g.wild] = n }) do
            local pay = length == 2 and s.two or s.pays and s.pays[length - 2]
            if pay then
                local m = 0
                for r = 1, length do m = m + (mult[r] or 0) end
                pay = pay * math.max(m, 1)
                if pay > best then best, count = pay, length end
            end
        end
        return best, count
    end

    local vs = {}
    for r, column in ipairs(grid) do
        for row, cell in ipairs(column) do
            if g.byId[idOf(cell)].duel and not vs[r] then vs[r] = { row = row, mult = valueOf(cell) } end
        end
    end
    local on = function(r, row) return vs[r] and vs[r].row == row end
    for _, line in ipairs(g.lines) do
        local _, count = evaluate(line, on)
        for r = 1, count or 0 do
            if on(r, line[r]) and not mult[r] then mult[r] = vs[r].mult end
        end
    end
    for r = 1, g.reels do
        if mult[r] then
            step.duels = step.duels or {}
            table.insert(step.duels, { reel = r, mult = mult[r] })
        end
    end

    local boost = b and (b.mults and pick(b.mults) or b.dead and state.hand.mult) or 1
    if b and b.dead then step.bank = state.hand.mult end
    if b and b.mults then step.boost = boost end

    for i, line in ipairs(g.lines) do
        local best, count = evaluate(line, function(r) return mult[r] end)
        if count then
            local amount = math.floor(bet * best * boost + 0.5)
            step.win = step.win + amount
            table.insert(step.wins, { line = i, count = count, amount = amount })
        end
    end

    if boost > 1 and step.win > 0 then step.mult = boost end

    for _, id in ipairs(free and state.expand or {}) do
        local on = {}
        for r, column in ipairs(grid) do
            for _, cell in ipairs(column) do
                if cell == id then
                    on[#on + 1] = r
                    break
                end
            end
        end
        local pay = #on == 2 and g.byId[id].two or g.byId[id].pays[#on - 2]
        if pay then
            local amount = math.floor(bet * pay * #g.lines + 0.5)
            step.win = step.win + amount
            step.expands = step.expands or {}
            table.insert(step.expands, { symbol = id, reels = on, amount = amount })
        end
    end

    local scatters = count(grid, g.scatter.id)
    spread(g, bet, step, scatters)
    if g.modes then
        trigger(g, step, free, scatters, state, grid)
    else
        if not free and scatters >= g.bonus.scatters then step.trigger = g.bonus.spins or 0 end
        if free and scatters >= g.bonus.again then step.extra = g.bonus.extra end
    end

    local dm = not free and step.mode and g.byMode[step.mode].dead
    if dm then
        step.dead = valkyrie(g, dm)
        state.hand = { wilds = step.dead.wilds, mult = step.dead.mult }
    end

    if b and (b.owls or b.sure) and step.win == 0 then step.respin = true end

    local m = g.byMode[step.mode or state.mode]
    if m and m.expand and step.trigger then
        local taken, left = {}, {}
        for _, id in ipairs(state.expand) do taken[id] = true end
        for _, id in ipairs(g.paying) do
            if not taken[id] then left[#left + 1] = id end
        end
        if #left > 0 then
            step.expand = pick(left)
            table.insert(state.expand, step.expand)
        end
    end

    return step
end

Play.tumble = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    local step = { grid = {}, drops = {}, win = 0 }
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end

    while true do
        local drop, gone = { wins = {}, gone = {}, fill = {} }, {}
        for _, id in ipairs(g.paying) do
            local n = count(grid, id)
            if n >= g.least then
                local pays = g.byId[id].pays
                local amount = math.floor(bet * pays[math.min((n - g.least) // 2 + 1, #pays)] + 0.5)
                step.win = step.win + amount
                table.insert(drop.wins, { symbol = id, count = n, amount = amount })
                gone[id] = true
            end
        end
        if #drop.wins == 0 then break end
        fall(g, grid, bag, drop, function(_, _, cell) return gone[cell] end)
        table.insert(step.drops, drop)
    end

    local sum = 0
    for r, column in ipairs(grid) do
        for row, cell in ipairs(column) do
            if idOf(cell) == 'orb' then
                sum = sum + valueOf(cell)
                step.orbs = step.orbs or {}
                table.insert(step.orbs, r * 10 + row)
            end
        end
    end
    if step.win > 0 and sum > 0 then
        if free then state.orbs = state.orbs + sum end
        step.mult = free and state.orbs or sum
        step.win = step.win * step.mult
    end
    if free and state.orbs > 0 then step.bank = state.orbs end

    local scatters = count(grid, g.scatter.id)
    spread(g, bet, step, scatters)
    trigger(g, step, free, scatters, state)
    return step
end

local cluster = function(g, grid, r, row, seen)
    local id, cells, visited, stack = idOf(grid[r][row]), {}, {}, { { r, row } }
    while #stack > 0 do
        local x, y = table.unpack(table.remove(stack))
        local key, cell = x * 10 + y, grid[x] and grid[x][y]
        local other = cell and idOf(cell)
        if not visited[key] and (other == id or other == g.wild.id) then
            visited[key], seen[key] = true, seen[key] or other == id
            cells[#cells + 1] = key
            for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do stack[#stack + 1] = { x + d[1], y + d[2] } end
        end
    end
    return cells
end

local reading = function(a, b)
    return a.key % 10 * 10 + a.key // 10 < b.key % 10 * 10 + b.key // 10
end

Play.cluster = function(g, bet, free, state)
    local grid, bag = roll(g, free, state)
    local mode = free and g.byMode[state.mode]
    local due = state.left == 1 and not state.opened and next(state.gold)
    if mode and count(grid, 'rainbow') == 0 and (math.random(100) <= mode.rainbow or due) then grid[math.random(g.reels)][math.random(g.rows)] = 'rainbow' end

    local step = { grid = {}, gold = {}, drops = {}, win = 0 }
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end
    for key in pairs(state.gold) do table.insert(step.gold, key) end

    while true do
        local drop, gone, seen = { wins = {}, mark = {}, gone = {}, fill = {} }, {}, {}
        for r, column in ipairs(grid) do
            for row, cell in ipairs(column) do
                local s = g.byId[idOf(cell)]
                local cells = s.pays and not seen[r * 10 + row] and cluster(g, grid, r, row, seen) or {}
                if #cells >= 5 then
                    local amount = math.floor(bet * s.pays[math.min((#cells - 5) // 2 + 1, #s.pays)] + 0.5)
                    step.win = step.win + amount
                    table.insert(drop.wins, { symbol = s.id, count = #cells, amount = amount })
                    gone[s.id] = true
                    for _, key in ipairs(cells) do
                        gone[key], state.gold[key] = true, true
                        table.insert(drop.mark, key)
                    end
                end
            end
        end
        if #drop.wins == 0 then break end

        fall(g, grid, bag, drop, function(r, row, cell) return gone[r * 10 + row] or gone[idOf(cell)] end)
        table.insert(step.drops, drop)
    end

    if count(grid, 'rainbow') > 0 and next(state.gold) then
        local pots, total, fresh = {}, 0, nil
        local cells, full = 0, 1
        for _ in pairs(state.gold) do cells = cells + 1 end
        if cells == g.reels * g.rows then full, step.full = g.gold.full, g.gold.full end
        step.rainbow = {}
        repeat
            local items, at, coins = {}, {}, 0
            fresh = {}
            for key in pairs(state.gold) do
                local item = { key = key, kind = pots[key] and 'pot' or pick(g.gold.kinds), base = pots[key], amount = pots[key], held = pots[key] and true }
                if item.kind == 'coin' then
                    local value = pick(mode and g.gold[mode.id] or g.gold.coins)
                    item.base, item.tier = math.max(math.floor(bet * value + 0.5), 1), value >= 25 and 3 or value >= 5 and 2 or 1
                    item.amount = item.base
                elseif item.kind == 'clover' then
                    item.mult = pick(g.gold.clovers)
                elseif not item.held then
                    fresh[#fresh + 1] = item
                end
                items[#items + 1], at[key] = item, item
            end

            local clovers, time = {}, T.Reveal
            for _, item in ipairs(items) do
                if item.mult then clovers[#clovers + 1] = item end
            end
            table.sort(clovers, reading)
            for n, clover in ipairs(clovers) do
                clover.order, clover.hits = n, {}
                for _, step in ipairs({ -10, -9, 1, 11, 10, 9, -1, -11 }) do
                    local near = at[clover.key + step]
                    if near and not near.mult then
                        near.boost, near.boosted = (near.boost or 1) * clover.mult, true
                        if near.base then near.amount = near.base * near.boost end
                        if near.held then pots[near.key] = near.amount end
                        table.insert(clover.hits, near.key)
                    end
                end
                time = time + T.Clover + #clover.hits * T.Hit
            end
            for _, item in ipairs(items) do coins = coins + (item.tier and item.amount or 0) end

            local collects = {}
            table.sort(fresh, reading)
            for n, pot in ipairs(fresh) do
                local held = 0
                for _, amount in pairs(pots) do held = held + amount end
                pot.amount = (coins + held) * (pot.boost or 1)
                pots[pot.key], collects[n] = pot.amount, pot.key
            end
            time = time + math.max(#fresh - 1, 0) * T.Pot + (step.full and #step.rainbow == 0 and T.Full or 0)

            total = #fresh == 0 and coins or 0
            for _, amount in pairs(pots) do total = total + amount end
            table.insert(step.rainbow, { items = items, total = total * full, time = time, collect = collects[1], collects = collects })
        until #fresh == 0 or #step.rainbow == 4
        step.win, state.opened = step.win + total * full, free
        if not (mode and mode.keep) then state.gold, step.clear = {}, true end
    end

    trigger(g, step, free, math.min(count(grid, g.scatter.id), not free and state.buy or math.huge), state)
    return step
end

Play.ways = function(g, bet, free, state)
    local mode = free and g.byMode[state.mode]
    local grid, bag = roll(g, free, state)
    local step = { grid = {}, drops = {}, win = 0 }
    for r, column in ipairs(grid) do step.grid[r] = { table.unpack(column) } end
    local mult = free and state.mult or 1
    if free then step.bank = mult end
    if mode and mode.torpedo then step.tube = { table.unpack(state.tube) } end

    local wild = function(id)
        return id == g.wild.id or id == 'xwild' or id == 'scope' or id == 'twild'
    end
    local torpedo = mode and mode.torpedo
    if torpedo then
        step.tube = {}
        for i, r in ipairs(torpedo.reels) do step.tube[i] = state.tube[r] or 0 end
    end
    local bombed = count(grid, g.wild.id) > 0

    local frozen = {}
    for r, column in ipairs(grid) do
        for _, cell in ipairs(column) do
            if idOf(cell) == 'nudge' and not frozen[r] then frozen[r] = { mult = valueOf(cell), from = 1, id = 'nudge' } end
        end
    end

    local open = function()
        for r, column in ipairs(grid) do
            for row, cell in ipairs(column) do
                if idOf(cell) == 'xways' then
                    step.reveal = step.reveal or pick(g.paying)
                    step.crate = step.crate or #step.drops == 0
                    column[row] = ('%s:%d'):format(step.reveal, valueOf(cell))
                elseif cell == 'twild' and torpedo then
                    local had = state.tube[r] or 0
                    state.tube[r] = math.min(torpedo.max, had + (had == 0 and torpedo.first or 1) + (bombed and 1 or 0))
                    column[row] = 'twild:1'
                    step.crate = step.crate or #step.drops == 0
                    step.loads = step.loads or {}
                    table.insert(step.loads, { reel = r, row = row, at = #step.drops, size = state.tube[r] })
                end
            end
        end
        if not torpedo then return end
        local full = true
        for _, r in ipairs(torpedo.reels) do
            if (state.tube[r] or 0) == 0 then full = false end
        end
        if not full then return end
        step.reveal = step.reveal or pick(g.paying)
        local launch = { at = #step.drops, cells = {} }
        for _, r in ipairs(torpedo.reels) do
            local spots, wilds = {}, false
            for _, w in ipairs(torpedo.wilds) do wilds = wilds or w == r end
            for row, cell in ipairs(frozen[r] and {} or grid[r]) do
                if g.byId[idOf(cell)].pays and not valueOf(cell) then spots[#spots + 1] = row end
            end
            if #spots > 0 then
                local row = pick(spots)
                grid[r][row] = ('%s:%d'):format(wilds and 'xwild' or step.reveal, state.tube[r])
                table.insert(launch.cells, { reel = r, row = row, cell = grid[r][row] })
            end
            state.tube[r] = 0
        end
        mult = mult + 1
        launch.mult = mult
        step.launches = step.launches or {}
        table.insert(step.launches, launch)
    end
    open()

    local scope = mode and mode.scope
    for row, cell in ipairs(scope and grid[scope.reel] or {}) do
        if idOf(cell) == 'scope' then
            local aim = false
            for _, a in ipairs(grid[1]) do
                for _, b in ipairs(grid[2]) do
                    if g.byId[idOf(a)].pays and (idOf(a) == idOf(b) or wild(idOf(b))) then aim = true end
                end
            end
            if aim then
                step.attack = { row = row, hit = math.random(100) <= scope.hit }
                if step.attack.hit then
                    frozen[scope.reel] = { mult = #grid[scope.reel] - row + 1, from = 1, id = 'scope', row = row }
                    mult = mult + 1
                    step.attack.mult = mult
                end
            end
            break
        end
    end
    for r, f in pairs(frozen) do
        step.nudges = step.nudges or {}
        table.insert(step.nudges, { reel = r, mult = f.mult, from = f.from, id = f.id, row = f.row })
    end

    local evaluate = function()
        local wins, keep = {}, {}
        for r = 1, g.reels do keep[r] = {} end
        for _, id in ipairs(g.paying) do
            local ways, length, boost = 1, 0, 0
            for r = 1, g.reels do
                local n, f = 0, frozen[r]
                for row, cell in ipairs(grid[r]) do
                    local c = idOf(cell)
                    if f and row >= f.from then
                        n = n + 1
                    elseif c == id or wild(c) then
                        n = n + (valueOf(cell) or 1)
                    end
                end
                if n == 0 then break end
                ways, length, boost = ways * n, r, boost + (f and f.mult or 0)
            end
            local pay = g.byId[id].pays[length - 2]
            if pay then
                wins[#wins + 1] = { symbol = id, count = length, ways = ways, amount = math.floor(bet * pay * ways * math.max(boost, 1) * mult + 0.5) }
                for r = 1, length do
                    for row, cell in ipairs(grid[r]) do
                        if idOf(cell) == id then keep[r][row] = true end
                    end
                end
            end
        end
        return wins, keep
    end

    local mines = function()
        local n = 0
        for r, column in ipairs(grid) do
            for _, cell in ipairs(frozen[r] and {} or column) do
                if cell == g.wild.id then n = n + 1 end
            end
        end
        return n
    end
    local seen = 0
    while mines() > seen do
        local now = mines()
        mult = mult + now - seen
        local _, keep = evaluate()
        local drop = { gone = {}, fill = {}, bombs = now - seen, mult = mult }
        seen = now
        fall(g, grid, bag, drop, function(r, row, cell)
            local c = idOf(cell)
            return not (frozen[r] or keep[r][row] or wild(c) or c == g.scatter.id)
        end)
        table.insert(step.drops, drop)
        open()
    end

    step.wins, step.x = evaluate(), mult
    for _, w in ipairs(step.wins) do step.win = step.win + w.amount end

    trigger(g, step, free, math.min(count(grid, g.scatter.id), not free and state.buy or math.huge), state)
    if free or step.trigger then state.mult = mult end
    return step
end

local tease = function(g, grid)
    local ids, seen = { [g.scatter.id] = true }, {}
    for _, m in ipairs(g.modes or {}) do
        if m.symbol then ids[m.symbol] = true end
    end
    for r, column in ipairs(grid) do
        for _, cell in ipairs(column) do
            local id = idOf(cell)
            if ids[id] then seen[id] = (seen[id] or 0) + 1 end
        end
        for _, n in pairs(seen) do
            if n >= g.bonus.scatters - 1 and r < #grid then return r + 1 end
        end
    end
end

local timeOf = function(g, step)
    local t = (step.free and T.FreeFirst or T.First) + (g.reels - 1) * (step.free and T.FreeGap or T.Gap) + T.Rest
    if step.duels or step.nudges then t = t + T.Expand end
    local most = 0
    for _, n in ipairs(step.nudges or {}) do most = math.max(most, n.mult - 1) end
    t = t + most * T.Nudge
    if step.crate then t = t + T.Crate end
    if step.attack then t = t + T.Attack end
    if step.launches then t = t + #step.launches * T.Launch end
    if step.tease then t = t + (g.reels - step.tease + 1) * T.Tease end
    if step.drops then t = t + #step.drops * T.Tumble end
    if step.wins and #step.wins > 0 then t = t + T.Win end
    if step.mult then t = t + (step.orbs and T.Orbs or T.Win) end
    if step.expands then t = t + #step.expands * (T.Expand + T.Win) end
    if step.expand then t = t + T.Book end
    if step.dead then t = t + T.Intro + #step.dead.rounds * T.Respin + T.Collect end
    if step.xways then t = t + T.Crate end
    if step.after then t = t + T.Stack end
    if step.digs then t = t + #step.digs * T.Dig + math.max(#step.grid - g.reels, 0) * 60 end
    if step.deeper then t = t + T.Win end
    if step.aim then t = t + T.Aim end
    for _, f in ipairs(step.fists or {}) do t = t + T.Fist + #f.punches * T.Punch end
    if step.drop then t = t + T.Drop end
    if step.won then t = t + #step.won * T.Win end
    if step.upgrades then t = t + #step.upgrades * T.Upgrade + 1500 end
    if step.drawn then t = t + T.Draw end
    if step.more or step.respin then t = t + T.Win end
    for _, d in ipairs({ step, table.unpack(step.drops or {}) }) do
        for _, x in ipairs(d.xways or {}) do
            if x.infected then
                t = t + T.Infect
                break
            end
        end
        if type(d.bombs) == 'table' then t = t + T.Bomb end
    end
    for _, round in ipairs(step.rainbow or {}) do t = t + round.time end
    if step.bonus then t = t + T.Wheel end
    if step.explore then t = t + step.explore.time end
    if step.trigger or step.extra then t = t + T.Intro end
    if step.nein then t = t + T.Nein end
    if step.last then t = t + T.Outro end
    return step.free and math.floor(t * T.Bonus) or t
end

Slots.Cost = function(g, bet, mode, kind)
    return mode and math.ceil(bet * (kind and g.byMode[kind].buy or g.bonus[mode])) or bet
end

local explore = function(bet, p)
    local e = { items = {}, win = 0 }
    while #e.items < 19 and (#e.items < p.least or math.random(100) > p.stop) do
        local amount = math.floor(bet * pick(p.coins) + 0.5)
        e.win = e.win + amount
        e.items[#e.items + 1] = amount
    end
    e.bonus = pick(p.ends)
    e.time = (#e.items + 1) * T.Pick + 1500
    return e
end

Slots.Spin = function(g, bet, mode, kind)
    local play, cap = Play[g.kind], bet * Cfg.MaxWin
    local cost = Slots.Cost(g, bet, mode, kind)
    local draw = mode == 'buy' and kind and g.byMode[kind].draw
    if draw then kind = pick(draw) end
    local fists = mode == 'buy' and kind and g.byMode[kind].fists
    local state = { sticky = {}, gold = {}, mult = 1, tube = {}, expand = {}, orbs = 0, spots = {}, up = {}, fists = fists,
        scatter = mode == 'buy' and kind and g.byMode[kind].symbol and g.byId[g.byMode[kind].symbol], bag = fists and kind or mode == 'ante' and 'ante' or 'base', buy = mode == 'buy' and not fists and (kind and g.byMode[kind].scatters or g.bonus.scatters) }
    local steps, total = {}, 0

    local add = function(step)
        step.win = math.min(step.win, cap - total)
        total = total + step.win
        step.total = total
        steps[#steps + 1] = step
        return total < cap
    end

    local first = play(g, bet, false, state)
    first.tease = not state.buy and tease(g, first.grid) or nil
    first.drawn = draw and kind or nil
    if first.trigger and g.wheel then
        state.bonus = pick(g.bags.wheel)
        first.bonus, first.trigger = state.bonus.id, state.bonus.spins
        if state.bonus.pick then
            first.explore = explore(bet, state.bonus.pick)
            first.win = first.win + first.explore.win
            state.bonus = nil
            for _, b in ipairs(g.wheel) do
                if b.id == first.explore.bonus then state.bonus = b end
            end
            first.trigger = state.bonus and state.bonus.spins
        end
    end
    state.mode = first.mode
    local left = add(first) and first.trigger or 0
    local done = 0
    while left > 0 do
        state.left = left
        local step = play(g, bet, true, state)
        done, left = done + 1, left - 1 + (step.extra or 0) + (step.more or 0) + (step.respin and done < 50 and 1 or 0)
        state.mode = step.mode or state.mode
        step.free, step.of = done, done + left
        if not add(step) then break end
    end
    if done > 0 then steps[#steps].last = true end
    local wolf = g.byMode[state.mode]
    if done > 0 and wolf and wolf.torpedo then
        local loaded = 0
        for _, r in ipairs(wolf.torpedo.reels) do
            if (state.tube[r] or 0) > 0 then loaded = loaded + 1 end
        end
        steps[#steps].nein = loaded == #wolf.torpedo.reels - 1 or nil
    end

    local time = 0
    for _, step in ipairs(steps) do
        step.time = timeOf(g, step)
        time = time + step.time
    end

    return { steps = steps, payout = total, bet = bet, cost = cost, ante = mode == 'ante', time = time }
end
