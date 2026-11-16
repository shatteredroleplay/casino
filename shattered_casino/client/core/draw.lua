DrawTri = function(txd, a, b, c, ua, ub, uc)
	DrawSpritePoly(
		a.x,
		a.y,
		a.z,
		b.x,
		b.y,
		b.z,
		c.x,
		c.y,
		c.z,
		255,
		255,
		255,
		255,
		txd,
		txd,
		ua.x,
		ua.y,
		1.0,
		ub.x,
		ub.y,
		1.0,
		uc.x,
		uc.y,
		1.0
	)
	DrawSpritePoly(
		c.x,
		c.y,
		c.z,
		b.x,
		b.y,
		b.z,
		a.x,
		a.y,
		a.z,
		255,
		255,
		255,
		255,
		txd,
		txd,
		uc.x,
		uc.y,
		1.0,
		ub.x,
		ub.y,
		1.0,
		ua.x,
		ua.y,
		1.0
	)
end

DrawQuad = function(txd, pos, r, u, u0, v0, u1, v1)
	local tl, tr, br, bl = pos - r + u, pos + r + u, pos + r - u, pos - r - u
	DrawTri(txd, tl, tr, br, vec2(u0, v0), vec2(u1, v0), vec2(u1, v1))
	DrawTri(txd, br, bl, tl, vec2(u1, v1), vec2(u0, v1), vec2(u0, v0))
end

DrawFacing = function(pos, half)
	local d = GetFinalRenderedCamCoord() - pos
	return norm(vec3(-d.y, d.x, 0.0)) * half
end

DrawStanding = function(txd, pos, w, h, u0, u1, v0, v1)
	local r = DrawFacing(pos, w / 2)
	local u = vec3(0.0, 0.0, h)
	local tl, tr, br, bl = pos - r + u, pos + r + u, pos + r, pos - r
	DrawTri(txd, tl, tr, br, vec2(u0, v0), vec2(u1, v0), vec2(u1, v1))
	DrawTri(txd, br, bl, tl, vec2(u1, v1), vec2(u0, v1), vec2(u0, v0))
end

local encode = function(text)
	return (text:gsub('[^%w%-_%.~]', function(c)
		return ('%%%02X'):format(c:byte())
	end))
end

DrawPageUrl = function(page, prefixes)
	local strings = {}
	for key, text in pairs(Locale.Strings) do
		for _, prefix in ipairs(prefixes) do
			if key:sub(1, #prefix) == prefix then
				strings[key] = text
			end
		end
	end
	local data = json.encode({ t = strings, sep = Config.Currency.Thousands, accent = Config.Ui and Config.Ui.Accent })
	return ('nui://%s/web/dist/boards/%s.html#%s'):format(Util.Resource, page, encode(data))
end
