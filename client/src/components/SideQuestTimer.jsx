import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SideQuestTimer({ seconds, onExpire, color = 'var(--accent-primary)' }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) { clearInterval(interval); onExpire?.(); return 0; }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const pct = remaining / seconds;

  return (
    <div style={{ width: '100%', marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-muted)' }}>
        <span>Time left</span>
        <span style={{ fontWeight: 800, color: remaining <= 5 ? 'var(--accent-hot)' : color, fontVariantNumeric: 'tabular-nums' }}>
          {remaining}s
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
          style={{ height: '100%', background: remaining <= 5 ? 'var(--accent-hot)' : color, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}
