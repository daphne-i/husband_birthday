import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Lock,
  Unlock,
  HelpCircle,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Upload,
  RotateCcw,
  Heart,
  Delete,
  Ticket,
  X,
  Volume2,
  VolumeX,
  Music,
} from 'lucide-react';

// ============================================================================
// BUILT-IN WEB AUDIO SOUND ENGINE (Zero external files needed)
// ============================================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimeout = null;
    this.noteIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, peakGain = 0.12) {
    if (this.muted) return;
    this.init();

    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  playTap() {
    this.playTone(520, 'triangle', 0.06, 0, 0.08);
  }

  playError() {
    this.playTone(170, 'sawtooth', 0.14, 0, 0.08);
    this.playTone(145, 'sawtooth', 0.2, 0.12, 0.08);
  }

  playWin() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.32, idx * 0.075, 0.14);
    });
  }

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

startBGM() {
    if (this.muted || this.bgmPlaying) return;
    this.init();
    this.bgmPlaying = true;
    this.noteIndex = 0;

    // "Happy Birthday" with warm jazz/lo-fi chords underneath
    const melody = [
      { f: 392.00, d: 0.40 }, { f: 392.00, d: 0.25 },
      { f: 440.00, chord: [261.63, 329.63, 392.00], d: 0.60 }, { f: 392.00, d: 0.60 },
      { f: 523.25, chord: [261.63, 329.63, 493.88], d: 0.60 }, { f: 493.88, chord: [293.66, 369.99, 440.00], d: 1.1 },

      { f: 392.00, d: 0.40 }, { f: 392.00, d: 0.25 },
      { f: 440.00, chord: [293.66, 349.23, 440.00], d: 0.60 }, { f: 392.00, d: 0.60 },
      { f: 587.33, chord: [246.94, 349.23, 440.00], d: 0.60 }, { f: 523.25, chord: [261.63, 329.63, 493.88], d: 1.1 },

      { f: 392.00, d: 0.40 }, { f: 392.00, d: 0.25 },
      { f: 783.99, chord: [261.63, 349.23, 440.00], d: 0.60 }, { f: 659.25, d: 0.60 },
      { f: 523.25, d: 0.60 }, { f: 493.88, d: 0.60 }, { f: 440.00, chord: [220.00, 293.66, 349.23], d: 1.0 },

      { f: 698.46, d: 0.40 }, { f: 698.46, d: 0.25 },
      { f: 659.25, chord: [261.63, 329.63, 392.00], d: 0.60 }, { f: 523.25, d: 0.60 },
      { f: 587.33, chord: [293.66, 349.23, 440.00], d: 0.60 }, { f: 523.25, chord: [261.63, 329.63, 493.88], d: 1.4 },
    ];

    const playNext = () => {
      if (!this.bgmPlaying || this.muted) return;
      const note = melody[this.noteIndex];

      // Lead electric-piano tone
      this.playTone(note.f, 'sine', note.d * 1.1, 0, 0.09);

      // Soft warm background chord
      if (note.chord) {
        note.chord.forEach((cFreq) => {
          this.playTone(cFreq, 'sine', note.d * 1.8, 0, 0.03);
        });
      }

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
    }
    this.muted = false;
    this.startBGM();
    return true;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    }
    return this.muted;
  }
}

const sound = new SoundEngine();

// ============================================================================
// CONFIGURATION: Set IS_PRODUCTION = true before sending him the link!
// ============================================================================
const IS_PRODUCTION = true;

const DEFAULT_PHOTOS = {
  memory1: '/photos/memory1.jpg',
  memory2: '/photos/memory2.jpg',
  memory3: '/photos/memory3.jpg',
  memory4: '/photos/memory4.jpg',
  scratch: '/photos/scratch-photo.jpg',
};

const FALLBACK_PHOTOS = {
  memory1: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=600&q=80',
  memory2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
  memory3: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=600&q=80',
  memory4: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=600&q=80',
  scratch: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
};

const TIMELINE_CORRECT = [
  { id: 'memory1', order: 1, title: 'D-Day' },
  { id: 'memory2', order: 2, title: 'Handsome Dude' },
  { id: 'memory3', order: 3, title: 'Cutie Pie' },
  { id: 'memory4', order: 4, title: 'Shy Shy Shy' },
];

const INITIAL_SHUFFLED = [
  TIMELINE_CORRECT[2],
  TIMELINE_CORRECT[0],
  TIMELINE_CORRECT[3],
  TIMELINE_CORRECT[1],
];

const SECRET_WORD = 'UNCLE';
const PIN_CODE = '1504';

export default function App() {
  const isPlayMode =
    IS_PRODUCTION ||
    new URLSearchParams(window.location.search).get('play') === 'true';

  const [stage, setStage] = useState(1);
  const [showToolbar, setShowToolbar] = useState(!isPlayMode);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [photos, setPhotos] = useState(DEFAULT_PHOTOS);

  // Audio state
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  // ---------------- STAGE 1: PIN LOCK STATE ----------------
  const [pinInput, setPinInput] = useState('');
  const [pinHintVisible, setPinHintVisible] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);

  // ---------------- STAGE 2: WORDLE STATE ----------------
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [wordleWon, setWordleWon] = useState(false);
  const [wordleHint, setWordleHint] = useState(false);

  // ---------------- STAGE 3: TIMELINE SORT STATE ----------------
  const [timelineItems, setTimelineItems] = useState(INITIAL_SHUFFLED);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [timelineSolved, setTimelineSolved] = useState(false);
  const [timelineError, setTimelineError] = useState(false);

  // ---------------- STAGE 4: SCRATCH CARD STATE ----------------
  const canvasRef = useRef(null);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [scratchCleared, setScratchCleared] = useState(false);
  const isDrawingRef = useRef(false);

  // ---------------- STAGE 5: CAKE & FINALE STATE ----------------
  const [candlesLit, setCandlesLit] = useState([true, true, true]);
  const allCandlesBlown = candlesLit.every((c) => !c);

  const triggerConfetti = () => {
    sound.playWin();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D96B8A', '#529E82', '#C5B3DC', '#F59E0B', '#EC4899'],
    });
  };

  // ---------------- STAGE 1 LOGIC ----------------
  const handlePinPress = (digit) => {
    if (pinUnlocked || pinInput.length >= 4) return;
    sound.playTap();
    const nextPin = pinInput + digit;
    setPinInput(nextPin);
    setPinError(false);

    if (nextPin.length === 4) {
      if (nextPin === PIN_CODE) {
        setPinUnlocked(true);
        triggerConfetti();
      } else {
        sound.playError();
        setPinError(true);
        setTimeout(() => {
          setPinInput('');
          setPinError(false);
        }, 650);
      }
    }
  };

  // ---------------- STAGE 2 LOGIC (WORDLE) ----------------
  const handleKeyPress = (key) => {
    if (wordleWon || guesses.length >= 6) return;
    sound.playTap();

    if (key === 'BACK') {
      setCurrentGuess((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'ENTER') {
      if (currentGuess.length !== 5) return;
      const nextGuesses = [...guesses, currentGuess];
      setGuesses(nextGuesses);
      setCurrentGuess('');

      if (currentGuess === SECRET_WORD) {
        setWordleWon(true);
        triggerConfetti();
      }
      return;
    }

    if (currentGuess.length < 5 && /^[A-Z]$/.test(key)) {
      setCurrentGuess((prev) => prev + key);
    }
  };

  const getLetterStyle = (letter, index) => {
    if (!letter) return 'bg-[#FAF6FE] border-[#C5B3DC] text-[#342640]';
    if (SECRET_WORD[index] === letter) {
      return 'bg-[#529E82] border-[#529E82] text-white';
    }
    if (SECRET_WORD.includes(letter)) {
      return 'bg-[#E5A93C] border-[#E5A93C] text-white';
    }
    return 'bg-[#9E8FB2] border-[#9E8FB2] text-white';
  };

  // ---------------- STAGE 3 LOGIC (TIMELINE SORT) ----------------
  const swapItems = (idx1, idx2) => {
    if (timelineSolved) return;
    sound.playTap();
    const updated = [...timelineItems];
    const temp = updated[idx1];
    updated[idx1] = updated[idx2];
    updated[idx2] = temp;
    setTimelineItems(updated);
    setSelectedIdx(null);
    setTimelineError(false);
  };

  const handleCardTap = (idx) => {
    if (timelineSolved) return;
    sound.playTap();
    if (selectedIdx === null) {
      setSelectedIdx(idx);
    } else if (selectedIdx === idx) {
      setSelectedIdx(null);
    } else {
      swapItems(selectedIdx, idx);
    }
  };

  const verifyTimeline = () => {
    const isCorrect = timelineItems.every((item, idx) => item.order === idx + 1);
    if (isCorrect) {
      setTimelineSolved(true);
      triggerConfetti();
    } else {
      sound.playError();
      setTimelineError(true);
      setTimeout(() => setTimelineError(false), 1200);
    }
  };

  // ---------------- STAGE 4 LOGIC (SCRATCH CARD) ----------------
  const initScratchCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, '#E6C6B8');
    grad.addColorStop(0.5, '#F5E1D8');
    grad.addColorStop(1, '#D4AF9F');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 45; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2.5 + 1,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    ctx.fillStyle = '#5E4352';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ RUB TO SCRATCH FOIL ✨', width / 2, height / 2 - 6);
    ctx.font = '12px sans-serif';
    ctx.fillText('Reveal your memory & wish pass', width / 2, height / 2 + 16);

    setScratchedPercent(0);
    setScratchCleared(false);
  };

  useEffect(() => {
    if (stage === 4) {
      setTimeout(initScratchCanvas, 60);
    }
  }, [stage]);

  const scratchAtPoint = (clientX, clientY) => {
    if (scratchCleared) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparentPixels = 0;
    const totalPixels = imageData.data.length / 4;
    for (let i = 3; i < imageData.data.length; i += 16) {
      if (imageData.data[i] < 128) transparentPixels++;
    }
    const pct = Math.min(
      100,
      Math.round((transparentPixels / (totalPixels / 4)) * 100)
    );
    setScratchedPercent(pct);

    if (pct >= 52 && !scratchCleared) {
      setScratchCleared(true);
      triggerConfetti();
    }
  };

  // ---------------- STAGE 5 LOGIC (CANDLES) ----------------
  const blowCandle = (idx) => {
    if (!candlesLit[idx]) return;
    sound.playBlow();
    const updated = [...candlesLit];
    updated[idx] = false;
    setCandlesLit(updated);

    if (updated.every((c) => !c)) {
      triggerConfetti();
      if (!isMuted) {
        sound.startBGM();
        setIsMusicPlaying(true);
      }
    }
  };

  const blowAllCandles = () => {
    sound.playBlow();
    setCandlesLit([false, false, false]);
    triggerConfetti();
    if (!isMuted) {
      sound.startBGM();
      setIsMusicPlaying(true);
    }
  };

  const relightCandles = () => {
    sound.playTap();
    setCandlesLit([true, true, true]);
  };

  const handlePhotoUpload = (key, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPhotos((prev) => ({ ...prev, [key]: url }));
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-between py-4 px-3 relative overflow-x-hidden"
      style={{
        background:
          'linear-gradient(145deg, #E2D6F0 0%, #F2D2DC 52%, #CBE2D6 100%)',
        color: '#342640',
      }}
    >
      {/* ==================== CREATOR DEV TOOLBAR ==================== */}
      {!isPlayMode && (
        <div className="w-full max-w-md z-30 mb-2">
          {showToolbar ? (
            <div className="bg-[#342640]/90 backdrop-blur-md text-white rounded-2xl p-2 shadow-lg flex items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                {[
                  { num: 1, label: '1:PIN' },
                  { num: 2, label: '2:Word' },
                  { num: 3, label: '3:Sort' },
                  { num: 4, label: '4:Scratch' },
                  { num: 5, label: '5:Card' },
                ].map((s) => (
                  <button
                    key={s.num}
                    onClick={() => setStage(s.num)}
                    className={`px-2 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                      stage === s.num
                        ? 'bg-[#D96B8A] text-white shadow'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowPhotoModal(true)}
                  className="px-2 py-1 rounded-lg bg-[#529E82] text-white font-medium flex items-center gap-1"
                  title="Preview Photos"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Photos</span>
                </button>
                <button
                  onClick={() => setShowToolbar(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                  title="Hide Creator Bar"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowToolbar(true)}
              className="fixed top-3 right-3 z-40 bg-[#342640]/75 text-white p-2 rounded-full shadow-md hover:bg-[#342640]"
              title="Show Creator Bar"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ==================== TOP PROGRESS BAR (STAGES 1 TO 5) ==================== */}
      <div className="w-full max-w-md mb-3">
        <div className="flex items-center justify-between px-2 mb-1.5">
          <span className="text-xs font-bold tracking-wider uppercase text-[#6E5A7F]">
            Nov 14 · Escape Card
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const playing = sound.toggleBGM();
                setIsMusicPlaying(playing);
                setIsMuted(sound.muted);
              }}
              className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 border transition-all ${
                isMusicPlaying
                  ? 'bg-[#D96B8A] text-white border-[#D96B8A] shadow-sm'
                  : 'bg-[#FAF6FE] text-[#6E5A7F] border-[#C5B3DC]'
              }`}
              title="Toggle Birthday Chime"
            >
              <Music className="w-3 h-3" />
              <span>{isMusicPlaying ? 'Chime On' : 'Chime'}</span>
            </button>

            <button
              onClick={() => {
                const muted = sound.toggleMute();
                setIsMuted(muted);
                if (muted) setIsMusicPlaying(false);
              }}
              className="p-1 rounded-full bg-[#FAF6FE] border border-[#C5B3DC] text-[#6E5A7F]"
              title={isMuted ? 'Unmute SFX' : 'Mute SFX'}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-red-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#529E82]" />
              )}
            </button>

            <span className="text-xs font-bold text-[#D96B8A] ml-1">
              Stage {stage} of 5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 px-1">
          {[1, 2, 3, 4, 5].map((stepNum) => (
            <div
              key={stepNum}
              className={`h-2 rounded-full transition-all duration-500 ${
                stepNum <= stage
                  ? 'bg-[#D96B8A] shadow-sm'
                  : 'bg-[#C5B3DC]/60'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ==================== MAIN STAGE CONTAINER ==================== */}
      <main className="w-full max-w-md flex-1 flex flex-col justify-center my-auto">
        {/* -------------------- STAGE 1: THE SEALED ENVELOPE -------------------- */}
        {stage === 1 && (
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-6 shadow-xl flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-[#D96B8A]/15 border-2 border-[#D96B8A] flex items-center justify-center mb-3 shadow-inner">
              {pinUnlocked ? (
                <Unlock className="w-8 h-8 text-[#529E82] animate-bounce" />
              ) : (
                <Lock className="w-8 h-8 text-[#D96B8A]" />
              )}
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#529E82] bg-[#529E82]/15 px-3 py-0.5 rounded-full mb-2">
              Stage 1 · Sealed Envelope
            </span>
            <h1 className="text-2xl font-extrabold text-[#342640] mb-1">
              For Nov 14th Only
            </h1>
            <p className="text-sm text-[#6E5A7F] mb-5">
              Enter the 4-digit secret code to break the seal on your birthday card.
            </p>

            <div
              className={`flex gap-3 mb-4 ${
                pinError ? 'animate-bounce text-red-600' : ''
              }`}
            >
              {[0, 1, 2, 3].map((i) => {
                const digit = pinInput[i] || '';
                return (
                  <div
                    key={i}
                    className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold shadow-sm transition-all ${
                      pinUnlocked
                        ? 'bg-[#529E82] border-[#529E82] text-white'
                        : pinError
                        ? 'bg-red-100 border-red-400 text-red-600'
                        : digit
                        ? 'bg-white border-[#D96B8A] text-[#342640]'
                        : 'bg-[#FAF6FE] border-[#C5B3DC] text-[#6E5A7F]'
                    }`}
                  >
                    {digit}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                sound.playTap();
                setPinHintVisible(!pinHintVisible);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#D96B8A] hover:underline mb-4"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{pinHintVisible ? 'Hide Hint' : 'Need a hint?'}</span>
            </button>

            {pinHintVisible && (
              <div className="w-full bg-[#FAF6FE] border border-[#C5B3DC] rounded-xl py-2 px-3 mb-4 text-xs font-medium text-[#342640]">
                💡 Hint: <span className="font-bold text-[#D96B8A]">D-Day</span> (DDMM)
              </div>
            )}

            {!pinUnlocked ? (
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePinPress(String(num))}
                    className="h-12 rounded-2xl bg-white hover:bg-[#FAF6FE] active:scale-95 border border-[#C5B3DC] text-lg font-bold text-[#342640] shadow-sm transition-transform"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => {
                    sound.playTap();
                    setPinInput('');
                  }}
                  className="h-12 rounded-2xl bg-[#EAE0F5] active:scale-95 border border-[#C5B3DC] text-xs font-bold text-[#6E5A7F]"
                >
                  CLR
                </button>
                <button
                  onClick={() => handlePinPress('0')}
                  className="h-12 rounded-2xl bg-white hover:bg-[#FAF6FE] active:scale-95 border border-[#C5B3DC] text-lg font-bold text-[#342640] shadow-sm"
                >
                  0
                </button>
                <button
                  onClick={() => {
                    sound.playTap();
                    setPinInput((p) => p.slice(0, -1));
                  }}
                  className="h-12 rounded-2xl bg-[#EAE0F5] active:scale-95 border border-[#C5B3DC] flex items-center justify-center text-[#6E5A7F]"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="w-full animate-fadeIn">
                <div className="bg-[#529E82]/15 border border-[#529E82] text-[#2E6B54] rounded-2xl p-3 mb-4 text-sm font-semibold">
                  Seal Broken! Envelope unlocked.
                </div>
                <button
                  onClick={() => {
                    sound.playTap();
                    setStage(2);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#D96B8A] hover:bg-[#c75b7a] text-white font-bold text-base shadow-lg transition-all"
                >
                  Open Stage 2 →
                </button>
              </div>
            )}
          </div>
        )}

        {/* -------------------- STAGE 2: CUSTOM WORDLE -------------------- */}
        {stage === 2 && (
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-4 shadow-xl flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#529E82] bg-[#529E82]/15 px-3 py-0.5 rounded-full mb-1">
              Stage 2 · Secret Word Lock
            </span>
            <h2 className="text-xl font-extrabold text-[#342640]">
              Guess the 5-Letter Word
            </h2>
            <p className="text-xs text-[#6E5A7F] mb-3 text-center">
              Solve the birthday word puzzle to unlock the memory vault.
            </p>

            <div className="grid grid-rows-6 gap-1.5 mb-3">
              {[0, 1, 2, 3, 4, 5].map((rowIdx) => {
                const isSubmitted = rowIdx < guesses.length;
                const isCurrent = rowIdx === guesses.length && !wordleWon;
                const word = isSubmitted
                  ? guesses[rowIdx]
                  : isCurrent
                  ? currentGuess
                  : '';

                return (
                  <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
                    {[0, 1, 2, 3, 4].map((colIdx) => {
                      const letter = word[colIdx] || '';
                      const cellStyle = isSubmitted
                        ? getLetterStyle(letter, colIdx)
                        : letter
                        ? 'bg-white border-[#D96B8A] text-[#342640]'
                        : 'bg-[#FAF6FE] border-[#C5B3DC] text-[#342640]';

                      return (
                        <div
                          key={colIdx}
                          className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center text-lg font-extrabold uppercase transition-all ${cellStyle}`}
                        >
                          {letter}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={() => {
                  sound.playTap();
                  setWordleHint(!wordleHint);
                }}
                className="text-xs font-semibold text-[#D96B8A] flex items-center gap-1 hover:underline"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{wordleHint ? 'Hide Clue' : 'Need a clue?'}</span>
              </button>
              {guesses.length >= 6 && !wordleWon && (
                <button
                  onClick={() => {
                    sound.playTap();
                    setGuesses([]);
                    setCurrentGuess('');
                  }}
                  className="text-xs font-bold text-[#529E82] flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Board
                </button>
              )}
            </div>

            {wordleHint && (
              <div className="w-full bg-[#FAF6FE] border border-[#C5B3DC] rounded-xl p-2 mb-3 text-center text-xs text-[#342640]">
                💡 Clue: Your Pet Name 😉
              </div>
            )}

            {wordleWon ? (
              <div className="w-full text-center animate-fadeIn mt-1">
                <div className="bg-[#529E82]/15 border-2 border-[#529E82] rounded-2xl p-3.5 mb-3">
                  <p className="text-sm font-extrabold text-[#255C47]">
                    🎉 UNCLE you are one step closer to 40. (I am still in 30s)
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playTap();
                    setStage(3);
                  }}
                  className="w-full py-3 rounded-2xl bg-[#D96B8A] text-white font-bold text-base shadow-lg"
                >
                  Continue to Stage 3 →
                </button>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-1.5 mt-1">
                {[
                  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKeyPress(key)}
                        className={`${
                          key === 'ENTER' || key === 'BACK'
                            ? 'px-2.5 text-[11px] bg-[#D96B8A] text-white'
                            : 'flex-1 max-w-[33px] text-xs bg-white text-[#342640]'
                        } h-10 rounded-lg font-bold border border-[#C5B3DC] shadow-sm active:scale-95 flex items-center justify-center`}
                      >
                        {key === 'BACK' ? '⌫' : key}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* -------------------- STAGE 3: MEMORY TIMELINE SORT -------------------- */}
        {stage === 3 && (
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-4 shadow-xl flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#529E82] bg-[#529E82]/15 px-3 py-0.5 rounded-full mb-1">
              Stage 3 · Memory Lineup
            </span>
            <h2 className="text-xl font-extrabold text-[#342640]">
              Put Us in Order (1 to 4)
            </h2>
            <p className="text-xs text-[#6E5A7F] mb-3 text-center">
              Tap any two Polaroids to swap them, or use the arrows to line them up from 1 to 4.
            </p>

            <div className="w-full flex flex-col gap-2.5 mb-4">
              {timelineItems.map((item, idx) => {
                const isSelected = selectedIdx === idx;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardTap(idx)}
                    className={`flex items-center gap-3 p-2 rounded-2xl border-2 transition-all cursor-pointer ${
                      timelineSolved
                        ? 'bg-[#529E82]/15 border-[#529E82]'
                        : isSelected
                        ? 'bg-[#D96B8A]/15 border-[#D96B8A] scale-[1.01]'
                        : 'bg-[#FAF7F5] border-[#C5B3DC]'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-[#342640] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      #{idx + 1}
                    </div>

                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#C5B3DC] bg-white shrink-0 shadow-sm">
                      <img
                        src={photos[item.id]}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_PHOTOS[item.id];
                        }}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 text-left">
                      <p className="text-sm font-extrabold text-[#342640]">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#6E5A7F]">
                        {timelineSolved
                          ? `✔ Locked in #${item.order}`
                          : isSelected
                          ? 'Tap another card to swap'
                          : 'Tap to select'}
                      </p>
                    </div>

                    {!timelineSolved && (
                      <div
                        className="flex flex-col gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          disabled={idx === 0}
                          onClick={() => swapItems(idx, idx - 1)}
                          className="p-1 rounded-lg bg-[#EAE0F5] disabled:opacity-30 text-[#342640]"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === timelineItems.length - 1}
                          onClick={() => swapItems(idx, idx + 1)}
                          className="p-1 rounded-lg bg-[#EAE0F5] disabled:opacity-30 text-[#342640]"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {timelineError && (
              <p className="text-xs font-bold text-red-600 mb-2 animate-bounce">
                Not quite the right order yet! Try swapping a couple.
              </p>
            )}

            {!timelineSolved ? (
              <button
                onClick={verifyTimeline}
                className="w-full py-3.5 rounded-2xl bg-[#D96B8A] text-white font-bold text-sm shadow-lg"
              >
                Check Order
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playTap();
                  setStage(4);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#529E82] text-white font-bold text-base shadow-lg animate-fadeIn"
              >
                Perfect! Unlock Stage 4 →
              </button>
            )}
          </div>
        )}

        {/* -------------------- STAGE 4: INSTANT PHOTO SCRATCH CARD -------------------- */}
        {stage === 4 && (
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-4 shadow-xl flex flex-col items-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#529E82] bg-[#529E82]/15 px-3 py-0.5 rounded-full mb-1">
              Stage 4 · Tactile Surprise
            </span>
            <h2 className="text-xl font-extrabold text-[#342640]">
              Scratch the Instant Photo
            </h2>
            <p className="text-xs text-[#6E5A7F] mb-3 text-center">
              Rub the rose-gold foil with your finger to reveal your memory and birthday coupon.
            </p>

            <div className="relative w-full max-w-[310px] bg-[#FAF7F5] p-3 pb-3.5 rounded-2xl shadow-xl border border-[#D8CCE8] mb-3">
              <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#EAE0F5] mb-2.5 shadow-inner">
                <img
                  src={photos.scratch}
                  onError={(e) => {
                    e.currentTarget.src = FALLBACK_PHOTOS.scratch;
                  }}
                  alt="Birthday Surprise"
                  className="w-full h-full object-cover object-top"
                />
              </div>

              <div className="w-full bg-[#F3EDF9] border-2 border-dashed border-[#D96B8A] rounded-xl px-3 py-2 text-center">
                <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[#D96B8A]">
                  <Sparkles className="w-3 h-3" />
                  <span>Birthday Wish Voucher · Nov 14</span>
                </div>
                <p className="text-xs font-extrabold text-[#342640] mt-0.5">
                  One Wish of Your Choice. Zero conditions.
                </p>
              </div>

              <canvas
                ref={canvasRef}
                width={310}
                height={385}
                onMouseDown={() => (isDrawingRef.current = true)}
                onMouseUp={() => (isDrawingRef.current = false)}
                onMouseLeave={() => (isDrawingRef.current = false)}
                onMouseMove={(e) => {
                  if (isDrawingRef.current) scratchAtPoint(e.clientX, e.clientY);
                }}
                onTouchStart={(e) => {
                  isDrawingRef.current = true;
                  const touch = e.touches[0];
                  scratchAtPoint(touch.clientX, touch.clientY);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  scratchAtPoint(touch.clientX, touch.clientY);
                }}
                onTouchEnd={() => (isDrawingRef.current = false)}
                className={`absolute inset-0 w-full h-full rounded-2xl touch-none cursor-crosshair transition-opacity duration-700 ${
                  scratchCleared ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              />
            </div>

            {!scratchCleared ? (
              <div className="flex items-center justify-between w-full max-w-[310px] text-xs text-[#6E5A7F]">
                <span>Scratched: {scratchedPercent}%</span>
                <button
                  onClick={() => {
                    setScratchCleared(true);
                    triggerConfetti();
                  }}
                  className="text-[#D96B8A] font-bold hover:underline"
                >
                  Quick Reveal ✨
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  sound.playTap();
                  setStage(5);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#D96B8A] text-white font-bold text-base shadow-lg animate-fadeIn mt-1"
              >
                Enter Stage 5: The Finale →
              </button>
            )}
          </div>
        )}

        {/* -------------------- STAGE 5: CAKE & HIDDEN WISH CARD -------------------- */}
        {stage === 5 && (
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-5 shadow-xl flex flex-col items-center text-center">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#529E82] bg-[#529E82]/15 px-3 py-0.5 rounded-full mb-1">
              Stage 5 · The Finale
            </span>

            {!allCandlesBlown ? (
              <div className="w-full flex flex-col items-center py-2">
                <h2 className="text-2xl font-extrabold text-[#342640] mb-1">
                  Make a Birthday Wish
                </h2>
                <p className="text-xs text-[#6E5A7F] mb-6">
                  Tap each flickering candle flame to blow them out and unlock your birthday card!
                </p>

                <div className="relative flex flex-col items-center my-4 select-none">
                  <div className="flex gap-8 mb-[-6px] z-10">
                    {candlesLit.map((isLit, idx) => (
                      <button
                        key={idx}
                        onClick={() => blowCandle(idx)}
                        className="flex flex-col items-center group focus:outline-none"
                      >
                        <div className="h-8 flex items-center justify-center">
                          {isLit ? (
                            <div className="w-5 h-7 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200 animate-pulse shadow-[0_0_16px_#f59e0b] cursor-pointer transform group-hover:scale-125 transition-transform" />
                          ) : (
                            <span className="text-xs text-[#6E5A7F] animate-fadeIn">
                              💨
                            </span>
                          )}
                        </div>
                        <div className="w-4 h-12 rounded-t-md bg-gradient-to-b from-white to-[#F2D2DC] border-2 border-[#D96B8A] shadow-sm" />
                      </button>
                    ))}
                  </div>

                  <div className="w-48 h-14 bg-[#F2D2DC] border-2 border-[#D96B8A] rounded-t-2xl relative shadow-md flex items-center justify-center">
                    <div className="text-xs font-extrabold tracking-widest text-[#9E3B5A] uppercase">
                      Nov 14
                    </div>
                  </div>
                  <div className="w-60 h-16 bg-[#E2D6F0] border-2 border-[#C5B3DC] rounded-b-2xl shadow-lg flex items-center justify-around px-4">
                    <Heart className="w-4 h-4 text-[#D96B8A] fill-[#D96B8A]" />
                    <Sparkles className="w-4 h-4 text-[#529E82]" />
                    <Heart className="w-4 h-4 text-[#D96B8A] fill-[#D96B8A]" />
                  </div>
                  <div className="w-68 h-3 bg-[#C5B3DC] rounded-full mt-1" />
                </div>

                <p className="text-xs font-bold text-[#D96B8A] mt-4 mb-3">
                  {candlesLit.filter(Boolean).length} of 3 candles still lit
                </p>

                <button
                  onClick={blowAllCandles}
                  className="px-6 py-2.5 rounded-full bg-[#D96B8A] text-white text-xs font-bold shadow-md hover:bg-[#c75b7a] transition-all"
                >
                  💨 Blow Out All Candles
                </button>
              </div>
            ) : (
              <div className="w-full animate-fadeIn text-left">
                <div className="flex items-center justify-between bg-[#529E82]/15 border border-[#529E82] rounded-full px-3.5 py-1.5 mb-4">
                  <span className="text-xs font-bold text-[#255C47]">
                    ✨ Wish Made! Card Unlocked
                  </span>
                  <button
                    onClick={relightCandles}
                    className="text-[11px] font-bold text-[#D96B8A] hover:underline"
                  >
                    Relight Candles
                  </button>
                </div>

                <div className="bg-[#FAF7F5] border-2 border-[#D8CCE8] rounded-2xl p-5 shadow-inner mb-4 relative">
                  <h1 className="text-2xl font-extrabold text-[#D96B8A] mb-3">
                    Happy Birthday Mama!
                  </h1>
                  <p className="text-sm leading-relaxed text-[#342640] mb-3 font-medium">
                    Here’s to the guy who quietly handles the hard stuff and never loses his sense of humor in the process. You’ve put so much energy into building a great life over this past year.
                  </p>
                  <p className="text-sm leading-relaxed text-[#342640] font-medium">
                    For this next year in life: I hope your days are lighter and you get way more time for the things that actually makes you happy.
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#E2D6F0] flex items-center justify-between text-xs font-bold text-[#6E5A7F]">
                    <span>November 14</span>
                    <span className="text-[#D96B8A]">With love ♥</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      sound.playTap();
                      setShowVoucherModal(true);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-[#D96B8A] text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>View Wish Voucher</span>
                  </button>
                  <button
                    onClick={() => {
                      sound.playTap();
                      setStage(1);
                    }}
                    className="px-4 py-3 rounded-2xl bg-[#EAE0F5] text-[#342640] font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Replay</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ==================== KEEPSAKE VOUCHER MODAL ==================== */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FAF7F5] border-2 border-[#C5B3DC] rounded-3xl p-4 max-w-xs w-full shadow-2xl relative animate-fadeIn">
            <button
              onClick={() => setShowVoucherModal(false)}
              className="absolute top-3 right-3 bg-white/80 rounded-full p-1.5 text-[#342640] shadow"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#EAE0F5] mb-3">
              <img
                src={photos.scratch}
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_PHOTOS.scratch;
                }}
                alt="Keepsake"
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="w-full bg-[#F3EDF9] border-2 border-dashed border-[#D96B8A] rounded-xl px-3 py-2.5 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#D96B8A]">
                ★ Birthday Wish Voucher · Nov 14 ★
              </div>
              <p className="text-xs font-extrabold text-[#342640] mt-0.5">
                One Wish of Your Choice. Zero conditions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DEV PHOTO UPLOADER MODAL ==================== */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#F3EDF9] border-2 border-[#C5B3DC] rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[#342640]">
                Preview Local Photos
              </h3>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 rounded-lg bg-[#EAE0F5] text-[#342640]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6E5A7F] mb-3">
              For permanent hosting, place your 5 files inside{' '}
              <code className="bg-white px-1 py-0.5 rounded font-mono">
                public/photos/
              </code>
              . You can also test-load images right here:
            </p>
            <div className="space-y-2 text-xs">
              {[
                { key: 'memory1', label: '1. D-Day (memory1.jpg)' },
                { key: 'memory2', label: '2. Handsome Dude (memory2.jpg)' },
                { key: 'memory3', label: '3. Cutie Pie (memory3.jpg)' },
                { key: 'memory4', label: '4. Shy Shy Shy (memory4.jpg)' },
                { key: 'scratch', label: 'Stage 4 Scratch Photo (scratch-photo.jpg)' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#C5B3DC]"
                >
                  <span className="font-semibold text-[#342640] truncate pr-2">
                    {item.label}
                  </span>
                  <label className="px-2.5 py-1 bg-[#D96B8A] text-white rounded-lg font-bold cursor-pointer shrink-0">
                    Choose
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(item.key, e)}
                      className="hidden"
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}