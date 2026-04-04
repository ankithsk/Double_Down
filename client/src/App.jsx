import useSocket from './hooks/useSocket';
import useGameStore from './store/gameStore';
import Lobby from './screens/Lobby';
import Game from './screens/Game';
import BusRide from './screens/BusRide';
import socket from './socket';

const GAME_PHASES = ['ROUND_1', 'ROUND_2', 'ROUND_3', 'ROUND_4'];

function GameOver() {
  const gameState = useGameStore(s => s.gameState);
  const pairs = Object.values(gameState?.pairs || {});
  const players = gameState?.players || {};
  const sorted = [...pairs].sort((a, b) => a.drinkCount - b.drinkCount);

  function handlePlayAgain() {
    socket.emit('game:restart');
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🏁</div>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4, color: 'var(--text-primary)' }}>Game Over</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Final drink counts</p>

      <div style={{ width: '100%', maxWidth: 400, marginBottom: 32 }}>
        {sorted.map((pair, i) => {
          const names = pair.playerIds.map(id => players[id]?.name || '?').join(' & ');
          const medals = ['🥇', '🥈', '🥉'];
          const icon = i === sorted.length - 1 ? '🚌' : (medals[i] || '');
          return (
            <div key={pair.id} style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{icon}</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{names}</span>
              </div>
              <span style={{
                fontSize: 20,
                fontWeight: 900,
                color: i === sorted.length - 1 ? 'var(--accent-hot)' : 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {pair.drinkCount} 🍺
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={handlePlayAgain}
        style={{
          background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
          color: '#fff',
          border: 'none',
          borderRadius: 14,
          padding: '16px 40px',
          fontSize: 18,
          fontWeight: 800,
          width: '100%',
          maxWidth: 400,
          boxShadow: 'var(--glow-purple)',
        }}
      >
        Ride Again?
      </button>
    </div>
  );
}

export default function App() {
  useSocket();
  const gameState = useGameStore(s => s.gameState);
  const phase = gameState?.phase || 'LOBBY';

  if (phase === 'BUS') return <BusRide />;
  if (phase === 'GAME_OVER') return <GameOver />;
  if (GAME_PHASES.includes(phase)) return <Game />;
  return <Lobby />;
}
