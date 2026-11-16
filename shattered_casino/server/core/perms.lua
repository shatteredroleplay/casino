Perms = {}

local Cfg = Config.Admin
Perms.Nodes = { 'view', 'rig', 'economy', 'settings' }

local byGroup = function(src, node)
	for group, nodes in pairs(Cfg.Groups) do
		for _, allowed in ipairs(nodes) do
			if allowed == node and BridgeFrameworkHasGroup(src, group) then
				return true
			end
		end
	end
	return false
end

PermsHas = function(src, node)
	if src == 0 then
		return true
	end
	if IsPlayerAceAllowed(src, Cfg.Ace) or IsPlayerAceAllowed(src, Cfg.Ace .. '.' .. node) then
		return true
	end
	local ok, allowed = pcall(byGroup, src, node)
	return ok and allowed
end

PermsList = function(src)
	local list = {}
	for _, node in ipairs(Perms.Nodes) do
		if PermsHas(src, node) then
			list[#list + 1] = node
		end
	end
	return list
end

PermsAny = function(src)
	for _, node in ipairs(Perms.Nodes) do
		if PermsHas(src, node) then
			return true
		end
	end
	return false
end
