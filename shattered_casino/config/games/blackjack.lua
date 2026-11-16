-- Blackjack: up to four players against the dealer, six decks, dealer stands on 17. Blackjack pays 3:2.
-- Times are in seconds, unless the name ends in Time and the value is in milliseconds (DealTime etc.).
Config.Blackjack = {
	BetTime = 15,
	TurnTime = 20,
	ResultTime = 6,
	IdleRounds = 3, -- rounds in a row without a bet before the seat is freed
	DealTime = 2000, -- ms between dealt cards
	HitTime = 1500, -- ms after a hit before the next action
	RevealTime = 2000, -- ms the hidden card shows before the dealer draws
	CardInHand = 1300, -- ms into the deal animation the card leaves the dealer's hand
	FlipDelay = 1000,
	PromptDelay = 2000, -- ms after the table is cleared before the keys show again
	RenderDistance = 30.0,
	SitDistance = 1.6,
	CardLift = 0.0,
	SplitOffset = 0.1, -- how far a split hand lies from the first one

	-- the floating numbers over every hand and the keys in front of you
	Board = { Distance = 12.0, Number = 0.12, NumberLift = 0.1, PromptForward = 0.5, PromptZ = 1.1, PromptGap = 0.02 },

	-- min and max are in chips. max is also lowered to what the house pool allows
	Tables = {
		{ coords = vec4(1023.62, 62.40, 71.48, 192.99), model = 'vw_prop_casino_blckjack_01', min = 25, max = 5000 },
		{ coords = vec4(1024.57, 58.28, 71.48, 12.99), model = 'vw_prop_casino_blckjack_01', min = 25, max = 5000 },
		{ coords = vec4(1021.55, 48.90, 72.28, 282.99), model = 'vw_prop_casino_blckjack_01b', min = 500, max = 10000 },
		{ coords = vec4(1015.58, 47.49, 72.28, 103.30), model = 'vw_prop_casino_blckjack_01b', min = 500, max = 10000 },
	},
}
