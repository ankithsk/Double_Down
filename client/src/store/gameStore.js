import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  roomCode: null,
  mySocketId: null,
  myPairId: null,
  playerName: null,
  gameState: null,
  gameMode: 'teams',
  pendingAction: false,
  error: null,
  lastReveal: null,   // { pairId, card, drinks, hit, disagreed, correct }
  lastBusCard: null,  // { pairId, card, drinks, finished, safe }
  busFinalResult: null,
  activeSideQuest: null,   // { type, contentIndex, pairId, drinksAtStake }
  sideQuestVotes: {},      // { [playerId]: 'yes' | 'no' }
  sideQuestPhase: 'reveal', // 'reveal' | 'active'

  setRoomCode: (code) => set({ roomCode: code }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => {
    const me = get().mySocketId;
    let pairId = null;
    if (me && state?.players?.[me]?.pairId) {
      pairId = state.players[me].pairId;
    }
    set({ gameState: state, myPairId: pairId, gameMode: state?.gameMode || 'teams' });
  },
  setPendingAction: (val) => set({ pendingAction: val }),
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
  setLastReveal: (reveal) => set({ lastReveal: reveal }),
  setLastBusCard: (card) => set({ lastBusCard: card }),
  setBusFinalResult: (result) => set({ busFinalResult: result }),
  setSideQuest: (sq) => set({ activeSideQuest: sq, sideQuestVotes: {}, sideQuestPhase: 'reveal', sideQuestResult: null }),
  clearSideQuest: () => set({ activeSideQuest: null, sideQuestVotes: {}, sideQuestPhase: 'reveal', sideQuestResult: null }),
  setSideQuestPhase: (phase) => set({ sideQuestPhase: phase }),
  resolveSideQuest: (won, drinksAtStake) => set({ sideQuestPhase: 'result', sideQuestResult: { won, drinksAtStake } }),
  sideQuestResult: null,
  questHistory: [],   // [{ type, won, names }] last 6
  addSideQuestVote: (playerId, vote) => set(s => ({
    sideQuestVotes: { ...s.sideQuestVotes, [playerId]: vote },
  })),
  pushQuestHistory: (entry) => set(s => ({
    questHistory: [entry, ...s.questHistory].slice(0, 6),
  })),
}));

export default useGameStore;
