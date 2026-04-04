import { motion } from 'framer-motion';

function Btn({ label, sublabel, onClick, disabled, variant = 'default', large = false }) {
  const colors = {
    default: { bg: 'linear-gradient(135deg, rgba(107,107,255,0.3), rgba(107,107,255,0.15))', border: 'rgba(107,107,255,0.5)', shadow: 'var(--glow-purple)' },
    red:     { bg: 'linear-gradient(135deg, #ff6b6b, #e53e3e)', border: '#ff6b6b', shadow: 'var(--glow-hot)' },
    black:   { bg: 'linear-gradient(135deg, #1a0a2e, #2d1a4e)', border: '#4a3a6a', shadow: 'none' },
    success: { bg: 'linear-gradient(135deg, #6bffb8, #48bb78)', border: '#6bffb8', shadow: '0 0 16px rgba(107,255,184,0.3)' },
    warning: { bg: 'linear-gradient(135deg, #ffd93d, #f6ad55)', border: '#ffd93d', shadow: 'var(--glow-gold)' },
    danger:  { bg: 'linear-gradient(135deg, #ff6b6b, #c53030)', border: '#ff6b6b', shadow: 'var(--glow-hot)' },
    ghost:   { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', shadow: 'none' },
  };
  const c = colors[variant] || colors.default;

  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.94 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: c.bg,
        border: `2px solid ${c.border}`,
        boxShadow: c.shadow,
        borderRadius: 16,
        padding: large ? '18px 32px' : '14px 22px',
        color: '#fff',
        fontSize: large ? 19 : 16,
        fontWeight: 800,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        minWidth: large ? 140 : 100,
        minHeight: 52,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span>{label}</span>
      {sublabel && <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 500 }}>{sublabel}</span>}
    </motion.button>
  );
}

export function R1Buttons({ onGuess, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Btn label="🔴 Red" onClick={() => onGuess('red')} disabled={disabled} variant="red" large />
      <Btn label="⚫ Black" onClick={() => onGuess('black')} disabled={disabled} variant="black" large />
    </div>
  );
}

export function R2Buttons({ onGuess, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Btn label="⬆ Higher" onClick={() => onGuess('higher')} disabled={disabled} large />
      <Btn label="= Equal" onClick={() => onGuess('equal')} disabled={disabled} large />
      <Btn label="⬇ Lower" onClick={() => onGuess('lower')} disabled={disabled} large />
    </div>
  );
}

export function R3Buttons({ onGuess, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Btn label="Inside" sublabel="Between the two" onClick={() => onGuess('inside')} disabled={disabled} large />
      <Btn label="Outside" sublabel="Beyond both" onClick={() => onGuess('outside')} disabled={disabled} large />
    </div>
  );
}

export function R4Buttons({ onGuess, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      {[
        { suit: 'hearts', symbol: '♥', color: 'red' },
        { suit: 'diamonds', symbol: '♦', color: 'red' },
        { suit: 'clubs', symbol: '♣', color: 'black' },
        { suit: 'spades', symbol: '♠', color: 'black' },
      ].map(({ suit, symbol, color }) => (
        <Btn
          key={suit}
          label={`${symbol} ${suit[0].toUpperCase() + suit.slice(1)}`}
          onClick={() => onGuess(suit)}
          disabled={disabled}
          variant={color}
          large
        />
      ))}
    </div>
  );
}

export function PartnerResponseButtons({ onResponse, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Btn label="🔥 Double Down" sublabel="2× drinks if wrong" onClick={() => onResponse('doubleDown')} disabled={disabled} variant="danger" large />
      <Btn label="🛡 Shield" sublabel="Half drinks, +1 now" onClick={() => onResponse('shield')} disabled={disabled} variant="success" large />
      <Btn label="Pass" sublabel="No change" onClick={() => onResponse('none')} disabled={disabled} variant="ghost" large />
    </div>
  );
}

export default Btn;
