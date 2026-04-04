const ROUND_INFO = {
  ROUND_1: { label: 'Round 1', title: 'Red or Black?', desc: 'Both partners guess — agree for bonus, disagree and drink.' },
  ROUND_2: { label: 'Round 2', title: 'Higher or Lower?', desc: 'One partner guesses, the other doubles down or shields.' },
  ROUND_3: { label: 'Round 3', title: 'Inside or Outside?', desc: 'Is the next card between your first two, or beyond them?' },
  ROUND_4: { label: 'Round 4', title: 'Guess the Suit', desc: 'Pick the suit of the next card. Get it right or drink 3.' },
};

export default function RoundPrompt({ phase }) {
  const info = ROUND_INFO[phase];
  if (!info) return null;

  return (
    <div style={{ textAlign: 'center', padding: '16px 24px' }}>
      <div style={{
        fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase',
        color: 'var(--accent-primary)', marginBottom: 6,
      }}>
        {info.label}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 900, color: 'var(--text-primary)',
        marginBottom: 8, lineHeight: 1.1, letterSpacing: '-0.5px',
      }}>
        {info.title}
      </div>
      <div style={{
        fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5,
        maxWidth: 300, margin: '0 auto',
      }}>
        {info.desc}
      </div>
    </div>
  );
}
