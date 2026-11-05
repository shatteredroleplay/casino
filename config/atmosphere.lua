-- Everything that makes the casino feel alive. All of it only runs while a player is inside the casino zone.
Config.Atmosphere = {
    -- map blip at Config.Locations.Center
    Blip = { Enabled = true, Sprite = 679, Scale = 0.8, Label = nil },   -- Label nil = the locale's casino name

    -- crowd murmur played while inside. Height: metres above the player it plays from, higher = quieter
    Crowd = { Enabled = true, Height = 8.0 },

    -- an event triggered with true/false when the crowd sound starts and stops, for resources that mute the world
    -- with audio scenes (they can block streamed sound). Example: 'misc:worldMute'. nil = none
    MuteEvent = nil,

    -- the big video wall of the casino interior: the GTA playlist with animated effects on top
    Wall = { Enabled = true, Effects = true, Playlist = 'CASINO_DIA_PL', Width = 1080, Height = 1920, Rotation = 90, Mirror = false, Distance = 40.0 },

    -- chip tracker next to the minimap: chips, start of session, net and a bar for every round
    Hud = { Enabled = true, Command = 'casinohud', Keep = 15 * 60, Bars = 24, Offset = { x = 0.8, y = 0.03 } },

    -- IPLs requested when the resource starts, for casino interiors that need them (leave empty for an MLO or bob74_ipl)
    Ipls = {},
}
