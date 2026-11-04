local Cfg = Config.Wheel
local SEG = 360.0 / #Cfg.Prizes
local CLAIM_TIME = 20000
local SPIN = Util.Event('wheel:spin')
local Rate = Config.Chips.Rate

local state = { from = 0.0, to = 0.0, started = 0 }
local owner, ownerUntil, spinning = nil, 0, false

local total, carIndex = 0, nil
for i, p in ipairs(Cfg.Prizes) do
    total = total + p.weight
    if p.type == 'car' then carIndex = i end
end

local carChance = function()
    local c, fund = Cfg.Car, Pool.Fund()
    if fund < c.Value then return 0 end
    local t = math.min(1, (fund - c.Value) / (c.Value * c.Chance.Ramp))
    return c.Chance.Min + (c.Chance.Max - c.Chance.Min) * t
end

local roll = function()
    if carIndex and math.random() < carChance() then return carIndex end
    local r = math.random() * total
    for i, p in ipairs(Cfg.Prizes) do
        if p.weight > 0 then
            r = r - p.weight
            if r <= 0 then return i end
        end
    end
    return 1
end

local Give = {
    chips = function(src, p)
        Pool.Add(-p.amount)
        Pool.Feed(-p.amount * Rate)
        return Wallet.Add(src, p.amount)
    end,
    money = function(src, p)
        Pool.Feed(-p.amount)
        return Bridge.Framework.AddMoney(src, 'cash', p.amount, 'casino-wheel') == true
    end,
    item = function(src, p)
        return Bridge.Inventory.Add(src, p.name, p.amount or 1) == true
    end,
    car = function(src)
        local c = Cfg.Car
        local plate = Bridge.Framework.GiveVehicle(src, { model = c.Model, label = c.Label, garage = c.Garage, props = {} })
        if not plate then return false end
        Pool.SetFund(0)
        pcall(Bridge.Keys.Give, src, plate, c.Label)
        Log('economy', L('log.wheel_car'), {
            { name = L('log.player'), value = ('%s [%s]'):format(Players.Name(src), Players.Id(src)), inline = true },
            { name = L('log.plate'), value = plate, inline = true },
        })
        return true
    end,
}

local Values = {
    chips = function(p) return p.amount * Rate end,
    money = function(p) return p.amount end,
    car = function() return Cfg.Car.Value end,
}

local lastSpin = function(id)
    return MySQL.scalar.await('SELECT `wheel_spun_at` FROM `casino_players` WHERE `identifier` = ?', { id }) or 0
end

local check = function(src)
    local dist = #(GetEntityCoords(GetPlayerPed(src)) - Cfg.Coords.xyz)
    if dist > 5.0 then return nil, L('wheel.too_far') end
    local id = Players.Id(src)
    if not id then return nil, L('error.not_loaded') end
    local refused = Settings.Refuse(src, 'wheel')
    if refused then return nil, refused end
    local left = lastSpin(id) + Cfg.Cooldown - os.time()
    if left > 0 then return nil, L('wheel.cooldown', { hours = left // 3600, minutes = left % 3600 // 60 }) end
    if Cfg.Cost > 0 and Wallet.Get(src) < Cfg.Cost then return nil, L('wheel.cost', { amount = Format.Chips(Cfg.Cost) }) end
    return id
end

Rpc.Register('wheel:claim', function(src)
    if spinning or (owner and GetGameTimer() < ownerUntil) then
        if owner == src and not spinning then return true end
        return L('wheel.busy')
    end
    owner, ownerUntil = src, GetGameTimer() + CLAIM_TIME
    local id, err = check(src)
    if not id then
        owner = nil
        return err
    end
    return true
end, 2)

Rpc.Register('wheel:spin', function(src)
    if spinning or owner ~= src or GetGameTimer() > ownerUntil then return L('wheel.too_slow') end
    spinning = true

    local id, err = check(src)
    if not id or (Cfg.Cost > 0 and not Wallet.Remove(src, Cfg.Cost)) then
        owner, spinning = nil, false
        return err or L('wheel.cost', { amount = Format.Chips(Cfg.Cost) })
    end
    if Cfg.Cost > 0 then
        Pool.Add(Cfg.Cost)
        Pool.Feed(Cfg.Cost * Rate)
    end
    MySQL.prepare.await('INSERT INTO `casino_players` (`identifier`, `wheel_spun_at`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `wheel_spun_at` = ?', { id, os.time(), os.time() })

    local index = Rig.WheelPrize(id) or roll()
    local target = -(index - 1) * SEG + (math.random() - 0.5) * SEG * 0.7
    local from = state.to % 360
    state = { from = from, to = from + 360 * Cfg.Turns + (target - from) % 360, started = GetGameTimer() }
    Broadcast(SPIN, state.from, state.to)
    Wait(Cfg.SpinTime)

    local prize = Cfg.Prizes[index]
    local ok, given = pcall(Give[prize.type], src, prize)
    given = ok and given == true
    if not ok then Util.Print('error', 'wheel prize failed: %s', tostring(given)) end
    local value = Values[prize.type] and Values[prize.type](prize) or 0
    Stats.Record(id, 'wheel', Cfg.Cost * Rate, given and value or 0)
    owner, spinning = nil, false
    return { index = index, given = given }
end)

Rpc.Register('wheel:state', function()
    return { from = state.from, to = state.to, elapsed = GetGameTimer() - state.started }
end)

