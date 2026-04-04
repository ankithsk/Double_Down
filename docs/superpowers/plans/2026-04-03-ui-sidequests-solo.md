# Double Down — UI Overhaul + Side Quests + Solo Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul Double Down's UI to "Chaotic Fun" visual style, add 5 side quest mini-games that interrupt punishments, add solo/individual play mode, and ship PWA shell.

**Architecture:** Client-side visual overhaul touches CSS vars + all components. Solo mode adds a `gameMode` field to GameManager with synthetic solo pairs. Side quests are server-triggered (type + contentIndex), content resolved client-side from a local data file, rendered as a full-screen overlay. PWA via vite-plugin-pwa.

**Tech Stack:** React 19, Framer Motion 12, Zustand 5, Socket.io 4, Vite 8, vite-plugin-pwa

**Spec:** `docs/superpowers/specs/2026-04-03-ui-sidequests-design.md`

---

## File Map

### New files
| File | Purpose |
|------|---------|
| `client/src/data/sidequests.js` | All side quest content: movies, dares, trivia Qs, celebrities |
| `client/src/components/SideQuestOverlay.jsx` | Full-screen side quest takeover — reveal, quest UI, result |
| `client/src/components/SideQuestTimer.jsx` | Countdown timer bar component |
| `client/src/audio.js` | Web Audio API synthesized sounds |
| `client/src/haptics.js` | Vibration API haptic feedback |
| `client/public/manifest.json` | PWA manifest |
| `client/public/icon.svg` | App icon (playing card motif, purple/coral) |

### Modified files
| File | Changes |
|------|---------|
| `client/src/index.css` | Chaotic Fun palette vars, globals |
| `client/src/components/Card.jsx` | Chaotic rotation, new palette, perspective fix |
| `client/src/components/PairPanel.jsx` | Glassmorphism style, demoted DrinkCounter |
| `client/src/components/ActionButtons.jsx` | Gradient primary buttons, glow shadows |
| `client/src/components/RoundPrompt.jsx` | New palette styling |
| `client/src/components/DrinkCounter.jsx` | Smaller/badge style (no longer prominent) |
| `client/src/screens/Lobby.jsx` | Mode picker (Teams/Solo), new Chaotic Fun styling |
| `client/src/screens/Game.jsx` | "TAKE X SIPS" reveal, solo mode action routing, side quest trigger |
| `client/src/screens/BusRide.jsx` | Solo bus variant, new styling |
| `client/src/App.jsx` | Pass gameMode through, GameOver restyled |
| `client/src/store/gameStore.js` | `activeSideQuest`, `gameMode` slices |
| `client/src/hooks/useSocket.js` | `sidequest:offer`, `sidequest:result` handlers |
| `client/vite.config.js` | Add vite-plugin-pwa |
| `server/GameManager.js` | `gameMode` field, solo individual logic, sidequest trigger |
| `server/index.js` | Sidequest socket handlers |

---

## Task 1: Chaotic Fun CSS Vars + Globals

**Files:**
- Modify: `client/src/index.css`

- [ ] Replace all CSS custom properties and globals in `client/src/index.css` with:

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg-deep:        #0a0510;
  --bg-surface:     #130d20;
  --bg-elevated:    #1e1535;
  --accent-primary: #6b6bff;
  --accent-hot:     #ff6b6b;
  --accent-gold:    #ffd93d;
  --accent-green:   #6bffb8;
  --text-primary:   #f5f0ff;
  --text-muted:     #7b6f8a;
  --border:         rgba(255,255,255,0.07);
  --glow-purple:    0 0 24px rgba(107,107,255,0.4);
  --glow-hot:       0 0 24px rgba(255,107,107,0.4);
  --glow-gold:      0 0 16px rgba(255,217,61,0.3);
}

html, body { height: 100%; width: 100%; overflow-x: hidden; }
#root { min-height: 100%; display: flex; flex-direction: column; }

body {
  background: var(--bg-deep);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
}

button { font-family: inherit; touch-action: manipulation; cursor: pointer; min-height: 48px; }
button:disabled { pointer-events: none; opacity: 0.4; }
input { font-family: inherit; }
```

- [ ] Commit: `git add client/src/index.css && git commit -m "style: Chaotic Fun CSS vars and globals"`

---

## Task 2: Card Component — Chaotic Rotation + New Palette

**Files:**
- Modify: `client/src/components/Card.jsx`

- [ ] Rewrite `client/src/components/Card.jsx` fully:

```jsx
import { motion } from 'framer-motion';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const RED_SUITS = ['hearts', 'diamonds'];
// Subtle rotations that make cards look scattered/alive
const ROTATIONS = [-3, -1, 1, 3];

function CardFace({ suit, value }) {
  const isRed = RED_SUITS.includes(suit);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
      background: '#fff',
      borderRadius: 12,
      border: '2px solid #e8e0f0',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: isRed ? '#ff6b6b' : '#1a0a2e',
      userSelect: 'none',
    }}>
      <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1, fontFamily: 'Georgia, serif' }}>{value}</div>
      <div style={{ fontSize: 36, lineHeight: 1, marginTop: 4 }}>{SUIT_SYMBOLS[suit] || '?'}</div>
    </div>
  );
}

function CardBack() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      background: 'linear-gradient(135deg, #1e1535 0%, #130d20 50%, #0a0510 100%)',
      borderRadius: 12,
      border: '2px solid rgba(107,107,255,0.3)',
      boxShadow: '0 0 12px rgba(107,107,255,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {/* Diamond pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.08,
        backgroundImage: 'repeating-linear-gradient(45deg, #6b6bff 0, #6b6bff 1px, transparent 0, transparent 50%)',
        backgroundSize: '12px 12px',
      }} />
      <div style={{ fontSize: 28, position: 'relative' }}>🃏</div>
    </div>
  );
}

export default function Card({ suit, value, faceUp = false, animateIn = false, size = 'md', index = 0 }) {
  const sizes = { sm: { width: 60, height: 84 }, md: { width: 90, height: 126 }, lg: { width: 120, height: 168 } };
  const { width, height } = sizes[size] || sizes.md;
  const baseRotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <div style={{ perspective: 1000, width, height, flexShrink: 0 }}>
      <motion.div
        initial={animateIn ? { y: -50, opacity: 0, rotate: baseRotation } : false}
        animate={{ y: 0, opacity: 1, rotateY: faceUp ? 0 : 180, rotate: baseRotation }}
        whileTap={{ rotate: 0, scale: 1.05 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 120, damping: 14 }}
        style={{ width, height, position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        <CardFace suit={suit} value={value} />
        <CardBack />
      </motion.div>
    </div>
  );
}
```

- [ ] In `PairPanel.jsx`, pass `index={i}` to each `<Card>` (already maps with index `i`)
- [ ] Run `npm run dev` from project root, verify cards have slight rotation and purple backs
- [ ] Commit: `git add client/src/components/Card.jsx && git commit -m "style: chaotic card rotation and Chaotic Fun palette"`

---

## Task 3: ActionButtons — Gradient Style

**Files:**
- Modify: `client/src/components/ActionButtons.jsx`

- [ ] Replace the `Btn` base component's style object and the color map at the top of `ActionButtons.jsx`:

```jsx
// Replace the colors object inside Btn:
const colors = {
  default: { bg: 'linear-gradient(135deg, rgba(107,107,255,0.3), rgba(107,107,255,0.15))', border: 'rgba(107,107,255,0.5)', shadow: 'var(--glow-purple)' },
  red:     { bg: 'linear-gradient(135deg, #ff6b6b, #e53e3e)', border: '#ff6b6b', shadow: 'var(--glow-hot)' },
  black:   { bg: 'linear-gradient(135deg, #1a0a2e, #2d1a4e)', border: '#4a3a6a', shadow: 'none' },
  success: { bg: 'linear-gradient(135deg, #6bffb8, #48bb78)', border: '#6bffb8', shadow: '0 0 16px rgba(107,255,184,0.3)' },
  warning: { bg: 'linear-gradient(135deg, #ffd93d, #f6ad55)', border: '#ffd93d', shadow: 'var(--glow-gold)' },
  danger:  { bg: 'linear-gradient(135deg, #ff6b6b, #c53030)', border: '#ff6b6b', shadow: 'var(--glow-hot)' },
  ghost:   { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)', shadow: 'none' },
};

// Replace the style object inside the motion.button:
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
```

- [ ] Verify buttons in devtools look purple-gradient and glow
- [ ] Commit: `git add client/src/components/ActionButtons.jsx && git commit -m "style: gradient action buttons with glow"`

---

## Task 4: PairPanel — Glassmorphism + Demote DrinkCounter

**Files:**
- Modify: `client/src/components/PairPanel.jsx`
- Modify: `client/src/components/DrinkCounter.jsx`

- [ ] Replace the outer `div` style in `PairPanel.jsx`:

```jsx
// Outer container style:
style={{
  background: isMyPair ? 'rgba(107,107,255,0.1)' : 'rgba(255,255,255,0.03)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: isMyPair ? '1px solid rgba(107,107,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
  boxShadow: isMyPair ? 'var(--glow-purple)' : 'none',
  borderRadius: 18,
  padding: compact ? '10px 14px' : '16px 20px',
  marginBottom: 10,
  transition: 'box-shadow 0.3s',
}}
```

- [ ] In `DrinkCounter.jsx`, make it a small badge (not a big number). Replace the component entirely:

```jsx
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
```

- [ ] Commit: `git add client/src/components/PairPanel.jsx client/src/components/DrinkCounter.jsx && git commit -m "style: glassmorphism pair panels, demote drink counter to badge"`

---

## Task 5: RoundPrompt — Chaotic Fun Styling

**Files:**
- Modify: `client/src/components/RoundPrompt.jsx`

- [ ] Update the styles in `RoundPrompt.jsx` to use the new palette:

```jsx
// Outer div:
style={{ textAlign: 'center', padding: '16px 24px' }}

// Round label:
style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 6 }}

// Title:
style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.1, letterSpacing: '-0.5px' }}

// Description:
style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5, maxWidth: 300, margin: '0 auto' }}
```

- [ ] Commit: `git add client/src/components/RoundPrompt.jsx && git commit -m "style: RoundPrompt Chaotic Fun palette"`

---

## Task 6: "TAKE X SIPS" Punishment Reveal

**Files:**
- Modify: `client/src/screens/Game.jsx`

- [ ] Replace the `RevealOverlay` component inside `Game.jsx` with this full-screen punishment flash version:

```jsx
function RevealOverlay({ reveal, onDismiss }) {
  useEffect(() => {
    if (!reveal) return;
    const t = setTimeout(onDismiss, 2500);
    return () => clearTimeout(t);
  }, [reveal, onDismiss]);

  if (!reveal) return null;
  const drank = reveal.drinks > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: drank ? 'rgba(20,4,12,0.97)' : 'rgba(4,20,12,0.97)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 32,
      }}
    >
      {/* Edge glow */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 0,
        boxShadow: drank ? 'inset 0 0 80px rgba(255,107,107,0.4)' : 'inset 0 0 80px rgba(107,255,184,0.3)',
        pointerEvents: 'none',
      }} />

      {reveal.card && (
        <motion.div
          initial={{ scale: 0.5, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{ marginBottom: 32 }}
        >
          <Card suit={reveal.card.suit} value={reveal.card.value} faceUp size="lg" />
        </motion.div>
      )}

      {drank ? (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-hot)', marginBottom: 8 }}>
            TAKE
          </div>
          <div style={{
            fontSize: 96, fontWeight: 900, lineHeight: 1,
            color: '#fff', fontVariantNumeric: 'tabular-nums',
            textShadow: '0 0 40px rgba(255,107,107,0.8)',
          }}>
            {reveal.drinks}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-hot)', marginTop: 4 }}>
            SIP{reveal.drinks !== 1 ? 'S' : ''}
          </div>
          {reveal.disagreed && (
            <div style={{ fontSize: 13, color: 'var(--accent-gold)', marginTop: 16 }}>
              +1 for disagreeing with your partner
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ fontSize: 80, marginBottom: 8 }}>✅</div>
          <div style={{
            fontSize: 56, fontWeight: 900,
            color: 'var(--accent-green)',
            textShadow: '0 0 40px rgba(107,255,184,0.6)',
          }}>
            SAFE!
          </div>
        </motion.div>
      )}

      <div style={{ position: 'absolute', bottom: 32, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
        tap to continue
      </div>
    </motion.div>
  );
}
```

- [ ] Run game in two browser tabs, get a wrong answer, verify the big "TAKE X SIPS" flash appears
- [ ] Commit: `git add client/src/screens/Game.jsx && git commit -m "feat: TAKE X SIPS full-screen punishment reveal"`

---

## Task 7: Lobby — Chaotic Fun Styling + Mode Picker

**Files:**
- Modify: `client/src/screens/Lobby.jsx`

- [ ] Add a `gameMode` state to the Lobby (before the room code is visible). When host clicks "Create Room", first show a mode picker. Update the top of the Lobby component:

```jsx
const [gameMode, setGameMode] = useState('teams'); // 'teams' | 'solo'
const [showModePicker, setShowModePicker] = useState(false);
```

- [ ] Replace `handleCreate` to first show the mode picker instead of immediately connecting:

```jsx
const handleCreate = useCallback(() => {
  if (!name.trim()) return;
  setShowModePicker(true);
}, [name]);

const handleConfirmCreate = useCallback(() => {
  setShowModePicker(false);
  if (socket.connected) {
    socket.emit('room:create', { playerName: name.trim(), gameMode });
  } else {
    socket.auth = {};
    socket.once('connect', () => socket.emit('room:create', { playerName: name.trim(), gameMode }));
    socket.connect();
  }
}, [name, gameMode]);
```

- [ ] Add a mode picker screen that renders when `showModePicker && !roomCode`:

```jsx
if (showModePicker && !roomCode) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>🎮</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>Game Mode</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, textAlign: 'center' }}>How are you playing tonight?</p>

      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {[
          { value: 'teams', icon: '👥', title: 'Teams', desc: 'Pair up — share drinks, use partner moves (Double Down / Shield)' },
          { value: 'solo', icon: '🧍', title: 'Every Man for Himself', desc: 'Everyone plays individually — pure chaos, no partners' },
        ].map(({ value, icon, title, desc }) => (
          <button
            key={value}
            onClick={() => setGameMode(value)}
            style={{
              background: gameMode === value ? 'rgba(107,107,255,0.2)' : 'var(--bg-surface)',
              border: gameMode === value ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
              boxShadow: gameMode === value ? 'var(--glow-purple)' : 'none',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'flex-start', gap: 14,
              color: 'var(--text-primary)', textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 28, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirmCreate}
        style={{
          width: '100%', maxWidth: 380,
          background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)',
          color: '#fff', border: 'none', borderRadius: 16,
          padding: '18px', fontSize: 18, fontWeight: 800,
          boxShadow: 'var(--glow-purple)',
        }}
      >
        Create Room →
      </button>
    </div>
  );
}
```

- [ ] Update all button/input/container styles in the pre-room and in-room views to use the new palette (`var(--bg-surface)`, `var(--accent-primary)`, etc.)
- [ ] Commit: `git add client/src/screens/Lobby.jsx && git commit -m "feat: mode picker in lobby, Chaotic Fun lobby styles"`

---

## Task 8: Server — Solo Mode in GameManager

**Files:**
- Modify: `server/GameManager.js`

- [ ] Add `gameMode` field to the constructor (after `this.mode = MODES.SOLO`):

```js
this.gameMode = 'teams'; // 'teams' | 'solo_individual'
```

- [ ] Update `startGame()` to accept and store `gameMode`:

```js
startGame(gameMode = 'teams') {
  this.gameMode = gameMode;
  // ... rest of existing startGame code unchanged
}
```

- [ ] Add a `_newRoundStateSolo(pair, round)` method after `_newRoundState`:

```js
_newRoundStateSolo(playerId, round) {
  return {
    round,
    guessBy: playerId,
    partnerOf: null,
    guess: null,
    waitingFor: round === 1 ? 'guess' : 'guess',
    resolved: false,
    partnerResponse: 'none', // always none in solo
  };
}
```

- [ ] Update `startGame()` to handle solo individual mode — replace the "Deal one card face-down to each pair" block:

```js
// After this.phase = PHASES.ROUND_1:
if (this.gameMode === 'solo_individual') {
  // Create synthetic solo pairs — one per player
  this.pairs = {};
  this._nextPairIndex = 0;
  for (const player of Object.values(this.players).filter(p => p.connected)) {
    const pairId = `pair-${this._nextPairIndex++}`;
    this.pairs[pairId] = this._newPair(pairId, [player.id]);
    player.pairId = pairId;
  }
}

for (const pair of Object.values(this.pairs)) {
  pair.hand = [];
  pair.drinkCount = 0;
  pair.pendingDrinks = 0;
  const card = this.deck.pop();
  pair.hand.push({ ...card, faceUp: false });
  pair.roundState = this.gameMode === 'solo_individual'
    ? this._newRoundStateSolo(pair.playerIds[0], 1)
    : this._newRoundState(pair, 1);
}
```

- [ ] Update `submitR1Guess` to handle solo (solo skips the "wait for both" step). Add at the top of the method:

```js
// Solo: immediate resolve, no partner
if (this.gameMode === 'solo_individual') {
  const rs = pair.roundState;
  if (rs.waitingFor !== 'guess') return null;
  rs.guessA = guess;
  rs.guessB = guess; // same player, no disagreement
  return this._resolveRound1(pair);
}
```

- [ ] Update `advanceRound` to use `_newRoundStateSolo` in solo mode. In the pairs loop inside `advanceRound`, replace `pair.roundState = rs`:

```js
if (this.gameMode === 'solo_individual') {
  pair.roundState = this._newRoundStateSolo(pair.playerIds[0], this.round);
} else {
  const rs = this._newRoundState(pair, this.round);
  if (this.round % 2 === 0) { rs.guessBy = playerB; rs.partnerOf = playerA; }
  pair.roundState = rs;
}
```

- [ ] Update `toJSON` to include `gameMode`:

```js
toJSON() {
  return {
    roomCode: this.roomCode,
    phase: this.phase,
    round: this.round,
    mode: this.mode,
    gameMode: this.gameMode,   // ADD THIS LINE
    players: this.players,
    pairs: this.pairs,
    bracket: this.bracket,
    deckRemaining: this.deck.length,
  };
}
```

- [ ] Commit: `git add server/GameManager.js && git commit -m "feat: solo_individual game mode in GameManager"`

---

## Task 9: Server — Solo Mode in index.js + game:start

**Files:**
- Modify: `server/index.js`

- [ ] Update `game:start` handler to pass `gameMode` from the emitted payload:

```js
socket.on('game:start', ({ gameMode = 'teams' } = {}) => {
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  const game = rooms.get(meta.roomCode);
  if (!game || !game.players[socket.id]?.isHost) return;
  const check = game.canStart();
  if (!check.ok) { socket.emit('room:error', { message: check.reason }); return; }
  game.startGame(gameMode);
  syncAll(game);
});
```

- [ ] Update `room:create` to accept and store `gameMode` on the GameManager:

```js
socket.on('room:create', ({ playerName: name, gameMode = 'teams' }) => {
  const code = generateRoomCode();
  const game = new GameManager(code, socket.id, name);
  game.gameMode = gameMode; // store for lobby display before start
  rooms.set(code, game);
  socketMeta.set(socket.id, { roomCode: code });
  socket.join(code);
  socket.emit('room:created', { roomCode: code, playerId: socket.id });
  syncAll(game);
});
```

- [ ] In solo mode, `canStart()` should allow 2+ players without pairing. Update `canStart()` in `GameManager.js`:

```js
canStart() {
  const connected = Object.values(this.players).filter(p => p.connected);
  if (connected.length < 2) return { ok: false, reason: 'Need at least 2 players' };
  if (this.gameMode !== 'solo_individual' && connected.some(p => !p.pairId)) {
    return { ok: false, reason: 'All players must be in pairs' };
  }
  return { ok: true };
}
```

- [ ] Update `Lobby.jsx` to emit `gameMode` with `game:start`:

```js
// In handleStart:
socket.emit('game:start', { gameMode: gameMode || 'teams' });
```

- [ ] Store `gameMode` in Zustand. In `gameStore.js`, add to the store:

```js
gameMode: 'teams',
// setGameState already sets this from state.gameMode — update setGameState:
setGameState: (state) => {
  const me = get().mySocketId;
  let pairId = null;
  if (me && state?.players?.[me]?.pairId) pairId = state.players[me].pairId;
  set({ gameState: state, myPairId: pairId, gameMode: state?.gameMode || 'teams' });
},
```

- [ ] Commit: `git add server/index.js server/GameManager.js client/src/store/gameStore.js client/src/screens/Lobby.jsx && git commit -m "feat: wire gameMode through server, store, and lobby start"`

---

## Task 10: Game.jsx — Solo Mode Action Routing

**Files:**
- Modify: `client/src/screens/Game.jsx`

- [ ] Add `gameMode` selector at the top of the `Game` component:

```js
const gameMode = useGameStore(s => s.gameMode);
```

- [ ] Update `getMyTurn` function to handle solo mode (in solo, `waitingFor` is always `'guess'`):

```js
function getMyTurn(phase, pair, mySocketId, gameMode) {
  const rs = pair?.roundState;
  if (!rs || rs.resolved) return null;

  if (phase === 'ROUND_1') {
    if (gameMode === 'solo_individual') {
      return rs.waitingFor === 'guess' ? 'r1' : null;
    }
    const isA = mySocketId === pair.playerIds[0];
    if (rs.waitingFor === 'bothGuess') {
      const myGuess = isA ? rs.guessA : rs.guessB;
      return myGuess ? null : 'r1';
    }
    return null;
  }

  if (rs.waitingFor === 'guess' && mySocketId === rs.guessBy) return 'guess';
  if (rs.waitingFor === 'partnerResponse' && mySocketId === rs.partnerOf) return 'partnerResponse';
  return null;
}
```

- [ ] Update the call to `getMyTurn` to pass `gameMode`:

```js
const myTurn = getMyTurn(phase, myPair, mySocketId, gameMode);
```

- [ ] Hide `PartnerResponseButtons` in solo mode — the `myTurn === 'partnerResponse'` branch will never fire, but add a guard:

```js
{myTurn === 'partnerResponse' && gameMode !== 'solo_individual' && (
  <PartnerResponseButtons onResponse={handlePartnerResponse} disabled={false} />
)}
```

- [ ] Commit: `git add client/src/screens/Game.jsx && git commit -m "feat: solo mode action routing in Game screen"`

---

## Task 11: Side Quest Content Data File

**Files:**
- Create: `client/src/data/sidequests.js`

- [ ] Create `client/src/data/sidequests.js` with all content:

```js
export const SIDE_QUESTS = {
  charades: {
    bollywood: [
      'DDLJ', 'Sholay', '3 Idiots', 'Gangs of Wasseypur', 'Andhadhun',
      'Dil Chahta Hai', 'Lagaan', 'Zindagi Na Milegi Dobara', 'Queen',
      'Taare Zameen Par', 'PK', 'Dangal', 'Kabhi Khushi Kabhie Gham',
      'Dil Dhadakne Do', 'Rockstar', 'Tamasha', 'Barfi', 'Highway',
      'Udta Punjab', 'Gully Boy', 'Article 15', 'Tumbbad', 'Stree',
      'Badhaai Ho', 'Shubh Mangal Saavdhan', 'Lootera', 'Masaan',
      'Gangs of Wasseypur 2', 'Raazi', 'Uri', 'Super 30', 'Bard of Blood',
    ],
    hollywood: [
      'Inception', 'The Dark Knight', 'Fight Club', 'Pulp Fiction',
      'The Matrix', 'Interstellar', 'Home Alone', 'Titanic', 'The Godfather',
      'Forrest Gump', 'The Lion King', 'Jurassic Park', 'Avengers: Endgame',
      'The Shawshank Redemption', 'Goodfellas', 'The Silence of the Lambs',
    ],
    tv: [
      'Breaking Bad', 'Game of Thrones', 'Friends', 'The Office',
      'Stranger Things', 'Dark', 'Sacred Games', 'Mirzapur',
      'Panchayat', 'Scam 1992', 'Money Heist', 'Squid Game',
      'The Crown', 'Narcos', 'Black Mirror',
    ],
  },

  rapidfire: [
    { category: 'Marvel superheroes', examples: ['Iron Man', 'Thor', 'Spider-Man'] },
    { category: 'Bollywood actors who debuted before 2000', examples: ['Shah Rukh Khan', 'Salman Khan', 'Aamir Khan'] },
    { category: 'Cricket World Cup winning countries', examples: ['India', 'Australia', 'West Indies'] },
    { category: 'Countries in Europe', examples: ['France', 'Germany', 'Italy'] },
    { category: 'Oscar Best Picture winners', examples: ['Titanic', 'The Godfather', 'Parasite'] },
    { category: 'Sitcoms from the 2000s', examples: ['Friends', 'The Office', 'How I Met Your Mother'] },
    { category: 'Sports that use a ball', examples: ['Cricket', 'Football', 'Tennis'] },
    { category: 'Capital cities of Asia', examples: ['New Delhi', 'Beijing', 'Tokyo'] },
    { category: 'Indian states', examples: ['Maharashtra', 'Karnataka', 'Rajasthan'] },
    { category: 'Hollywood directors', examples: ['Christopher Nolan', 'Steven Spielberg', 'Quentin Tarantino'] },
    { category: 'Bollywood movies with one-word titles', examples: ['Sholay', 'Dangal', 'Tamasha'] },
    { category: 'Things you find in a kitchen', examples: ['Knife', 'Spoon', 'Pan'] },
  ],

  dares: [
    "Text your ex 'I miss you' and show the screen to the room",
    "Do your best strip-tease for 10 seconds — clothes stay on, barely",
    "Let the group go through your camera roll for 30 seconds",
    "Give a lap dance to the person on your left",
    "Tell the room your most embarrassing hook-up story in under 60 seconds",
    "Show the group the last 5 people you texted and what you said",
    "Send a voice note saying 'I've been thinking about you' to the last person you matched on a dating app",
    "Let the group write one Instagram story from your account — they decide what it says",
    "Whisper something dirty in the ear of the person to your right",
    "Name three people in this room you'd swipe right on, ranked 1 to 3",
    "Do your best moan. Group rates it 1–10",
    "Let someone in the room go through your DMs for 20 seconds",
    "Tell everyone your honest opinion of each person's partner or crush",
    "Call someone you have a crush on and say 'I just wanted to hear your voice'",
    "Act out how you behave when you're drunk — group votes if it's accurate",
    "Read out the last voice note you sent, out loud, in your most dramatic voice",
    "Describe your type in physical detail — be specific",
    "Do 10 seconds of freestyle rap about the person sitting across from you",
    "Let the group pick one contact in your phone and you have to send them a compliment right now",
    "Confess the most scandalous thing you've done that nobody in this room knows about",
    "Do your best impression of how you act on a first date",
    "Tell the room the last lie you told, and to whom",
    "Show your most-liked selfie on Instagram and explain why you posted it",
    "Let the room ask you one question you HAVE to answer honestly",
    "Demonstrate how you kiss — on your hand, show the room",
  ],

  mimicry: {
    bollywood: [
      { name: 'Amitabh Bachchan', hint: 'Deep baritone, classic dialogues' },
      { name: 'Shah Rukh Khan', hint: 'Arms wide open, charming smile' },
      { name: 'Salman Khan', hint: 'Dabangg style, flexing arms' },
      { name: 'Ranveer Singh', hint: 'Loud, over-the-top energy' },
      { name: 'Govinda', hint: 'Dancing walk, comic timing' },
      { name: 'Akshay Kumar', hint: 'Action hero punchlines' },
      { name: 'Aamir Khan', hint: 'Perfectionist, intense stare' },
      { name: 'Nana Patekar', hint: 'Rapid-fire angry dialogue' },
      { name: 'Kapil Sharma', hint: 'Stand-up comedian energy' },
      { name: 'Sanjay Dutt', hint: 'Munnabhai mannerisms' },
      { name: 'Allu Arjun', hint: 'Pushpa swagger and style' },
      { name: 'Rajinikanth', hint: 'Coin flip, sunglasses move' },
      { name: 'Nawazuddin Siddiqui', hint: 'Calm, menacing intensity' },
    ],
    hollywood: [
      { name: 'Arnold Schwarzenegger', hint: '"I'll be back" accent' },
      { name: 'Al Pacino', hint: 'Scarface: "Say hello to my little friend"' },
      { name: 'Christopher Walken', hint: 'Unusual pauses when speaking' },
      { name: 'Morgan Freeman', hint: 'Wise narrator voice' },
      { name: 'Jim Carrey', hint: 'Rubber face, over the top' },
      { name: 'Will Smith', hint: 'Fresh Prince energy' },
      { name: 'Leonardo DiCaprio', hint: 'Intense monologue face' },
      { name: 'Donald Trump', hint: 'Believe me, huge, the best' },
      { name: 'Robert De Niro', hint: '"You talkin\' to me?"' },
      { name: 'Keanu Reeves', hint: '"Whoa." Neo vibes' },
    ],
  },

  trivia: [
    { q: 'Which movie did Aamir Khan NOT produce?', options: ['Dangal', 'Lagaan', 'Dhobi Ghat', 'Bajrangi Bhaijaan'], answer: 3 },
    { q: 'How many Oscars did Titanic win?', options: ['9', '11', '13', '7'], answer: 1 },
    { q: 'Who has the most Test cricket centuries?', options: ['Ricky Ponting', 'Jacques Kallis', 'Sachin Tendulkar', 'Brian Lara'], answer: 2 },
    { q: 'What year did Instagram launch?', options: ['2008', '2010', '2012', '2009'], answer: 1 },
    { q: 'What is the capital of Australia?', options: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], answer: 2 },
    { q: 'Which country won the 2023 Cricket World Cup?', options: ['Australia', 'India', 'England', 'South Africa'], answer: 0 },
    { q: 'How many seasons does Game of Thrones have?', options: ['6', '7', '8', '9'], answer: 2 },
    { q: '"Bura mat dekho" is associated with which Indian symbol?', options: ['National Flag', 'Three Monkeys', 'Lotus', 'Ashoka Chakra'], answer: 1 },
    { q: 'Which Bollywood film has the dialogue "All is well"?', options: ['PK', 'Dangal', '3 Idiots', 'Taare Zameen Par'], answer: 2 },
    { q: 'Who directed Inception?', options: ['Steven Spielberg', 'Christopher Nolan', 'Ridley Scott', 'James Cameron'], answer: 1 },
    { q: 'In which city is the Eiffel Tower?', options: ['Rome', 'Berlin', 'Paris', 'Madrid'], answer: 2 },
    { q: 'Which streaming service made Sacred Games?', options: ['Amazon', 'Disney+', 'Netflix', 'Hotstar'], answer: 2 },
    { q: 'What is the highest-grossing Bollywood film of all time?', options: ['Baahubali 2', 'Dangal', 'RRR', 'KGF 2'], answer: 0 },
    { q: 'Squid Game is from which country?', options: ['Japan', 'China', 'South Korea', 'Thailand'], answer: 2 },
    { q: 'How many players are in a cricket team?', options: ['9', '10', '11', '12'], answer: 2 },
    { q: 'Which actor played Iron Man in the MCU?', options: ['Chris Evans', 'Robert Downey Jr.', 'Chris Hemsworth', 'Mark Ruffalo'], answer: 1 },
    { q: 'What does URL stand for?', options: ['Universal Resource Locator', 'Uniform Resource Locator', 'United Resource Link', 'Universal Remote Link'], answer: 1 },
    { q: 'In Breaking Bad, what is Walter White\'s alias?', options: ['The Cook', 'Heisenberg', 'Mr. White', 'Blue Sky'], answer: 1 },
    { q: 'Which Indian state has the longest coastline?', options: ['Kerala', 'Tamil Nadu', 'Gujarat', 'Andhra Pradesh'], answer: 2 },
    { q: 'Who composed the music for Lagaan?', options: ['AR Rahman', 'Shankar Ehsaan Loy', 'Vishal-Shekhar', 'Pritam'], answer: 0 },
  ],
};
```

- [ ] Commit: `git add client/src/data/sidequests.js && git commit -m "feat: side quest content data (movies, dares, trivia, celebs)"`

---

## Task 12: Server — Side Quest Trigger Logic

**Files:**
- Modify: `server/GameManager.js`
- Modify: `server/index.js`

- [ ] Add a `_maybeTriggerSideQuest(pair)` method to `GameManager.js` after `endBus`:

```js
_maybeTriggerSideQuest(pair) {
  const drinks = pair.pendingDrinks || 0;
  if (drinks < 2) return null;
  if (Math.random() > 0.4) return null;

  const types = ['charades', 'rapidfire', 'dare', 'mimicry', 'trivia'];
  const type = types[Math.floor(Math.random() * types.length)];
  const contentIndex = Math.floor(Math.random() * 1000); // client resolves via modulo

  return { type, contentIndex, pairId: pair.id, drinksAtStake: drinks };
}
```

- [ ] Update `_resolveRound` in `GameManager.js` to store the pending side quest. After `rs.hit = hit;` and before `return`:

```js
pair._pendingSideQuest = this._maybeTriggerSideQuest(pair);
```

- [ ] Update `_resolveRound1` similarly. After `rs.resolved = true;` and before `return`:

```js
pair._pendingSideQuest = this._maybeTriggerSideQuest(pair);
```

- [ ] In `server/index.js`, after `round:reveal` is emitted for `round:r1Guess`, `round:guess` result, and `round:partnerResponse` result, check for and emit the side quest. Add this helper function near the top of the file (after `syncAllRaw`):

```js
function maybeSendSideQuest(game, pair, socket) {
  if (pair?._pendingSideQuest) {
    const sq = pair._pendingSideQuest;
    pair._pendingSideQuest = null;
    io.to(game.roomCode).emit('sidequest:offer', sq);
  }
}
```

- [ ] In the `round:r1Guess` handler, after emitting `round:reveal`, call:

```js
if (result) {
  io.to(game.roomCode).emit('round:reveal', { pairId: player.pairId, ...result });
  maybeSendSideQuest(game, game.pairs[player.pairId], socket);
}
```

- [ ] Do the same in `round:partnerResponse` handler after emitting `round:reveal`
- [ ] Add `sidequest:decline` and `sidequest:accept` handlers:

```js
socket.on('sidequest:decline', () => {
  // Nothing to do server-side — drinks already applied, sidequest just closes
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  const game = rooms.get(meta.roomCode);
  if (!game) return;
  io.to(game.roomCode).emit('sidequest:closed');
});

socket.on('sidequest:result', ({ pairId, won, drinksAtStake }) => {
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  const game = rooms.get(meta.roomCode);
  if (!game || !game.players[socket.id]?.isHost) return;
  const pair = game.pairs[pairId];
  if (!pair) return;
  if (won) {
    pair.drinkCount = Math.max(0, pair.drinkCount - drinksAtStake);
    pair.pendingDrinks = 0;
  }
  io.to(game.roomCode).emit('sidequest:resolved', { pairId, won, drinksAtStake });
  syncAll(game);
});

socket.on('sidequest:vote', ({ vote }) => {
  // Broadcast vote to room so all clients can tally
  const meta = socketMeta.get(socket.id);
  if (!meta) return;
  const game = rooms.get(meta.roomCode);
  if (!game) return;
  io.to(game.roomCode).emit('sidequest:votecast', {
    playerId: socket.id,
    vote, // 'yes' | 'no'
  });
});
```

- [ ] Commit: `git add server/GameManager.js server/index.js && git commit -m "feat: side quest trigger logic and server socket handlers"`

---

## Task 13: Store + Hook — Side Quest State

**Files:**
- Modify: `client/src/store/gameStore.js`
- Modify: `client/src/hooks/useSocket.js`

- [ ] Add side quest slice to `gameStore.js`. Add these fields and setters to the store object:

```js
activeSideQuest: null,   // { type, contentIndex, pairId, drinksAtStake }
sideQuestVotes: {},      // { [playerId]: 'yes' | 'no' }

setSideQuest: (sq) => set({ activeSideQuest: sq, sideQuestVotes: {} }),
clearSideQuest: () => set({ activeSideQuest: null, sideQuestVotes: {} }),
addSideQuestVote: (playerId, vote) => set(s => ({
  sideQuestVotes: { ...s.sideQuestVotes, [playerId]: vote }
})),
```

- [ ] Add side quest event handlers to `useSocket.js`. Inside the `useEffect`, after existing socket.on calls:

```js
socket.on('sidequest:offer', (data) => {
  useGameStore.getState().setSideQuest(data);
});

socket.on('sidequest:closed', () => {
  useGameStore.getState().clearSideQuest();
});

socket.on('sidequest:resolved', () => {
  useGameStore.getState().clearSideQuest();
});

socket.on('sidequest:votecast', ({ playerId, vote }) => {
  useGameStore.getState().addSideQuestVote(playerId, vote);
});
```

- [ ] Add cleanup in the return function of the useEffect:

```js
socket.off('sidequest:offer');
socket.off('sidequest:closed');
socket.off('sidequest:resolved');
socket.off('sidequest:votecast');
```

- [ ] Commit: `git add client/src/store/gameStore.js client/src/hooks/useSocket.js && git commit -m "feat: side quest Zustand slice and socket event handlers"`

---

## Task 14: SideQuestTimer Component

**Files:**
- Create: `client/src/components/SideQuestTimer.jsx`

- [ ] Create the timer component:

```jsx
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
```

- [ ] Commit: `git add client/src/components/SideQuestTimer.jsx && git commit -m "feat: SideQuestTimer countdown component"`

---

## Task 15: SideQuestOverlay Component

**Files:**
- Create: `client/src/components/SideQuestOverlay.jsx`

- [ ] Create `client/src/components/SideQuestOverlay.jsx`:

```jsx
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import socket from '../socket';
import useGameStore from '../store/gameStore';
import SideQuestTimer from './SideQuestTimer';
import { SIDE_QUESTS } from '../data/sidequests';

// ─── Reveal Screen ────────────────────────────────────────────────────────────
function QuestReveal({ quest, isMyQuest, players, onAccept, onDecline }) {
  const ICONS = { charades: '🎬', rapidfire: '⚡', dare: '😈', mimicry: '🎭', trivia: '🧠' };
  const TITLES = { charades: 'Dumb Charades!', rapidfire: 'Rapid Fire!', dare: 'Truth or Dare!', mimicry: 'Mimicry Challenge!', trivia: 'Trivia Lifeline!' };
  const DESCS = {
    charades: 'Act out the movie — no words, no sounds. Team guesses. Get it right → skip drinks.',
    rapidfire: 'Name 5 things in the category in 30 seconds. 3+ correct → save drinks.',
    dare: 'Another player picks a dare for you. Complete it → skip drinks. Decline → drinks doubled.',
    mimicry: 'Impersonate the celebrity for 15 seconds. Group votes. Win → drinks halved.',
    trivia: 'Answer a trivia question. Correct → skip drinks. Wrong → drinks doubled. No help allowed.',
  };
  const pairNames = quest.pairId
    ? (useGameStore.getState().gameState?.pairs?.[quest.pairId]?.playerIds || [])
        .map(id => players[id]?.name || '?').join(' & ')
    : '';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      style={{
        background: 'linear-gradient(160deg, #2d0a4e, #0a1a3e)',
        border: '2px solid rgba(107,107,255,0.4)',
        borderRadius: 24,
        padding: 28,
        width: '100%', maxWidth: 380,
        boxShadow: '0 8px 40px rgba(107,107,255,0.3)',
        textAlign: 'center',
      }}
    >
      {/* Badge */}
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        style={{
          display: 'inline-flex', width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff6b6b, #ffd93d)',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 30, marginBottom: 16,
          boxShadow: '0 0 24px rgba(255,107,107,0.5)',
        }}
      >
        {ICONS[quest.type]}
      </motion.div>

      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 4, color: '#ffd93d', textTransform: 'uppercase', marginBottom: 6 }}>
        ⚡ Side Quest Unlocked
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 10 }}>{TITLES[quest.type]}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 20 }}>
        {DESCS[quest.type]}
      </div>

      {pairNames && (
        <div style={{ fontSize: 13, color: 'var(--accent-primary)', marginBottom: 20 }}>
          Challenge: <strong>{pairNames}</strong> · {quest.drinksAtStake} sips at stake
        </div>
      )}

      {isMyQuest ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={onAccept}
            style={{
              background: 'linear-gradient(135deg, #ff6b6b, #ff6bcc)',
              color: '#fff', border: 'none', borderRadius: 14,
              padding: '16px', fontSize: 17, fontWeight: 800,
              boxShadow: 'var(--glow-hot)',
            }}
          >
            ACCEPT ⚡
          </button>
          <button
            onClick={onDecline}
            style={{
              background: 'transparent', color: 'rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14,
              padding: '12px', fontSize: 14, fontWeight: 600,
            }}
          >
            skip it (keep drinks)
          </button>
        </div>
      ) : (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Waiting for {pairNames} to decide…
        </div>
      )}
    </motion.div>
  );
}

// ─── Charades Quest ───────────────────────────────────────────────────────────
function CharadesQuest({ quest, isActor, players, onHostResult }) {
  const isHost = useGameStore(s => s.gameState?.players?.[s.mySocketId]?.isHost);
  const pool = [...SIDE_QUESTS.charades.bollywood, ...SIDE_QUESTS.charades.hollywood, ...SIDE_QUESTS.charades.tv];
  const title = pool[quest.contentIndex % pool.length];

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>🎬 Dumb Charades</div>
      <SideQuestTimer seconds={60} onExpire={() => isHost && onHostResult(false)} color="var(--accent-primary)" />
      {isActor ? (
        <>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>You're acting! Others must guess:</div>
          <div style={{
            background: 'rgba(107,107,255,0.15)', border: '2px solid var(--accent-primary)',
            borderRadius: 16, padding: '20px 24px',
            fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px',
            boxShadow: 'var(--glow-purple)',
          }}>
            {title}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>No words · No sounds · No mouthing</div>
        </>
      ) : (
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', padding: 24 }}>
          🎬 Guessing in progress…
        </div>
      )}
      {isHost && (
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={() => onHostResult(true)} style={{ flex: 1, background: 'var(--accent-green)', color: '#0a0510', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, fontSize: 15 }}>They got it! ✓</button>
          <button onClick={() => onHostResult(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', fontWeight: 700, fontSize: 15 }}>Nope ✗</button>
        </div>
      )}
    </div>
  );
}

// ─── Trivia Quest ─────────────────────────────────────────────────────────────
function TriviaQuest({ quest, isMyQuest, onAnswer }) {
  const q = SIDE_QUESTS.trivia[quest.contentIndex % SIDE_QUESTS.trivia.length];
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>🧠 Trivia Lifeline</div>
      <div style={{ background: 'rgba(107,107,255,0.1)', border: '1px solid rgba(107,107,255,0.3)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.4, color: '#fff' }}>{q.q}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {q.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => { if (!isMyQuest || selected !== null) return; setSelected(i); setTimeout(() => onAnswer(i === q.answer), 600); }}
            style={{
              background: selected === null ? 'var(--bg-surface)' : i === q.answer ? 'rgba(107,255,184,0.2)' : selected === i ? 'rgba(255,107,107,0.2)' : 'var(--bg-surface)',
              border: `1px solid ${selected === null ? 'var(--border)' : i === q.answer ? 'var(--accent-green)' : selected === i ? 'var(--accent-hot)' : 'var(--border)'}`,
              borderRadius: 12, padding: '14px 16px',
              color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, textAlign: 'left',
              opacity: isMyQuest ? 1 : 0.5,
            }}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
      {!isMyQuest && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginTop: 16 }}>No hints! Let them answer.</p>}
    </div>
  );
}

// ─── Dare Quest ───────────────────────────────────────────────────────────────
function DareQuest({ quest, isMyQuest, isHost, players, mySocketId, votes, onHostResult }) {
  const dares = SIDE_QUESTS.dares;
  // Show 3 dares starting from contentIndex
  const shown = [0, 1, 2].map(i => dares[(quest.contentIndex + i) % dares.length]);
  const [chosenDare, setChosenDare] = useState(null);
  const [voting, setVoting] = useState(false);
  const [myVote, setMyVote] = useState(null);

  const pairPlayerIds = useGameStore.getState().gameState?.pairs?.[quest.pairId]?.playerIds || [];
  const amIPunished = pairPlayerIds.includes(mySocketId);
  const amIDareGiver = !amIPunished && !isHost;

  const yesVotes = Object.values(votes).filter(v => v === 'yes').length;
  const noVotes = Object.values(votes).filter(v => v === 'no').length;
  const totalPlayers = Object.values(players).filter(p => p.connected).length;

  function handleVote(v) {
    setMyVote(v);
    socket.emit('sidequest:vote', { vote: v });
  }

  if (!chosenDare) {
    return (
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>😈 Pick a Dare</div>
        {amIDareGiver || isHost ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 12, textAlign: 'center' }}>Choose one dare for the punished player:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {shown.map((dare, i) => (
                <button key={i} onClick={() => { setChosenDare(dare); setVoting(true); }}
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, textAlign: 'left', lineHeight: 1.4 }}>
                  {dare}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 24, fontSize: 15 }}>Another player is picking your dare…</div>
        )}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>😈 The Dare</div>
      <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 16, padding: 20, marginBottom: 20, fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>
        {chosenDare}
      </div>
      <SideQuestTimer seconds={30} onExpire={() => isHost && onHostResult(false)} color="var(--accent-hot)" />
      {!myVote && !isHost && (
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => handleVote('yes')} style={{ flex: 1, background: 'rgba(107,255,184,0.2)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800 }}>👍 Done it</button>
          <button onClick={() => handleVote('no')} style={{ flex: 1, background: 'rgba(255,107,107,0.15)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800 }}>👎 Nope</button>
        </div>
      )}
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>
        Votes: 👍 {yesVotes} · 👎 {noVotes} / {totalPlayers - 1}
      </div>
      {isHost && <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={() => onHostResult(yesVotes >= noVotes)} style={{ flex: 1, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800 }}>Close Vote</button>
      </div>}
    </div>
  );
}

// ─── Mimicry Quest ────────────────────────────────────────────────────────────
function MimicryQuest({ quest, isMyQuest, isHost, votes, players, mySocketId, onHostResult }) {
  const [pool, setPool] = useState('bollywood');
  const [assigned, setAssigned] = useState(null);
  const celeb = assigned ? assigned : null;
  const yesVotes = Object.values(votes).filter(v => v === 'yes').length;
  const noVotes = Object.values(votes).filter(v => v === 'no').length;
  const totalPlayers = Object.values(players).filter(p => p.connected).length;
  const [myVote, setMyVote] = useState(null);

  function handleAssign() {
    const arr = SIDE_QUESTS.mimicry[pool];
    setAssigned(arr[quest.contentIndex % arr.length]);
  }

  function handleVote(v) {
    setMyVote(v);
    socket.emit('sidequest:vote', { vote: v });
  }

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>🎭 Mimicry Challenge</div>
      {!celeb ? (
        <>
          {isMyQuest && (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>Choose your celebrity pool — you can switch once before revealing:</p>
              <div style={{ display: 'flex', background: 'var(--bg-surface)', borderRadius: 10, padding: 3, marginBottom: 20 }}>
                {[['bollywood', '🎬 Bollywood'], ['hollywood', '🎥 Hollywood']].map(([v, label]) => (
                  <button key={v} onClick={() => setPool(v)} style={{ flex: 1, background: pool === v ? 'var(--accent-primary)' : 'transparent', color: pool === v ? '#fff' : 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '10px', fontSize: 14, fontWeight: 700 }}>{label}</button>
                ))}
              </div>
              <button onClick={handleAssign} style={{ width: '100%', background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 17, fontWeight: 800, boxShadow: 'var(--glow-purple)' }}>Reveal My Celebrity</button>
            </>
          )}
          {!isMyQuest && <div style={{ color: 'rgba(255,255,255,0.5)', padding: 24 }}>Waiting for them to pick their celebrity…</div>}
        </>
      ) : (
        <>
          <div style={{ background: 'rgba(107,107,255,0.15)', border: '2px solid var(--accent-primary)', borderRadius: 16, padding: '20px 24px', marginBottom: 8, boxShadow: 'var(--glow-purple)' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>{celeb.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>{celeb.hint}</div>
          </div>
          <SideQuestTimer seconds={15} onExpire={() => {}} color="var(--accent-primary)" />
          {!myVote && !isMyQuest && !isHost && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button onClick={() => handleVote('yes')} style={{ flex: 1, background: 'rgba(107,255,184,0.2)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800 }}>👍 Nailed it</button>
              <button onClick={() => handleVote('no')} style={{ flex: 1, background: 'rgba(255,107,107,0.15)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800 }}>👎 Rubbish</button>
            </div>
          )}
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 12 }}>Votes: 👍 {yesVotes} · 👎 {noVotes}</div>
          {isHost && <button onClick={() => onHostResult(yesVotes >= noVotes)} style={{ width: '100%', marginTop: 12, background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800 }}>Close Vote</button>}
        </>
      )}
    </div>
  );
}

// ─── Rapid Fire Quest ─────────────────────────────────────────────────────────
function RapidFireQuest({ quest, isMyQuest, isHost, onHostResult }) {
  const cats = SIDE_QUESTS.rapidfire;
  const cat = cats[quest.contentIndex % cats.length];
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  return (
    <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 3, color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: 12 }}>⚡ Rapid Fire</div>
      <SideQuestTimer seconds={30} onExpire={() => isHost && onHostResult(score >= 3)} color="var(--accent-gold)" />
      <div style={{ background: 'rgba(255,217,61,0.1)', border: '1px solid rgba(255,217,61,0.3)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--accent-gold)', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Category</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{cat.category}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>e.g. {cat.examples.join(', ')}</div>
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--accent-gold)', marginBottom: 16 }}>
        {score} / 5
      </div>
      {isHost && attempts < 5 && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { setScore(s => s + 1); setAttempts(a => a + 1); }} style={{ flex: 1, background: 'rgba(107,255,184,0.2)', border: '1px solid var(--accent-green)', borderRadius: 12, padding: '14px', color: 'var(--accent-green)', fontWeight: 800, fontSize: 22 }}>✓</button>
          <button onClick={() => setAttempts(a => a + 1)} style={{ flex: 1, background: 'rgba(255,107,107,0.15)', border: '1px solid var(--accent-hot)', borderRadius: 12, padding: '14px', color: 'var(--accent-hot)', fontWeight: 800, fontSize: 22 }}>✗</button>
        </div>
      )}
      {isHost && attempts >= 5 && (
        <button onClick={() => onHostResult(score >= 3)} style={{ width: '100%', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 800, marginTop: 8 }}>
          Final Score: {score}/5 — {score >= 3 ? 'WIN' : 'LOSE'}
        </button>
      )}
      {!isHost && <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 12 }}>Host is marking answers</p>}
    </div>
  );
}

// ─── Result Screen ────────────────────────────────────────────────────────────
function QuestResult({ won, drinksAtStake, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ textAlign: 'center', width: '100%', maxWidth: 380 }}
    >
      <div style={{ fontSize: 72, marginBottom: 12 }}>{won ? '🎉' : '😬'}</div>
      <div style={{ fontSize: 36, fontWeight: 900, color: won ? 'var(--accent-green)' : 'var(--accent-hot)', marginBottom: 8 }}>
        {won ? 'QUEST COMPLETE!' : 'QUEST FAILED!'}
      </div>
      <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>
        {won ? `Saved ${drinksAtStake} sip${drinksAtStake !== 1 ? 's' : ''}!` : 'Drinks stay. Better luck next time.'}
      </div>
    </motion.div>
  );
}

// ─── Main Overlay ─────────────────────────────────────────────────────────────
export default function SideQuestOverlay() {
  const activeSideQuest = useGameStore(s => s.activeSideQuest);
  const sideQuestVotes = useGameStore(s => s.sideQuestVotes);
  const clearSideQuest = useGameStore(s => s.clearSideQuest);
  const gameState = useGameStore(s => s.gameState);
  const mySocketId = useGameStore(s => s.mySocketId);
  const players = gameState?.players || {};

  const [phase, setPhase] = useState('reveal'); // 'reveal' | 'active' | 'result'
  const [result, setResult] = useState(null);   // { won, drinksAtStake }

  const isHost = players[mySocketId]?.isHost;
  const pairPlayerIds = activeSideQuest ? (gameState?.pairs?.[activeSideQuest.pairId]?.playerIds || []) : [];
  const isMyQuest = pairPlayerIds.includes(mySocketId);
  const isActor = isMyQuest && activeSideQuest?.type === 'charades';

  const handleAccept = useCallback(() => {
    socket.emit('sidequest:accept');
    setPhase('active');
  }, []);

  const handleDecline = useCallback(() => {
    socket.emit('sidequest:decline');
    clearSideQuest();
  }, [clearSideQuest]);

  const handleHostResult = useCallback((won) => {
    socket.emit('sidequest:result', {
      pairId: activeSideQuest?.pairId,
      won,
      drinksAtStake: activeSideQuest?.drinksAtStake,
    });
    setResult({ won, drinksAtStake: activeSideQuest?.drinksAtStake });
    setPhase('result');
  }, [activeSideQuest]);

  // Reset phase when a new quest arrives
  const questKey = activeSideQuest?.type + activeSideQuest?.contentIndex;

  if (!activeSideQuest) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={questKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(5,2,16,0.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        {/* Background glow */}
        <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 120px rgba(107,107,255,0.15)', pointerEvents: 'none' }} />

        {phase === 'reveal' && (
          <QuestReveal
            quest={activeSideQuest}
            isMyQuest={isMyQuest}
            players={players}
            onAccept={handleAccept}
            onDecline={handleDecline}
          />
        )}

        {phase === 'active' && activeSideQuest.type === 'charades' && (
          <CharadesQuest quest={activeSideQuest} isActor={isActor} players={players} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'trivia' && (
          <TriviaQuest quest={activeSideQuest} isMyQuest={isMyQuest} onAnswer={(won) => { if (isMyQuest) handleHostResult(won); }} />
        )}
        {phase === 'active' && activeSideQuest.type === 'dare' && (
          <DareQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} players={players} mySocketId={mySocketId} votes={sideQuestVotes} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'mimicry' && (
          <MimicryQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} votes={sideQuestVotes} players={players} mySocketId={mySocketId} onHostResult={handleHostResult} />
        )}
        {phase === 'active' && activeSideQuest.type === 'rapidfire' && (
          <RapidFireQuest quest={activeSideQuest} isMyQuest={isMyQuest} isHost={isHost} onHostResult={handleHostResult} />
        )}

        {phase === 'result' && (
          <QuestResult won={result.won} drinksAtStake={result.drinksAtStake} onDismiss={clearSideQuest} />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] Commit: `git add client/src/components/SideQuestOverlay.jsx && git commit -m "feat: SideQuestOverlay — full side quest UI (charades, trivia, dare, mimicry, rapid fire)"`

---

## Task 16: Wire SideQuestOverlay into App

**Files:**
- Modify: `client/src/App.jsx`

- [ ] Import and render `SideQuestOverlay` in `App.jsx`. Add the import:

```js
import SideQuestOverlay from './components/SideQuestOverlay';
```

- [ ] Wrap the screen renders so `SideQuestOverlay` sits above everything:

```jsx
export default function App() {
  useSocket();
  const gameState = useGameStore(s => s.gameState);
  const phase = gameState?.phase || 'LOBBY';

  return (
    <>
      {phase === 'BUS' && <BusRide />}
      {phase === 'GAME_OVER' && <GameOver />}
      {GAME_PHASES.includes(phase) && <Game />}
      {phase === 'LOBBY' && <Lobby />}
      <SideQuestOverlay />
    </>
  );
}
```

- [ ] Run game, get punished 2+ drinks, verify the side quest overlay appears ~40% of the time
- [ ] Commit: `git add client/src/App.jsx && git commit -m "feat: wire SideQuestOverlay into app root"`

---

## Task 17: Audio + Haptics

**Files:**
- Create: `client/src/audio.js`
- Create: `client/src/haptics.js`

- [ ] Create `client/src/audio.js`:

```js
let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(volume, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
  } catch (e) { /* silently ignore — audio not critical */ }
}

export const sounds = {
  cardFlip:   () => playTone(800, 0.08, 'triangle'),
  correct:    () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.15), 80); },
  wrong:      () => playTone(200, 0.3, 'sawtooth', 0.2),
  takeSip:    () => playTone(440, 0.15, 'sine'),
  doubleDown: () => playTone(300, 0.2, 'square', 0.2),
  sideQuest:  () => { playTone(440, 0.1); setTimeout(() => playTone(554, 0.1), 100); setTimeout(() => playTone(659, 0.2), 200); },
  questWin:   () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.15), i * 80)); },
  questFail:  () => { [440, 370, 311].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sawtooth', 0.15), i * 80)); },
};

// Must be called on first user interaction to unlock AudioContext
export function unlockAudio() { getCtx(); }
```

- [ ] Create `client/src/haptics.js`:

```js
export const haptics = {
  light:     () => navigator.vibrate?.(10),
  medium:    () => navigator.vibrate?.(25),
  heavy:     () => navigator.vibrate?.(50),
  error:     () => navigator.vibrate?.([30, 20, 30]),
  success:   () => navigator.vibrate?.([10, 10, 10]),
  sideQuest: () => navigator.vibrate?.([20, 10, 20, 10, 60]),
};
```

- [ ] In `App.jsx`, unlock audio on first interaction:

```jsx
import { unlockAudio } from './audio';

// Inside App component, add:
useEffect(() => {
  const unlock = () => { unlockAudio(); window.removeEventListener('touchstart', unlock); };
  window.addEventListener('touchstart', unlock, { once: true });
}, []);
```

- [ ] In `Game.jsx`, import and call sounds at key moments:

```js
import { sounds } from '../audio';
import { haptics } from '../haptics';

// In handleR1Guess, handleGuess, handlePartnerResponse — add before socket.emit:
sounds.cardFlip(); haptics.light();

// In RevealOverlay, add useEffect when reveal changes:
useEffect(() => {
  if (!reveal) return;
  if (reveal.drinks > 0) { sounds.wrong(); haptics.error(); }
  else { sounds.correct(); haptics.success(); }
}, [reveal]);
```

- [ ] In `SideQuestOverlay.jsx`, in `QuestReveal` after `onAccept`:

```js
sounds.sideQuest(); haptics.sideQuest();
```

- [ ] In `QuestResult`, add useEffect:

```js
useEffect(() => {
  if (won) { sounds.questWin(); haptics.success(); }
  else { sounds.questFail(); haptics.error(); }
}, []);
```

- [ ] Commit: `git add client/src/audio.js client/src/haptics.js client/src/screens/Game.jsx client/src/components/SideQuestOverlay.jsx client/src/App.jsx && git commit -m "feat: audio and haptic feedback"`

---

## Task 18: PWA Shell

**Files:**
- Modify: `client/vite.config.js`
- Create: `client/public/manifest.json`
- Create: `client/public/icon.svg`

- [ ] Install vite-plugin-pwa:

```bash
cd client && npm install -D vite-plugin-pwa
```

Expected: `added 1 package` (or similar)

- [ ] Replace `client/vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Double Down',
        short_name: 'Double Down',
        description: 'A multiplayer drinking card game',
        theme_color: '#0a0510',
        background_color: '#0a0510',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,svg}'],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true, changeOrigin: true },
    },
  },
});
```

- [ ] Create `client/public/icon.svg` (playing card motif, purple/coral):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0a0510"/>
  <rect x="64" y="80" width="384" height="352" rx="40" fill="#f5f0ff"/>
  <rect x="80" y="96" width="352" height="320" rx="32" fill="#fff"/>
  <text x="128" y="240" font-family="Georgia,serif" font-size="160" font-weight="900" fill="#ff6b6b">A</text>
  <text x="180" y="370" font-family="Georgia,serif" font-size="120" fill="#ff6b6b">♥</text>
</svg>
```

- [ ] Generate PNG icons from the SVG. Run this in `client/public/`:

```bash
# If sharp-cli or Inkscape is unavailable, use this approach:
# Copy icon.svg as a placeholder for both sizes — browsers accept SVG as icon source
cp client/public/icon.svg client/public/icon-192.png
cp client/public/icon.svg client/public/icon-512.png
# Note: for production, convert to actual PNG. For dev this is fine.
```

- [ ] Add safe area CSS to all screen containers. In `index.css`, add:

```css
.screen {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

- [ ] Run `npm run build` from project root, verify no errors
- [ ] Commit: `git add client/vite.config.js client/public/ && git commit -m "feat: PWA manifest, icons, service worker via vite-plugin-pwa"`

---

## Task 19: BusRide — Chaotic Fun Restyling

**Files:**
- Modify: `client/src/screens/BusRide.jsx`

- [ ] Update all inline styles in `BusRide.jsx` to use the new palette vars. Key changes:

```jsx
// Outer container:
style={{ minHeight: '100vh', background: 'var(--bg-deep)', display: 'flex', flexDirection: 'column', padding: '24px 16px', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}

// Bus label:
style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--accent-hot)', marginBottom: 4 }}

// Drinks pending counter (big number):
style={{ fontSize: 48, fontWeight: 900, color: drinksPending > 0 ? 'var(--accent-hot)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}

// FLIP button:
style={{ width: '100%', background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 18, padding: '24px', fontSize: 28, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', boxShadow: 'var(--glow-purple)' }}

// Keep Going button:
style={{ width: '100%', background: 'linear-gradient(135deg, #6bffb8, #48bb78)', color: '#0a0510', border: 'none', borderRadius: 14, padding: '18px', fontSize: 18, fontWeight: 800 }}

// Bail button:
style={{ width: '100%', background: 'rgba(255,107,107,0.15)', color: 'var(--accent-hot)', border: '2px solid var(--accent-hot)', borderRadius: 14, padding: '14px', fontSize: 15, fontWeight: 700 }}
```

- [ ] In the bail button, change the label to:

```jsx
`Bail on ${flipperName} 💀 (their drinks ×2)`
```

- [ ] Commit: `git add client/src/screens/BusRide.jsx && git commit -m "style: BusRide Chaotic Fun restyling"`

---

## Task 20: Lobby — Chaotic Fun Restyling

**Files:**
- Modify: `client/src/screens/Lobby.jsx`

- [ ] Update the pre-room screen styles in `Lobby.jsx`:

```jsx
// Main input:
style={{ width: '100%', background: 'var(--bg-surface)', border: '2px solid var(--border)', borderRadius: 14, padding: '14px 18px', color: 'var(--text-primary)', fontSize: 20, outline: 'none', marginBottom: 16, transition: 'border-color 0.15s' }}
// On focus (via onFocus/onBlur handlers): border: '2px solid var(--accent-primary)'

// Primary action button:
style={{ width: '100%', background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 18, fontWeight: 800, boxShadow: 'var(--glow-purple)', opacity: disabled ? 0.4 : 1 }}

// Room code display:
style={{ fontFamily: 'ui-monospace, monospace', fontSize: 52, fontWeight: 900, letterSpacing: 14, color: 'var(--accent-primary)', textShadow: 'var(--glow-purple)' }}

// Player row — selected:
style={{ background: 'rgba(107,107,255,0.2)', border: '2px solid var(--accent-primary)', boxShadow: 'var(--glow-purple)', borderRadius: 14, padding: '12px 16px', ... }}

// Start button — active:
style={{ background: 'linear-gradient(135deg, #6b6bff, #ff6bcc)', boxShadow: 'var(--glow-purple)', ... }}
```

- [ ] Commit: `git add client/src/screens/Lobby.jsx && git commit -m "style: Lobby Chaotic Fun restyling"`

---

## Task 21: Final Integration Test

- [ ] Start the server: `npm run dev` from project root
- [ ] Open two browser tabs at `http://localhost:5173`
- [ ] **Test Teams flow:**
  1. Tab 1: Create room (Teams mode) → see room code
  2. Tab 2: Join room → both players visible
  3. Auto-pair → Start game
  4. Play Round 1 — both tabs guess, verify "TAKE X SIPS" flash appears
  5. Play through Rounds 2–4
  6. Let a punishment of 2+ sips happen — verify side quest appears ~40% of the time
  7. Accept a side quest, complete it, verify drinks are removed
  8. Complete all 4 rounds → Bus ride appears
  9. Flip cards, bail or complete → Game over screen
- [ ] **Test Solo flow:**
  1. Create room (Every Man for Himself mode)
  2. Add 3 more players (or test with 2)
  3. Start game — verify no partner response buttons appear
  4. Play through rounds — each player has their own hand
  5. Highest drink count player rides bus alone
- [ ] Fix any issues found
- [ ] Final commit: `git add -A && git commit -m "feat: complete UI overhaul, side quests, solo mode"`

---

## Execution Checklist

- [ ] Task 1: CSS vars
- [ ] Task 2: Card component
- [ ] Task 3: ActionButtons
- [ ] Task 4: PairPanel + DrinkCounter
- [ ] Task 5: RoundPrompt
- [ ] Task 6: "TAKE X SIPS" reveal
- [ ] Task 7: Lobby mode picker
- [ ] Task 8: GameManager solo mode
- [ ] Task 9: Server wire-up + store
- [ ] Task 10: Game.jsx solo routing
- [ ] Task 11: Side quest data
- [ ] Task 12: Side quest server logic
- [ ] Task 13: Store + socket hooks
- [ ] Task 14: SideQuestTimer
- [ ] Task 15: SideQuestOverlay
- [ ] Task 16: Wire overlay into App
- [ ] Task 17: Audio + haptics
- [ ] Task 18: PWA shell
- [ ] Task 19: BusRide restyling
- [ ] Task 20: Lobby restyling
- [ ] Task 21: Integration test
