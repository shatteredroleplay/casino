Db = {}

local Migrations = {
	'sql/install.sql',
	'sql/002_owed.sql',
}

Db.Latest = #Migrations

local ready = promise.new()
Db.Ready = false

DbAwait = function()
	if Db.Ready then
		return true
	end
	return Citizen.Await(ready)
end

local statements = function(path)
	local raw = LoadResourceFile(Util.Resource, path)
	if not raw then
		error(('missing %s'):format(path), 0)
	end
	local list = {}
	for statement in raw:gmatch('[^;]+') do
		if statement:find('%S') then
			list[#list + 1] = { query = statement }
		end
	end
	return list
end

local migrate = function()
	MySQL.query.await('CREATE TABLE IF NOT EXISTS `casino_schema` (`version` INT NOT NULL) ENGINE=InnoDB')
	local version = MySQL.scalar.await('SELECT `version` FROM `casino_schema` LIMIT 1')
	if not version then
		MySQL.insert.await('INSERT INTO `casino_schema` (`version`) VALUES (0)')
		version = 0
	end

	for i = version + 1, #Migrations do
		local queries = statements(Migrations[i])
		queries[#queries + 1] = { query = 'UPDATE `casino_schema` SET `version` = ?', values = { i } }
		if not MySQL.transaction.await(queries) then
			error(('migration %s failed'):format(Migrations[i]), 0)
		end
		UtilPrint('ok', 'database updated to version %d', i)
		version = i
	end
	Db.Version = version
end

MySQL.ready(function()
	local ok, err = pcall(migrate)
	if not ok then
		UtilPrint('error', 'database setup failed: %s. Run sql/install.sql by hand and restart', tostring(err))
		return
	end
	Db.Ready = true
	ready:resolve(true)
end)
