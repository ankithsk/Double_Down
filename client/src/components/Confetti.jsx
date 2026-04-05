import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#6b6bff', '#ff6b6b', '#ffd93d', '#6bffb8', '#ff6bcc', '#fff'];

function randomBetween(a, b) { return a + Math.random() * (b - a); }

export default function Confetti({ count = 80 }) {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: randomBetween(5, 95),           // % from left
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: randomBetween(6, 14),
      duration: randomBetween(2.5, 4.5),
      delay: randomBetween(0, 1.2),
      rotate: randomBetween(-180, 180),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
  );

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotate, scale: 0.5 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            top: 0,
            width: p.size,
            height: p.shape === 'circle' ? p.size : p.size * 0.5,
            borderRadius: p.shape === 'circle' ? '50%' : 2,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}80`,
          }}
        />
      ))}
    </div>
  );
}
