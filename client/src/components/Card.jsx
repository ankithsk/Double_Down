import { motion } from 'framer-motion';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RED_SUITS = ['hearts', 'diamonds'];

function CardFace({ suit, value }) {
  const isRed = RED_SUITS.includes(suit);
  const symbol = SUIT_SYMBOLS[suit] || '?';
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        background: '#fff',
        borderRadius: 12,
        border: '2px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: isRed ? '#e53e3e' : '#1a1a1a',
        fontFamily: 'Georgia, serif',
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 36, lineHeight: 1, marginTop: 4 }}>{symbol}</div>
    </div>
  );
}

function CardBack() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        borderRadius: 12,
        border: '2px solid #0f3460',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ fontSize: 32 }}>🃏</div>
    </div>
  );
}

export default function Card({ suit, value, faceUp = false, animateIn = false, size = 'md' }) {
  const sizes = {
    sm: { width: 60, height: 84 },
    md: { width: 90, height: 126 },
    lg: { width: 120, height: 168 },
  };
  const { width, height } = sizes[size] || sizes.md;

  return (
    <motion.div
      initial={animateIn ? { y: -40, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1, rotateY: faceUp ? 0 : 180 }}
      transition={{ duration: 0.4, type: 'spring', stiffness: 120, damping: 14 }}
      style={{
        width,
        height,
        position: 'relative',
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
    >
      <CardFace suit={suit} value={value} />
      <CardBack />
    </motion.div>
  );
}
