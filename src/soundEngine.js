// src/soundEngine.js
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimeout = null;
    this.noteIndex = 0;
  }

  // Initializes and unlocks Web Audio on the first user tap (required for iOS/Android)
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Helper to play a single synthesized musical note
  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, peakGain = 0.12) {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    // Smooth music-box envelope (gentle attack, natural decay)
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  // 1. Soft tactile pop for keypad, Wordle keys, and Polaroid taps
  playTap() {
    this.playTone(520, 'triangle', 0.06, 0, 0.08);
  }

  // 2. Low double-buzz for wrong PIN or wrong timeline order
  playError() {
    this.playTone(170, 'sawtooth', 0.14, 0, 0.08);
    this.playTone(145, 'sawtooth', 0.2, 0.12, 0.08);
  }

  // 3. Sparkly ascending arpeggio when a stage is unlocked
  playWin() {
    // C5 - E5 - G5 - C6 - E6
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.32, idx * 0.075, 0.14);
    });
  }

  // 4. Airy "whoosh" puff sound when blowing out a candle
  playBlow() {
    if (this.muted) return;
    this.init();

    const duration = 0.28;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // Bandpass filter sweeps down to mimic a breath puff
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(280, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
  }

  // 5. Gentle "Happy Birthday" Music Box Loop
  startBGM() {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.noteIndex = 0;

    // Frequencies and beat lengths for "Happy Birthday"
    const melody = [
      { f: 392.00, d: 0.35 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.55 }, { f: 392.00, d: 0.55 }, { f: 523.25, d: 0.55 }, { f: 493.88, d: 1.0 },
      { f: 392.00, d: 0.35 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.55 }, { f: 392.00, d: 0.55 }, { f: 587.33, d: 0.55 }, { f: 523.25, d: 1.0 },
      { f: 392.00, d: 0.35 }, { f: 392.00, d: 0.25 }, { f: 783.99, d: 0.55 }, { f: 659.25, d: 0.55 }, { f: 523.25, d: 0.55 }, { f: 493.88, d: 0.55 }, { f: 440.00, d: 0.9 },
      { f: 698.46, d: 0.35 }, { f: 698.46, d: 0.25 }, { f: 659.25, d: 0.55 }, { f: 523.25, d: 0.55 }, { f: 587.33, d: 0.55 }, { f: 523.25, d: 1.3 },
    ];

    const playNext = () => {
      if (!this.bgmPlaying || this.muted) return;
      const note = melody[this.noteIndex];
      // Soft sine wave for a warm music-box chime
      this.playTone(note.f, 'sine', note.d * 0.95, 0, 0.055);
      this.noteIndex = (this.noteIndex + 1) % melody.length;
      this.bgmTimeout = setTimeout(playNext, note.d * 1000);
    };

    playNext();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimeout) {
      clearTimeout(this.bgmTimeout);
      this.bgmTimeout = null;
    }
  }

  toggleBGM() {
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.muted = false;
      this.startBGM();
      return true;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }
}

export const sound = new SoundEngine();