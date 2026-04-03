import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function DrinkCounter({ count, label = 'drinks', highlight = false }) {
  const [displayed, setDisplayed] = useState(count);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    if (count !== displayed) {
      setBump(true);
      const t = setTimeout(() => {
        setDisplayed(count);
        setBump(false);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [count]);

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        animate={bump ? { scale: 1.4, color: '#e53e3e' } : { scale: 1, color: highlight ? '#e53e3e' : '#fff' }}
        transition={{ duration: 0.2 }}
        style={{ fontSize: 48, fontWeight: 900, lineHeight: 1 }}
      >
        {displayed}
      </motion.div>
      <div style={{ fontSize: 14, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
    </div>
  );
}
