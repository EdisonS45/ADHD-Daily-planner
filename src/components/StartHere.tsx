import React from 'react';
import { Task } from '../types';
import { Play, CheckCircle2, Zap, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface StartHereProps {
  tasks: Task[];
  energyLevel: 'all' | 'low' | 'medium' | 'deep';
  onComplete: (id: string) => void;
  onStartFocus: (task: Task) => void;
  onSetEnergy: (energy: 'all' | 'low' | 'medium' | 'deep') => void;
}

export default function StartHere({ tasks, energyLevel, onComplete, onStartFocus, onSetEnergy }: StartHereProps) {
  const uncompleted = tasks.filter(t => !t.completed);

  // Intelligent recommendation engine
  const getRecommendation = (): Task | null => {
    if (uncompleted.length === 0) return null;

    // Filter by active energy level if not 'all'
    let pool = uncompleted;
    if (energyLevel !== 'all') {
      pool = uncompleted.filter(t => t.energyLevel === energyLevel);
    }

    // Recommendation logic:
    // 1. If we have tiny-wins, pick the first tiny-win to build early dopamine!
    const tinyWins = pool.filter(t => t.category === 'tiny-win');
    if (tinyWins.length > 0) return tinyWins[0];

    // 2. Next, pick deep-focus
    const deepFocus = pool.filter(t => t.category === 'deep-focus');
    if (deepFocus.length > 0) return deepFocus[0];

    // 3. Next, recovery or routines
    const recovery = pool.filter(t => t.category === 'recovery');
    if (recovery.length > 0) return recovery[0];

    // 4. Next, admin or standard routines
    const admin = pool.filter(t => t.category === 'admin');
    if (admin.length > 0) return admin[0];

    // Fallback to any pool task
    if (pool.length > 0) return pool[0];

    // Fallback to any uncompleted task overall
    return uncompleted[0];
  };

  const recommendedTask = getRecommendation();

  const getSmarterLabelAndStyles = (category: Task['category']) => {
    switch (category) {
      case 'tiny-win':
        return { label: 'Tiny Win', style: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
      case 'deep-focus':
        return { label: 'Needs full concentration', style: 'bg-purple-50 text-purple-700 border border-purple-100' };
      case 'recovery':
        return { label: 'Reset / Recovery', style: 'bg-amber-50 text-amber-600 border border-amber-105' };
      case 'routine':
        return { label: 'Gentle Routine', style: 'bg-[#F2EDFF] text-purple-600 border border-purple-100' };
      case 'admin':
      default:
        return { label: 'Life admin', style: 'bg-slate-100 text-slate-700 border border-slate-205' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative p-8 md:p-10 rounded-[32px] bg-white/50 backdrop-blur-xl border border-purple-100/60 shadow-xl shadow-purple-900/5 col-span-12"
      id="start-here-card"
    >
      {/* Start Here badge aligned perfectly with mockup style */}
      <div className="absolute -top-3 -left-3 bg-purple-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full z-10 shadow-lg uppercase tracking-widest font-mono">
        Recommended focus
      </div>

      <div className="flex items-center justify-between mb-4">
        <div></div>
        <span className="text-xs text-purple-400 font-mono font-bold">Safe Attention Anchor</span>
      </div>

      {recommendedTask ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1 space-y-5">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-snug font-sans">
                {recommendedTask.text}
              </h2>
              <div className="flex flex-wrap gap-2.5 mt-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider font-sans ${
                  getSmarterLabelAndStyles(recommendedTask.category).style
                }`}>
                  {getSmarterLabelAndStyles(recommendedTask.category).label}
                </span>

                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-600 font-sans border border-purple-100 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  {recommendedTask.energyLevel === 'low' ? 'Low Energy' : recommendedTask.energyLevel === 'medium' ? 'Medium Focus' : 'Deep Focus'}
                </span>
              </div>
            </div>

            <div className="text-slate-500 text-sm max-w-xl font-sans font-medium">
              {recommendedTask.category === 'tiny-win' ? (
                "Build early momentum with this quick, stress-free step."
              ) : recommendedTask.category === 'deep-focus' ? (
                "A deeper project. Work on it for just 5-10 minutes — no pressure."
              ) : recommendedTask.category === 'recovery' ? (
                "A gentle nervous system reset to renew your attention battery."
              ) : recommendedTask.category === 'routine' ? (
                "A supportive physical anchor for your focus state."
              ) : (
                "A brief administrative item. Let's clear this simple detail."
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {recommendedTask.category === 'tiny-win' ? (
                <button
                  onClick={() => onComplete(recommendedTask.id)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-750 hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  id="start-complete-btn"
                >
                  <CheckCircle2 size={15} className="text-white" />
                  Claim Instant Win
                </button>
              ) : (
                <button
                  onClick={() => onStartFocus(recommendedTask)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  id="start-focus-btn"
                >
                  <Play size={15} fill="white" />
                  Focus Now
                </button>
              )}
              {recommendedTask.category !== 'tiny-win' && (
                <button
                  onClick={() => onComplete(recommendedTask.id)}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/80 hover:bg-white text-slate-750 border border-purple-100/60 text-slate-700 font-bold text-sm transition shadow-sm hover:border-purple-200 cursor-pointer"
                  id="start-complete-btn"
                >
                  <CheckCircle2 size={15} className="text-purple-500" />
                  Done with it
                </button>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center p-4">
            <div className="w-32 h-32 rounded-full border-4 border-purple-50/50 bg-white/40 backdrop-blur-md flex items-center justify-center shadow-md">
              <div className="w-24 h-24 rounded-full border-8 border-purple-600/10 flex items-center justify-center">
                 <span className="text-xl font-black text-purple-600 font-mono tracking-tight">
                   {recommendedTask.category === 'tiny-win' ? '1m' : '10m'}
                 </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-[22px] bg-purple-50 border border-purple-100 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <CheckCircle2 size={30} className="text-purple-600 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 tracking-tight">Your space is calm right now</h3>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Supportive routines and simple steps lower mental friction. Let's add one tiny next step to build peaceful momentum.
          </p>
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => onSetEnergy('all')}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-65 uppercase tracking-wide cursor-pointer bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-600/10 transition"
            >
              Reset Cycle Filters
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
