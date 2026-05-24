import React from 'react';
import { Task, Routine } from '../types';
import { Award, Flame, Trophy, CheckCircle, Zap, Heart, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface WinsMomentumProps {
  tasks: Task[];
  routines: Routine[];
}

export default function WinsMomentum({ tasks, routines }: WinsMomentumProps) {
  const completedTasks = tasks.filter(t => t.completed);
  const completedRoutines = routines.filter(r => r.completed);

  // Calculate points
  const taskPoints = completedTasks.length * 15;
  const routinePoints = completedRoutines.length * 10;
  const activeFocusPoints = tasks
    .filter(t => t.durationSeconds && t.durationSeconds > 0)
    .reduce((acc, t) => acc + Math.floor((t.durationSeconds || 0) / 10), 0);
  
  const totalDopaminePts = taskPoints + routinePoints + activeFocusPoints;

  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = completedRoutines.length;
  const totalRoutineCount = routines.length;

  // Daily Energy Wins: spent focus resources calculated as self-care achievements
  const lowEnergyCount = completedTasks.filter(t => t.energyLevel === 'low').length;
  const mediumEnergyCount = completedTasks.filter(t => t.energyLevel === 'medium').length;
  const highEnergyCount = completedTasks.filter(t => t.energyLevel === 'deep').length;

  return (
    <div className="space-y-8" id="wins-view">
      {/* Dynamic App Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-purple-950 tracking-tight font-sans flex items-center gap-2">
          Your Victory Space
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
          No guilt trackers or rigid charts. Just celebrating every choice you made to protect your mind, build peaceful momentum, or rest.
        </p>
      </div>

      {/* THREE THEMED REWARD WIDGETS */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Momentum Trail Map Card */}
        <div className="p-6 rounded-[28px] bg-gradient-to-br from-purple-600 to-indigo-700 text-white min-h-[155px] flex flex-col justify-between shadow-lg shadow-purple-950/15 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-3xl pointer-events-none group-hover:scale-110 transition duration-700" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-200 font-mono">Momentum Trail</span>
            <div className="p-1.5 bg-white/15 rounded-lg">
              <Sparkles size={14} className="fill-purple-300 stroke-purple-100 animate-spin" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3.5xl font-black tracking-tight">{totalDopaminePts} Pts</h2>
            <div className="mt-2 text-xs flex flex-col gap-0.5 text-purple-100 font-sans">
              <div className="font-bold flex items-center gap-1.5 text-xs">
                <span>🏆 Level {Math.floor(totalDopaminePts / 100) + 1}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-md text-[9px] font-mono leading-none font-bold">
                  {totalDopaminePts < 35 ? 'Warm Streak' : totalDopaminePts < 90 ? 'Active Pulse' : 'Flow Master'}
                </span>
              </div>
              <span className="text-[10px] text-purple-200">Dopamine trails glow active</span>
            </div>
          </div>
        </div>

        {/* Recovery Streak Panel */}
        <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 min-h-[155px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Today's Routines</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
              <Heart size={14} className="fill-emerald-400 stroke-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-3.5xl font-black tracking-tight text-slate-800">
              {completedToday}/{totalRoutineCount}
            </h2>
            <p className="text-xs text-slate-500 font-sans font-semibold mt-2">
              Routines completed today. No pressure — any number is a win.
            </p>
          </div>
        </div>

        {/* Total Victories Clearance */}
        <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 min-h-[155px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Actions Completed</span>
            <div className="p-1.5 bg-amber-50 rounded-lg text-amber-500">
              <Trophy size={14} className="fill-amber-400 stroke-amber-500" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3.5xl font-black tracking-tight text-slate-800">
                {completedTasks.length + completedRoutines.length}
              </h2>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-2 py-0.5 font-sans leading-none">
                {(completedTasks.length + completedRoutines.length) === 0 ? '✨ Slate Clean' :
                 (completedTasks.length + completedRoutines.length) < 3 ? '🌸 Spark Lit' :
                 (completedTasks.length + completedRoutines.length) < 6 ? '⚡ Steady Steps' :
                 '🔥 Massive Triumph'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans font-semibold mt-2">
              Scattered thoughts converted to spacious mental safety
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-12">
        {/* COMPLIMENTARY WINS: Daily Energy Wins panel (4 columns on larger grids) */}
        <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 lg:col-span-5 space-y-6">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-purple-600 font-mono">Daily Energy Wins</span>
            <h3 className="text-base font-black tracking-tight text-slate-800 mt-1">Focus Resources Spent</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1.5">⚡ Gentle/Low Energy <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-mono">+{lowEnergyCount}</span></span>
                <span className="text-[10px] font-sans text-slate-400">Momentum Builders</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100/60 overflow-hidden">
                <div 
                  className="h-full bg-emerald-400 transition-all duration-1000" 
                  style={{ width: `${Math.min((lowEnergyCount / 5) * 100, 100) || 8}%` }} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1.5">⚡⚡ Moderate Focus <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-mono">+{mediumEnergyCount}</span></span>
                <span className="text-[10px] font-sans text-slate-400">Regular Flow</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100/60 overflow-hidden">
                <div 
                  className="h-full bg-purple-400 transition-all duration-1000" 
                  style={{ width: `${Math.min((mediumEnergyCount / 5) * 100, 100) || 8}%` }} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold flex items-center gap-1.5">⚡⚡⚡ Concentrated Focus <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-md font-mono">+{highEnergyCount}</span></span>
                <span className="text-[10px] font-sans text-slate-400">Concentration summits</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100/60 overflow-hidden">
                <div 
                  className="h-full bg-rose-400 transition-all duration-1000" 
                  style={{ width: `${Math.min((highEnergyCount / 3) * 100, 100) || 8}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* WINS WALL: Tiny Victory Wall & Completed Wins Timeline (7 columns on larger grids) */}
        <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Completed Wins Timeline</span>
              <h3 className="text-base font-black tracking-tight text-slate-800 mt-1">Tiny Victory Wall</h3>
            </div>
            {completedTasks.length > 0 && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                Momentum Active
              </span>
            )}
          </div>

          {completedTasks.length > 0 ? (
            <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
              {completedTasks.map((task, index) => (
                <motion.div 
                  key={task.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-purple-50/40 hover:border-purple-200 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs border border-emerald-100 shrink-0">
                      ✓
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-slate-700 font-sans leading-relaxed">{task.text}</span>
                  </div>
                  <span className="text-[9px] bg-purple-100 text-purple-700 px-2 rounded-full font-mono font-black scale-95 shrink-0">
                    +15 Dopamine
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 text-xs font-semibold max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={20} className="text-purple-300" />
              </div>
              "Your space is calm right now. Add one tiny next step." complete a quick objective or routine to place a milestone.
            </div>
          )}
        </div>
      </div>

      {/* FOOTER EMOTIONAL SUPPORT ROW */}
      <div className="p-6 rounded-[28px] bg-[#F9F7FF] border border-purple-100 text-slate-700 flex flex-col md:flex-row items-start md:items-center gap-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 shadow-sm font-sans text-xl">
          🌸
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-purple-900 font-sans">Every single action is a major victory for your nervous system.</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
            ADHD starting barriers are real. If you completed only one physical adjustment, checked a single routine step, or did a 2-minute focus session—you broke task paralysis. That is a massive triumph. Let go of the guilt.
          </p>
        </div>
      </div>
    </div>
  );
}
