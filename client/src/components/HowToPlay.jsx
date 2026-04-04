import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  {
    icon: '🃏',
    title: 'The Game',
    color: 'var(--accent-primary)',
    body: 'Double Down is a 4-round drinking card game for 2–8 players. Each round you guess something about the next card flipped. Get it wrong → take sips. Get it right → stay dry.',
  },
  {
    icon: '👥',
    title: 'Teams vs Every Man for Himself',
    color: 'var(--accent-gold)',
    body: 'In Teams mode, players are paired up and share a hand of cards. In Every Man for Himself, everyone plays solo — no partners, pure chaos.',
  },
  {
    icon: '1️⃣',
    title: 'Round 1 — Red or Black?',
    color: '#ff6bcc',
    body: 'Both partners secretly guess the colour of the hidden card. Reveal together:\n• Both right → safe\n• Both wrong → 1 sip each\n• You disagree → 1 sip each (even if one was right)',
  },
  {
    icon: '2️⃣',
    title: 'Round 2 — Higher or Lower?',
    color: 'var(--accent-green)',
    body: 'One player guesses whether the next card is higher, lower, or equal to the first. Partner then chooses:\n• Double Down — if wrong, drinks ×2\n• Shield — take 1 sip now, halve the wrong-penalty\n• Pass — no change',
  },
  {
    icon: '3️⃣',
    title: 'Round 3 — Inside or Outside?',
    color: 'var(--accent-gold)',
    body: 'Guess if the third card falls between your first two cards (Inside) or beyond them (Outside). Same partner response mechanic applies. Miss → 2 sips.',
  },
  {
    icon: '4️⃣',
    title: 'Round 4 — Guess the Suit',
    color: 'var(--accent-hot)',
    body: 'Guess the exact suit (♥ ♦ ♣ ♠) of the last card. Miss → 3 sips. This is the big one.',
  },
  {
    icon: '🚌',
    title: 'The Bus Ride',
    color: 'var(--accent-hot)',
    body: 'The pair with the most sips at the end rides the bus. Flip cards one at a time — each face card (J/Q/K/A) adds a sip to a running total. The decider can Bail at any time, doubling the flipper\'s total. Clear the deck to escape safely.',
  },
  {
    icon: '⚡',
    title: 'Side Quests',
    color: '#c4b5fd',
    body: 'When a punishment is 2+ sips, there\'s a chance a Side Quest interrupts! Win a mini-game to skip your drinks:\n• Dumb Charades — act out a movie\n• Rapid Fire — name 5 things in 30 sec\n• Dare — community pick a dare\n• Mimicry — impersonate a celeb\n• Trivia — answer a question solo',
  },
];

export default function HowToPlay({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(5, 2, 16, 0.96)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={e => e.stopPropagation()}
          style={{ padding: '24px 16px 48px', maxWidth: 480, margin: '0 auto', width: '100%' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 4 }}>HOW TO PLAY</div>
              <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>Double Down</div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                borderRadius: '50%', width: 40, height: 40, minHeight: 40,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: 'var(--text-muted)',
              }}
            >
              ✕
            </button>
          </div>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sections.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${s.color}`,
                  borderRadius: 14,
                  padding: '16px 18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 15, color: s.color }}>{s.title}</span>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {s.body}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button
              onClick={onClose}
              style={{
                background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
                color: '#fff', border: 'none', borderRadius: 14,
                padding: '16px 40px', fontSize: 16, fontWeight: 800,
                boxShadow: 'var(--glow-purple)',
              }}
            >
              Let's Play!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
