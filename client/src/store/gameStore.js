import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  roomCode: null,
  mySocketId: null,
  myPairId: null,
  playerName: null,
  gameState: null,
  pendingAction: false,
  error: null,
  lastReveal: null,   // { pairId, card, drinks, hit, disagreed, correct }
  lastBusCard: null,  // { pairId, card, drinks, finished, safe }
  busFinalResult: null,

  setRoomCode: (code) => set({ roomCode: code }),
  setMySocketId: (id) => set({ mySocketId: id }),
  setPlayerName: (name) => set({ playerName: name }),
  setGameState: (state) => {
    const me = get().mySocketId;
    let pairId = null;
    if (me && state?.players?.[me]?.pairId) {
      pairId = state.players[me].pairId;
    }
    set({ gameState: state, myPairId: pairId });
  },
  setPendingAction: (val) => set({ pendingAction: val }),
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
  setLastReveal: (reveal) => set({ lastReveal: reveal }),
  setLastBusCard: (card) => set({ lastBusCard: card }),
  setBusFinalResult: (result) => set({ busFinalResult: result }),
}));

export default useGameStore;
