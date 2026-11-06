local Cfg = Config.Wheel
local TXD = 'casino_wheel'
local SOUNDS = 'dlc_vw_casino_lucky_wheel_sounds'
local SEG = 360.0 / #Cfg.Prizes
local WINDUP, WINDUP_DEG = 0.1, 12.0
local Title = L('game.wheel')

local Dui, Ready, Busy
local State = { from = 0.0, to = 0.0, started = -math.huge }

local urlData = function()
    local prizes = {}
    for i, p in ipairs(Cfg.Prizes) do prizes[i] = { label = Wheel.Label(p), color = p.color } end
    return (json.encode({ prizes = prizes }):gsub('[^%w]', function(c) return ('%%%02X'):format(c:byte()) end))
end

local Spot = (function()
    local c, h = Cfg.Coords, math.rad(Cfg.Coords.w)
    local right, fwd, up = vec3(math.cos(h), math.sin(h), 0.0), vec3(-math.sin(h), math.cos(h), 0.0), vec3(0.0, 0.0, 1.0)
    local at = function(o) return c.xyz + right * o.x + fwd * o.y + up * o.z end
    return { pos = at(Cfg.Center), right = right, fwd = fwd, up = up }
end)()

local progress = function()
    return math.min((GetGameTimer() - State.started) / Cfg.SpinTime, 1.0)
end

local angle = function(p)
    if p < WINDUP then return State.from - WINDUP_DEG * math.sin(math.pi * p / WINDUP) end
    local q = (p - WINDUP) / (1.0 - WINDUP)
    return State.from + (State.to - State.from) * (1.0 - (1.0 - q) ^ 4)
end

local sound = function(name)
    local p = Spot.pos
    PlaySoundFromCoord(-1, name, p.x, p.y, p.z, SOUNDS, false, 20, false)
end

local draw = function(deg)
    local d = GetFinalRenderedCamCoord() - Spot.pos
    if (d.x * Spot.fwd.x + d.y * Spot.fwd.y) * Cfg.Offset < 0 then return end
    local rad = math.rad(deg)
    local c = Spot.pos + Spot.fwd * Cfg.Offset
    local r0 = Spot.right * (Cfg.Offset > 0 and -Cfg.Radius or Cfg.Radius)
    local u0 = Spot.up * Cfg.Radius
    local r = r0 * math.cos(rad) - u0 * math.sin(rad)
    local u = u0 * math.cos(rad) + r0 * math.sin(rad)
    Draw.Quad(TXD, c, r, u, 0.0, 0.0, 1.0, 1.0)
end

local openDui = function()
    Dui = CreateDui(('nui://%s/web/dist/boards/wheel.html#%s'):format(Util.Resource, urlData()), 1024, 1024)
    CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(TXD), TXD, GetDuiHandle(Dui))
    Ready = true
    RequestScriptAudioBank('DLC_VINEWOOD/CASINO_GENERAL', false)
end

local closeDui = function()
    if Dui then DestroyDui(Dui) end
    Dui, Ready = nil, false
end

local anim = function(dict, name, loop)
    TaskPlayAnim(PlayerPedId(), dict, name, 8.0, -8.0, -1, loop and 1 or 0, 0.0, false, false, false)
    return math.floor(GetAnimDuration(dict, name) * 1000)
end

local release = function()
    Busy, Casino.Seated = false, false
    FreezeEntityPosition(PlayerPedId(), false)
    ClearPedTasks(PlayerPedId())
end

local fail = function(msg)
    release()
    Bridge.Notify.Send(type(msg) == 'string' and msg or L('wheel.no_answer'), 'error', 3000, Title)
end

local Results = {
    car = function(label) return L('wheel.won_car', { prize = label }), 'success', 10000 end,
    any = function(label) return L('wheel.won', { prize = label }), 'success', 5000 end,
    car_failed = function(label) return L('wheel.car_failed', { prize = label }), 'error', 10000 end,
    any_failed = function(label) return L('wheel.no_room', { prize = label }), 'error', 5000 end,
}

local play = function()
    if Busy or Casino.Seated or Casino.IsDown() then return end
    Busy, Casino.Seated = true, true

    local ok = Rpc.Call('wheel:claim')
    if ok ~= true then return fail(ok) end

    CreateThread(function()
        while Busy do
            Casino.DisableControls()
            Wait(0)
        end
    end)

    local ped = PlayerPedId()
    local dict = ('anim_casino_a@amb@casino@games@lucky7wheel@%s'):format(IsPedMale(ped) and 'male' or 'female')
    Casino.LoadDict(dict)

    local c = Cfg.Coords
    local obj = GetClosestObjectOfType(c.x, c.y, c.z, 3.0, joaat('vw_prop_vw_luckywheel_01a'), false, false, false)
    local origin, rot = c.xyz, vec3(0.0, 0.0, c.w)
    if obj ~= 0 then origin, rot = GetEntityCoords(obj), GetEntityRotation(obj, 2) end
    local s = GetAnimInitialOffsetPosition(dict, 'enter_right_to_baseidle', origin.x, origin.y, origin.z, rot.x, rot.y, rot.z, 0.0, 2)
    local heading = GetAnimInitialOffsetRotation(dict, 'enter_right_to_baseidle', origin.x, origin.y, origin.z, rot.x, rot.y, rot.z, 0.0, 2).z

    TaskGoStraightToCoord(ped, s.x, s.y, s.z, 1.0, 5000, heading, 0.05)
    local timeout = GetGameTimer() + 5000
    while #(GetEntityCoords(ped).xy - s.xy) > 0.15 and GetGameTimer() < timeout do Wait(0) end
    SetEntityCoordsNoOffset(ped, s.x, s.y, GetEntityCoords(ped).z, false, false, false)
    SetEntityHeading(ped, heading)
    FreezeEntityPosition(ped, true)

    Wait(anim(dict, 'enter_right_to_baseidle'))
    Wait(anim(dict, 'enter_to_armraisedidle'))

    local pull = anim(dict, 'armraisedidle_to_spinningidle_high')
    SetTimeout(pull, function()
        if Busy then anim(dict, 'spinningidle_high', true) end
    end)

    local res = Rpc.Call('wheel:spin')
    if type(res) ~= 'table' then return fail(res) end

    release()
    local prize = Cfg.Prizes[res.index]
    local key = (prize.type == 'car' and 'car' or 'any') .. (res.given and '' or '_failed')
    local text, kind, time = Results[key](Wheel.Label(prize))
    Bridge.Notify.Send(text, kind, time, Title)
end

local sync = function()
    Rpc.Async('wheel:state', function(s)
        if type(s) == 'table' then State = { from = s.from, to = s.to, started = GetGameTimer() - s.elapsed } end
    end)
end

AddEventHandler(Util.Event('active'), function(active)
    if active then sync() end
end)

RegisterNetEvent(Util.Event('wheel:spin'), function(from, to)
    State = { from = from, to = to, started = GetGameTimer() }
    if Dui then sound('Spin_Start') end
end)

CreateThread(function()
    Bridge.Target.AddModels({ 'vw_prop_vw_luckywheel_01a' }, { {
        name = 'casino_wheel',
        label = Cfg.Cost > 0 and L('wheel.spin_cost', { amount = Format.Chips(Cfg.Cost) }) or L('wheel.spin'),
        icon = 'fa-solid fa-dharmachakra',
        distance = 2.5,
        canInteract = function() return not Busy and progress() >= 1.0 end,
        onSelect = function() CreateThread(play) end,
    } })
end)

CreateThread(function()
    sync()
    local lastTick, lastP = nil, 1.0
    while true do
        if not Dui then Casino.WaitActive() end
        if Casino.Active and #(GetEntityCoords(PlayerPedId()) - Spot.pos) < Cfg.RenderDistance then
            if not Dui then openDui() end
            local p = progress()
            local deg = angle(p)
            local tick = (deg + SEG / 2) // SEG
            if p < 1.0 and lastTick and tick ~= lastTick then sound('Spin_Single_Ticks') end
            if p >= 1.0 and lastP < 1.0 then sound('Win') end
            lastTick, lastP = tick, p
            local visible = Casino.OnScreen(Spot, Spot.pos, Cfg.Radius + 0.5)
            if Ready and visible then draw(deg) end
            Wait((visible or p < 1.0) and 0 or 200)
        else
            closeDui()
            lastTick, lastP = nil, 1.0
            Wait(1000)
        end
    end
end)

AddEventHandler('onResourceStop', function(resource)
    if resource ~= Util.Resource then return end
    closeDui()
    if Busy then release() end
end)
