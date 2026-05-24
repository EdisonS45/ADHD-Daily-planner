import React from 'react';
import { Routine } from '../types';
import { Check, Flame, Smile, Trash2 } from 'lucide-react';

interface RoutinesProps {
  routines: Routine[];
  onToggleRoutine: (id: string) => void;
  onAddRoutine: (label: string, frequencyType: 'morning' | 'afternoon' | 'anytime', icon: string) => void;
  onDeleteRoutine: (id: string) => void;
  onEditRoutine: (id: string, updatedLabel: string) => void;
}

export default function Routines({ 
  routines, 
  onToggleRoutine, 
  onAddRoutine, 
  onDeleteRoutine, 
  onEditRoutine 
}: RoutinesProps) {
  const morningRoutines = routines.filter(r => r.frequencyType === 'morning');
  const afternoonRoutines = routines.filter(r => r.frequencyType === 'afternoon');
  const anywhereRoutines = routines.filter(r => r.frequencyType === 'anytime');

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'water': return '💧';
      case 'meds': return '💊';
      case 'sun': return '☀️';
      case 'stretch': return '🧘';
      case 'tidy': return '🧹';
      case 'review': return '🔬';
      default: return '✅';
    }
  };

  const renderSection = (title: string, list: Routine[], subtitle: string, bgClass: string, textAccentClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className={`p-6 rounded-[28px] border border-white/80 bg-white/35 backdrop-blur-xl shadow-md shadow-purple-900/5 transition duration-300 flex flex-col justify-between`}>
        <div>
          <div className="mb-4">
            <h3 className={`text-base font-bold flex items-center gap-2 ${textAccentClass}`}>
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>

          <div className="space-y-2.5">
            {list.map((routine) => (
              <div
                key={routine.id}
                onClick={() => onToggleRoutine(routine.id)}
                className="flex items-center justify-between p-4 rounded-2xl bg-white/65 hover:bg-white border border-purple-50/40 hover:border-purple-200 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-50/80 border border-slate-100/50 flex items-center justify-center text-lg flex-shrink-0 font-sans select-none shadow-xs">
                  {getIcon(routine.icon)}
                </div>
                <div className="flex-1 min-w-[140px] mx-3 select-none text-left">
                  <span className={`text-[13px] sm:text-[13.5px] font-bold transition block leading-snug tracking-tight break-words whitespace-normal ${
                    routine.completed 
                      ? 'text-slate-400/80 line-through opacity-70 font-medium' 
                      : 'text-slate-800'
                  }`}>
                    {routine.label}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteRoutine(routine.id);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
                    title="Delete routine"
                  >
                    <Trash2 size={12} />
                  </button>

                  <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center border transition flex-shrink-0 ${
                    routine.completed 
                      ? 'bg-[#6D21A8] border-[#6D21A8] text-white shadow-sm' 
                      : 'border-slate-200 group-hover:border-purple-400 text-transparent'
                  }`}>
                    <Check size={12} strokeWidth={3} className={routine.completed ? "block" : "hidden group-hover:block group-hover:text-slate-300"} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const totalPoints = routines.filter(r => r.completed).length * 10;

  return (
    <div className="space-y-6" id="routines-view">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-purple-950 tracking-tight font-sans">
            Supportive Routines
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed font-sans font-medium">
            Zero pressure. Just supportive physical adjustments to preserve energy, hydrate, and maintain focus flow.
          </p>
        </div>

        {totalPoints > 0 && (
          <div className="px-4 py-2 bg-purple-100 text-purple-700 border border-purple-200/50 rounded-xl text-xs font-bold flex items-center gap-2 self-start sm:self-auto shadow-sm">
            <Flame size={15} className="text-purple-600 animate-bounce" />
            Routines: +{totalPoints} Dopamine pts today
          </div>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 min-[1500px]:grid-cols-3">
        {renderSection(
          "☀ Sunrise Adjust",
          morningRoutines,
          "Kickstart momentum quietly",
          "bg-amber-50/20",
          "text-amber-800"
        )}

        {renderSection(
          "🌙 Afternoon Tune-ups",
          afternoonRoutines,
          "Prevent sensory burnout",
          "bg-indigo-50/20",
          "text-indigo-900"
        )}

        {renderSection(
          "🌱 Core Anytime Check-ins",
          anywhereRoutines,
          "Whenever your battery feels low",
          "bg-emerald-50/20",
          "text-emerald-900"
        )}
      </div>

      <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/80 shadow-md space-y-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 font-mono block">Add a custom routine</span>
        <AddRoutineForm onAdd={onAddRoutine} />
      </div>

      <div className="p-6 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/80 shadow-md shadow-purple-900/5 flex items-start gap-4">
        <Smile size={24} className="text-purple-600 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-800 font-sans">You don't need absolute perfection</h4>
          <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
            ADHD routines can be messy, and that is absolutely fine. If you miss days, there is zero penalty, zero guilt. Every single checkbox you complete is a total victory for your nervous system.
          </p>
        </div>
      </div>
    </div>
  );
}

function AddRoutineForm({ onAdd }: { onAdd: RoutinesProps['onAddRoutine'] }) {
  const [label, setLabel] = React.useState('');
  const [freq, setFreq] = React.useState<'morning' | 'afternoon' | 'anytime'>('morning');
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="e.g. Evening walk, Take vitamins..."
        className="flex-1 px-4 py-2.5 rounded-xl border border-purple-100 text-sm bg-white/60 focus:outline-none focus:border-purple-400 text-slate-800 placeholder-slate-400 font-sans"
      />
      <select
        value={freq}
        onChange={e => setFreq(e.target.value as any)}
        className="px-3 py-2.5 rounded-xl border border-purple-100 text-xs bg-white/60 focus:outline-none text-slate-700 cursor-pointer font-sans"
      >
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="anytime">Anytime</option>
      </select>
      <button
        type="button"
        onClick={() => { if (label.trim()) { onAdd(label.trim(), freq, 'sun'); setLabel(''); } }}
        className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer transition font-sans"
      >
        Add
      </button>
    </div>
  );
}
