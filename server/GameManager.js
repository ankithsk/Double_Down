const { createShuffledDeck } = require('./Deck');
const {
  PHASES, RED_SUITS, NUMERIC_VALUE, FACE_CARDS, SUITS, MODES, PARTNER_RESPONSE_TIMEOUT_MS
} = require('./constants');

class GameManager {
  constructor(roomCode, hostId, hostName) {
    this.roomCode = roomCode;
    this.phase = PHASES.LOBBY;
    this.players = {};
    this.pairs = {};
    this.deck = [];
    this.round = 1;
    this.mode = MODES.SOLO;
    this.gameMode = 'teams'; // 'teams' | 'solo_individual'
    this.bracket = null;
    this._partnerTimeouts = {}; // pairId -> timeout handle
    this._nextPairIndex = 0;

    this.addPlayer(hostId, hostName, true);
  }

  // ─── Player Management ───────────────────────────────────────────────────

  addPlayer(socketId, name, isHost = false) {
    this.players[socketId] = { id: socketId, name, pairId: null, isHost, connected: true };
    this._recalcMode();
    return this.players[socketId];
  }

  removePlayer(socketId) {
    const player = this.players[socketId];
    if (!player) return;
    player.connected = false;
    // If a pair partner disconnects during game, mark pair
    if (player.pairId && this.pairs[player.pairId]) {
      this.pairs[player.pairId].hasDisconnect = true;
    }
    this._recalcMode();
  }

  reconnectPlayer(oldId, newId) {
    const player = this.players[oldId];
    if (!player) return false;
    player.id = newId;
    player.connected = true;
    this.players[newId] = player;
    delete this.players[oldId];
    if (player.pairId && this.pairs[player.pairId]) {
      const pair = this.pairs[player.pairId];
      const idx = pair.playerIds.indexOf(oldId);
      if (idx !== -1) pair.playerIds[idx] = newId;
      pair.hasDisconnect = pair.playerIds.some(id => !this.players[id]?.connected);
    }
    return true;
  }

  _recalcMode() {
    const count = Object.values(this.players).filter(p => p.connected).length;
    if (count <= 2) this.mode = MODES.SOLO;
    else if (count <= 6) this.mode = MODES.PAIRS;
    else this.mode = MODES.TOURNAMENT;
  }

  getHost() {
    return Object.values(this.players).find(p => p.isHost && p.connected);
  }

  // ─── Pair Assignment ─────────────────────────────────────────────────────

  assignPair(playerIdA, playerIdB) {
    const existingPair = this._findPairByPlayers([playerIdA, playerIdB]);
    if (existingPair) return existingPair;

    // Remove both from any existing pairs
    this._removePlayerFromPair(playerIdA);
    this._removePlayerFromPair(playerIdB);

    const pairId = `pair-${this._nextPairIndex++}`;
    this.pairs[pairId] = this._newPair(pairId, [playerIdA, playerIdB]);
    this.players[playerIdA].pairId = pairId;
    this.players[playerIdB].pairId = pairId;
    return this.pairs[pairId];
  }

  autoAssignPairs() {
    const connected = Object.values(this.players).filter(p => p.connected);
    // Clear existing pairs
    this.pairs = {};
    this._nextPairIndex = 0;
    connected.forEach(p => { p.pairId = null; });

    const shuffled = [...connected].sort(() => Math.random() - 0.5);
    for (let i = 0; i + 1 < shuffled.length; i += 2) {
      this.assignPair(shuffled[i].id, shuffled[i + 1].id);
    }
    // Odd player out: solo pair
    if (shuffled.length % 2 === 1) {
      const solo = shuffled[shuffled.length - 1];
      const pairId = `pair-${this._nextPairIndex++}`;
      this.pairs[pairId] = this._newPair(pairId, [solo.id]);
      solo.pairId = pairId;
    }
  }

  _newPair(pairId, playerIds) {
    return {
      id: pairId,
      playerIds,
      hand: [],
      drinkCount: 0,
      pendingDrinks: 0,
      roundState: null,
      onBus: false,
      busState: null,
      hasDisconnect: false,
    };
  }

  _findPairByPlayers(ids) {
    return Object.values(this.pairs).find(p =>
      ids.every(id => p.playerIds.includes(id))
    ) || null;
  }

  _removePlayerFromPair(playerId) {
    const player = this.players[playerId];
    if (!player || !player.pairId) return;
    const pair = this.pairs[player.pairId];
    if (!pair) return;
    pair.playerIds = pair.playerIds.filter(id => id !== playerId);
    if (pair.playerIds.length === 0) delete this.pairs[pair.id];
    player.pairId = null;
  }

  canStart() {
    const connected = Object.values(this.players).filter(p => p.connected);
    if (connected.length < 2) return { ok: false, reason: 'Need at least 2 players' };
    if (this.gameMode !== 'solo_individual' && connected.some(p => !p.pairId)) {
      return { ok: false, reason: 'All players must be in pairs' };
    }
    return { ok: true };
  }

  // ─── Game Start ──────────────────────────────────────────────────────────

  startGame(gameMode = 'teams') {
    this.gameMode = gameMode;
    this.deck = createShuffledDeck();
    this.round = 1;
    this.phase = PHASES.ROUND_1;

    if (this.mode === MODES.TOURNAMENT) {
      this._buildBracket();
    }

    // In solo mode, create synthetic solo pairs — one per player
    if (this.gameMode === 'solo_individual') {
      this.pairs = {};
      this._nextPairIndex = 0;
      for (const player of Object.values(this.players).filter(p => p.connected)) {
        const pairId = `pair-${this._nextPairIndex++}`;
        this.pairs[pairId] = this._newPair(pairId, [player.id]);
        player.pairId = pairId;
      }
    }

    // Deal one card face-down to each pair
    for (const pair of Object.values(this.pairs)) {
      pair.hand = [];
      pair.drinkCount = 0;
      pair.pendingDrinks = 0;
      const card = this.deck.pop();
      pair.hand.push({ ...card, faceUp: false });
      pair.roundState = this.gameMode === 'solo_individual'
        ? this._newRoundStateSolo(pair.playerIds[0], 1)
        : this._newRoundState(pair, 1);
    }
  }

  _newRoundState(pair, round) {
    const [playerA, playerB] = pair.playerIds;
    return {
      round,
      guessBy: playerA,         // rotates each round
      partnerOf: playerB,
      guessA: null,
      guessB: null,
      guess: null,
      partnerResponse: null,    // 'doubleDown' | 'shield' | 'none'
      waitingFor: round === 1 ? 'bothGuess' : 'guess',
      resolved: false,
    };
  }

  _newRoundStateSolo(playerId, round) {
    return {
      round,
      guessBy: playerId,
      partnerOf: null,
      guessA: null,
      guessB: null,
      guess: null,
      partnerResponse: 'none',
      waitingFor: 'guess',
      resolved: false,
    };
  }

  // ─── Round 1: Red or Black ────────────────────────────────────────────────

  submitR1Guess(pairId, playerId, guess) {
    const pair = this.pairs[pairId];
    if (!pair || pair.roundState?.round !== 1) return null;
    const rs = pair.roundState;

    // Solo: single player guesses — resolve immediately, no partner needed
    if (this.gameMode === 'solo_individual') {
      if (rs.waitingFor !== 'guess') return null;
      rs.guessA = guess;
      rs.guessB = guess; // same player, no disagreement
      return this._resolveRound1(pair);
    }

    const isA = playerId === pair.playerIds[0];

    if (isA) rs.guessA = guess;
    else rs.guessB = guess;

    // Once both are in, resolve
    if (rs.guessA && rs.guessB) {
      return this._resolveRound1(pair);
    }
    return null; // still waiting for partner
  }

  _resolveRound1(pair) {
    const rs = pair.roundState;
    const card = pair.hand[0];
    card.faceUp = true;

    const correct = RED_SUITS.includes(card.suit) ? 'red' : 'black';
    let drinks = 0;

    // Disagreement penalty — drink for being out of sync
    if (rs.guessA !== rs.guessB) drinks += 1;

    // Miss penalty
    const theirGuess = rs.guessA; // use A's for resolution (both punished if different)
    if (theirGuess !== correct) drinks += 1;
    // if they disagreed and one was right, still take disagreement drink but no miss drink for the correct one
    // Simplification: both drink the same amount (shared hand)

    pair.pendingDrinks = drinks;
    pair.drinkCount += drinks;
    rs.waitingFor = 'resolved';
    rs.resolved = true;
    rs.correct = correct;

    pair._pendingSideQuest = this._maybeTriggerSideQuest(pair);
    return { card, drinks, disagreed: rs.guessA !== rs.guessB, correct };
  }

  // ─── Round 2+: Higher/Lower, Inside/Outside, Suit ─────────────────────────

  submitGuess(pairId, playerId, guess) {
    const pair = this.pairs[pairId];
    if (!pair) return null;
    const rs = pair.roundState;
    if (rs.waitingFor !== 'guess' || playerId !== rs.guessBy) return null;
    rs.guess = guess;

    // Solo: no partner response step — resolve immediately
    if (this.gameMode === 'solo_individual') {
      rs.partnerResponse = 'none';
      return this._resolveRound(pair);
    }

    rs.waitingFor = 'partnerResponse';
    return true;
  }

  submitPartnerResponse(pairId, playerId, response) {
    const pair = this.pairs[pairId];
    if (!pair) return null;
    const rs = pair.roundState;
    if (rs.waitingFor !== 'partnerResponse') return null;
    if (playerId !== rs.partnerOf) return null;

    this._clearPartnerTimeout(pairId);
    rs.partnerResponse = response;
    return this._resolveRound(pair);
  }

  _resolveRound(pair) {
    const rs = pair.roundState;
    const round = rs.round;
    const hand = pair.hand;
    const card = hand[round - 1];
    const hit = this._evaluateGuess(rs.guess, hand, round);

    card.faceUp = true;

    let drinks = 0;
    if (!hit) {
      const baseDrinks = round === 4 ? 3 : round === 3 ? 2 : 1;
      if (rs.partnerResponse === 'doubleDown') drinks = baseDrinks * 2;
      else if (rs.partnerResponse === 'shield') drinks = Math.ceil(baseDrinks / 2);
      else drinks = baseDrinks;
    }

    let shieldPenalty = rs.partnerResponse === 'shield' ? 1 : 0;
    const totalDrinks = drinks + shieldPenalty;

    pair.pendingDrinks = totalDrinks;
    pair.drinkCount += totalDrinks;
    rs.waitingFor = 'resolved';
    rs.resolved = true;
    rs.hit = hit;

    pair._pendingSideQuest = this._maybeTriggerSideQuest(pair);
    return { card, drinks: totalDrinks, hit, shieldPenalty };
  }

  _evaluateGuess(guess, hand, round) {
    if (round === 2) {
      const curr = NUMERIC_VALUE[hand[1].value];
      const prev = NUMERIC_VALUE[hand[0].value];
      if (guess === 'higher') return curr > prev;
      if (guess === 'lower') return curr < prev;
      if (guess === 'equal') return curr === prev;
    }
    if (round === 3) {
      const curr = NUMERIC_VALUE[hand[2].value];
      const a = NUMERIC_VALUE[hand[0].value];
      const b = NUMERIC_VALUE[hand[1].value];
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (guess === 'inside') return curr > lo && curr < hi;
      if (guess === 'outside') return curr < lo || curr > hi;
    }
    if (round === 4) {
      return guess === hand[3].suit;
    }
    return false;
  }

  // ─── Round Advancement ────────────────────────────────────────────────────

  advanceRound(fromRound) {
    if (this.round !== fromRound) return false;
    this.round += 1;
    const nextPhase = [null, PHASES.ROUND_1, PHASES.ROUND_2, PHASES.ROUND_3, PHASES.ROUND_4][this.round];

    if (!nextPhase) {
      // After round 4 — determine who rides the bus
      this._setupBus();
      return true;
    }

    this.phase = nextPhase;

    for (const pair of Object.values(this.pairs)) {
      // Deal new card face-down
      const card = this.deck.pop();
      if (!card) return false; // shouldn't happen
      pair.hand.push({ ...card, faceUp: false });
      pair.pendingDrinks = 0;

      if (this.gameMode === 'solo_individual') {
        pair.roundState = this._newRoundStateSolo(pair.playerIds[0], this.round);
      } else {
        const [playerA, playerB] = pair.playerIds;
        const rs = this._newRoundState(pair, this.round);
        // Alternate: even rounds = B guesses, odd = A guesses
        if (this.round % 2 === 0) {
          rs.guessBy = playerB;
          rs.partnerOf = playerA;
        }
        pair.roundState = rs;
      }
    }
    return true;
  }

  // ─── Bus ─────────────────────────────────────────────────────────────────

  _setupBus() {
    this.phase = PHASES.BUS;
    let busRiders;

    if (this.gameMode === 'solo_individual') {
      // Player with the most drinks rides the bus
      const sorted = Object.values(this.pairs).sort((a, b) => b.drinkCount - a.drinkCount);
      busRiders = [sorted[0]];
    } else if (this.mode === MODES.SOLO) {
      busRiders = Object.values(this.pairs);
    } else if (this.mode === MODES.PAIRS) {
      const sorted = Object.values(this.pairs).sort((a, b) => b.drinkCount - a.drinkCount);
      busRiders = [sorted[0]]; // worst pair rides
    } else {
      // tournament: handled separately
      busRiders = this.bracket?.finalLoser ? [this.pairs[this.bracket.finalLoser]] : [];
    }

    for (const pair of busRiders) {
      pair.onBus = true;
      const [flipper, decider] = pair.playerIds;
      pair.busState = {
        active: true,
        flipperId: flipper,
        deciderId: flipper, // in solo, same person flips and decides — no bail option
        cardsFlipped: [],
        drinksPending: 0,
        bailed: false,
        finished: false,
        isSolo: this.gameMode === 'solo_individual',
      };
    }
  }

  flipBusCard(pairId, playerId) {
    const pair = this.pairs[pairId];
    if (!pair?.busState?.active) return null;
    if (playerId !== pair.busState.flipperId) return null;

    const card = this.deck.pop();
    if (!card) {
      // No cards left — bus over, safe!
      pair.busState.finished = true;
      pair.busState.active = false;
      return { card: null, drinks: 0, finished: true, safe: true };
    }

    pair.busState.cardsFlipped.push({ ...card });

    let drinks = 0;
    if (FACE_CARDS.includes(card.value)) {
      drinks = 1;
      pair.busState.drinksPending += 1;
    }

    return { card, drinks, finished: false, safe: false };
  }

  busDecide(pairId, playerId, decision) {
    const pair = this.pairs[pairId];
    if (!pair?.busState?.active) return null;
    if (playerId !== pair.busState.deciderId) return null;

    if (decision === 'bail') {
      pair.busState.bailed = true;
      pair.busState.finished = true;
      pair.busState.active = false;
      const flipperDrinks = pair.busState.drinksPending * 2;
      pair.drinkCount += flipperDrinks;
      return { bailed: true, flipperDrinks, deciderDrinks: 0 };
    }
    // 'continue' — just keep going
    return { bailed: false };
  }

  // ─── Side Quest Trigger ───────────────────────────────────────────────────

  _maybeTriggerSideQuest(pair) {
    const drinks = pair.pendingDrinks || 0;
    if (drinks < 2) return null;
    if (Math.random() > 0.4) return null;
    const types = ['charades', 'rapidfire', 'dare', 'mimicry', 'trivia'];
    const type = types[Math.floor(Math.random() * types.length)];
    const contentIndex = Math.floor(Math.random() * 1000);
    return { type, contentIndex, pairId: pair.id, drinksAtStake: drinks };
  }

  endBus(pairId) {
    const pair = this.pairs[pairId];
    if (!pair?.busState) return null;
    pair.busState.active = false;
    pair.busState.finished = true;
    // Don't double-count: busDecide('bail') already added drinksPending*2 to drinkCount
    const totalDrinks = pair.busState.bailed ? 0 : pair.busState.drinksPending;
    pair.drinkCount += totalDrinks;

    const allDone = Object.values(this.pairs).filter(p => p.onBus).every(p => p.busState?.finished);
    if (allDone) this.phase = PHASES.GAME_OVER;
    return { totalDrinks };
  }

  // ─── Partner Response Timeout ─────────────────────────────────────────────

  startPartnerTimeout(pairId, callback) {
    this._clearPartnerTimeout(pairId);
    this._partnerTimeouts[pairId] = setTimeout(() => {
      const pair = this.pairs[pairId];
      if (pair?.roundState?.waitingFor === 'partnerResponse') {
        pair.roundState.partnerResponse = 'none';
        const result = this._resolveRound(pair);
        callback(pairId, result);
      }
    }, PARTNER_RESPONSE_TIMEOUT_MS);
  }

  _clearPartnerTimeout(pairId) {
    if (this._partnerTimeouts[pairId]) {
      clearTimeout(this._partnerTimeouts[pairId]);
      delete this._partnerTimeouts[pairId];
    }
  }

  // ─── Tournament ───────────────────────────────────────────────────────────

  _buildBracket() {
    const pairIds = Object.keys(this.pairs);
    // Simple: track matchups; winner = fewer drinks per round
    this.bracket = {
      rounds: [],
      currentRound: 0,
      byePair: null,
      finalLoser: null,
    };

    if (pairIds.length % 2 === 1) {
      this.bracket.byePair = pairIds[pairIds.length - 1];
    }
  }

  // ─── State Serialization ──────────────────────────────────────────────────

  toJSON() {
    return {
      roomCode: this.roomCode,
      phase: this.phase,
      round: this.round,
      mode: this.mode,
      gameMode: this.gameMode,
      players: this.players,
      pairs: this.pairs,
      bracket: this.bracket,
      deckRemaining: this.deck.length,
    };
  }

  // Filter state so Player B can't see Player A's round 1 guess before submitting their own
  toJSONForPlayer(playerId) {
    const state = this.toJSON();
    if (this.phase !== PHASES.ROUND_1) return state;

    const player = this.players[playerId];
    if (!player?.pairId) return state;

    const pair = state.pairs[player.pairId];
    if (!pair?.roundState) return state;

    const rs = pair.roundState;
    if (rs.waitingFor !== 'bothGuess') return state;

    // Strip partner's guess
    const isPlayerA = playerId === pair.playerIds[0];
    const filtered = JSON.parse(JSON.stringify(state));
    const frs = filtered.pairs[player.pairId].roundState;
    if (isPlayerA) frs.guessB = null;
    else frs.guessA = null;

    return filtered;
  }

  allPairsResolved() {
    return Object.values(this.pairs).every(p => p.roundState?.resolved);
  }
}

module.exports = GameManager;
