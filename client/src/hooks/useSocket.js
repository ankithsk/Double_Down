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
  } = useGameStore();

  useEffect(() => {
    socket.on('connect', () => {
      setMySocketId(socket.id);
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

    socket.on('player:disconnected', ({ name }) => {
      // Could show a toast — handled in App
    });

    return () => {
      socket.off('connect');
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:error');
      socket.off('state:sync');
      socket.off('round:reveal');
      socket.off('bus:cardFlipped');
      socket.off('bus:finished');
      socket.off('player:disconnected');
    };
  }, []);
}
