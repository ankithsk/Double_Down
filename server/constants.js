const PHASES = Object.freeze({
  LOBBY: 'LOBBY',
  ROUND_1: 'ROUND_1',
  ROUND_2: 'ROUND_2',
  ROUND_3: 'ROUND_3',
  ROUND_4: 'ROUND_4',
  BUS: 'BUS',
  GAME_OVER: 'GAME_OVER',
});

const SUITS = Object.freeze(['hearts', 'diamonds', 'clubs', 'spades']);
const SUIT_SYMBOLS = Object.freeze({ hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' });
const RED_SUITS = Object.freeze(['hearts', 'diamonds']);

const VALUES = Object.freeze([2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']);
const FACE_CARDS = Object.freeze(['J', 'Q', 'K', 'A']);

const NUMERIC_VALUE = Object.freeze({
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  J: 11, Q: 12, K: 13, A: 14,
});

const MODES = Object.freeze({
  SOLO: 'solo',       // 2 players, 1 pair
  PAIRS: 'pairs',     // 4-6 players, 2-3 pairs compete
  TOURNAMENT: 'tournament', // 8-10 players, bracket
});

const PARTNER_RESPONSE_TIMEOUT_MS = 15000;

module.exports = {
  PHASES, SUITS, SUIT_SYMBOLS, RED_SUITS, VALUES, FACE_CARDS, NUMERIC_VALUE, MODES, PARTNER_RESPONSE_TIMEOUT_MS
};
