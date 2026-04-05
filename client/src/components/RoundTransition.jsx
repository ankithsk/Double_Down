import { useEffect } from 'react';
import { motion } from 'framer-motion';

const ROUND_INFO = {
  ROUND_1: { num: '1', title: 'Red or Black?',       color: '#ff6bcc', icon: '🃏' },
  ROUND_2: { num: '2', title: 'Higher or Lower?',    color: '#6b6bff', icon: '📈' },
  ROUND_3: { num: '3', title: 'Inside or Outside?',  color: '#ffd93d', icon: '🎯' },
  ROUND_4: { num: '4', title: 'Guess the Suit',      color: '#ff6b6b', icon: '♠️'  },
};

export default function RoundTransition({ phase, onDone }) {
  const info = ROUND_INFO[phase];

  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  if (!info) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(10,5,16,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      {/* Color pulse ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.6 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          width: 120, height: 120, borderRadius: '50%',
          border: `3px solid ${info.color}`,
        }}
      />

      <motion.div
        initial={{ scale: 0.4, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ fontSize: 56, marginBottom: 12 }}>{info.icon}</div>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 4,
          textTransform: 'uppercase', color: info.color, marginBottom: 8,
        }}>
          Round {info.num}
        </div>
        <div style={{
          fontSize: 36, fontWeight: 900, color: '#fff',
          letterSpacing: '-0.5px', textShadow: `0 0 30px ${info.color}80`,
        }}>
          {info.title}
        </div>
      </motion.div>
    </motion.div>
  );
}
