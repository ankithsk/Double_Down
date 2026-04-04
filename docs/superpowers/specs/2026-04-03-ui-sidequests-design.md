# Double Down — UI Overhaul + Side Quests Design

**Date:** 2026-04-03  
**Status:** Approved  

---

## Overview

Three parallel upgrades to the existing Phase 1 MVP:

1. **UI overhaul** — "Chaotic Fun" visual language with Framer Motion animations
2. **Side quests** — 5 mini-game types that interrupt punishments
3. **Solo mode** — individual play alongside existing teams mode

---

## 1. Visual Language — "Chaotic Fun"

### Palette (replaces existing CSS vars)

```css
--bg-deep:      #0a0510;     /* near-black purple-black */
--bg-surface:   #130d20;     /* card/panel bg */
--bg-elevated:  #1e1535;     /* modals, overlays */
--accent-primary: #6b6bff;   /* purple — main actions */
--accent-hot:   #ff6b6b;     /* coral-red — danger, red cards */
--accent-gold:  #ffd93d;     /* yellow — rewards, highlights */
--accent-green: #6bffb8;     /* mint green — success */
--text-primary: #f5f0ff;     /* slightly purple-tinted white */
--text-muted:   #7b6f8a;
--border:       rgba(255,255,255,0.07);
--glow-purple:  0 0 24px rgba(107,107,255,0.4);
--glow-hot:     0 0 24px rgba(255,107,107,0.4);
--glow-gold:    0 0 16px rgba(255,217,61,0.3);
```

### Typography
- System UI stack — same as now, no external fonts
- Headers: `font-weight: 900`, tight `letter-spacing: -0.5px`
- Labels: `font-weight: 800`, `letter-spacing: 3px`, `text-transform: uppercase`

### Cards — "Chaotic" Treatment
- Playing cards get a subtle random rotation: `rotate([-3, -1, 1, 3][index % 4]deg)`
- Card backs: deep purple gradient + subtle repeating diamond pattern via CSS
- Card face: white with coral red suits, deep purple for black suits
- Hover/deal: `rotate` snaps to 0 on focus, springs back on blur
- `perspective: 1000px` on wrapper, `transformStyle: preserve-3d` on card

### Buttons
- Primary: `background: linear-gradient(135deg, #6b6bff, #ff6bcc)` with `box-shadow: var(--glow-purple)`
- Danger: coral `#ff6b6b` with glow
- Ghost: `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.15)`
- All buttons: `whileTap={{ scale: 0.94 }}`, `touch-action: manipulation`
- Active state only (no hover on touch)

### Pair Panels — Glassmorphism
- `background: rgba(107,107,255,0.06)`
- `backdrop-filter: blur(10px)`
- `border: 1px solid rgba(107,107,255,0.2)`
- My pair: `border-color: #6b6bff` + `box-shadow: var(--glow-purple)`

### Punishment UX — "Take X Sips" First
The primary punishment moment is **immediate and loud**, not a running score:
- After every wrong answer / penalty, a full-screen flash shows **"TAKE 2 SIPS"** (or however many) in huge text with a hot red background flash
- This is the thing people react to — not a counter incrementing
- The cumulative drink count is still tracked internally (small, subtle display) **only** to determine who rides the bus at the end of Round 4
- `DrinkCounter` moves from being a prominent scoreboard element to a small badge — secondary info
- The reveal overlay is redesigned: card flips → big RED/GREEN flash → huge "TAKE X SIPS" or "SAFE!" → auto-dismiss after 2.5s

### Animation System
| Moment | Animation | Duration |
|--------|-----------|----------|
| Card deal | slide from top + opacity, stagger 60ms per card | 350ms |
| Card flip | `rotateY: 180→0`, spring stiffness 120 damping 14 | ~400ms |
| Screen enter | `y: 30→0` + opacity, ease out | 280ms |
| Button tap | `scale: 0.94` | 100ms |
| "TAKE X SIPS" reveal | full screen hot-red flash, number scales 0→1 with spring | 500ms |
| "SAFE!" reveal | full screen mint-green flash | 400ms |
| Wrong answer bg | root `box-shadow` pulse hot red | 400ms |
| Correct bg | root `box-shadow` pulse mint green | 300ms |
| Side quest appear | scale `0.8→1` + opacity + slight `rotate(-2→0)` | 400ms spring |
| Round transition | fade out 200ms → pause 150ms → fade in 250ms | 600ms total |

---

## 2. Solo Mode

### Lobby Flow
1. Host creates room — immediately shown a **mode picker** before seeing the room code:
   - **Teams** (default) — pair up, partner mechanics active
   - **Every Man for Himself** — everyone plays individually
2. Mode is locked once game starts. Shown in lobby header as a badge.

### Solo Mode Gameplay Changes
- `gameMode: 'solo_individual'` added to GameManager state
- **Round 1**: All players submit red/black simultaneously. Each scored individually. Disagreement drink removed (no partner to disagree with). Miss = 1 drink.
- **Rounds 2–4**: Each player has their own `roundState`. No `partnerResponse` step. Guess → immediate resolve.
- **Partner Response buttons**: hidden entirely in solo mode
- **Bus Ride**: Player with highest drink count at end of Round 4 rides. Flipper = Decider = same person. No "bail" option (can't bail on yourself). Just flip until a non-face card appears or player decides to stop.
- **Side quests in solo**: challenger is the punished player, target is the player of their choice (any other player in the room).

### Server Changes
- `GameManager`: `gameMode` field, `startGame(mode)` accepts mode param
- Solo individual: pairs are synthetic — each player gets a solo "pair" with `playerIds: [id]`
- `_newRoundState` skips `partnerOf` / `waitingFor: 'partnerResponse'` in solo mode
- `advanceRound` skips partner response phase in solo mode

---

## 3. Side Quests

### Trigger Logic
- Side quests trigger **after a punishment is resolved** (card flipped, drinks assigned)
- Trigger condition: `drinks >= 2` AND `Math.random() < 0.4` (40% chance when drinking 2+)
- Only one side quest active at a time globally
- Side quest can be **declined** — drinks stay as-is
- Side quest **accepted + won** — drinks reduced (quest-specific)
- Side quest **accepted + lost** — drinks stay (no extra penalty except Trivia)

### Content Consistency Across Devices
Server picks the quest type AND a `contentIndex` (random integer), then emits both to all clients via `sidequest:offer`. Each client uses `contentIndex % contentArray.length` to deterministically look up the same item from their local `sidequests.js`. This keeps content client-side (no server data) while ensuring all phones show the same movie/dare/celebrity.

```js
// Server emits:
{ type: 'charades', contentIndex: 47, pairId: 'pair-0', drinksAtStake: 3 }

// Client resolves:
const movie = SIDE_QUESTS.charades.bollywood[47 % SIDE_QUESTS.charades.bollywood.length]
```

### Side Quest Content Files
All content lives in `client/src/data/sidequests.js` — pure JS arrays, no network requests.

```js
// Structure
export const SIDE_QUESTS = {
  charades: { ... },
  rapidfire: { ... },
  dare: { ... },
  mimicry: { ... },
  trivia: { ... },
}
```

### Quest Definitions

#### 🎬 Dumb Charades
- **Mechanic**: App picks a random title and shows it **only to the actor** (punished player). Rest of room must guess. 60 second timer on screen.
- **Win condition**: Host taps "They got it!" before timer ends
- **Reward**: Skip all punishment drinks
- **Categories** (randomly selected per quest):
  - Bollywood classics: DDLJ, Sholay, 3 Idiots, Gangs of Wasseypur, Andhadhun, Dil Chahta Hai, Lagaan, Zindagi Na Milegi Dobara, Queen, Taare Zameen Par, PK, Dangal, Kabhi Khushi Kabhie Gham, Dil Dhadakne Do, Rockstar, Tamasha, Barfi, Highway, Udta Punjab, Gully Boy, Article 15, Tumbbad, Stree, Badhaai Ho, Shubh Mangal Saavdhan
  - Hollywood classics: Inception, The Dark Knight, Fight Club, Pulp Fiction, The Matrix, Interstellar, Home Alone, Titanic, The Godfather, Forrest Gump, The Lion King, Jurassic Park
  - TV shows: Breaking Bad, Game of Thrones, Friends, The Office, Stranger Things, Dark, Sacred Games, Mirzapur, Panchayat, Scam 1992
- **UI**: Actor sees the title large + a countdown. Spectators see a pulsing "🎬 Guessing..." screen with timer.

#### ⚡ Rapid Fire
- **Mechanic**: App shows a category. Punished player has **30 seconds** to name 5 things. Host (or group) taps ✓/✗ for each answer live.
- **Win condition**: 3+ correct answers
- **Reward**: Each correct answer saves 1 drink (max saves = drinks owed)
- **Categories**: Marvel superheroes, Bollywood actors born in the 80s, Cricket World Cup winners, Countries in Europe, Oscar Best Picture winners, Sitcoms from the 2000s, Sports that use a ball, Capital cities, Indian states, Hollywood directors
- **UI**: Big countdown timer, category displayed boldly, tally of ✓/✗ marks

#### 😈 Truth or Dare Swap
- **Mechanic**: Another pair/player picks a dare from a pre-built list shown on their screen. Punished player must do it.
- **Win condition**: Group votes 👍 that it was done properly — majority wins, ties favour the punished player. Vote window: 10 seconds shown as a shrinking bar. Each player votes once on their own phone.
- **Reward**: Skip all punishment drinks
- **Decline penalty**: Drinks doubled
- **21+ Dare List** (50+ dares, sampled at random, 3 shown to dare-giver to choose from):
  - "Text your ex 'I miss you' and show the screen"
  - "Do your best strip-tease for 10 seconds — clothes stay on, barely"
  - "Let the group go through your camera roll for 30 seconds"
  - "Give a lap dance to the person on your left"
  - "Tell the room your most embarrassing hook-up story"
  - "Show the group the last 5 people you texted and what you said"
  - "Do an impression of [another player] trying to flirt — group votes if it's accurate"
  - "Send a voice note saying 'I've been thinking about you' to the last person you matched on a dating app"
  - "Let the group write a tweet/Instagram story from your account — they decide what it says"
  - "Whisper something dirty in the ear of the person to your right"
  - "Name three people in this room you'd swipe right on, ranked"
  - "Do your best moan. Group rates it 1–10"
  - "Let someone in the room go through your DMs for 20 seconds"
  - "Tell everyone your honest opinion of each person's significant other (or crush)"
  - "Call someone you have a crush on and say 'I just wanted to hear your voice'"
  - "Act out how you behave when you're drunk, in front of everyone"
  - "Let the group assign you a nickname based on your biggest personality flaw — you must use it for the rest of the game"
  - "Read out the last voice note you sent, out loud, in your most dramatic voice"
  - "Describe your ideal first night with someone — in detail"
  - "Do 10 seconds of freestyle rap about the person sitting across from you"

#### 🎭 Mimicry Challenge
- **Mechanic**: App assigns a specific celebrity. Player has 15 seconds to impersonate them. Group votes 👍/👎.
- **Win condition**: Majority 👍 in a 10-second vote window (ties favour punished player)
- **Reward**: Drinks halved (rounded up)
- **Celebrity Pool**:
  - Bollywood (default, larger pool): Amitabh Bachchan, Shah Rukh Khan, Salman Khan, Ranveer Singh, Govinda, Akshay Kumar, Aamir Khan, Rajkummar Rao, Nawazuddin Siddiqui, Kartik Aaryan, Ranbir Kapoor, Allu Arjun, Vijay Devarakonda, Kapil Sharma, Nana Patekar, Sanjay Dutt, Hrithik Roshan, Katrina Kaif (mannerisms)
  - Hollywood (option, smaller pool of very famous): Arnold Schwarzenegger, Al Pacino, Christopher Walken, Morgan Freeman, Jim Carrey, Will Smith, Leonardo DiCaprio, Keanu Reeves, Robert De Niro, Donald Trump
- **UI**: App shows name + a toggle "🎬 Bollywood / 🎥 Hollywood" that the punished player can flip once before seeing their assignment. Assignment is random within chosen pool.

#### 🧠 Trivia Lifeline
- **Mechanic**: App shows a multiple-choice question (4 options). Punished player answers solo. No help from room.
- **Win condition**: Correct answer
- **Reward**: Skip all punishment drinks
- **Loss penalty**: Drinks doubled
- **Question bank** (50+ questions across categories):
  - Bollywood: "Which movie did Aamir Khan NOT produce? a) Dangal b) Lagaan c) Dhobi Ghat d) Bajrangi Bhaijaan" → d
  - Hollywood: "How many Oscars did Titanic win? a) 9 b) 11 c) 13 d) 7" → b
  - Sports: "Who holds the record for most Test cricket centuries? a) Ricky Ponting b) Jacques Kallis c) Sachin Tendulkar d) Brian Lara" → c
  - Pop culture: "What year did Instagram launch? a) 2008 b) 2010 c) 2012 d) 2009" → b
  - Geography: "What is the capital of Australia? a) Sydney b) Melbourne c) Canberra d) Brisbane" → c
  - (full 50-question bank in sidequests.js)

### Side Quest UI Flow

1. **Trigger**: After punishment resolved, `SideQuestOverlay` mounts with `AnimatePresence`
2. **Reveal screen** (full screen takeover):
   - Animated ⚡ badge pulses in
   - "SIDE QUEST UNLOCKED" label
   - Quest name + 1–2 line description
   - "ACCEPT" (gradient button) + "skip it" (ghost)
   - Only the punished player/pair sees ACCEPT/SKIP. Others see "Waiting for [name]…"
3. **Active quest screen**: Quest-specific UI (timer, dare display, voting buttons)
4. **Result screen**: "They did it!" or "Nope!" → drink update animation → dismiss

### State Management
New Zustand slice additions:
```js
activeSideQuest: null,  // { type, data, pairId, drinksAtStake }
setSideQuest: (q) => set({ activeSideQuest: q }),
clearSideQuest: () => set({ activeSideQuest: null }),
```

New socket events:
- `sidequest:offer` → server → client (triggers overlay)
- `sidequest:accept` → client → server
- `sidequest:decline` → client → server
- `sidequest:result` → server → client (win/lose)
- `sidequest:vote` → client → server (for group vote quests)

---

## 4. PWA Shell (Phase 2 — included in this plan)

- Install `vite-plugin-pwa`
- Manifest: name "Double Down", `display: standalone`, `background_color: #0a0510`, `theme_color: #0a0510`
- Workbox: navigate fallback only, no game state cached
- Icons: SVG-generated 192×192 and 512×512 (playing card motif, purple/coral)
- Safe area CSS on all screens

---

## File Plan

### New files
```
client/src/data/sidequests.js          — all content (movies, dares, trivia, celebs)
client/src/components/SideQuestOverlay.jsx  — full-screen takeover + quest UI
client/src/components/SideQuestTimer.jsx   — countdown timer component
client/src/audio.js                    — Web Audio API sounds
client/src/haptics.js                  — Vibration API
client/public/manifest.json
client/public/icon-192.png             (SVG→PNG or inline SVG)
client/public/icon-512.png
```

### Modified files
```
client/src/index.css                   — new colour vars + chaotic fun globals
client/src/App.jsx                     — solo mode routing
client/src/screens/Lobby.jsx           — mode picker, teams/solo toggle
client/src/screens/Game.jsx            — solo mode action buttons, side quest trigger
client/src/screens/BusRide.jsx         — solo bus ride variant
client/src/components/Card.jsx         — chaotic rotation, updated palette
client/src/components/PairPanel.jsx    — glassmorphism update
client/src/components/ActionButtons.jsx — new gradient style
client/src/store/gameStore.js          — activeSideQuest slice
client/src/hooks/useSocket.js          — sidequest socket events
client/vite.config.js                  — vite-plugin-pwa
server/GameManager.js                  — gameMode field, solo individual logic
server/index.js                        — sidequest socket handlers
```

---

additional requirements:
Players can enter custom dares

## Out of Scope
- Tournament bracket mode (deferred per original plan)
- Real-time synced timers (timers are client-side only; host confirms result)
- Persistent leaderboard across sessions
