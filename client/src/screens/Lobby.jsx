import { useState, useCallback, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import socket from '../socket';
import useGameStore from '../store/gameStore';

function InitialsAvatar({ name, color }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%', background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

const AVATAR_COLORS = ['#6b6bff', '#6bffb8', '#ffd93d', '#ff6b6b', '#ff6bcc', '#48bb78', '#38b2ac', '#fc8181'];
function avatarColor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getPairName(pairs, playerId) {
  for (const [pairId, pair] of Object.entries(pairs)) {
    if (pair.playerIds.includes(playerId)) return pairId.replace('pair-', 'Pair ');
  }
  return null;
}

export default function Lobby() {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectingPair, setSelectingPair] = useState(null);
  const [gameMode, setGameMode] = useState('teams');
  const [showModePicker, setShowModePicker] = useState(false);

  const roomCode = useGameStore(s => s.roomCode);
  const gameState = useGameStore(s => s.gameState);
  const mySocketId = useGameStore(s => s.mySocketId);
  const error = useGameStore(s => s.error);
  const clearError = useGameStore(s => s.clearError);

  const players = gameState?.players || {};
  const pairs = gameState?.pairs || {};
  const me = players[mySocketId];
  const isHost = me?.isHost;
  const playerList = Object.values(players).filter(p => p.connected);
  const allPaired = playerList.length >= 2 && playerList.every(p => p.pairId);

  useEffect(() => {
    const storedRoom = sessionStorage.getItem('dd_room');
    const storedPid = sessionStorage.getItem('dd_pid');
    if (storedRoom && storedPid && !socket.connected) {
      socket.auth = { roomCode: storedRoom, previousId: storedPid };
      socket.connect();
    }
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;
    setShowModePicker(true);
  }, [name]);

  const handleConfirmCreate = useCallback(() => {
    setShowModePicker(false);
    if (socket.connected) { socket.emit('room:create', { playerName: name.trim(), gameMode }); }
    else { socket.auth = {}; socket.once('connect', () => socket.emit('room:create', { playerName: name.trim(), gameMode })); socket.connect(); }
  }, [name, gameMode]);

  const handleJoin = useCallback(() => {
    if (!name.trim() || !joinCode.trim()) return;
    const doJoin = () => socket.emit('room:join', { roomCode: joinCode.trim().toUpperCase(), playerName: name.trim() });
    if (socket.connected) { doJoin(); }
    else { socket.auth = {}; socket.once('connect', doJoin); socket.connect(); }
  }, [name, joinCode]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }, [roomCode]);

  const handleAutoPair = useCallback(() => { socket.emit('pair:autoAssign'); }, []);
  const handleStart = useCallback(() => { socket.emit('game:start', { gameMode }); }, [gameMode]);

  const handlePlayerTap = useCallback((playerId) => {
    if (!isHost) return;
    if (!selectingPair) { setSelectingPair(playerId); }
    else {
      if (selectingPair !== playerId) socket.emit('pair:assign', { playerIdA: selectingPair, playerIdB: playerId });
      setSelectingPair(null);
    }
  }, [isHost, selectingPair]);

  const joinUrl = roomCode ? `${window.location.origin}?join=${roomCode}` : '';

  // ── Mode picker (shown after name entered, before room is created) ─────────
  if (showModePicker && !roomCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4, letterSpacing: '-0.5px' }}>Game Mode</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center' }}>How are you playing tonight?</p>

        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {[
            { value: 'teams', icon: '👥', title: 'Teams', desc: 'Pair up — share drinks, use partner moves (Double Down / Shield)' },
            { value: 'solo_individual', icon: '🧍', title: 'Every Man for Himself', desc: 'Everyone plays individually — pure chaos, no partners' },
          ].map(({ value, icon, title, desc }) => (
            <button key={value} onClick={() => setGameMode(value)} style={{
              background: gameMode === value ? 'rgba(107,107,255,0.2)' : 'var(--bg-surface)',
              border: gameMode === value ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              boxShadow: gameMode === value ? 'var(--glow-purple)' : 'none',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
              color: 'var(--text-primary)', textAlign: 'left', transition: 'all 0.15s',
            }}>
              <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button onClick={handleConfirmCreate} style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
          color: '#fff', border: 'none', borderRadius: 16,
          padding: '18px', fontSize: 18, fontWeight: 800,
          boxShadow: 'var(--glow-purple)',
        }}>
          Create Room →
        </button>
        <button onClick={() => setShowModePicker(false)} style={{ marginTop: 12, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, minHeight: 'auto' }}>
          ← Back
        </button>
      </div>
    );
  }

  // ── Pre-room: name entry ────────────────────────────────────────────────
  if (!roomCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, marginBottom: 4, textAlign: 'center' }}>Double Down</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center' }}>A drinking card game for groups</p>

        {error && (
          <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid var(--accent-hot)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: 'var(--accent-hot)', fontSize: 14, width: '100%', maxWidth: 380, textAlign: 'center' }}>
            {error}
            <button onClick={clearError} style={{ background: 'none', border: 'none', color: 'inherit', marginLeft: 8, minHeight: 'auto', fontSize: 16 }}>✕</button>
          </div>
        )}

        <div style={{ width: '100%', maxWidth: 380 }}>
          <input
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'create' ? handleCreate() : handleJoin())}
            placeholder="Your name" autoFocus maxLength={20}
            style={{ width: '100%', background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '14px 18px', color: 'var(--text-primary)', fontSize: 20, outline: 'none', marginBottom: 16 }}
          />

          <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
            {['create', 'join'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, background: mode === m ? 'var(--accent-primary)' : 'transparent', color: mode === m ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 10, padding: '10px', fontSize: 15, fontWeight: 700, transition: 'all 0.15s' }}>
                {m === 'create' ? 'Create Room' : 'Join Room'}
              </button>
            ))}
          </div>

          {mode === 'join' && (
            <input
              value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Room code" maxLength={4}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '14px 18px', color: 'var(--text-primary)', fontSize: 28, fontWeight: 700, letterSpacing: 8, textAlign: 'center', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', outline: 'none', marginBottom: 16 }}
            />
          )}

          <button
            onClick={mode === 'create' ? handleCreate : handleJoin}
            disabled={!name.trim() || (mode === 'join' && joinCode.length < 4)}
            style={{ width: '100%', background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 18, fontWeight: 800, boxShadow: 'var(--glow-purple)', opacity: (!name.trim() || (mode === 'join' && joinCode.length < 4)) ? 0.4 : 1 }}
          >
            {mode === 'create' ? 'Create Room' : 'Join Game'}
          </button>
        </div>
      </div>
    );
  }

  // ── In-room view ────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '24px 16px 100px' }}>

      {/* Room code */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 8 }}>Room Code — tap to copy</p>
        <button onClick={handleCopyCode} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 32px', width: '100%', maxWidth: 340, display: 'block', margin: '0 auto' }}>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 48, fontWeight: 900, letterSpacing: 12, color: 'var(--accent-primary)', textShadow: 'var(--glow-purple)' }}>
            {roomCode}
          </span>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{copied ? '✓ Copied!' : 'Tap to copy'}</div>
        </button>
        {joinUrl && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 8, display: 'inline-block' }}>
              <QRCodeSVG value={joinUrl} size={120} />
            </div>
          </div>
        )}
      </div>

      {/* Players */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
          {playerList.length} player{playerList.length !== 1 ? 's' : ''} in room
          {isHost && ' — tap two players to pair them'}
        </p>
        {playerList.map(p => {
          const pairName = getPairName(pairs, p.id);
          const isSelected = selectingPair === p.id;
          return (
            <div key={p.id} onClick={() => handlePlayerTap(p.id)} style={{
              background: isSelected ? 'rgba(107,107,255,0.2)' : 'var(--bg-surface)',
              border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              boxShadow: isSelected ? 'var(--glow-purple)' : 'none',
              borderRadius: 14, padding: '12px 16px', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: isHost ? 'pointer' : 'default', transition: 'all 0.15s',
            }}>
              <InitialsAvatar name={p.name} color={avatarColor(p.id)} />
              <span style={{ fontWeight: 700, fontSize: 16, flex: 1 }}>{p.name}</span>
              {p.id === mySocketId && <span style={{ fontSize: 11, background: 'var(--accent-primary)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>You</span>}
              {p.isHost && <span style={{ fontSize: 12, color: 'var(--accent-gold)', fontWeight: 700 }}>Host</span>}
              {pairName && <span style={{ fontSize: 11, color: 'var(--accent-green)', background: 'rgba(107,255,184,0.1)', border: '1px solid rgba(107,255,184,0.3)', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>{pairName}</span>}
            </div>
          );
        })}
      </div>

      {/* Host controls */}
      {isHost && (
        <div style={{ marginBottom: 16 }}>
          <button onClick={handleAutoPair} disabled={playerList.length < 2} style={{ width: '100%', background: 'transparent', border: '2px solid var(--border)', borderRadius: 14, padding: '12px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 700, opacity: playerList.length < 2 ? 0.4 : 1 }}>
            Auto-Pair Players
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid var(--accent-hot)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, color: 'var(--accent-hot)', fontSize: 14, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* Start button */}
      {isHost && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px', background: 'linear-gradient(to top, var(--bg-deep) 60%, transparent)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
          <button
            onClick={handleStart}
            disabled={!allPaired}
            style={{
              width: '100%', maxWidth: 500, display: 'block', margin: '0 auto',
              background: allPaired ? 'linear-gradient(135deg, #6b6bff, #ff6bcc)' : 'var(--bg-surface)',
              color: allPaired ? '#fff' : 'var(--text-muted)',
              border: allPaired ? 'none' : '2px solid var(--border)',
              borderRadius: 16, padding: '18px', fontSize: 19, fontWeight: 800,
              boxShadow: allPaired ? 'var(--glow-purple)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {allPaired ? 'Start Game →' : playerList.length < 2 ? 'Waiting for players…' : 'Pair all players first'}
          </button>
        </div>
      )}
    </div>
  );
}
