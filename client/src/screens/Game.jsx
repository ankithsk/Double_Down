import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import useGameStore from '../store/gameStore';
import PairPanel from '../components/PairPanel';
import RoundPrompt from '../components/RoundPrompt';
import RoundTransition from '../components/RoundTransition';
import Card from '../components/Card';
import { sounds, toggleMute, isMuted } from '../audio';
import { haptics } from '../haptics';
import {
  R1Buttons,
  R2Buttons,
  R3Buttons,
  R4Buttons,
  PartnerResponseButtons,
} from '../components/ActionButtons';

const QUEST_ICONS = { charades: '🎬', rapidfire: '⚡', dare: '😈', mimicry: '🎭', trivia: '🧠' };

function RevealOverlay({ reveal, onDismiss, myPairId, pairs, players }) {
  useEffect(() => {
    if (!reveal) return;
    if (reveal.drinks > 0) { sounds.wrong(); haptics.error(); }
    else { sounds.correct(); haptics.success(); }
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [reveal, onDismiss]);

  if (!reveal) return null;
  const drank = reveal.drinks > 0;
  const isMyPair = reveal.pairId === myPairId;

  // Build name label — "YOU" for your pair, first names for others
  const pairPlayerIds = pairs[reveal.pairId]?.playerIds || [];
  const pairNames = pairPlayerIds.map(id => players[id]?.name || '?');
  const nameLabel = isMyPair
    ? (pairNames.length === 1 ? pairNames[0].toUpperCase() : 'YOU')
    : pairNames.map(n => n.split(' ')[0]).join(' & ').toUpperCase();

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
          style={{ marginBottom: 28 }}
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
          <div style={{
            fontSize: nameLabel.length > 10 ? 20 : 24,
            fontWeight: 900, letterSpacing: 2,
            textTransform: 'uppercase',
            color: isMyPair ? '#fff' : 'rgba(255,255,255,0.7)',
            marginBottom: 4,
          }}>
            {nameLabel}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-hot)', marginBottom: 8 }}>
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
            fontSize: nameLabel.length > 10 ? 22 : 28,
            fontWeight: 900, letterSpacing: 1,
            color: 'rgba(255,255,255,0.7)', marginBottom: 8,
          }}>
            {nameLabel}
          </div>
          <div style={{
            fontSize: 52, fontWeight: 900,
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

function getMyTurn(phase, pair, mySocketId, gameMode) {
  const rs = pair?.roundState;
  if (!rs || rs.resolved) return null;

  if (phase === 'ROUND_1') {
    // Solo: waitingFor is always 'guess' — show R1 buttons immediately
    if (gameMode === 'solo_individual') {
      return rs.waitingFor === 'guess' && mySocketId === rs.guessBy ? 'r1' : null;
    }
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
  const gameMode = useGameStore(s => s.gameMode);
  const questHistory = useGameStore(s => s.questHistory);

  const [showReveal, setShowReveal] = useState(null);
  const [nextRoundThrottle, setNextRoundThrottle] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [muted, setMuted] = useState(isMuted);
  const prevPhaseRef = useRef(null);

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
      // Play streak sound when on a roll
      if (lastReveal.streak >= 2) setTimeout(() => sounds.streak(), 400);
    }
  }, [lastReveal, setLastReveal]);

  // Round transition overlay
  useEffect(() => {
    if (prevPhaseRef.current && prevPhaseRef.current !== phase) {
      sounds.roundStart();
      setShowTransition(true);
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const dismissReveal = useCallback(() => setShowReveal(null), []);

  const myTurn = getMyTurn(phase, myPair, mySocketId, gameMode);

  const handleR1Guess = useCallback((guess) => {
    sounds.cardFlip(); haptics.light();
    socket.emit('round:r1Guess', { guess });
  }, []);

  const handleGuess = useCallback((guess) => {
    sounds.cardFlip(); haptics.light();
    socket.emit('round:guess', { guess });
  }, []);

  const handlePartnerResponse = useCallback((response) => {
    sounds.cardFlip(); haptics.medium();
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
      const partnerName = players[isA ? myPair.playerIds[1] : myPair.playerIds[0]]?.name || 'Partner';
      if (myGuess) return `Waiting for ${partnerName} to guess…`;
    }
    if (rs.waitingFor === 'partnerResponse' && mySocketId === rs.guessBy && gameMode !== 'solo_individual') {
      const partnerName = players[rs.partnerOf]?.name || 'Partner';
      return `Waiting for ${partnerName} to respond…`;
    }
    if (rs.waitingFor === 'guess' && mySocketId !== rs.guessBy && gameMode !== 'solo_individual') {
      return `${players[rs.guessBy]?.name || 'Partner'} is guessing…`;
    }
    return null;
  })();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

      {/* Top bar: mode badge + mute */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 0' }}>
        <div>
          {gameMode === 'solo_individual' && (
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--accent-gold)', background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.3)', borderRadius: 6, padding: '3px 10px' }}>
              Every Man for Himself
            </span>
          )}
        </div>
        <button
          onClick={() => { const next = toggleMute(); setMuted(next); }}
          style={{ background: 'none', border: 'none', fontSize: 20, minHeight: 'auto', padding: '4px 8px', opacity: 0.6 }}
          title={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>

      {/* Pair panels — scrollable top section */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 0' }}>
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

      {/* Quest history chips */}
      {questHistory.length > 0 && (
        <div style={{ overflowX: 'auto', display: 'flex', gap: 6, padding: '4px 16px', scrollbarWidth: 'none' }}>
          {questHistory.map((q, i) => (
            <span key={i} style={{
              flexShrink: 0, fontSize: 11, fontWeight: 700,
              background: q.won ? 'rgba(107,255,184,0.12)' : 'rgba(255,107,107,0.12)',
              border: `1px solid ${q.won ? 'rgba(107,255,184,0.3)' : 'rgba(255,107,107,0.3)'}`,
              color: q.won ? 'var(--accent-green)' : 'var(--accent-hot)',
              borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
            }}>
              {QUEST_ICONS[q.type]} {q.names} {q.won ? 'won' : 'lost'}
            </span>
          ))}
        </div>
      )}

      {/* Round prompt */}
      <RoundPrompt phase={phase} />

      {/* Action area — fixed bottom */}
      <div style={{ padding: '0 16px 16px' }}>

        {/* YOUR TURN banner */}
        {myTurn && !allResolved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            <span style={{
              display: 'inline-block',
              fontSize: 11, fontWeight: 800, letterSpacing: 3,
              textTransform: 'uppercase', color: '#0a0510',
              background: myTurn === 'partnerResponse'
                ? 'var(--accent-gold)'
                : 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
              borderRadius: 8, padding: '5px 14px',
            }}>
              {myTurn === 'partnerResponse' ? '⚡ Your move — support or bail?' : '👇 Your turn'}
            </span>
          </motion.div>
        )}

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
        {myTurn === 'partnerResponse' && gameMode !== 'solo_individual' && (
          <>
            {myPair?.roundState?.guess && (
              <div style={{ textAlign: 'center', marginBottom: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                {players[myPair.roundState.guessBy]?.name?.split(' ')[0] || 'Partner'} guessed{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                  {myPair.roundState.guess.toUpperCase()}
                </span>
              </div>
            )}
            <PartnerResponseButtons onResponse={handlePartnerResponse} disabled={false} />
          </>
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

      {/* Round transition */}
      <AnimatePresence>
        {showTransition && (
          <RoundTransition phase={phase} onDone={() => setShowTransition(false)} />
        )}
      </AnimatePresence>

      {/* Reveal overlay */}
      <AnimatePresence>
        {showReveal && (
          <RevealOverlay
            reveal={showReveal}
            onDismiss={dismissReveal}
            myPairId={myPairId}
            pairs={pairs}
            players={players}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
