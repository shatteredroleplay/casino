local Cfg = Config.Atmosphere
local Loc = Config.Locations
local TXD, TXN = 'Prop_Screen_Vinewood', 'BG_Wall_Colour_4x4'
local WALL_TXD = 'casino_wall'
local MUTE_SCENE = 'CHARACTER_CHANGE_IN_SKY_SCENE'

for _, ipl in ipairs(Cfg.Ipls or {}) do RequestIpl(ipl) end

if Cfg.Blip.Enabled then
    CreateThread(function()
        local c = Loc.Center
        local blip = AddBlipForCoord(c.x, c.y, c.z)
        SetBlipSprite(blip, Cfg.Blip.Sprite)
        SetBlipScale(blip, Cfg.Blip.Scale)
        SetBlipAsShortRange(blip, true)
        BeginTextCommandSetBlipName('STRING')
        AddTextComponentSubstringPlayerName(Cfg.Blip.Label or L('common.casino'))
        EndTextCommandSetBlipName(blip)
    end)
end

local mute = function(on)
    if Cfg.MuteEvent then TriggerEvent(Cfg.MuteEvent, on) end
end

local ambience, loading, holder = false, false, nil

local startAmbience = function()
    if ambience or loading then return end
    loading = true
    mute(false)
    RequestScriptAudioBank('DLC_VINEWOOD/CASINO_GENERAL', false)
    local timeout = GetGameTimer() + 10000
    local loaded = LoadStream('casino_walla', 'DLC_VW_Casino_Interior_Sounds')
    while not loaded and Casino.Inside and GetGameTimer() < timeout do
        Wait(0)
        loaded = LoadStream('casino_walla', 'DLC_VW_Casino_Interior_Sounds')
    end
    loading = false
    if not loaded or not Casino.Inside then
        mute(true)
        return
    end
    if holder then DeleteObject(holder) holder = nil end
    local height = Cfg.Crowd.Height or 0
    local model = height > 0 and Casino.LoadModel('prop_golf_ball')
    if model then
        holder = CreateObject(model, 0.0, 0.0, 0.0, false, false, false)
        SetModelAsNoLongerNeeded(model)
        SetEntityVisible(holder, false, false)
        SetEntityCollision(holder, false, false)
        AttachEntityToEntity(holder, PlayerPedId(), 0, 0.0, 0.0, height, 0.0, 0.0, 0.0, false, false, false, false, 2, true)
        PlayStreamFromObject(holder)
    else
        PlayStreamFromPed(PlayerPedId())
    end
    StartAudioScene('DLC_VW_Casino_General')
    ambience = true
end

local stopAmbience = function()
    if not ambience then return end
    ambience = false
    StopStream()
    if holder then DeleteObject(holder) holder = nil end
    StopAudioScene('DLC_VW_Casino_General')
    mute(true)
end

if Cfg.Crowd.Enabled then
    CreateThread(function()
        local retryAt = 0
        while true do
            if Casino.Inside then
                if ambience and GetGameTimer() >= retryAt and not IsStreamPlaying() then ambience = false end
                if ambience and Cfg.MuteEvent and IsAudioSceneActive(MUTE_SCENE) then mute(false) end
                if not ambience and not loading and GetGameTimer() >= retryAt then
                    retryAt = GetGameTimer() + 5000
                    CreateThread(startAmbience)
                end
                Wait(500)
            else
                stopAmbience()
                Wait(1000)
            end
        end
    end)
end

local Wall = Cfg.Wall
local wallDui
local wallSeen, wallNear, wallCheck = false, true, 0

local nearWall = function(on)
    local now = GetGameTimer()
    if now < wallCheck then return wallNear end
    wallCheck = now + 2000
    local pos = GetEntityCoords(PlayerPedId())
    local model = joaat('vw_vwint01_video_overlay')
    if not wallSeen then wallSeen = GetClosestObjectOfType(pos.x, pos.y, pos.z, 200.0, model, false, false, false) ~= 0 end
    local range = Wall.Distance + (on and 5.0 or 0.0)
    wallNear = not wallSeen or GetClosestObjectOfType(pos.x, pos.y, pos.z, range, model, false, false, false) ~= 0
    return wallNear
end

local closeWall = function()
    if wallDui then DestroyDui(wallDui) end
    wallDui = nil
end

local drawWall = function()
    if not Wall.Effects then return end
    if not wallDui then
        local url = ('nui://%s/web/dist/boards/wall.html#rot=%d&mirror=%d'):format(Util.Resource, Wall.Rotation, Wall.Mirror and 1 or 0)
        wallDui = CreateDui(url, Wall.Width, Wall.Height)
        CreateRuntimeTextureFromDuiHandle(CreateRuntimeTxd(WALL_TXD), WALL_TXD, GetDuiHandle(wallDui))
    end
    DrawSprite(WALL_TXD, WALL_TXD, 0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
end

local setupScreen = function()
    RequestStreamedTextureDict(TXD, false)
    while not HasStreamedTextureDictLoaded(TXD) do Wait(50) end
    if not IsNamedRendertargetRegistered('casinoscreen_01') then RegisterNamedRendertarget('casinoscreen_01', false) end
    if not IsNamedRendertargetLinked(joaat('vw_vwint01_video_overlay')) then LinkNamedRendertarget(joaat('vw_vwint01_video_overlay')) end
    SetTvChannelPlaylist(0, Wall.Playlist, true)
    SetTvAudioFrontend(true)
    SetTvVolume(-100.0)
    SetTvChannel(0)
    return GetNamedRendertargetRenderId('casinoscreen_01')
end

if Wall.Enabled then
    CreateThread(function()
        local rt
        while true do
            if Casino.Inside and nearWall(rt ~= nil) then
                rt = rt or setupScreen()
                SetTextRenderId(rt)
                SetScriptGfxDrawOrder(4)
                SetScriptGfxDrawBehindPausemenu(true)
                DrawInteractiveSprite(TXD, TXN, 0.25, 0.5, 0.5, 1.0, 0.0, 255, 255, 255, 255)
                DrawTvChannel(0.5, 0.5, 1.0, 1.0, 0.0, 255, 255, 255, 255)
                drawWall()
                SetTextRenderId(GetDefaultScriptRendertargetRenderId())
                Wait(0)
            else
                if rt then
                    SetTvChannel(-1)
                    ReleaseNamedRendertarget('casinoscreen_01')
                    SetStreamedTextureDictAsNoLongerNeeded(TXD)
                    closeWall()
                    rt = nil
                end
                if Casino.Inside then
                    Wait(500)
                else
                    Wait(1000)
                    Casino.WaitActive()
                end
            end
        end
    end)
end

AddEventHandler('onResourceStop', function(resource)
    if resource ~= Util.Resource then return end
    closeWall()
    stopAmbience()
end)
