import { useEffect } from 'react';
import socket from '../socket';
import useGameStore from '../store/gameStore';

export default function useSocket() {
  const {
    setMySocketId,
    setRoomCode,
    setGameState,
    setError,
    setLastReveal,
    setLastBusCard,
    setBusFinalResult,
    setSideQuest,
    clearSideQuest,
    addSideQuestVote,
    setSideQuestPhase,
    pushQuestHistory,
  } = useGameStore();

  useEffect(() => {
    socket.on('connect', () => {
      setMySocketId(socket.id);
    });

    socket.on('session:expired', () => {
      sessionStorage.removeItem('dd_room');
      sessionStorage.removeItem('dd_pid');
      setError('Your session expired. Start a new game.');
    });

    socket.on('host:transferred', () => {
      // mySocketId in store is already correct; state:sync will update isHost flag
    });

    socket.on('room:created', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setMySocketId(playerId);
      sessionStorage.setItem('dd_room', roomCode);
      sessionStorage.setItem('dd_pid', playerId);
    });

    socket.on('room:joined', ({ roomCode, playerId }) => {
      setRoomCode(roomCode);
      setMySocketId(playerId);
      sessionStorage.setItem('dd_room', roomCode);
      sessionStorage.setItem('dd_pid', playerId);
    });

    socket.on('room:error', ({ message }) => {
      setError(message);
    });

    socket.on('state:sync', ({ gameState }) => {
      setGameState(gameState);
    });

    socket.on('round:reveal', (data) => {
      setLastReveal(data);
    });

    socket.on('bus:cardFlipped', (data) => {
      setLastBusCard(data);
    });

    socket.on('bus:finished', (data) => {
      setBusFinalResult(data);
    });

    socket.on('sidequest:offer', (data) => {
      setSideQuest(data);
    });

    socket.on('sidequest:accepted', () => {
      setSideQuestPhase('active');
    });

    socket.on('sidequest:closed', () => {
      clearSideQuest();
    });

    socket.on('sidequest:resolved', ({ won, drinksAtStake, pairId }) => {
      useGameStore.getState().resolveSideQuest(won, drinksAtStake);
      // Build quest history entry
      const { activeSideQuest, gameState } = useGameStore.getState();
      const type = activeSideQuest?.type || 'quest';
      const pairPlayers = gameState?.pairs?.[pairId]?.playerIds || [];
      const names = pairPlayers.map(id => gameState?.players?.[id]?.name || '?').join(' & ');
      pushQuestHistory({ type, won, names });
      setTimeout(() => clearSideQuest(), 3200);
    });

    socket.on('sidequest:votecast', ({ playerId, vote }) => {
      addSideQuestVote(playerId, vote);
    });

    socket.on('player:disconnected', ({ name }) => {
      // Could show a toast — handled in App
    });

    return () => {
      socket.off('connect');
      socket.off('session:expired');
      socket.off('host:transferred');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('state:sync');
      socket.off('round:reveal');
      socket.off('bus:cardFlipped');
      socket.off('bus:finished');
      socket.off('sidequest:offer');
      socket.off('sidequest:accepted');
      socket.off('sidequest:closed');
      socket.off('sidequest:resolved');
      socket.off('sidequest:votecast');
      socket.off('player:disconnected');
    };
  }, []);
}
