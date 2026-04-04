import { motion } from 'framer-motion';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RED_SUITS = ['hearts', 'diamonds'];
const ROTATIONS = [-3, -1, 1, 3];

function CardFace({ suit, value }) {
  const isRed = RED_SUITS.includes(suit);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
      background: '#fff',
      borderRadius: 12,
      border: '2px solid #e8e0f0',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: isRed ? '#ff6b6b' : '#1a0a2e',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{value}</div>
      <div style={{ fontSize: 36, lineHeight: 1, marginTop: 4 }}>{SUIT_SYMBOLS[suit] || '?'}</div>
    </div>
  );
}

function CardBack() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      background: 'linear-gradient(135deg, #1e1535 0%, #130d20 50%, #0a0510 100%)',
      borderRadius: 12,
      border: '2px solid rgba(107,107,255,0.3)',
      boxShadow: '0 0 12px rgba(107,107,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'repeating-linear-gradient(45deg, #6b6bff 0, #6b6bff 1px, transparent 0, transparent 50%)',
        backgroundSize: '12px 12px',
      }} />
      <div style={{ fontSize: 28, position: 'relative' }}>🃏</div>
    </div>
  );
}

export default function Card({ suit, value, faceUp = false, animateIn = false, size = 'md', index = 0 }) {
  const sizes = { sm: { width: 60, height: 84 }, md: { width: 90, height: 126 }, lg: { width: 120, height: 168 } };
  const { width, height } = sizes[size] || sizes.md;
  const baseRotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <div style={{ perspective: 1000, width, height, flexShrink: 0 }}>
      <motion.div
        initial={animateIn ? { y: -50, opacity: 0, rotate: baseRotation } : false}
        animate={{ y: 0, opacity: 1, rotateY: faceUp ? 0 : 180, rotate: baseRotation }}
        whileTap={{ rotate: 0, scale: 1.05 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 120, damping: 14 }}
        style={{ width, height, position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <CardFace suit={suit} value={value} />
        <CardBack />
      </motion.div>
    </div>
  );
}
