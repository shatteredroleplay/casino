local Cfg = Config.Atmosphere.Hud

local session, shown, sent, pending, hidden

local setHidden = function(state)
    hidden = state ~= false
    sent = nil
end

exports('HideHud', setHidden)
exports('IsHudHidden', function() return hidden == true end)

if not Cfg.Enabled then return end

if Cfg.Command then
    RegisterCommand(Cfg.Command, function()
        setHidden(not hidden)
        Bridge.Notify.Send(L(hidden and 'hud.hidden' or 'hud.visible'), 'info', 3000, L('common.casino'))
    end, false)
end

local count = function()
    local held = Casino.Chips or 0
    if Config.Chips.Mode == 'item' then
        local ok, n = pcall(Bridge.Inventory.Count, Config.Chips.Item)
        held = ok and tonumber(n) or held
    end
    local seat = Casino.PokerChips and Casino.PokerChips() or 0
    return held + seat
end

local push = function(data)
    Nui.Send('hud', data)
end

local place = function()
    SetScriptGfxAlign(76, 66)
    local left, bottom = GetScriptGfxPosition(-0.0045, 0.002 - 0.188888)
    ResetScriptGfxAlign()
    bottom = bottom + 1.0 / 5.674
    return ('%.2f'):format(left * 100 + Cfg.Offset.x), ('%.2f'):format((1.0 - bottom + Cfg.Offset.y) * 100)
end

local label = function(game)
    local kind, title = game:match('^([^:]+):?(.*)$')
    if kind == 'slots' and title ~= '' and Slots.Text(title) then return Slots.Text(title).label end
    return L('game.' .. (kind or game))
end

CreateThread(function()
    while true do
        if Casino.Inside and Casino.IsLoaded() then
            local now, chips = GetGameTimer(), count()

            if not session or session.left and now - session.left > Cfg.Keep * 1000 then
                session = { start = chips, chips = chips, played = false }
                push({ action = 'reset', start = chips, chips = chips, bars = Cfg.Bars })
                sent, pending = nil, nil
            end
            session.left = nil

            if chips == pending then session.chips = chips end
            pending = chips

            local visible = not hidden and not IsPauseMenuActive() and (session.chips > 0 or session.start > 0 or session.played)
            local left, bottom = place()
            local key = ('%s:%s:%s:%s:%s'):format(session.chips, session.start, visible, left, bottom)
            if key ~= sent and now >= (session.hold or 0) then
                sent = key
                push({ action = 'update', chips = session.chips, start = session.start, show = visible, left = left, bottom = bottom })
            end
            shown = visible
            Wait(300)
        else
            if session and not session.left then session.left = GetGameTimer() end
            if shown then
                shown, sent = false, nil
                push({ action = 'update', show = false })
            end
            Wait(1000)
            Casino.WaitActive()
        end
    end
end)

AddEventHandler(Util.Event('hud:exchange'), function(amount)
    if not session or math.type(amount) ~= 'integer' then return end
    session.start = math.max(0, session.start + amount)
    session.hold = GetGameTimer() + 1200
    sent = nil
end)

RegisterNetEvent(Util.Event('hud:round'), function(delta, game)
    if not session or type(delta) ~= 'number' then return end
    session.played = true
    push({ action = 'round', delta = delta, game = label(tostring(game or '')) })
end)

AddEventHandler(Util.Event('player:unloaded'), function()
    session, sent, pending = nil, nil, nil
    if shown then
        shown = false
        push({ action = 'update', show = false })
    end
end)
