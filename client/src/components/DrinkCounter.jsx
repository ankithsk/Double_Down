export default function DrinkCounter({ count, label = 'sips' }) {
  return (
    <div style={{
      background: count > 0 ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${count > 0 ? 'rgba(255,107,107,0.3)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 8,
      padding: '3px 10px',
      fontSize: 13,
      fontWeight: 700,
      color: count > 0 ? 'var(--accent-hot)' : 'var(--text-muted)',
      fontVariantNumeric: 'tabular-nums',
      whiteSpace: 'nowrap',
    }}>
      {count} {label}
    </div>
  );
}
