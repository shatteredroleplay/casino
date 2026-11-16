Cards = {}

Cards.Suits = { 'club', 'dia', 'hrt', 'spd' }
Cards.Ranks = { 'ace', '02', '03', '04', '05', '06', '07', '08', '09', '10', 'jack', 'queen', 'king' }

CardsNewDeck = function(decks)
	local deck = {}
	for _ = 1, decks do
		for _, suit in ipairs(Cards.Suits) do
			for _, rank in ipairs(Cards.Ranks) do
				deck[#deck + 1] = suit .. '_' .. rank
			end
		end
	end
	for i = #deck, 2, -1 do
		local j = math.random(i)
		deck[i], deck[j] = deck[j], deck[i]
	end
	return deck
end

CardsValue = function(cards)
	local total, aces = 0, 0
	for _, card in ipairs(cards) do
		local rank = card:match('_(%w+)$')
		if rank == 'ace' then
			total = total + 11
			aces = aces + 1
		elseif rank == 'jack' or rank == 'queen' or rank == 'king' then
			total = total + 10
		else
			total = total + (tonumber(rank or '') or 0)
		end
	end
	while total > 21 and aces > 0 do
		total = total - 10
		aces = aces - 1
	end
	return total
end

CardsIsBlackjack = function(cards)
	return #cards == 2 and CardsValue(cards) == 21
end

CardsPayout = function(hand, dealer, split)
	local player, house = CardsValue(hand.cards), CardsValue(dealer)
	if player > 21 then
		return 0
	end
	local pbj, dbj = not split and CardsIsBlackjack(hand.cards), CardsIsBlackjack(dealer)
	if pbj and dbj then
		return hand.bet
	end
	if pbj then
		return math.floor(hand.bet * 2.5)
	end
	if dbj then
		return 0
	end
	if house > 21 or player > house then
		return hand.bet * 2
	end
	if player == house then
		return hand.bet
	end
	return 0
end

local rankOf = function(card)
	local rank = card:match('_(%w+)$')
	return rank == 'ace' and 14
		or rank == 'king' and 13
		or rank == 'queen' and 12
		or rank == 'jack' and 11
		or tonumber(rank)
end

CardsPoker = function(cards)
	local count, suits = {}, {}
	for _, card in ipairs(cards) do
		local rank, suit = rankOf(card), card:match('^%a+')
		count[rank] = (count[rank] or 0) + 1
		suits[suit] = suits[suit] or {}
		suits[suit][rank] = true
	end

	local where = function(test)
		local list = {}
		for rank = 14, 2, -1 do
			if test(rank) then
				list[#list + 1] = rank
			end
		end
		return list
	end
	local of = function(n)
		return where(function(rank)
			return count[rank] == n
		end)
	end
	local kickers = function(a, b)
		return where(function(rank)
			return count[rank] and rank ~= a and rank ~= b
		end)
	end
	local straight = function(has)
		for high = 14, 5, -1 do
			local run = true
			for rank = high - 4, high do
				run = run and has[rank == 1 and 14 or rank]
			end
			if run then
				return high
			end
		end
	end
	local score = function(kind, ...)
		local n = kind
		for i = 1, 5 do
			n = n * 15 + (select(i, ...) or 0)
		end
		return n, kind
	end

	local flush
	for _, has in pairs(suits) do
		local ranks = where(function(rank)
			return has[rank]
		end)
		if #ranks >= 5 then
			if straight(has) then
				return score(8, straight(has))
			end
			flush = ranks
		end
	end

	local four, three, two = of(4), of(3), of(2)
	if four[1] then
		return score(7, four[1], kickers(four[1])[1])
	end
	if three[1] and (three[2] or two[1]) then
		return score(6, three[1], math.max(three[2] or 0, two[1] or 0))
	end
	if flush then
		return score(5, table.unpack(flush, 1, 5))
	end
	if straight(count) then
		return score(4, straight(count))
	end
	if three[1] then
		return score(3, three[1], table.unpack(kickers(three[1]), 1, 2))
	end
	if two[2] then
		return score(2, two[1], two[2], kickers(two[1], two[2])[1])
	end
	if two[1] then
		return score(1, two[1], table.unpack(kickers(two[1]), 1, 3))
	end
	return score(0, table.unpack(kickers(), 1, 5))
end

CardsHandName = function(kind)
	return L('poker.hand_' .. kind)
end

CardsPoints = function(cards)
	local total = 0
	for _, card in ipairs(cards) do
		local rank = card:match('_(%w+)$')
		total = total + (rank == 'ace' and 1 or tonumber(rank) or 0)
	end
	return total % 10
end

CardsBaccarat = function(deck)
	local draw = function()
		return table.remove(deck)
	end
	local player, bank = {}, {}
	for _ = 1, 2 do
		player[#player + 1] = draw()
		bank[#bank + 1] = draw()
	end

	local p, b = CardsPoints(player), CardsPoints(bank)
	if p >= 8 or b >= 8 then
		return player, bank
	end

	local third
	if p <= 5 then
		player[3] = draw()
		third = CardsPoints({ player[3] })
	end
	local draws = b <= 5
	if third then
		draws = b <= 2
			or b == 3 and third ~= 8
			or b == 4 and third >= 2 and third <= 7
			or b == 5 and third >= 4 and third <= 7
			or b == 6 and third >= 6 and third <= 7
	end
	if draws then
		bank[3] = draw()
	end
	return player, bank
end
