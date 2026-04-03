import Card from './Card';
import DrinkCounter from './DrinkCounter';

export default function PairPanel({ pair, players, mySocketId, isMyPair, compact = false }) {
  if (!pair) return null;
  const names = pair.playerIds.map(id => players[id]?.name || '?').join(' & ');
  const rs = pair.roundState;

  return (
    <div
      style={{
        background: isMyPair ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.05)',
        border: isMyPair ? '2px solid #63b3ed' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: compact ? '12px 16px' : '20px 24px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: compact ? 16 : 20 }}>{names}</span>
          {isMyPair && <span style={{ marginLeft: 8, fontSize: 12, background: '#63b3ed', color: '#000', borderRadius: 6, padding: '2px 8px' }}>YOU</span>}
        </div>
        <DrinkCounter count={pair.drinkCount} label="sips" />
      </div>

      {/* Hand */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {pair.hand.map((card, i) => (
          <Card key={i} suit={card.suit} value={card.value} faceUp={card.faceUp} size="sm" />
        ))}
      </div>

      {/* Round status */}
      {rs && !compact && (
        <div style={{ marginTop: 8, fontSize: 13, opacity: 0.7 }}>
          {rs.waitingFor === 'bothGuess' && 'Waiting for both guesses...'}
          {rs.waitingFor === 'guess' && 'Waiting for guess...'}
          {rs.waitingFor === 'partnerResponse' && 'Partner deciding...'}
          {rs.resolved && rs.hit === true && '✓ Correct!'}
          {rs.resolved && rs.hit === false && `✗ Wrong — ${pair.pendingDrinks} drink${pair.pendingDrinks !== 1 ? 's' : ''}`}
          {rs.resolved && rs.hit === undefined && (pair.pendingDrinks > 0 ? `${pair.pendingDrinks} drink${pair.pendingDrinks !== 1 ? 's' : ''}` : 'Safe!')}
        </div>
      )}
    </div>
  );
}
