-- Template: send casino logs anywhere. Set Config.Bridge.Logs = 'custom'.
-- category is 'admin', 'rig', 'economy' or 'bigwin'. fields = { { name = 'Admin', value = 'Name (1)', inline = true }, ... }
Bridge.Add('logs', 'custom', {
    Send = function(category, title, fields)
    end,
})
