Rig = {}

local Cfg = Config.Rig
local GLOBAL = 'global'
local FEED = Util.Event('rig:feed')
local Modes = { off = 0, win = 1, lose = -1 }

Rig.Games = { 'blackjack', 'roulette', 'baccarat', 'track', 'slots' }
local Valid = Util.Set(Rig.Games)

local Entries, Dirty, Watchers = {}, {}, {}
local Feed, FeedId = {}, 0

Rig.Prizes = function()
    return Config.Wheel and Config.Wheel.Prizes or {}
end

local prizeLabel = function(index)
    local prize = Rig.Prizes()[index]
    return prize and Wheel.Label(prize) or tostring(index)
end

local nameOf = function(id)
    if id == GLOBAL then return L('rig.everyone') end
    local src = Players.Source(id)
    return src and ('%s (%s)'):format(Players.Name(src), src) or id
end

local describe = function(e)
    if not e or e.mode == 'off' then return L('rig.off') end
    local games = {}
    for _, game in ipairs(Rig.Games) do
        if not e.games or e.games[game] then games[#games + 1] = L('game.' .. game) end
    end
    local text = L(e.mode == 'win' and 'rig.describe_win' or 'rig.describe_lose', { chance = e.chance, games = table.concat(games, ', ') })
    if e.limit then text = text .. ' · ' .. L('rig.describe_limit', { amount = Format.Chips(e.limit) }) end
    if e.expires then text = text .. ' · ' .. L('rig.describe_until', { time = os.date('%H:%M', e.expires) }) end
    return text
end

local gameList = function(set)
    if not set then return nil end
    local list = {}
    for _, game in ipairs(Rig.Games) do
        if set[game] then list[#list + 1] = game end
    end
    return list
end

local save = function(target)
    local e = Entries[target]
    if not e then
        MySQL.update('DELETE FROM `casino_rigs` WHERE `target` = ?', { target })
        return
    end
    local games = e.games and json.encode(gameList(e.games)) or ''
    MySQL.prepare([[INSERT INTO `casino_rigs` (`target`, `mode`, `chance`, `games`, `wheel_prize`, `net`, `until_net`, `expires_at`, `created_by`)
        VALUES (?, ?, ?, NULLIF(?, ''), NULLIF(?, 0), ?, NULLIF(?, 0), NULLIF(?, 0), ?)
        ON DUPLICATE KEY UPDATE `mode` = VALUES(`mode`), `chance` = VALUES(`chance`), `games` = VALUES(`games`), `wheel_prize` = VALUES(`wheel_prize`),
        `net` = VALUES(`net`), `until_net` = VALUES(`until_net`), `expires_at` = VALUES(`expires_at`), `created_by` = VALUES(`created_by`)]], {
        target, e.mode, e.chance, games, e.wheel or 0, e.net, e.limit or 0, e.expires or 0, e.by or '',
    })
end

Rig.Feed = function(game, text)
    if game then text = ('%s: %s'):format(L('game.' .. game), text) end
    FeedId = FeedId + 1
    local entry = { id = FeedId, time = os.time(), game = game, text = text }
    Feed[#Feed + 1] = entry
    if #Feed > Cfg.Feed then table.remove(Feed, 1) end
    for src in pairs(Watchers) do TriggerClientEvent(FEED, src, entry) end
    TriggerEvent(FEED, entry)
end

local retire = function(target, e, reason)
    e.mode, e.limit, e.expires = 'off', nil, nil
    if not e.wheel then Entries[target] = nil end
    Dirty[target] = nil
    save(target)
    Rig.Feed(nil, L(reason, { name = nameOf(target) }))
end

local active = function(target, e)
    if not e or e.mode == 'off' then return false end
    if e.expires and os.time() >= e.expires then
        retire(target, e, 'rig.ended_time')
        return false
    end
    if e.limit and ((e.mode == 'win' and e.net >= e.limit) or (e.mode == 'lose' and e.net <= -e.limit)) then
        retire(target, e, 'rig.ended_limit')
        return false
    end
    return true
end

local entryFor = function(id, game)
    local p = id and Entries[id]
    if active(id, p) and (not p.games or p.games[game]) then return p end
    local g = Entries[GLOBAL]
    if active(GLOBAL, g) and (not g.games or g.games[game]) then return g end
end

Rig.Want = function(id, game)
    local e = entryFor(id, game)
    if not e or math.random(100) > e.chance then return 0 end
    return Modes[e.mode]
end

Rig.Wants = function(game, ids)
    local wants
    for id in pairs(ids) do
        local want = Rig.Want(id, game)
        if want ~= 0 then
            wants = wants or {}
            wants[id] = want
        end
    end
    return wants
end

Rig.Pick = function(game, wants, first, roll, nets, valid)
    local score = function(candidate)
        if valid and not valid(candidate) then return -math.huge, false end
        local n, total, ok = nets(candidate), 0, true
        for id, want in pairs(wants) do
            local v = want * (n[id] or 0)
            total = total + v
            if v <= 0 then ok = false end
        end
        return total, ok
    end

    local best, top, done = first, score(first)
    for _ = 1, done and 0 or Cfg.Tries do
        local candidate = roll()
        local s, ok = score(candidate)
        if ok then
            best = candidate
            break
        end
        if s > top then best, top = candidate, s end
    end

    if best ~= first then
        local list = {}
        for id, want in pairs(wants) do list[#list + 1] = L(want > 0 and 'rig.feed_win' or 'rig.feed_lose', { name = nameOf(id) }) end
        Rig.Feed(game, L('rig.feed_steered', { who = table.concat(list, ', ') }))
    end
    return best
end

Rig.Shuffle = function(list)
    local copy = { table.unpack(list) }
    for i = #copy, 2, -1 do
        local j = math.random(i)
        copy[i], copy[j] = copy[j], copy[i]
    end
    return copy
end

local track = function(target, delta)
    local e = Entries[target]
    if not e or e.mode == 'off' then return end
    e.net = e.net + delta
    Dirty[target] = true
end

Rig.Track = function(id, bet, payout)
    if id then track(id, payout - bet) end
    track(GLOBAL, payout - bet)
end

Rig.WheelPrize = function(id)
    local e = id and Entries[id]
    if not e or not e.wheel then return nil end
    local index = e.wheel
    e.wheel = nil
    if e.mode == 'off' then Entries[id] = nil end
    save(id)
    Rig.Feed('wheel', L('rig.feed_wheel', { name = nameOf(id), prize = prizeLabel(index) }))
    return index
end

local known = function(id)
    if type(id) ~= 'string' or id == '' or id == GLOBAL then return nil end
    if Entries[id] or Players.Source(id) then return id end
end

Rig.Set = function(admin, target, mode, chance, games, options)
    if not Modes[mode] then return false end
    chance = Util.Integer(chance, 1, 100)
    if not chance then return false end
    options = type(options) == 'table' and options or {}

    local picked, count = {}, 0
    for _, game in ipairs(type(games) == 'table' and games or {}) do
        if Valid[game] and not picked[game] then
            picked[game] = true
            count = count + 1
        end
    end
    if count == 0 and mode ~= 'off' then return L('rig.pick_game') end

    local key = GLOBAL
    if target then
        key = known(target)
        if not key then return L('rig.player_gone') end
    end

    local e = Entries[key] or { mode = 'off', chance = 100, net = 0 }
    if e.mode == 'off' then e.net = 0 end
    local minutes, limit = Util.Integer(options.minutes, 1), Util.Integer(options.limit, 1)
    e.mode, e.chance, e.games = mode, chance, count < #Rig.Games and picked or nil
    e.expires = mode ~= 'off' and minutes and os.time() + minutes * 60 or nil
    e.limit = mode ~= 'off' and limit or nil
    e.by = admin.name
    Entries[key] = (mode ~= 'off' or e.wheel) and e or nil
    save(key)

    Audit.Record(admin, 'rig', 'rig.set', L('log.rig_title'), key, {
        { name = L('log.applies_to'), value = ('%s [%s]'):format(nameOf(key), key), inline = false },
        { name = L('log.mode'), value = describe(e), inline = false },
    }, { mode = mode, chance = chance, games = gameList(e.games), minutes = minutes, limit = limit })
    return true
end

Rig.SetWheel = function(admin, id, index)
    id, index = known(id), Util.Integer(index, 0, #Rig.Prizes())
    if not id then return L('rig.player_gone') end
    if not index then return false end

    local e = Entries[id] or { mode = 'off', chance = 100, net = 0 }
    e.wheel = index > 0 and index or nil
    Entries[id] = (e.mode ~= 'off' or e.wheel) and e or nil
    save(id)

    Audit.Record(admin, 'rig', 'rig.wheel', L('log.rig_title'), id, {
        { name = L('log.applies_to'), value = ('%s [%s]'):format(nameOf(id), id), inline = false },
        { name = L('log.next_prize'), value = e.wheel and prizeLabel(e.wheel) or L('rig.random'), inline = false },
    }, { prize = index })
    return true
end

Rig.Clear = function(admin)
    Entries, Dirty = {}, {}
    MySQL.update('DELETE FROM `casino_rigs`')
    Audit.Record(admin, 'rig', 'rig.clear', L('log.rig_title'), nil, {
        { name = L('log.mode'), value = L('rig.cleared'), inline = false },
    })
    return true
end

Rig.Watch = function(src, on)
    if on == nil then on = not Watchers[src] end
    Watchers[src] = on and true or nil
    return Watchers[src] == true
end

Rig.Watching = function(src)
    return Watchers[src] == true
end

local view = function(e)
    if not e then return nil end
    return { mode = e.mode, chance = e.chance, games = gameList(e.games), net = e.net, wheel = e.wheel, limit = e.limit, expires = e.expires, by = e.by, text = describe(e) }
end

Rig.State = function()
    local list, seen = {}, {}
    for _, p in ipairs(Players.Online()) do
        seen[p.id] = true
        local e = Entries[p.id]
        list[#list + 1] = {
            id = p.id,
            src = p.src,
            name = Players.Name(p.src),
            chips = Wallet.Get(p.src),
            inside = Player(p.src).state.casinoInside == true,
            rig = view(e),
        }
    end
    for id, e in pairs(Entries) do
        if id ~= GLOBAL and not seen[id] then list[#list + 1] = { id = id, rig = view(e) } end
    end
    table.sort(list, function(a, b) return (a.src or math.huge) < (b.src or math.huge) end)

    local prizes = {}
    for i in ipairs(Rig.Prizes()) do prizes[i] = prizeLabel(i) end
    local games = {}
    for i, game in ipairs(Rig.Games) do games[i] = { id = game, label = L('game.' .. game) } end

    return { global = view(Entries[GLOBAL]), players = list, pool = Pool.Balance(), games = games, prizes = prizes }
end

Rig.FeedSince = function(since)
    since = tonumber(since) or 0
    if since > FeedId then since = 0 end
    local list = {}
    for _, entry in ipairs(Feed) do
        if entry.id > since then list[#list + 1] = entry end
    end
    return list
end

CreateThread(function()
    Db.Await()
    for _, row in ipairs(MySQL.query.await('SELECT * FROM `casino_rigs`') or {}) do
        local games
        if row.games and row.games ~= '' then
            local ok, list = pcall(json.decode, row.games)
            if ok and type(list) == 'table' then games = Util.Set(list) end
        end
        Entries[row.target] = {
            mode = Modes[row.mode] and row.mode or 'off',
            chance = row.chance,
            games = games,
            net = row.net or 0,
            wheel = row.wheel_prize,
            limit = row.until_net,
            expires = row.expires_at,
            by = row.created_by,
        }
    end

    while true do
        Wait(Config.Stats.Flush * 1000)
        for target, e in pairs(Entries) do active(target, e) end
        for target in pairs(Dirty) do
            local e = Entries[target]
            if e then MySQL.update('UPDATE `casino_rigs` SET `net` = ? WHERE `target` = ?', { e.net, target }) end
        end
        Dirty = {}
    end
end)

AddEventHandler('playerDropped', function()
    Watchers[source] = nil
end)
