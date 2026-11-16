-- Only loaded on the server, never sent to players. Keep secrets here.
ServerConfig = {}

-- Where the house income is paid when Config.Bridge.Society is set.
--   esx: the addon account, usually 'society_casino'
--   qb / renewed / okok: the job or society account name, usually 'casino'
ServerConfig.Society = {
	Account = 'casino',
}

ServerConfig.Logs = {
	-- One webhook per category. Categories without their own webhook use Default.
	Discord = {
		Default = '',
		Webhooks = {
			admin = '',
			rig = '',
			economy = '',
			bigwin = '',
		},
		Name = 'Casino',
		Color = 14070366,
	},
	Fivemanage = {
		Token = '',
		Dataset = 'casino',
	},
}
