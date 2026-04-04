import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import useGameStore from '../store/gameStore';
import PairPanel from '../components/PairPanel';
import RoundPrompt from '../components/RoundPrompt';
import Card from '../components/Card';
import {
  R1Buttons,
  R2Buttons,
  R3Buttons,
  R4Buttons,
  PartnerResponseButtons,
} from '../components/ActionButtons';

function RevealOverlay({ reveal, onDismiss }) {
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [reveal, onDismiss]);

  if (!reveal) return null;
  const drank = reveal.drinks > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: drank ? 'rgba(20,4,12,0.97)' : 'rgba(4,20,12,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}
    >
      {/* Edge glow */}
      <div style={{
        position: 'absolute', inset: 0,
        boxShadow: drank
          ? 'inset 0 0 80px rgba(255,107,107,0.4)'
          : 'inset 0 0 80px rgba(107,255,184,0.3)',
        pointerEvents: 'none',
      }} />

      {reveal.card && (
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ marginBottom: 32 }}
        >
          <Card suit={reveal.card.suit} value={reveal.card.value} faceUp size="lg" />
        </motion.div>
      )}

      {drank ? (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-hot)', marginBottom: 8 }}>
            TAKE
          </div>
          <div style={{
            fontSize: 96, fontWeight: 900, lineHeight: 1,
            color: '#fff', fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 40px rgba(255,107,107,0.8)',
          }}>
            {reveal.drinks}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-hot)', marginTop: 4 }}>
            SIP{reveal.drinks !== 1 ? 'S' : ''}
          </div>
          {reveal.disagreed && (
            <div style={{ fontSize: 13, color: 'var(--accent-gold)', marginTop: 16 }}>
              +1 for disagreeing with your partner
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: 80, marginBottom: 8 }}>✅</div>
          <div style={{
            fontSize: 56, fontWeight: 900,
            color: 'var(--accent-green)',
            textShadow: '0 0 40px rgba(107,255,184,0.6)',
          }}>
            SAFE!
          </div>
        </motion.div>
      )}

      <div style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        tap to continue
      </div>
    </motion.div>
  );
}

function getMyTurn(phase, pair, mySocketId) {
  const rs = pair?.roundState;
  if (!rs || rs.resolved) return null;

  if (phase === 'ROUND_1') {
    const isA = mySocketId === pair.playerIds[0];
    if (rs.waitingFor === 'bothGuess') {
      const myGuess = isA ? rs.guessA : rs.guessB;
      return myGuess ? null : 'r1';
    }
    return null;
  }

  if (rs.waitingFor === 'guess' && mySocketId === rs.guessBy) return 'guess';
  if (rs.waitingFor === 'partnerResponse' && mySocketId === rs.partnerOf) return 'partnerResponse';
  return null;
}

export default function Game() {
  const gameState = useGameStore(s => s.gameState);
  const mySocketId = useGameStore(s => s.mySocketId);
  const myPairId = useGameStore(s => s.myPairId);
  const lastReveal = useGameStore(s => s.lastReveal);
  const setLastReveal = useGameStore(s => s.setLastReveal);

  const [showReveal, setShowReveal] = useState(null);
  const [nextRoundThrottle, setNextRoundThrottle] = useState(false);

  const phase = gameState?.phase || 'ROUND_1';
  const players = gameState?.players || {};
  const pairs = gameState?.pairs || {};
  const myPair = pairs[myPairId];
  const me = players[mySocketId];
  const isHost = me?.isHost;

  useEffect(() => {
    if (lastReveal) {
      setShowReveal(lastReveal);
      setLastReveal(null);
    }
  }, [lastReveal, setLastReveal]);

  const dismissReveal = useCallback(() => setShowReveal(null), []);

  const myTurn = getMyTurn(phase, myPair, mySocketId);

  const handleR1Guess = useCallback((guess) => {
    socket.emit('round:r1Guess', { guess });
  }, []);

  const handleGuess = useCallback((guess) => {
    socket.emit('round:guess', { guess });
  }, []);

  const handlePartnerResponse = useCallback((response) => {
    socket.emit('round:partnerResponse', { response });
  }, []);

  const handleNextRound = useCallback(() => {
    if (nextRoundThrottle) return;
    socket.emit('game:nextRound');
    setNextRoundThrottle(true);
    setTimeout(() => setNextRoundThrottle(false), 1500);
  }, [nextRoundThrottle]);

  const allResolved = Object.values(pairs).every(p => p.roundState?.resolved);
  const sortedPairs = Object.values(pairs).sort((a, b) => {
    if (a.id === myPairId) return -1;
    if (b.id === myPairId) return 1;
    return 0;
  });

  const waitingMsg = (() => {
    if (!myPair?.roundState) return null;
    const rs = myPair.roundState;
    if (rs.resolved) return null;
    if (phase === 'ROUND_1' && rs.waitingFor === 'bothGuess') {
      const isA = mySocketId === myPair.playerIds[0];
      const myGuess = isA ? rs.guessA : rs.guessB;
      if (myGuess) return 'Waiting for partner to guess…';
    }
    if (rs.waitingFor === 'partnerResponse' && mySocketId === rs.guessBy) {
      return 'Waiting for partner response…';
    }
    if (rs.waitingFor === 'guess' && mySocketId !== rs.guessBy) {
      return `${players[rs.guessBy]?.name || 'Partner'} is guessing…`;
    }
    return null;
  })();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      {/* Pair panels — scrollable top section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
        {sortedPairs.map(pair => (
          <PairPanel
            key={pair.id}
            pair={pair}
            players={players}
            mySocketId={mySocketId}
            isMyPair={pair.id === myPairId}
            compact={sortedPairs.length > 2}
          />
        ))}
      </div>

      {/* Round prompt */}
      <RoundPrompt phase={phase} />

      {/* Action area — fixed bottom */}
      <div style={{ padding: '0 16px 16px' }}>
        {myTurn === 'r1' && (
          <R1Buttons onGuess={handleR1Guess} disabled={false} />
        )}
        {myTurn === 'guess' && phase === 'ROUND_2' && (
          <R2Buttons onGuess={handleGuess} disabled={false} />
        )}
        {myTurn === 'guess' && phase === 'ROUND_3' && (
          <R3Buttons onGuess={handleGuess} disabled={false} />
        )}
        {myTurn === 'guess' && phase === 'ROUND_4' && (
          <R4Buttons onGuess={handleGuess} disabled={false} />
        )}
        {myTurn === 'partnerResponse' && (
          <PartnerResponseButtons onResponse={handlePartnerResponse} disabled={false} />
        )}
        {!myTurn && waitingMsg && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 15,
            padding: '16px 0',
          }}>
            {waitingMsg}
          </div>
        )}
        {isHost && allResolved && (
          <button
            onClick={handleNextRound}
            disabled={nextRoundThrottle}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '18px',
              fontSize: 18,
              fontWeight: 800,
              marginTop: 12,
              boxShadow: 'var(--glow-purple)',
              opacity: nextRoundThrottle ? 0.5 : 1,
            }}
          >
            Next Round →
          </button>
        )}
        {!isHost && allResolved && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 15, padding: '16px 0' }}>
            Waiting for host to advance…
          </div>
        )}
      </div>

      {/* Reveal overlay */}
      <AnimatePresence>
        {showReveal && (
          <RevealOverlay reveal={showReveal} onDismiss={dismissReveal} />
        )}
      </AnimatePresence>
    </div>
  );
}
