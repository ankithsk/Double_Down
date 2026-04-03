# Double Down — Build Plan

> Mobile-first PWA. Real-time multiplayer. Top-notch design. No lag, no broken animations.
> Primary target: iPhone Safari / Android Chrome, played in a group with 2–10 phones.

---

## Current State

### Done ✅
| File | Status |
|------|--------|
| `server/constants.js` | Complete — all game enums, values, suits |
| `server/Deck.js` | Complete — deck creation + Fisher-Yates shuffle |
| `server/GameManager.js` | Complete — full game logic (rounds 1–4, bus, pairs, tournament bracket) |
| `server/index.js` | Complete — Socket.io event routing, reconnect handling, state sync |
| `client/src/socket.js` | Complete — singleton socket instance |
| `client/src/store/gameStore.js` | Complete — Zustand store |
| `client/src/hooks/useSocket.js` | Complete — socket event → store bridge |
| `client/src/components/Card.jsx` | Complete — flip animation, face/back, suit symbols |
| `client/src/components/DrinkCounter.jsx` | Complete — animated count-up |
| `client/src/components/PairPanel.jsx` | Complete — pair display with hand + status |
| `client/src/components/ActionButtons.jsx` | Complete — all button sets for rounds 1–4 + partner response |
| `client/src/components/Scoreboard.jsx` | Complete — ranked pair list |
| `client/vite.config.js` | Updated — Socket.io proxy configured |
| `package.json` | Updated — `npm run dev` launches both server + client |

### Still Needed 🔧
- `client/src/App.jsx` — currently Vite default template, needs full rewrite
- `client/src/screens/Lobby.jsx` — room create/join, pair assignment UI
- `client/src/screens/Game.jsx` — round orchestration screen
- `client/src/screens/BusRide.jsx` — bus round isolated screen
- `client/index.html` — needs PWA meta tags, viewport-fit=cover, theme-color
- `client/src/index.css` — needs reset + CSS custom properties + global font
- `client/public/manifest.json` — PWA manifest
- `client/public/sw.js` or vite-plugin-pwa — service worker
- App icons (192×192, 512×512 PNG) for add-to-homescreen
- Sound feedback (Web Audio API synthesized tones — no files needed)

---

## Phased Build Plan

---

### Phase 1 — Wired & Working (MVP)
**Goal:** Two phones can play a full game end-to-end. No polish yet. Just working.

**Tasks:**
1. Rewrite `client/src/App.jsx` — phase-driven screen router (LOBBY → ROUND_1–4 → BUS → GAME_OVER)
2. Write `client/src/screens/Lobby.jsx`
   - Name entry input
   - Create Room (show 4-char code large) / Join Room (4-char input)
   - Player list with pair assignment (auto-pair button for host)
   - Start Game button (host only, disabled until all paired)
3. Write `client/src/screens/Game.jsx`
   - Shows current round prompt
   - Renders correct ActionButtons set based on phase + who your are
   - Shows all pairs' PairPanels
   - "Next Round" button for host after all resolve
   - Between-round drink resolution overlay
4. Write `client/src/screens/BusRide.jsx`
   - Flipper sees "Flip" button + flipped cards in a row
   - Decider sees "Keep Going" / "Bail" with guilt-trip copy
   - Spectators see read-only view with live updates
5. Fix `client/index.html` — proper title, viewport meta
6. Basic `client/src/index.css` — dark background, font, no default margins
7. **Test:** Full 2-player and 4-player game flow on localhost

---

### Phase 2 — PWA Shell
**Goal:** Works as installed app on iPhone Safari and Android Chrome. Feels native.

**Tasks:**
1. Install `vite-plugin-pwa`
   ```
   cd client && npm install -D vite-plugin-pwa
   ```
2. Configure in `vite.config.js`:
   - `manifest` block with name, short_name, theme_color, background_color, display: standalone
   - `workbox` with `navigateFallback: 'index.html'` (shell caching only — no game state cached)
   - `registerType: 'autoUpdate'`
3. Generate app icons:
   - 192×192 and 512×512 PNG with card/game motif
   - Place in `client/public/`
4. Update `client/index.html`:
   - `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`
   - `<meta name="apple-mobile-web-app-capable" content="yes">`
   - `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
   - `<meta name="theme-color" content="#0a0a1a">`
   - Apple touch icon link tags
5. Add safe area inset CSS vars:
   ```css
   padding-bottom: env(safe-area-inset-bottom);
   padding-top: env(safe-area-inset-top);
   ```
6. QR code on host Lobby screen (`qrcode.react` already installed) — scan to join, eliminates typing the code
7. **Test:** Add to home screen on iOS Safari. Verify standalone mode, no address bar, no white flash on load.

---

### Phase 3 — Design Pass
**Goal:** Looks and feels exceptional. Dark, rich, tactile. People pull out their phones to show friends.

#### Visual Language
- **Palette:**
  ```
  --bg-deep:      #0a0a1a   (near-black navy)
  --bg-surface:   #12122a   (card/panel background)
  --bg-elevated:  #1a1a3a   (modals, overlays)
  --accent-blue:  #4f9cf9   (primary actions)
  --accent-red:   #e53e3e   (danger, red cards)
  --accent-gold:  #f6ad55   (shield, warning)
  --accent-green: #48bb78   (success, correct)
  --text-primary: #f0f0f0
  --text-muted:   #6b7280
  --border:       rgba(255,255,255,0.08)
  --glow-blue:    0 0 20px rgba(79,156,249,0.3)
  --glow-red:     0 0 20px rgba(229,62,62,0.3)
  ```
- **Typography:** Use system UI stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`) — no Google Fonts request, instant render, feels native on iOS.
- **Card design:** White face with clean serif value + suit. Subtle drop shadow. Back: deep navy gradient + a subtle repeating diamond pattern in CSS (no images).

#### Layout Principles
- **Mobile-first breakpoint:** Design for 375px width. Everything should feel intentional at this size.
- **Touch targets:** Every interactive element minimum 48×48px. Use `min-height: 48px` on all buttons.
- **Thumb zone:** Primary action buttons sit in the bottom 40% of screen — the natural thumb reach area. Prompts and info live in the upper 60%.
- **No horizontal scroll** ever. Use `overflow-x: hidden` on root.
- **Safe areas:** All screens respect `env(safe-area-inset-*)` for notch and home indicator.
- **One action per screen moment:** During a round, the player should see exactly one thing to do, large and centered. Don't crowd the viewport.

#### Component Refinements
- **Card:** Add a subtle inner bevel with `box-shadow: inset 0 1px 0 rgba(255,255,255,0.5)`. Red suits use `#c53030` (deeper red, easier on eyes in dark UI). Add subtle paper texture via CSS `background-image: noise pattern`.
- **Buttons:** Use `backdrop-filter: blur(12px)` on ghost/glass style buttons. Active state uses `box-shadow: var(--glow-blue)`. No hover states on touch — use `:active` only.
- **DrinkCounter:** The big number should use tabular numerals (`font-variant-numeric: tabular-nums`) to prevent layout shift as it changes. Pair with a subtle pulse animation when it increments.
- **RoundPrompt:** Full-width banner with large round number and rule. Use a gradient text treatment on the round name. Animate in from bottom with spring physics.
- **PairPanel:** Glassmorphism — `background: rgba(255,255,255,0.05)`, `backdrop-filter: blur(8px)`, `border: 1px solid rgba(255,255,255,0.1)`. My pair gets a blue glow border.
- **Lobby room code:** Display as a giant mono-spaced 4-char code with letter-spacing. Copy-to-clipboard on tap. Background subtle pulse to draw attention.

#### Screens

**Lobby:**
- Two-state layout: Create/Join toggle (pill switcher at top)
- Name field with large font, auto-focus
- Room code display: massive text, full-width, dark card background, one-tap copy
- Player list: avatar-style initials in colored circles + name + pair badge
- Host pair assignment: tap two players to pair them, animated connector line between them
- Auto-pair shuffles with a satisfying animation
- Start button: full-width, bottom-anchored, disabled state clearly communicated

**Game:**
- Top section (scrollable): all PairPanels with their hands
- Middle: RoundPrompt — current round label + instruction
- Bottom section (fixed): ActionButtons for current player's turn, dimmed if not your turn
- Round reveal: full-screen overlay with card reveal + drink count — auto-dismiss after 2.5s
- Transition between rounds: fade out old content, deal new card animation

**BusRide:**
- Full-screen dark overlay
- Cards displayed horizontally in a row, newest appearing from right
- Drink counter prominent in the top-right
- Flipper: single giant "FLIP" button, bottom-center
- Decider: "Keep Going" (full-width, green) above "Bail on [partner name]" (smaller, red, with skull emoji) — make bailing feel like a decision
- Spectator: just the live view + a "watching 👀" indicator

**Game Over:**
- Podium-style ranking
- Final drink counts with trophy/bus emoji
- "Ride Again?" button (restarts in same room)

---

### Phase 4 — Animation & Motion System
**Goal:** Every state transition feels deliberate and smooth. No janky layout shifts.

#### Rules
1. **Only animate GPU-composited properties:** `transform`, `opacity`. Never animate `height`, `width`, `top`, `left`, `margin`, `padding`. These trigger layout and cause jank.
2. **`will-change: transform` on Card component** — tells the browser to promote to its own layer ahead of the flip.
3. **`initial={false}` on AnimatePresence** for screen transitions after mount — prevents animations firing on first render.
4. **Disable Framer Motion reducedMotion** support — check `window.matchMedia('(prefers-reduced-motion: reduce)')` and conditionally disable springs.
5. **No layout animations on the hot path** — the PairPanel list must not use `layout` prop during active gameplay rounds. Reserve it for lobby only.
6. **Debounce state updates into animation queue** — socket `state:sync` can arrive during an animation. Buffer max 1 pending sync, apply after animation completes (200ms gate).

#### Specific Animations
| Moment | Animation | Duration |
|--------|-----------|----------|
| Card deal (new round) | Slide in from top + opacity 0→1, stagger 80ms per card | 350ms |
| Card flip (reveal) | `rotateY: 180 → 0`, spring stiffness 120 damping 14 | ~400ms |
| Drink counter bump | Scale 1 → 1.4 → 1 + color flash | 300ms |
| Wrong answer reveal | Screen edge flash red (box-shadow on root) | 400ms |
| Correct answer | Screen edge flash green | 300ms |
| Round transition | Fade out → pause 200ms → fade in | 500ms total |
| Bus card appear | Slide in from right | 300ms |
| Bail betrayal moment | Shake animation on decider's name in the flipper's view | 600ms |
| Game over | Cards rain from top (CSS keyframes, non-blocking) | 2s |
| Button press | Scale 0.96 via `whileTap` | 100ms |
| Screen enter | Translate Y +20px → 0 + opacity | 250ms |

#### Card Flip — Critical Implementation
```jsx
// The perspective must be on the PARENT, not the card itself
// Otherwise the flip axis is wrong on mobile Safari

<div style={{ perspective: 1000 }}>        // parent
  <motion.div
    animate={{ rotateY: faceUp ? 0 : 180 }}
    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
    style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
  >
    <div style={{ backfaceVisibility: 'hidden' }}>  {/* front */}
    <div style={{ backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)' }}>  {/* back */}
  </motion.div>
</div>
```
- `backfaceVisibility: 'hidden'` must be set on both faces **and** `-webkit-backface-visibility: 'hidden'` for Safari.
- Do not use `rotateY` and `scale` simultaneously in the same `animate` — compose via nested divs to avoid Safari transform decomposition bugs.

---

### Phase 5 — Performance & Reliability
**Goal:** Zero lag on a crowded Wi-Fi network. Handles reconnects gracefully.

#### Network
- Socket.io already uses WebSocket with polling fallback — good.
- Add `pingTimeout: 10000, pingInterval: 5000` to server Socket.io options — faster disconnect detection.
- Send `previousId` in socket auth on reconnect (save to `sessionStorage` in `useSocket.js`).
- Debounce "Next Round" button — host can only emit once per 1s. Prevents double-advance.
- State sync is full payload (~2KB max for 10 players) — fine. Do not introduce delta diffing.

#### Rendering
- Wrap `PairPanel` in `React.memo` — it re-renders on every `state:sync` otherwise.
- Wrap `Card` in `React.memo` with `areEqual` on `{ suit, value, faceUp }`.
- Use `useCallback` for all socket emit functions in screen components.
- `gameStore` uses Zustand's selector pattern — components subscribe only to slices they use:
  ```js
  const myPair = useGameStore(s => s.gameState?.pairs?.[s.myPairId]);
  // NOT: const { gameState } = useGameStore() — this re-renders on every sync
  ```
- Remove `StrictMode` from `main.jsx` in production builds (double-invoke effects cause double socket connects in dev; StrictMode is fine in dev but confirm it's stripped).

#### Touch Performance
- Add `touch-action: manipulation` to all buttons — eliminates 300ms tap delay on iOS without needing FastClick.
- Add `-webkit-tap-highlight-color: transparent` globally.
- Use `pointer-events: none` on disabled buttons instead of just `opacity` — prevents ghost taps.

#### Battery / Background Tab
- Socket.io handles re-connection automatically.
- When tab becomes hidden (`visibilitychange`), stop any polling/animation loops.
- When tab becomes visible again, emit a no-op or check `state:sync` freshness.

---

### Phase 6 — Sound (Optional but High Impact)
**Goal:** Satisfying audio feedback without any sound files.

Use the Web Audio API directly — synthesized tones, zero network requests.

```js
// client/src/audio.js
const ctx = new (window.AudioContext || window.webkitAudioContext)();

export function playTone(freq, duration, type = 'sine', volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export const sounds = {
  cardFlip: () => playTone(800, 0.08, 'triangle'),
  correct:  () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.15), 80); },
  wrong:    () => playTone(200, 0.3, 'sawtooth', 0.2),
  drink:    () => playTone(440, 0.15, 'sine'),
  doubleDown: () => playTone(300, 0.2, 'square', 0.2),
  bail:     () => { playTone(440, 0.1); setTimeout(() => playTone(330, 0.2), 100); },
  busFlip:  () => playTone(600, 0.06, 'triangle'),
};
```

- AudioContext must be created/resumed in response to a user gesture (tap). Do this on the first button press.
- Add a mute toggle in the top-right corner of the game screen (🔊/🔇).

---

### Phase 7 — Haptics
**Goal:** Tactile feedback on every significant moment.

```js
// client/src/haptics.js
export const haptics = {
  light:  () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(25),
  heavy:  () => navigator.vibrate?.(50),
  error:  () => navigator.vibrate?.([30, 20, 30]),
  success:() => navigator.vibrate?.([10, 10, 10]),
  bail:   () => navigator.vibrate?.([100, 50, 100, 50, 200]),
};
```

Vibration API is supported on Android Chrome. iOS Safari ignores it silently — no errors.

| Moment | Haptic |
|--------|--------|
| Button tap | `light` |
| Card flip | `medium` |
| Correct answer | `success` |
| Wrong answer | `error` |
| Bail betrayal | `bail` |
| Drink counter bump | `medium` |

---

## File Creation Order (recommended)

```
Phase 1:
  client/src/index.css              ← reset + CSS vars + font
  client/src/App.jsx                ← phase router (replaces Vite default)
  client/src/screens/Lobby.jsx
  client/src/screens/Game.jsx
  client/src/screens/BusRide.jsx
  client/src/components/RoundPrompt.jsx
  client/index.html                 ← basic PWA meta

Phase 2:
  client/public/manifest.json
  client/public/icon-192.png        ← generate or use SVG placeholder
  client/public/icon-512.png
  vite.config.js                    ← add vite-plugin-pwa
  install: vite-plugin-pwa

Phase 3+:
  client/src/audio.js
  client/src/haptics.js
  Refine all components per design direction above
```

---

## Known Issues / Watchlist

- **GameManager.js has a duplicate `_resolveRound` method** — the first definition uses a closure over `pair_hand_first_val` that doesn't exist. The second (correct) definition overwrites it. Before Phase 1 is complete, clean up the first definition at lines ~105–125.
- **Round 3 `_evaluateGuess`** uses `hand[2]` — only valid after 3 cards are dealt. Verify `advanceRound` deals cards before setting `roundState`.
- **Tournament mode `_buildBracket`** is a skeleton — bracket matchup progression isn't implemented. Fine for MVP (solo/pairs covers 2–6 players), defer tournament to Phase 1 stretch.
- **`bus:done` handler in `server/index.js`** uses the host's pairId to end the bus — should use the bus-riding pair's ID, not the host's. Fix before Phase 1 testing.
- **`App.jsx` is still the Vite default template** — nothing renders yet. Phase 1 starts here.

---

## Running the App

```bash
# From project root
npm run dev

# Server:  http://localhost:3001
# Client:  http://localhost:5173

# On your phone (same Wi-Fi):
# http://<your-local-ip>:5173
# Find your IP: ipconfig (Windows) or ifconfig (Mac)
```

For PWA install on iPhone: open in Safari → Share → "Add to Home Screen"
For PWA install on Android: Chrome will prompt automatically, or use browser menu → "Add to Home Screen"
