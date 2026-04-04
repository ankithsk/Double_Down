const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const GameManager = require('./GameManager');
const { PHASES } = require('./constants');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

// roomCode -> GameManager
const rooms = new Map();
// socketId -> { roomCode, previousId }
const socketMeta = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function syncAll(game) {
  game.toJSON(); // ensure state is fresh
  for (const player of Object.values(game.players)) {
    if (player.connected) {
      io.to(player.id).emit('state:sync', { gameState: game.toJSONForPlayer(player.id) });
    }
  }
}

function syncAllRaw(game) {
  const state = game.toJSON();
  io.to(game.roomCode).emit('state:sync', { gameState: state });
}

function maybeSendSideQuest(game, pair) {
  if (pair?._pendingSideQuest) {
    const sq = pair._pendingSideQuest;
    pair._pendingSideQuest = null;
    io.to(game.roomCode).emit('sidequest:offer', sq);
  }
}

io.on('connection', (socket) => {
  const { playerName, roomCode: rejoinCode, previousId } = socket.handshake.auth;

  // Attempt reconnect
  if (rejoinCode && previousId && rooms.has(rejoinCode)) {
    const game = rooms.get(rejoinCode);
    const reconnected = game.reconnectPlayer(previousId, socket.id);
    if (reconnected) {
      socketMeta.set(socket.id, { roomCode: rejoinCode });
      socket.join(rejoinCode);
      socket.emit('room:joined', { roomCode: rejoinCode, playerId: socket.id });
      syncAll(game);
      return;
    }
  }

  // ─── room:create ──────────────────────────────────────────────────────────
  socket.on('room:create', ({ playerName: name, gameMode = 'teams' }) => {
    const code = generateRoomCode();
    const game = new GameManager(code, socket.id, name);
    game.gameMode = gameMode;
    rooms.set(code, game);
    socketMeta.set(socket.id, { roomCode: code });
    socket.join(code);
    socket.emit('room:created', { roomCode: code, playerId: socket.id });
    syncAll(game);
  });

  // ─── room:join ────────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomCode, playerName: name }) => {
    const code = roomCode.toUpperCase();
    if (!rooms.has(code)) {
      socket.emit('room:error', { message: 'Room not found. Check the code and try again.' });
      return;
    }
    const game = rooms.get(code);
    if (game.phase !== PHASES.LOBBY) {
      socket.emit('room:error', { message: 'Game already in progress.' });
      return;
    }
    game.addPlayer(socket.id, name);
    socketMeta.set(socket.id, { roomCode: code });
    socket.join(code);
    socket.emit('room:joined', { roomCode: code, playerId: socket.id });
    syncAll(game);
  });

  // ─── pair:assign ─────────────────────────────────────────────────────────
  socket.on('pair:assign', ({ playerIdA, playerIdB }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    game.assignPair(playerIdA, playerIdB);
    syncAll(game);
  });

  // ─── pair:autoAssign ─────────────────────────────────────────────────────
  socket.on('pair:autoAssign', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    game.autoAssignPairs();
    syncAll(game);
  });

  // ─── game:start ──────────────────────────────────────────────────────────
  socket.on('game:start', ({ gameMode = 'teams' } = {}) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    const check = game.canStart();
    if (!check.ok) {
      socket.emit('room:error', { message: check.reason });
      return;
    }
    game.startGame(gameMode);
    syncAll(game);
  });

  // ─── round:r1Guess ───────────────────────────────────────────────────────
  socket.on('round:r1Guess', ({ guess }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player?.pairId) return;
    const result = game.submitR1Guess(player.pairId, socket.id, guess);
    if (result) {
      io.to(game.roomCode).emit('round:reveal', { pairId: player.pairId, ...result });
      maybeSendSideQuest(game, game.pairs[player.pairId]);
    }
    syncAll(game);
  });

  // ─── round:guess ─────────────────────────────────────────────────────────
  socket.on('round:guess', ({ guess }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player?.pairId) return;
    const ok = game.submitGuess(player.pairId, socket.id, guess);
    if (!ok) return;
    // Solo: submitGuess already resolved and returned the result object
    if (typeof ok === 'object') {
      io.to(game.roomCode).emit('round:reveal', { pairId: player.pairId, ...ok });
      maybeSendSideQuest(game, game.pairs[player.pairId]);
      syncAll(game);
      return;
    }
    // Teams: start timeout for partner response
    game.startPartnerTimeout(player.pairId, (pairId, result) => {
      io.to(game.roomCode).emit('round:reveal', { pairId, ...result });
      syncAll(game);
    });
    syncAll(game);
  });

  // ─── round:partnerResponse ────────────────────────────────────────────────
  socket.on('round:partnerResponse', ({ response }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player?.pairId) return;
    const result = game.submitPartnerResponse(player.pairId, socket.id, response);
    if (!result) return;
    io.to(game.roomCode).emit('round:reveal', { pairId: player.pairId, ...result });
    maybeSendSideQuest(game, game.pairs[player.pairId]);
    syncAll(game);
  });

  // ─── game:nextRound ───────────────────────────────────────────────────────
  socket.on('game:nextRound', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    if (!game.allPairsResolved()) return;
    const ok = game.advanceRound(game.round);
    if (ok) syncAll(game);
  });

  // ─── bus:flip ─────────────────────────────────────────────────────────────
  socket.on('bus:flip', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player?.pairId) return;
    const result = game.flipBusCard(player.pairId, socket.id);
    if (!result) return;
    io.to(game.roomCode).emit('bus:cardFlipped', { pairId: player.pairId, ...result });
    if (result.finished) {
      game.endBus(player.pairId);
    }
    syncAll(game);
  });

  // ─── bus:decide ───────────────────────────────────────────────────────────
  socket.on('bus:decide', ({ decision }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    const player = game.players[socket.id];
    if (!player?.pairId) return;
    const result = game.busDecide(player.pairId, socket.id, decision);
    if (!result) return;
    if (result.bailed) {
      io.to(game.roomCode).emit('bus:finished', { pairId: player.pairId, ...result });
      game.endBus(player.pairId);
    }
    syncAll(game);
  });

  // ─── bus:done ─────────────────────────────────────────────────────────────
  socket.on('bus:done', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    const busPair = Object.values(game.pairs).find(p => p.onBus && p.busState?.active);
    if (!busPair) return;
    const result = game.endBus(busPair.id);
    if (result) {
      io.to(game.roomCode).emit('bus:finished', { pairId: busPair.id, ...result });
      syncAll(game);
    }
  });

  // ─── sidequest:decline ───────────────────────────────────────────────────
  socket.on('sidequest:decline', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    io.to(game.roomCode).emit('sidequest:closed');
  });

  // ─── sidequest:accept ────────────────────────────────────────────────────
  socket.on('sidequest:accept', () => {
    // Client-side only — just broadcast so all screens show active quest UI
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    io.to(game.roomCode).emit('sidequest:accepted', { playerId: socket.id });
  });

  // ─── sidequest:result ────────────────────────────────────────────────────
  socket.on('sidequest:result', ({ pairId, won, drinksAtStake }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game || !game.players[socket.id]?.isHost) return;
    const pair = game.pairs[pairId];
    if (!pair) return;
    if (won) {
      pair.drinkCount = Math.max(0, pair.drinkCount - drinksAtStake);
      pair.pendingDrinks = 0;
    }
    io.to(game.roomCode).emit('sidequest:resolved', { pairId, won, drinksAtStake });
    syncAll(game);
  });

  // ─── sidequest:vote ──────────────────────────────────────────────────────
  socket.on('sidequest:vote', ({ vote }) => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    io.to(game.roomCode).emit('sidequest:votecast', { playerId: socket.id, vote });
  });

  // ─── disconnect ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const meta = socketMeta.get(socket.id);
    if (!meta) return;
    const game = rooms.get(meta.roomCode);
    if (!game) return;
    game.removePlayer(socket.id);
    socketMeta.delete(socket.id);
    io.to(meta.roomCode).emit('player:disconnected', {
      playerId: socket.id,
      name: game.players[socket.id]?.name || 'Someone',
    });
    syncAll(game);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Double Down server running on http://localhost:${PORT}`);
});
