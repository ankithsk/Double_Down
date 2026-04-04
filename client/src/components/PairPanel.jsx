import Card from './Card';
import DrinkCounter from './DrinkCounter';

export default function PairPanel({ pair, players, mySocketId, isMyPair, compact = false }) {
  if (!pair) return null;
  const names = pair.playerIds.map(id => players[id]?.name || '?').join(' & ');
  const rs = pair.roundState;

  return (
    <div style={{
      background: isMyPair ? 'rgba(107,107,255,0.1)' : 'rgba(255,255,255,0.03)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: isMyPair ? '1px solid rgba(107,107,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
      boxShadow: isMyPair ? 'var(--glow-purple)' : 'none',
      borderRadius: 18,
      padding: compact ? '10px 14px' : '16px 20px',
      marginBottom: 10,
      transition: 'box-shadow 0.3s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span style={{ fontWeight: 800, fontSize: compact ? 15 : 18 }}>{names}</span>
          {isMyPair && (
            <span style={{ marginLeft: 8, fontSize: 11, background: 'var(--accent-primary)', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 }}>YOU</span>
          )}
        </div>
        <DrinkCounter count={pair.drinkCount} label="sips" />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {pair.hand.map((card, i) => (
          <Card key={i} suit={card.suit} value={card.value} faceUp={card.faceUp} size="sm" index={i} />
        ))}
      </div>

      {rs && !compact && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
          {rs.waitingFor === 'bothGuess' && 'Waiting for both guesses…'}
          {rs.waitingFor === 'guess' && 'Waiting for guess…'}
          {rs.waitingFor === 'partnerResponse' && 'Partner deciding…'}
          {rs.resolved && rs.hit === true && '✓ Correct!'}
          {rs.resolved && rs.hit === false && `✗ Wrong — ${pair.pendingDrinks} sip${pair.pendingDrinks !== 1 ? 's' : ''}`}
          {rs.resolved && rs.hit === undefined && (pair.pendingDrinks > 0 ? `${pair.pendingDrinks} sip${pair.pendingDrinks !== 1 ? 's' : ''}` : 'Safe!')}
        </div>
      )}
    </div>
  );
}
