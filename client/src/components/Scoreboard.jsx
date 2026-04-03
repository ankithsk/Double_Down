import { motion } from 'framer-motion';

export default function Scoreboard({ pairs, players }) {
  const sorted = Object.values(pairs).sort((a, b) => b.drinkCount - a.drinkCount);

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 16, opacity: 0.8 }}>Scoreboard</h2>
      {sorted.map((pair, i) => {
        const names = pair.playerIds.map(id => players[id]?.name || '?').join(' & ');
        return (
          <motion.div
            key={pair.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              background: i === 0 ? 'rgba(229,62,62,0.2)' : 'rgba(255,255,255,0.05)',
              border: i === 0 ? '1px solid rgba(229,62,62,0.4)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20 }}>{i === 0 ? '🚌' : i === sorted.length - 1 ? '🏆' : `${i + 1}.`}</span>
              <span style={{ fontWeight: 600 }}>{names}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 900 }}>{pair.drinkCount} <span style={{ fontSize: 13, opacity: 0.6 }}>sips</span></span>
          </motion.div>
        );
      })}
      <p style={{ textAlign: 'center', fontSize: 13, opacity: 0.6, marginTop: 12 }}>
        {sorted[0] && `${sorted[0].playerIds.map(id => players[id]?.name || '?').join(' & ')} riding the bus 🚌`}
      </p>
    </div>
  );
}
