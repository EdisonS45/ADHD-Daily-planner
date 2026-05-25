import React from 'react';
import { Task, Routine, WinsArchive } from '../types';
import { Award, Flame, Trophy, CheckCircle, Zap, Heart, Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';

interface WinsMomentumProps {
  tasks: Task[];
  routines: Routine[];
  winsArchive: WinsArchive;
}

function calcStreak(archive: WinsArchive): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (archive[key] && archive[key].length > 0) {
      streak++;
    } else {
      if (i === 0) {
        continue;
      }
      break;
    }
  }
  return streak;
}

export default function WinsMomentum({ tasks, routines, winsArchive }: WinsMomentumProps) {
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

  // Helper to determine day label
  const getDayLabel = (dateStr: string) => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toISOString().split('T')[0];

    if (dateStr === todayString) return "Today";
    if (dateStr === yesterdayString) return "Yesterday";
    
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {
      return dateStr;
    }
  };

  const sortedDates = Object.keys(winsArchive || {}).sort((a, b) => b.localeCompare(a));
  const totalWinsInArchive = Object.values(winsArchive || {}).reduce((acc, list) => acc + list.length, 0);

  // Streak count calculation
  const streakCount = calcStreak(winsArchive);

  // Weekly Comparison calculations
  const getWeeklyComparison = () => {
    const today = new Date();
    
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const currentMondayStr = currentMonday.toISOString().split('T')[0];
    const todayStrHeader = today.toISOString().split('T')[0];

    const lastMonday = new Date(currentMonday);
    lastMonday.setDate(currentMonday.getDate() - 7);
    const lastMondayStr = lastMonday.toISOString().split('T')[0];

    const lastSunday = new Date(currentMonday);
    lastSunday.setDate(currentMonday.getDate() - 1);
    const lastSundayStr = lastSunday.toISOString().split('T')[0];

    let thisWeekWins = 0;
    let lastWeekWins = 0;

    Object.entries(winsArchive || {}).forEach(([dateStr, list]) => {
      if (dateStr >= currentMondayStr && dateStr <= todayStrHeader) {
        thisWeekWins += list.length;
      } else if (dateStr >= lastMondayStr && dateStr <= lastSundayStr) {
        lastWeekWins += list.length;
      }
    });

    return { thisWeekWins, lastWeekWins };
  };

  // 7-day calculations for bar chart
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateKey = d.toISOString().split('T')[0];
    const wins = winsArchive[dateKey]?.length ?? 0;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const isToday = i === 6;
    return { dateKey, wins, dayName, isToday };
  });

  const totalThisWeek = last7Days.reduce((sum, d) => sum + d.wins, 0);
  const maxWins = Math.max(...last7Days.map(d => d.wins), 1);

  // Patterns & insights calculations
  const getInsights = () => {
    const archiveKeys = Object.keys(winsArchive || {});
    const totalDays = archiveKeys.length;
    
    const categoryCounts: Record<string, number> = {
      'tiny-win': 0,
      'deep-focus': 0,
      'admin': 0,
      'recovery': 0,
      'routine': 0
    };
    
    let totalWinsCount = 0;
    Object.values(winsArchive || {}).forEach(list => {
      list.forEach(win => {
        totalWinsCount++;
        const cat = win.category;
        if (cat && cat in categoryCounts) {
          categoryCounts[cat]++;
        }
      });
    });
    
    let favCategory = '';
    let maxCatCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        favCategory = cat;
      }
    });

    let insightA = "🌱 Your patterns will appear here as you use the app.";
    if (totalWinsCount > 0 && favCategory) {
      const mappings: Record<string, string> = {
        'tiny-win': "🌸 You complete the most Tiny Wins — dopamine building at its best.",
        'deep-focus': "🧠 Deep focus tasks are your strength — you do hard things.",
        'admin': "💼 You clear life admin consistently — underrated superpower.",
        'recovery': "🌱 You prioritise recovery — that is genuinely rare and wise.",
        'routine': "☀️ Routines are your anchor — structure suits your brain."
      };
      insightA = mappings[favCategory] || insightA;
    }

    const weekdayCounts = Array(7).fill(0);
    Object.entries(winsArchive || {}).forEach(([dateStr, list]) => {
      try {
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay();
        if (!isNaN(day)) {
          weekdayCounts[day] += list.length;
        }
      } catch (e) {}
    });

    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let maxDayCount = 0;
    let bestWeekdayIndex = -1;
    weekdayCounts.forEach((count, i) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        bestWeekdayIndex = i;
      }
    });

    let insightB = "📅 Check back after a full week to see your best day.";
    if (totalDays >= 7 && bestWeekdayIndex !== -1) {
      insightB = `📅 Your strongest day tends to be ${weekdays[bestWeekdayIndex]}.`;
    }

    let bestDayKey = '';
    let bestDayCount = 0;
    Object.entries(winsArchive || {}).forEach(([dateStr, list]) => {
      if (list.length > bestDayCount) {
        bestDayCount = list.length;
        bestDayKey = dateStr;
      }
    });

    let insightC = '';
    if (bestDayCount > 0 && bestDayKey) {
      let formattedDate = bestDayKey;
      try {
        const d = new Date(bestDayKey + 'T00:00:00');
        formattedDate = d.toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      } catch (e) {}
      
      insightC = `🏆 Your best day ever: ${bestDayCount} ${bestDayCount === 1 ? 'task' : 'tasks'} on ${formattedDate}.`;
    }

    return { insightA, insightB, insightC };
  };

  const { insightA, insightB, insightC } = getInsights();

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
              {(() => {
                const { thisWeekWins, lastWeekWins } = getWeeklyComparison();
                if (thisWeekWins > lastWeekWins) {
                  return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/15 text-emerald-300 w-fit mt-2">
                      ↑ {thisWeekWins - lastWeekWins} more than last week
                    </span>
                  );
                } else if (thisWeekWins < lastWeekWins) {
                  return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/15 text-amber-300 w-fit mt-2">
                      ↓ {lastWeekWins - thisWeekWins} fewer than last week
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md bg-white/15 text-purple-100 w-fit mt-2">
                      {thisWeekWins} actions this week
                    </span>
                  );
                }
              })()}
            </div>
          </div>
        </div>

        {/* Day Streak & Routine Completion Panel */}
        <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 min-h-[155px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 font-mono">Day Streak</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-500">
              <Flame size={14} className="fill-emerald-400 stroke-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-3.5xl font-black tracking-tight text-slate-800">
                {streakCount}
              </h2>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Day streak</span>
            </div>
            
            <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Routines today:</span>
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-mono font-black">
                {completedToday}/{totalRoutineCount}
              </span>
            </div>

            <p className="text-xs text-slate-500 font-sans font-semibold mt-2 leading-relaxed">
              {(() => {
                const s = streakCount;
                if (s === 0) return "Start today — every streak begins with one day.";
                if (s === 1) return "Day one. The hardest day is always the first.";
                if (s >= 2 && s <= 6) return "Building momentum. Keep this going.";
                if (s >= 7 && s <= 13) return "One week strong. This is becoming a habit.";
                return "Two weeks in. You're rewiring your brain.";
              })()}
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

      {/* 7-Day Activity Bar Chart Card */}
      <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5">
        <div className="flex flex-col gap-1 mb-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#6D21A8]/80 font-mono">7-Day Progress</span>
          <h3 className="text-base font-black tracking-tight text-slate-800">Activity & Consistency</h3>
          <p className="text-xs font-mono font-bold text-slate-500 mt-1">
            This week: <span className="text-[#6D21A8] font-extrabold">{totalThisWeek}</span> {totalThisWeek === 1 ? 'action' : 'actions'} completed
          </p>
        </div>

        <div className="w-full">
          <svg viewBox="0 0 420 120" className="w-full h-auto overflow-visible select-none">
            {last7Days.map((day, i) => {
              const xValue = i * 60 + 15;
              const barWidth = 30;
              const maxY = 85;
              const maxBarHeight = 65;
              const barHeight = day.wins > 0 
                ? (day.wins / maxWins) * maxBarHeight 
                : 4;
              const barY = maxY - barHeight;
              const isToday = day.isToday;
              
              const barFill = isToday ? '#7C3AED' : '#6D21A8';
              const barOpacity = isToday ? 1.0 : 0.6;
              const isPlaceholder = day.wins === 0;

              return (
                <g key={day.dateKey} className="group/bar">
                  {/* Bar */}
                  <rect
                    x={xValue}
                    y={barY}
                    width={barWidth}
                    height={barHeight}
                    rx={4}
                    fill={barFill}
                    opacity={isPlaceholder ? 0.08 : barOpacity}
                    className="transition-all duration-300"
                  />

                  {/* Count small text below each bar if greater than 0 */}
                  {day.wins > 0 && (
                    <text
                      x={xValue + barWidth / 2}
                      y={maxY + 12}
                      textAnchor="middle"
                      className="text-[10px] font-mono font-black fill-purple-950/80"
                    >
                      {day.wins}
                    </text>
                  )}

                  {/* Day Label */}
                  <text
                    x={xValue + barWidth / 2}
                    y={maxY + 25}
                    textAnchor="middle"
                    className={`text-[9.5px] font-bold font-sans ${
                      isToday ? 'fill-[#6D21A8] font-black' : 'fill-slate-400'
                    }`}
                  >
                    {day.dayName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Personal Insights Panel */}
      <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-md shadow-purple-900/5 space-y-5">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase font-black tracking-widest text-[#6D21A8]/80 font-mono font-sans font-bold">Patterns & insights</span>
          <h3 className="text-base font-black tracking-tight text-slate-800">Mindset & habit metrics</h3>
        </div>

        <div className="space-y-5.5 font-sans">
          {/* Insight A */}
          <div className="flex items-start gap-3.5">
            <span className="text-lg shrink-0 select-none">
              {insightA.startsWith("🌸") ? "🌸" : 
               insightA.startsWith("🧠") ? "🧠" : 
               insightA.startsWith("💼") ? "💼" : 
               insightA.startsWith("☀️") ? "☀️" : "🌱"}
            </span>
            <span className="text-sm font-medium text-slate-700 leading-relaxed">
              {insightA.replace(/^(🌸|🧠|💼|🌱|☀️)\s*/, '')}
            </span>
          </div>

          {/* Insight B */}
          <div className="flex items-start gap-3.5">
            <span className="text-lg shrink-0 select-none">📅</span>
            <span className="text-sm font-medium text-slate-700 leading-relaxed">
              {insightB.replace(/^📅\s*/, '')}
            </span>
          </div>

          {/* Insight C */}
          {insightC && (
            <div className="flex items-start gap-3.5">
              <span className="text-lg shrink-0 select-none">🏆</span>
              <span className="text-sm font-medium text-slate-700 leading-relaxed">
                {insightC.replace(/^🏆\s*/, '')}
              </span>
            </div>
          )}
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
            {totalWinsInArchive > 0 && (
              <span className="text-[10px] bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Star size={10} fill="currentColor" />
                Momentum Active
              </span>
            )}
          </div>

          {totalWinsInArchive > 0 ? (
            <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
              {sortedDates.map((dateStr) => {
                const dayWins = winsArchive[dateStr] || [];
                if (dayWins.length === 0) return null;
                return (
                  <div key={dateStr} className="space-y-2">
                    <h4 className="text-[11px] font-bold text-purple-950 font-sans tracking-tight sticky top-0 bg-purple-50/90 backdrop-blur-md py-1 px-2.5 rounded-lg border border-purple-100/40 inline-block">
                      {getDayLabel(dateStr)}
                    </h4>
                    <div className="space-y-2.5">
                      {dayWins.map((win, index) => (
                        <motion.div 
                          key={win.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 border border-purple-50/40 hover:border-purple-200 transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs border border-emerald-100 shrink-0 font-bold">
                              ✓
                            </span>
                            <span className="text-xs md:text-sm font-semibold text-slate-700 font-sans leading-relaxed">{win.text}</span>
                          </div>
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-mono font-black scale-95 shrink-0">
                            +15 Dopamine
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
