import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import useGameStore from '../store/gameStore';
import Card from '../components/Card';

export default function BusRide() {
  const gameState = useGameStore(s => s.gameState);
  const mySocketId = useGameStore(s => s.mySocketId);
  const busFinalResult = useGameStore(s => s.busFinalResult);

  const pairs = gameState?.pairs || {};
  const players = gameState?.players || {};

  const busPair = Object.values(pairs).find(p => p.onBus);
  const busState = busPair?.busState;

  if (!busPair || !busState) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading bus ride…</p>
      </div>
    );
  }

  const isFlipper = mySocketId === busState.flipperId;
  const isDecider = mySocketId === busState.deciderId;
  const isSpectator = !isFlipper && !isDecider;

  const flipperName = players[busState.flipperId]?.name || 'Flipper';
  const deciderName = players[busState.deciderId]?.name || 'Decider';

  const handleFlip = useCallback(() => { socket.emit('bus:flip'); }, []);
  const handleDecide = useCallback((decision) => { socket.emit('bus:decide', { decision }); }, []);
  const handleDone = useCallback(() => { socket.emit('bus:done'); }, []);

  const busNames = busPair.playerIds.map(id => players[id]?.name || '?').join(' & ');
  const cardsFlipped = busState.cardsFlipped || [];
  const drinksPending = busState.drinksPending || 0;
  const finished = busState.finished || busFinalResult;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-hot)', marginBottom: 4 }}>
          🚌 Bus Ride
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>{busNames}</div>
        {isSpectator && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Watching 👀</div>}
      </div>

      {/* Drink counter */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: `1px solid ${drinksPending > 0 ? 'rgba(255,107,107,0.3)' : 'var(--border)'}`,
          borderRadius: 14,
          padding: '12px 32px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>Sips pending</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: drinksPending > 0 ? 'var(--accent-hot)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {drinksPending}
          </div>
        </div>
      </div>

      {/* Cards row */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {cardsFlipped.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No cards flipped yet</div>
        ) : (
          <div style={{
            overflowX: 'auto', display: 'flex', gap: 8, padding: '8px 0',
            justifyContent: cardsFlipped.length <= 4 ? 'center' : 'flex-start',
          }}>
            <AnimatePresence>
              {cardsFlipped.map((card, i) => (
                <motion.div key={i} initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Card suit={card.suit} value={card.value} faceUp size="md" index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 24 }}>
        {finished ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>{busFinalResult?.bailed ? '💀' : '🎉'}</div>
            <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>
              {busFinalResult?.bailed
                ? `${deciderName} bailed! ${flipperName} drinks ${busFinalResult.flipperDrinks}!`
                : 'Bus ride over!'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Total sips: {busPair.drinkCount}</div>
          </div>

        ) : isFlipper ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Flip a card. Face card = sip.</p>
            <button onClick={handleFlip} style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
              color: '#fff', border: 'none', borderRadius: 18,
              padding: '24px', fontSize: 28, fontWeight: 900,
              letterSpacing: 3, textTransform: 'uppercase',
              boxShadow: 'var(--glow-purple)',
            }}>
              Flip
            </button>
          </div>

        ) : isDecider ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Your call — help your partner or save yourself.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={() => handleDecide('continue')} style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6bffb8, #48bb78)',
                color: '#0a0510', border: 'none', borderRadius: 14,
                padding: '18px', fontSize: 18, fontWeight: 800,
              }}>
                Keep Going
              </button>
              <button onClick={() => handleDecide('bail')} style={{
                width: '100%',
                background: 'rgba(255,107,107,0.1)',
                color: 'var(--accent-hot)',
                border: '2px solid var(--accent-hot)',
                borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700,
              }}>
                Bail on {flipperName} 💀 (their sips ×2)
              </button>
            </div>
          </div>

        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15 }}>
            {busState.active ? 'Bus ride in progress…' : 'Waiting…'}
          </div>
        )}

        {!finished && busState.active && players[mySocketId]?.isHost && (
          <button onClick={handleDone} style={{
            width: '100%', background: 'transparent',
            border: '1px solid var(--border)', borderRadius: 12,
            padding: '12px', color: 'var(--text-muted)', fontSize: 14, marginTop: 16,
          }}>
            End Bus Ride (host)
          </button>
        )}
      </div>
    </div>
  );
}
