import { motion } from 'framer-motion';

function Btn({ label, sublabel, onClick, disabled, variant = 'default', large = false }) {
  const colors = {
    default: { bg: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.2)', hover: 'rgba(255,255,255,0.2)' },
    red: { bg: 'rgba(229,62,62,0.8)', border: '#e53e3e', hover: 'rgba(229,62,62,1)' },
    black: { bg: 'rgba(26,26,26,0.9)', border: '#555', hover: '#333' },
    success: { bg: 'rgba(72,187,120,0.8)', border: '#48bb78', hover: 'rgba(72,187,120,1)' },
    warning: { bg: 'rgba(246,173,85,0.8)', border: '#f6ad55', hover: 'rgba(246,173,85,1)' },
    danger: { bg: 'rgba(229,62,62,0.8)', border: '#e53e3e', hover: 'rgba(229,62,62,1)' },
    ghost: { bg: 'transparent', border: 'rgba(255,255,255,0.3)', hover: 'rgba(255,255,255,0.08)' },
  };
  const c = colors[variant] || colors.default;

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.96 } : {}}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: c.bg,
        border: `2px solid ${c.border}`,
        borderRadius: 14,
        padding: large ? '18px 32px' : '12px 20px',
        color: '#fff',
        fontSize: large ? 20 : 16,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        minWidth: large ? 140 : 100,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        transition: 'background 0.15s',
      }}
    >
      <span>{label}</span>
      {sublabel && <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{sublabel}</span>}
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
      <Btn
        label="🔥 Double Down"
        sublabel="2× drinks if wrong"
        onClick={() => onResponse('doubleDown')}
        disabled={disabled}
        variant="danger"
        large
      />
      <Btn
        label="🛡 Shield"
        sublabel="Half drinks, +1 now"
        onClick={() => onResponse('shield')}
        disabled={disabled}
        variant="success"
        large
      />
      <Btn
        label="Pass"
        sublabel="No change"
        onClick={() => onResponse('none')}
        disabled={disabled}
        variant="ghost"
        large
      />
    </div>
  );
}

export default Btn;
