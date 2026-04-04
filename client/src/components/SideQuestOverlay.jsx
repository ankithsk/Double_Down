import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import useGameStore from '../store/gameStore';
import SideQuestTimer from './SideQuestTimer';
import { SIDE_QUESTS } from '../data/sidequests';

// ─── QuestReveal ─────────────────────────────────────────────────────────────
function QuestReveal({ quest, isMyQuest, players, onAccept, onDecline }) {
  const ICONS  = { charades: '🎬', rapidfire: '⚡', dare: '😈', mimicry: '🎭', trivia: '🧠' };
  const TITLES = { charades: 'Dumb Charades!', rapidfire: 'Rapid Fire!', dare: 'Truth or Dare!', mimicry: 'Mimicry Challenge!', trivia: 'Trivia Lifeline!' };
  const DESCS  = {
    charades:  'Act out the movie — no words, no sounds. Get it right → skip drinks.',
    rapidfire: 'Name 5 things in the category in 30 sec. 3+ correct → save drinks.',
    dare:      'Another player picks a dare. Complete it → skip drinks. Decline → drinks doubled.',
    mimicry:   'Impersonate the celebrity for 15 sec. Group votes. Win → drinks halved.',
    trivia:    'Answer a trivia question solo. Correct → skip drinks. Wrong → drinks doubled.',
  };

  const gameState = useGameStore(s => s.gameState);
  const pairNames = quest.pairId
    ? (gameState?.pairs?.[quest.pairId]?.playerIds || []).map(id => players[id]?.name || '?').join(' & ')
    : '';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{ background: 'linear-gradient(160deg, #2d0a4e, #0a1a3e)', border: '2px solid rgba(107,107,255,0.4)', borderRadius: 24, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 8px 40px rgba(107,107,255,0.3)', textAlign: 'center' }}
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
        style={{ display: 'inline-flex', width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16, boxShadow: '0 0 24px rgba(255,107,107,0.5)' }}
      >
        {ICONS[quest.type]}
      </motion.div>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: '#ffd93d', textTransform: 'uppercase', marginBottom: 6 }}>⚡ Side Quest Unlocked</div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10 }}>{TITLES[quest.type]}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 20 }}>{DESCS[quest.type]}</div>
      {pairNames && <div style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 20 }}>Challenge: <strong>{pairNames}</strong> · {quest.drinksAtStake} sips at stake</div>}
      {isMyQuest ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onAccept} style={{ background: 'linear-gradient(135deg, #ff6b6b, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 17, fontWeight: 800, boxShadow: 'var(--glow-hot)' }}>ACCEPT ⚡</button>
          <button onClick={onDecline} style={{ background: 'transparent', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px', fontSize: 14, fontWeight: 600 }}>skip it (keep drinks)</button>
        </div>
      ) : (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Waiting for {pairNames} to decide…</div>
      )}
    </motion.div>
  );
}

// ─── CharadesQuest ────────────────────────────────────────────────────────────
function CharadesQuest({ quest, isActor, isHost, onHostResult }) {
  const pool = [
    ...SIDE_QUESTS.charades.bollywood,
    ...SIDE_QUESTS.charades.hollywood,
    ...SIDE_QUESTS.charades.tv,
  ];
  const title = pool[quest.contentIndex % pool.length];

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>🎬 Dumb Charades</div>
      <SideQuestTimer seconds={60} onExpire={() => isHost && onHostResult(false)} color="var(--accent-primary)" />
      {isActor ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>You're acting! Others must guess:</div>
          <div style={{ background: 'rgba(107,107,255,0.15)', border: '2px solid var(--accent-primary)', borderRadius: 16, padding: '20px 24px', fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', boxShadow: 'var(--glow-purple)' }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>No words · No sounds · No mouthing</div>
        </>
      ) : (
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', padding: 24 }}>🎬 Guessing in progress…</div>
      )}
      {isHost && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => onHostResult(true)} style={{ flex: 1, background: 'rgba(107,255,184,0.15)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 15 }}>They got it! ✓</button>
          <button onClick={() => onHostResult(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15 }}>Nope ✗</button>
        </div>
      )}
    </div>
  );
}

// ─── TriviaQuest ──────────────────────────────────────────────────────────────
function TriviaQuest({ quest, isMyQuest, onAnswer }) {
  const q = SIDE_QUESTS.trivia[quest.contentIndex % SIDE_QUESTS.trivia.length];
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>🧠 Trivia Lifeline</div>
      <div style={{ background: 'rgba(107,107,255,0.1)', border: '1px solid rgba(107,107,255,0.3)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: '#fff' }}>{q.q}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => {
          let bg = 'var(--bg-surface)', border = 'var(--border)';
          if (selected !== null) {
            if (i === q.answer) { bg = 'rgba(107,255,184,0.15)'; border = 'var(--accent-green)'; }
            else if (i === selected) { bg = 'rgba(255,107,107,0.15)'; border = 'var(--accent-hot)'; }
          }
          return (
            <button key={i} onClick={() => {
              if (!isMyQuest || selected !== null) return;
              setSelected(i);
              setTimeout(() => onAnswer(i === q.answer), 700);
            }} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, textAlign: 'left', opacity: isMyQuest ? 1 : 0.5 }}>
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {!isMyQuest && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>No hints! Let them answer.</p>}
    </div>
  );
}

// ─── DareQuest ────────────────────────────────────────────────────────────────
function DareQuest({ quest, isMyQuest, isHost, players, mySocketId, votes, onHostResult }) {
  const baseDares = SIDE_QUESTS.dares;
  const shown = [0, 1, 2].map(i => baseDares[(quest.contentIndex + i) % baseDares.length]);
  const [chosenDare, setChosenDare] = useState(null);
  const [myVote, setMyVote] = useState(null);
  const [customDare, setCustomDare] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const pairPlayerIds = useGameStore.getState().gameState?.pairs?.[quest.pairId]?.playerIds || [];
  const amIPunished = pairPlayerIds.includes(mySocketId);
  const canPickDare = !amIPunished;

  const yesVotes = Object.values(votes).filter(v => v === 'yes').length;
  const noVotes  = Object.values(votes).filter(v => v === 'no').length;
  const totalVoters = Object.values(players).filter(p => p.connected).length - 1;

  function handleVote(v) { setMyVote(v); socket.emit('sidequest:vote', { vote: v }); }

  if (!chosenDare) {
    return (
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>😈 Pick a Dare</div>
        {canPickDare || isHost ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>Choose one dare for the punished player:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              {shown.map((dare, i) => (
                <button key={i} onClick={() => setChosenDare(dare)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, textAlign: 'left', lineHeight: 1.4 }}>{dare}</button>
              ))}
            </div>
            {!showCustom ? (
              <button onClick={() => setShowCustom(true)} style={{ width: '100%', background: 'transparent', border: '1px dashed rgba(255,217,61,0.4)', borderRadius: 12, padding: '12px', color: 'var(--accent-gold)', fontSize: 13, fontWeight: 700 }}>+ Write a custom dare</button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={customDare} onChange={e => setCustomDare(e.target.value)} placeholder="Type your dare…" style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--accent-gold)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 14, outline: 'none' }} />
                <button onClick={() => customDare.trim() && setChosenDare(customDare.trim())} style={{ background: 'var(--accent-gold)', color: '#0a0510', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 800, fontSize: 14 }}>Use</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 24, fontSize: 15 }}>Another player is picking your dare…</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>😈 The Dare</div>
      <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 16, padding: 20, marginBottom: 16, fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{chosenDare}</div>
      <SideQuestTimer seconds={30} onExpire={() => isHost && onHostResult(yesVotes >= noVotes)} color="var(--accent-hot)" />
      {!myVote && !isHost && (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => handleVote('yes')} style={{ flex: 1, background: 'rgba(107,255,184,0.15)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800 }}>👍 Done it</button>
          <button onClick={() => handleVote('no')} style={{ flex: 1, background: 'rgba(255,107,107,0.1)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800 }}>👎 Nope</button>
        </div>
      )}
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Votes: 👍 {yesVotes} · 👎 {noVotes} / {totalVoters}</div>
      {isHost && (
        <button onClick={() => onHostResult(yesVotes >= noVotes)} style={{ width: '100%', marginTop: 12, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800 }}>Close Vote</button>
      )}
    </div>
  );
}

// ─── MimicryQuest ─────────────────────────────────────────────────────────────
function MimicryQuest({ quest, isMyQuest, isHost, votes, players, mySocketId, onHostResult }) {
  const [pool, setPool] = useState('bollywood');
  const [assigned, setAssigned] = useState(null);
  const [myVote, setMyVote] = useState(null);

  const yesVotes = Object.values(votes).filter(v => v === 'yes').length;
  const noVotes  = Object.values(votes).filter(v => v === 'no').length;

  function handleAssign() {
    const arr = SIDE_QUESTS.mimicry[pool];
    setAssigned(arr[quest.contentIndex % arr.length]);
  }
  function handleVote(v) { setMyVote(v); socket.emit('sidequest:vote', { vote: v }); }

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>🎭 Mimicry Challenge</div>
      {!assigned ? (
        <>
          {isMyQuest ? (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Choose your pool — you can switch once before revealing:</p>
              <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                {[['bollywood', '🎬 Bollywood'], ['hollywood', '🎥 Hollywood']].map(([v, label]) => (
                  <button key={v} onClick={() => setPool(v)} style={{ flex: 1, background: pool === v ? 'var(--accent-primary)' : 'transparent', color: pool === v ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700 }}>{label}</button>
                ))}
              </div>
              <button onClick={handleAssign} style={{ width: '100%', background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 17, fontWeight: 800, boxShadow: 'var(--glow-purple)' }}>Reveal My Celebrity</button>
            </>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.4)', padding: 24 }}>Waiting for them to pick their celebrity…</div>
          )}
        </>
      ) : (
        <>
          <div style={{ background: 'rgba(107,107,255,0.15)', border: '2px solid var(--accent-primary)', borderRadius: 16, padding: '20px 24px', marginBottom: 8, boxShadow: 'var(--glow-purple)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{assigned.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{assigned.hint}</div>
          </div>
          <SideQuestTimer seconds={15} onExpire={() => {}} color="var(--accent-primary)" />
          {!myVote && !isMyQuest && !isHost && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => handleVote('yes')} style={{ flex: 1, background: 'rgba(107,255,184,0.15)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800 }}>👍 Nailed it</button>
              <button onClick={() => handleVote('no')} style={{ flex: 1, background: 'rgba(255,107,107,0.1)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800 }}>👎 Rubbish</button>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Votes: 👍 {yesVotes} · 👎 {noVotes}</div>
          {isHost && (
            <button onClick={() => onHostResult(yesVotes >= noVotes)} style={{ width: '100%', marginTop: 12, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800 }}>Close Vote</button>
          )}
        </>
      )}
    </div>
  );
}

// ─── RapidFireQuest ───────────────────────────────────────────────────────────
function RapidFireQuest({ quest, isMyQuest, isHost, onHostResult }) {
  const cats = SIDE_QUESTS.rapidfire;
  const cat = cats[quest.contentIndex % cats.length];
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>⚡ Rapid Fire</div>
      <SideQuestTimer seconds={30} onExpire={() => isHost && onHostResult(score >= 3)} color="var(--accent-gold)" />
      <div style={{ background: 'rgba(255,217,61,0.08)', border: '1px solid rgba(255,217,61,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{cat.category}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>e.g. {cat.examples.join(', ')}</div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--accent-gold)', marginBottom: 16, fontVariantNumeric: 'tabular-nums' }}>{score} / 5</div>
      {isHost && attempts < 5 && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setScore(s => s + 1); setAttempts(a => a + 1); }} style={{ flex: 1, background: 'rgba(107,255,184,0.15)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800, fontSize: 22 }}>✓</button>
          <button onClick={() => setAttempts(a => a + 1)} style={{ flex: 1, background: 'rgba(255,107,107,0.1)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800, fontSize: 22 }}>✗</button>
        </div>
      )}
      {isHost && attempts >= 5 && (
        <button onClick={() => onHostResult(score >= 3)} style={{ width: '100%', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, marginTop: 8 }}>
          Final: {score}/5 — {score >= 3 ? 'WIN 🎉' : 'LOSE 😬'}
        </button>
      )}
      {!isHost && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>Host is marking answers</p>}
    </div>
  );
}

// ─── QuestResult ──────────────────────────────────────────────────────────────
function QuestResult({ won, drinksAtStake, onDismiss }) {
  useEffect(() => { const t = setTimeout(onDismiss, 3000); return () => clearTimeout(t); }, []);
  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ textAlign: 'center', width: '100%', maxWidth: 380 }}
    >
      <div style={{ fontSize: 72, marginBottom: 12 }}>{won ? '🎉' : '😬'}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: won ? 'var(--accent-green)' : 'var(--accent-hot)', marginBottom: 8 }}>
        {won ? 'QUEST COMPLETE!' : 'QUEST FAILED!'}
      </div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
        {won ? `Saved ${drinksAtStake} sip${drinksAtStake !== 1 ? 's' : ''}!` : 'Drinks stay. Better luck next time.'}
      </div>
    </motion.div>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────
export default function SideQuestOverlay() {
  const activeSideQuest = useGameStore(s => s.activeSideQuest);
  const sideQuestVotes  = useGameStore(s => s.sideQuestVotes);
  const clearSideQuest  = useGameStore(s => s.clearSideQuest);
  const gameState       = useGameStore(s => s.gameState);
  const mySocketId      = useGameStore(s => s.mySocketId);

  const [phase, setPhase] = useState('reveal'); // 'reveal' | 'active' | 'result'
  const [result, setResult] = useState(null);

  const players      = gameState?.players || {};
  const isHost       = players[mySocketId]?.isHost;
  const pairPlayerIds = activeSideQuest
    ? (gameState?.pairs?.[activeSideQuest.pairId]?.playerIds || [])
    : [];
  const isMyQuest = pairPlayerIds.includes(mySocketId);
  const isActor   = isMyQuest && activeSideQuest?.type === 'charades';

  // Reset phase whenever a new quest arrives
  const questKey = activeSideQuest ? `${activeSideQuest.type}-${activeSideQuest.contentIndex}` : null;
  useEffect(() => { setPhase('reveal'); setResult(null); }, [questKey]);

  const handleAccept = useCallback(() => {
    socket.emit('sidequest:accept');
    setPhase('active');
  }, []);

  const handleDecline = useCallback(() => {
    socket.emit('sidequest:decline');
    clearSideQuest();
  }, [clearSideQuest]);

  const handleHostResult = useCallback((won) => {
    socket.emit('sidequest:result', {
      pairId: activeSideQuest?.pairId,
      won,
      drinksAtStake: activeSideQuest?.drinksAtStake,
    });
    setResult({ won, drinksAtStake: activeSideQuest?.drinksAtStake });
    setPhase('result');
  }, [activeSideQuest]);

  if (!activeSideQuest) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={questKey}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,2,16,0.97)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}
      >
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px rgba(107,107,255,0.12)', pointerEvents: 'none' }} />

        {phase === 'reveal' && (
          <QuestReveal quest={activeSideQuest} isMyQuest={isMyQuest} players={players} onAccept={handleAccept} onDecline={handleDecline} />
        )}
        {phase === 'active' && activeSideQuest.type === 'charades' && (
          <CharadesQuest quest={activeSideQuest} isActor={isActor} isHost={isHost} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'trivia' && (
          <TriviaQuest quest={activeSideQuest} isMyQuest={isMyQuest} onAnswer={won => isMyQuest && handleHostResult(won)} />
        )}
        {phase === 'active' && activeSideQuest.type === 'dare' && (
          <DareQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} players={players} mySocketId={mySocketId} votes={sideQuestVotes} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'mimicry' && (
          <MimicryQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} votes={sideQuestVotes} players={players} mySocketId={mySocketId} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'rapidfire' && (
          <RapidFireQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} onHostResult={handleHostResult} />
        )}
        {phase === 'result' && result && (
          <QuestResult won={result.won} drinksAtStake={result.drinksAtStake} onDismiss={clearSideQuest} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
