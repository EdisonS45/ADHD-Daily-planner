import React, { useState, useEffect, useRef } from 'react';
import { Task } from '../types';
import { Play, Pause, RotateCcw, CheckCircle, Flame, Heart, Sparkles, Wind, Volume2, VolumeX, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pure Web Audio Synthesizer Class for Offline Atmospheric Sounds
class AmbientAudioPlayer {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;

  startBrownianNoise(volume: number = 0.35) {
    this.stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 10 * sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.8; // scaling
    }
    
    this.source = this.ctx.createBufferSource();
    this.source.buffer = noiseBuffer;
    this.source.loop = true;
    
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    
    this.source.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.source.start(0);
  }

  startRainNoise(volume: number = 0.35) {
    this.stop();
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 8 * sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + white * 0.5362;
      
      const rainDrop = Math.random() > 0.9985 ? (Math.random() * 0.28) : 0;
      output[i] = (pink * 0.09) + rainDrop;
    }
    
    this.source = this.ctx.createBufferSource();
    this.source.buffer = noiseBuffer;
    this.source.loop = true;
    
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(volume * 0.65, this.ctx.currentTime);
    
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, this.ctx.currentTime);
    
    this.source.connect(lowpass);
    lowpass.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);
    
    this.source.start(0);
  }

  setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
    }
  }

  stop() {
    try {
      if (this.source) {
        this.source.stop();
        this.source.disconnect();
        this.source = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      if (this.ctx && this.ctx.state !== 'closed') {
        this.ctx.close();
        this.ctx = null;
      }
    } catch (e) {
      console.warn("Audio clean-up caution:", e);
    }
  }
}

interface FocusModeProps {
  activeTask: Task | null;
  onComplete: (id: string, durationSeconds: number) => void;
  onCancel: () => void;
}

const AFFIRMATIONS = [
  "You do not have to finish the whole thing. Just work for 2 minutes.",
  "Tiny progress is still progress. Every single minute counts.",
  "Your brain is unique and capable. Take this step with love.",
  "Momentum is built drop by drop, not all at once.",
  "Let go of the pressure. Right now, this is your only focus.",
  "If your mind wanders, gently guide it back. No self-judgment.",
  "It is okay if it isn't perfect. Doing it is already a major victory."
];

export default function FocusMode({ activeTask, onComplete, onCancel }: FocusModeProps) {
  // ADHD flexible durations: 5 minutes, 15 minutes, 25 minutes
  const [duration, setDuration] = useState(15 * 60); 
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [affirmation, setAffirmation] = useState(AFFIRMATIONS[0]);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  
  const [ambientSound, setAmbientSound] = useState<'off' | 'brown' | 'rain'>('off');
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const audioPlayerRef = useRef<AmbientAudioPlayer | null>(null);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const secondsElapsedRef = useRef(0);

  // Initialize and clean up audio player
  useEffect(() => {
    audioPlayerRef.current = new AmbientAudioPlayer();
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.stop();
      }
    };
  }, []);

  // Sync ambient selection changes
  useEffect(() => {
    if (!audioPlayerRef.current) return;
    if (ambientSound === 'off') {
      audioPlayerRef.current.stop();
    } else if (ambientSound === 'brown') {
      audioPlayerRef.current.startBrownianNoise(ambientVolume);
    } else if (ambientSound === 'rain') {
      audioPlayerRef.current.startRainNoise(ambientVolume);
    }
  }, [ambientSound]);

  // Sync volume adjustments dynamically
  useEffect(() => {
    if (audioPlayerRef.current) {
      if (ambientSound === 'rain') {
        audioPlayerRef.current.setVolume(ambientVolume * 0.65);
      } else {
        audioPlayerRef.current.setVolume(ambientVolume);
      }
    }
  }, [ambientVolume, ambientSound]);

  // Set randomized affirmations on mounting or changing task
  useEffect(() => {
    const randomIdx = Math.floor(Math.random() * AFFIRMATIONS.length);
    setAffirmation(AFFIRMATIONS[randomIdx]);
  }, [activeTask]);

  // Handle countdown interval
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          secondsElapsedRef.current += 1;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Breathing loop simulation
  useEffect(() => {
    let breathTimer: NodeJS.Timeout;
    if (showBreathing) {
      const breathLoop = () => {
        setBreathPhase('inhale');
        breathTimer = setTimeout(() => {
          setBreathPhase('hold');
          breathTimer = setTimeout(() => {
            setBreathPhase('exhale');
            breathTimer = setTimeout(breathLoop, 4000); // 4s exhale
          }, 4000); // 4s hold
        }, 4000); // 4s inhale
      };
      
      breathLoop();
    }

    return () => {
      clearTimeout(breathTimer);
    };
  }, [showBreathing]);

  const selectDuration = (minutes: number) => {
    const secs = minutes * 60;
    setDuration(secs);
    setTimeLeft(secs);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mm = Math.floor(seconds / 60);
    const ss = seconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(duration);
    secondsElapsedRef.current = 0;
  };

  const handleFinishCustom = () => {
    if (activeTask) {
      onComplete(activeTask.id, secondsElapsedRef.current);
    }
  };

  const progressPercent = ((duration - timeLeft) / duration) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 md:p-10 rounded-[32px] bg-white/45 backdrop-blur-xl text-slate-800 min-h-[500px] flex flex-col justify-between shadow-xl border border-white/85 relative overflow-hidden"
      id="focus-mode-view"
    >
      {/* Background radial soft light to make it look expensive */}
      <div className="absolute top-0 right-0 w-85 h-85 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-85 h-85 rounded-full bg-pink-500/5 blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between z-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-purple-100/80 text-purple-700 border border-purple-200/50 shadow-sm tracking-wide font-mono">
          <Sparkles size={11} className="text-purple-600 animate-spin" />
          Focus Space
        </span>
        <button
          onClick={onCancel}
          className="text-xs text-slate-500 hover:text-purple-700 px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-purple-100/40 hover:border-purple-200 transition shadow-sm font-bold cursor-pointer"
        >
          Exit focus
        </button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-around gap-8 my-8 z-10 w-full">
        {/* Core Task & Affinity */}
        <div className="space-y-6 max-w-md text-center lg:text-left">
          <div>
            <span className="text-[10px] uppercase text-purple-500 font-bold tracking-widest font-mono">Current Objective</span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mt-1 leading-snug text-slate-900 font-sans">
              {activeTask ? activeTask.text : "Gentle Breathing & Reset"}
            </h2>
          </div>

          <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100/40 backdrop-blur-sm shadow-inner shadow-purple-900/5 flex items-start gap-3">
            <Heart size={18} className="text-purple-500 mt-0.5 flex-shrink-0 animate-pulse fill-purple-400" />
            <p className="text-xs md:text-sm text-slate-700 italic font-sans font-medium leading-relaxed">
              "{affirmation}"
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5">
            <button
              onClick={() => setShowBreathing(!showBreathing)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border transition duration-300 cursor-pointer shadow-sm ${
                showBreathing 
                  ? 'bg-purple-600 text-white border-purple-600 shadow-purple-600/20 shadow-md' 
                  : 'bg-white/80 hover:bg-white text-slate-600 border-purple-100/40 hover:border-purple-200'
              }`}
            >
              <Wind size={13} className={showBreathing ? "animate-spin" : ""} />
              {showBreathing ? "Breathing Assistant: On" : "Breathing Assistant"}
            </button>
          </div>

          {/* Ambient Soundscape Synthesizer */}
          <div className="space-y-3 pt-4 border-t border-purple-100/30 text-center lg:text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center lg:justify-start gap-1.5 font-mono">
              <Music size={11} className="text-purple-500" />
              Focus Soundscape
            </span>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
              {(['off', 'brown', 'rain'] as const).map((sound) => (
                <button
                  key={sound}
                  onClick={() => setAmbientSound(sound)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    ambientSound === sound
                      ? 'bg-purple-600 text-white shadow-purple-600/10'
                      : 'bg-white/80 hover:bg-white text-slate-600 border border-purple-100/30'
                  }`}
                >
                  {sound === 'off' ? '🚫 Mute' : sound === 'brown' ? '🟫 Brown Noise' : '🌧️ Rain Ambient'}
                </button>
              ))}
            </div>

            {ambientSound !== 'off' && (
              <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm p-2 rounded-2xl border border-purple-100/20 max-w-[240px] mx-auto lg:mx-0 shadow-sm mt-2">
                <Volume2 size={13} className="text-purple-600 shrink-0 ml-1" />
                <input
                  type="range"
                  min="0.05"
                  max="0.8"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full accent-purple-600 h-1 bg-purple-150 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-bold font-mono text-purple-600 shrink-0 mr-1">
                  {Math.round(ambientVolume * 100)}%
                </span>
              </div>
            )}
            
            <p className="text-[10px] text-slate-400 italic font-medium">
              "Starts distraction-safe focus mode for this task."
            </p>
          </div>
        </div>

        {/* Action interactive ring and counter */}
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="relative w-56 h-56 flex items-center justify-center">
            {/* Subtle animated breathing pulse / ambient motion / soft focus glow */}
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute w-44 h-44 rounded-full bg-purple-400/25 blur-2xl -z-10"
            />
            {/* SVG circle meter */}
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                className="stroke-purple-100/50"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                className="stroke-purple-600 transition-all duration-1000"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="603"
                strokeDashoffset={603 - (603 * progressPercent) / 100}
                strokeLinecap="round"
              />
            </svg>

            {/* Middle Breathing Bubble */}
            <AnimatePresence mode="wait">
              {showBreathing ? (
                <motion.div
                  key={breathPhase}
                  initial={{ scale: breathPhase === 'inhale' ? 0.65 : breathPhase === 'hold' ? 1 : 1 }}
                  animate={{ 
                    scale: breathPhase === 'inhale' ? 1 : breathPhase === 'hold' ? 1.05 : 0.65,
                    backgroundColor: breathPhase === 'inhale' ? 'rgba(147, 51, 234, 0.15)' : breathPhase === 'hold' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="absolute w-36 h-36 rounded-full flex flex-col items-center justify-center text-center p-2 border border-purple-100/30 backdrop-blur-md"
                >
                  <span className="text-lg font-black capitalize tracking-wider font-sans text-purple-950">
                    {breathPhase}
                  </span>
                  <span className="text-[9px] text-purple-600 uppercase tracking-widest font-mono font-bold mt-1">
                    {breathPhase === 'inhale' ? 'expand lung' : breathPhase === 'hold' ? 'keep air' : 'relax chest'}
                  </span>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center z-10 text-center">
                  <span className="text-4xl md:text-5xl font-mono font-black text-purple-950 tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[9px] uppercase text-purple-500 tracking-widest font-mono font-semibold mt-1">
                    {isRunning ? "focus cycle active" : "paused"}
                  </span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Time presets */}
          <div className="flex items-center gap-1.5 p-1 bg-white/70 rounded-xl border border-purple-100/30 shadow-sm">
            {[5, 15, 25].map((mins) => (
              <button
                key={mins}
                onClick={() => selectDuration(mins)}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide transition cursor-pointer ${
                  duration === mins * 60
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/15'
                    : 'text-slate-500 hover:text-purple-600 hover:bg-white/60'
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Play Controls and Confirm Done */}
      <div className="border-t border-purple-100/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition cursor-pointer shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
              isRunning 
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/15' 
                : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/15'
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={15} fill="white" /> Pause Focus
              </>
            ) : (
              <>
                <Play size={15} fill="white" /> Start Limit
              </>
            )}
          </button>
          
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-white/80 border border-purple-100 hover:bg-white hover:border-purple-200 text-slate-400 hover:text-purple-600 transition shadow-sm cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {activeTask && (
          <button
            onClick={handleFinishCustom}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition shadow-lg shadow-emerald-600/15 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <CheckCircle size={15} fill="rgba(255,255,255,0.2)" />
            Completed Objective
          </button>
        )}
      </div>
    </motion.div>
  );
}
