let ctx = null;

function isMuted() {
  try { return localStorage.getItem('dd_muted') === '1'; } catch { return false; }
}

export function toggleMute() {
  const next = !isMuted();
  try { localStorage.setItem('dd_muted', next ? '1' : '0'); } catch {}
  return next;
}

export { isMuted };

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  if (isMuted()) return;
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
  } catch (e) { /* audio not critical */ }
}

export const sounds = {
  cardFlip:     () => playTone(800, 0.08, 'triangle'),
  correct:      () => { playTone(523, 0.1); setTimeout(() => playTone(659, 0.15), 80); },
  wrong:        () => playTone(200, 0.3, 'sawtooth', 0.2),
  takeSip:      () => playTone(440, 0.15, 'sine'),
  doubleDown:   () => playTone(300, 0.2, 'square', 0.2),
  faceCard:     () => {
    playTone(150, 0.08, 'sawtooth', 0.4);
    setTimeout(() => playTone(120, 0.25, 'sawtooth', 0.3), 60);
  },
  roundStart:   () => {
    playTone(392, 0.08, 'triangle', 0.2);
    setTimeout(() => playTone(523, 0.15, 'triangle', 0.25), 100);
  },
  streak:       () => {
    [523, 659, 784].forEach((f, i) => setTimeout(() => playTone(f, 0.1, 'sine', 0.25), i * 60));
  },
  gameOver:     () => {
    [523, 523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 'sine', 0.2), i * 100));
  },
  sideQuest:    () => {
    playTone(440, 0.1);
    setTimeout(() => playTone(554, 0.1), 100);
    setTimeout(() => playTone(659, 0.2), 200);
  },
  questWin:     () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.15), i * 80)); },
  questFail:    () => { [440, 370, 311].forEach((f, i) => setTimeout(() => playTone(f, 0.2, 'sawtooth', 0.15), i * 80)); },
};

export function unlockAudio() { getCtx(); }
