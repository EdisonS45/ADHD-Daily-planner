import React, { useState, useEffect } from 'react';
import { Task, Routine, AppState, WinRecord, WinsArchive } from './types';
import StartHere from './components/StartHere';
import BrainDump from './components/BrainDump';
import FocusMode from './components/FocusMode';
import Routines from './components/Routines';
import WinsMomentum from './components/WinsMomentum';
import { 
  Sparkles, CheckCircle, Circle, Flame, AlertCircle, Plus, 
  Trash2, BrainCircuit, Play, Zap, RefreshCw, Layers, Grid,
  User, Check, Compass, Sun, EyeOff, LayoutTemplate, Coffee, AlertOctagon, HelpCircle, Award, HelpCircle as HelpIcon,
  X, CheckSquare, Dumbbell, Activity, ShieldCheck, HeartPulse, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage, checkAndResetRoutinesIfNewDay } from './lib/storage';

const DEFAULT_TASKS: Task[] = [
  { id: '1', text: 'Drink a cold glass of water', category: 'tiny-win', energyLevel: 'low', completed: false, createdAt: new Date().toISOString() },
  { id: '2', text: 'Step outside for 2 minutes of direct daylight', category: 'recovery', energyLevel: 'low', completed: false, createdAt: new Date().toISOString() },
  { id: '3', text: 'Outline the core features for FocusFlow app', category: 'deep-focus', energyLevel: 'deep', completed: false, createdAt: new Date().toISOString() },
  { id: '4', text: 'Review feedback from UX specialist', category: 'admin', energyLevel: 'medium', completed: false, createdAt: new Date().toISOString() },
  { id: '5', text: 'Put desktop items away in drawers', category: 'admin', energyLevel: 'low', completed: false, createdAt: new Date().toISOString() }
];

const DEFAULT_ROUTINES: Routine[] = [
  // Morning
  { id: 'r1', label: 'Hydrate (Full glass of water)', completed: false, frequencyType: 'morning', icon: 'water' },
  { id: 'r2', label: 'Take daily medication/supplements', completed: false, frequencyType: 'morning', icon: 'meds' },
  { id: 'r3', label: 'Morning sunlight exposure (2 minutes)', completed: false, frequencyType: 'morning', icon: 'sun' },
  // Afternoon
  { id: 'r4', label: 'Stretch lower-back/shoulders', completed: false, frequencyType: 'afternoon', icon: 'stretch' },
  { id: 'r5', label: 'Sanitation / declutter desk surface', completed: false, frequencyType: 'afternoon', icon: 'tidy' },
  { id: 'r6', label: 'Rest eyes / 5-min breathing pause', completed: false, frequencyType: 'afternoon', icon: 'review' }
];

const ADHD_INSIGHTS = [
  "Action cures paralysis: Pick a task and commit to doing it for just 60 seconds.",
  "Dopamine trick: Put on some familiar upbeat music or brown noise to block background sounds.",
  "Your brain has different batteries. If focus is low, work strictly on 'Tiny Wins'.",
  "If a task is scary, rewrite it into something silly: Instead of 'Clean room', do 'Pick up 3 socks'.",
  "Consistency isn't doing it every day. It's returning to it whenever you're ready.",
  "There is zero shame in having a chaotic desk or mind. You are navigating life at your own pace."
];

const CATEGORY_OPTIONS = [
  { val: 'tiny-win', label: 'Tiny Win', icon: '🌸', desc: 'Dopamine builder' },
  { val: 'deep-focus', label: 'Needs concentration', icon: '🧠', desc: 'Important focus' },
  { val: 'admin', label: 'Life admin', icon: '💼', desc: 'Tasks & chores' },
  { val: 'recovery', label: 'Reset / Recovery', icon: '🌱', desc: 'Self-care step' },
  { val: 'routine', label: 'Gentle Routine', icon: '☀️', desc: 'Habit builder' }
];

const ENERGY_OPTIONS = [
  { val: 'low', label: 'Low Energy', icon: '⚡', desc: 'Gentle pace' },
  { val: 'medium', label: 'Medium Energy', icon: '⚡⚡', desc: 'Moderate focus' },
  { val: 'deep', label: 'High Energy', icon: '⚡⚡⚡', desc: 'Deep concentration' }
];

export default function App() {
  // Load tasks and routines and preferences from local storage safely
  const [tasks, setTasks] = useState<Task[]>(() => {
    return storage.loadTasks(DEFAULT_TASKS);
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    return storage.loadRoutines(DEFAULT_ROUTINES);
  });

  const prefs = storage.loadPreferences();
  const [currentView, setCurrentView] = useState<'today' | 'focus' | 'brain-dump' | 'routines' | 'wins'>(prefs.currentView);
  const [isOverwhelmed, setIsOverwhelmed] = useState(prefs.isOverwhelmed);
  const [energyLevel, setEnergyLevel] = useState<'all' | 'low' | 'medium' | 'deep'>(prefs.energyLevel);
  
  // New task form fields (Redesigned with progressive disclosure)
  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<'tiny-win' | 'deep-focus' | 'admin' | 'recovery' | 'routine'>('tiny-win');
  const [newEnergy, setNewEnergy] = useState<'low' | 'medium' | 'deep'>('medium');
  const [isTaskEntryExpanded, setIsTaskEntryExpanded] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isEnergyDropdownOpen, setIsEnergyDropdownOpen] = useState(false);

  const selectedCat = CATEGORY_OPTIONS.find(c => c.val === newCategory) || CATEGORY_OPTIONS[0];
  const selectedEnergy = ENERGY_OPTIONS.find(e => e.val === newEnergy) || ENERGY_OPTIONS[0];
  
  // Quick Add Bottom Sheet Dialog State (Frictionless mind unloading overlay)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [quickAddCategory, setQuickAddCategory] = useState<'tiny-win' | 'deep-focus' | 'admin' | 'recovery' | 'routine'>('tiny-win');
  const [quickAddEnergy, setQuickAddEnergy] = useState<'low' | 'medium' | 'deep'>('medium');

  // Contextual Onboarding Clarity Switch
  const [showOnboarding, setShowOnboarding] = useState(prefs.showOnboarding);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [userName, setUserName] = useState<string>(() => storage.loadUserName() || '');
  const [onboardingName, setOnboardingName] = useState('');
  const [planningTime, setPlanningTime] = useState<'morning' | 'afternoon' | 'evening'>(() => storage.loadUserPlanningTime() || 'morning');
  const [onboardingPlanningTime, setOnboardingPlanningTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [winsArchive, setWinsArchive] = useState<WinsArchive>(() => storage.loadWinsArchive());
  const [isCarryForwardOpen, setIsCarryForwardOpen] = useState(false);
  
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const [currentInsightIdx, setCurrentInsightIdx] = useState(0);

  // Active micro particle celebrations or message
  const [lastCompletedTaskName, setLastCompletedTaskName] = useState<string | null>(null);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
  };

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddText.trim()) return;

    const taskItem: Task = {
      id: Date.now().toString(),
      text: quickAddText.trim(),
      category: quickAddCategory,
      energyLevel: quickAddEnergy,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [taskItem, ...prev]);
    setQuickAddText('');
    setIsQuickAddOpen(false);
  };

  // Customizable routines operations
  const handleAddRoutine = (label: string, frequencyType: 'morning' | 'afternoon' | 'anytime', icon: string) => {
    const freshRoutine: Routine = {
      id: 'routine_' + Date.now(),
      label,
      completed: false,
      frequencyType,
      icon,
    };
    setRoutines(prev => [...prev, freshRoutine]);
  };

  const handleDeleteRoutine = (id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  };

  const handleEditRoutine = (id: string, updatedLabel: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, label: updatedLabel } : r));
  };

  useEffect(() => {
    const reset = checkAndResetRoutinesIfNewDay(routines, storage.saveRoutines);
    if (reset !== routines) setRoutines(reset);
  }, []);

  // Sync state changes with localStorage instantly (Auto-save)
  useEffect(() => {
    storage.saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    storage.saveRoutines(routines);
  }, [routines]);

  useEffect(() => {
    storage.savePreferences({
      isOverwhelmed,
      currentView,
      showOnboarding,
      energyLevel,
    });
  }, [isOverwhelmed, currentView, showOnboarding, energyLevel]);

  // Rotate random sanity tips periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsightIdx((prev) => (prev + 1) % ADHD_INSIGHTS.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Filter tasks based on Overwhelm Reset and Energy choice
  const getFilteredTasks = () => {
    let uncompleted = tasks.filter(t => !t.completed);
    if (isOverwhelmed) {
      // Limit to max 1-3 tiny-win/recovery tasks to prevent visual and choice overload
      const pool = uncompleted.filter(t => t.category === 'tiny-win' || t.category === 'recovery');
      uncompleted = pool.length > 0 ? pool.slice(0, 3) : uncompleted.slice(0, 3);
    } else if (energyLevel !== 'all') {
      uncompleted = uncompleted.filter(t => t.energyLevel === energyLevel);
    }
    return uncompleted;
  };

  // Partition filtered tasks into today and carryForward specifically for Today action board
  const getPartitionedTasks = () => {
    const uncompleted = getFilteredTasks();
    const todayStr = new Date().toISOString().split('T')[0];
    const today: Task[] = [];
    const carryForward: Task[] = [];

    uncompleted.forEach(task => {
      const taskDate = task.createdAt ? task.createdAt.substring(0, 10) : '';
      if (taskDate === todayStr) {
        today.push(task);
      } else {
        carryForward.push(task);
      }
    });

    return { today, carryForward };
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    const taskItem: Task = {
      id: Date.now().toString(),
      text: newText.trim(),
      category: newCategory,
      energyLevel: newEnergy,
      completed: false,
      createdAt: new Date().toISOString()
    };

    setTasks(prev => [taskItem, ...prev]);
    setNewText('');
  };

  const handleAddTasksFromDump = (newItems: Omit<Task, 'id' | 'completed' | 'createdAt'>[]) => {
    const mapped = newItems.map((item, idx) => ({
      ...item,
      id: (Date.now() + idx).toString(),
      completed: false,
      createdAt: new Date().toISOString()
    }));
    setTasks(prev => [...mapped, ...prev]);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          setLastCompletedTaskName(t.text);
          // Auto clear the celebration bubble after 4 seconds
          setTimeout(() => {
            setLastCompletedTaskName(null);
          }, 4000);

          // Append to archive
          const win: WinRecord = {
            id: t.id,
            text: t.text,
            category: t.category,
            energyLevel: t.energyLevel,
            completedAt: new Date().toISOString()
          };
          storage.appendWinToArchive(win);
          setWinsArchive(storage.loadWinsArchive());
        }
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined
        };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (activeFocusTask?.id === id) {
      setActiveFocusTask(null);
    }
  };

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => {
      if (r.id === id) {
        return { ...r, completed: !r.completed };
      }
      return r;
    }));
  };

  const startFocusOnTask = (task: Task) => {
    setActiveFocusTask(task);
    setCurrentView('focus');
  };

  const finishFocusSession = (taskId: string, durationSeconds: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        // Append to archive first
        const win: WinRecord = {
          id: t.id,
          text: t.text,
          category: t.category,
          energyLevel: t.energyLevel,
          completedAt: new Date().toISOString()
        };
        storage.appendWinToArchive(win);
        setWinsArchive(storage.loadWinsArchive());

        return {
          ...t,
          completed: true,
          completedAt: new Date().toISOString(),
          durationSeconds: (t.durationSeconds || 0) + durationSeconds
        };
      }
      return t;
    }));
    setActiveFocusTask(null);
    setCurrentView('wins');
  };

  const clearCompletedTasks = () => {
    // Append all currently completed tasks to the archive if not already archived
    const completed = tasks.filter(t => t.completed);
    completed.forEach(t => {
      const win: WinRecord = {
        id: t.id,
        text: t.text,
        category: t.category,
        energyLevel: t.energyLevel,
        completedAt: t.completedAt || new Date().toISOString()
      };
      storage.appendWinToArchive(win);
    });
    setWinsArchive(storage.loadWinsArchive());
    setTasks(prev => prev.filter(t => !t.completed));
  };

  // Overwhelm text messaging
  const overwhelmMessage = isOverwhelmed 
    ? "Let's shrink the noise. You do not need to do everything right now. Focus only on these 1-3 tiny steps."
    : "Feeling scattered? Let's hide the noise instantly.";

  const getCategoryBadge = (category: Task['category']) => {
    switch (category) {
      case 'tiny-win':
        return { label: 'Tiny Win', class: 'bg-emerald-50 text-emerald-600 border border-emerald-100' };
      case 'deep-focus':
        return { label: 'Needs full concentration', class: 'bg-purple-50 text-purple-700 border border-purple-100' };
      case 'recovery':
        return { label: 'Reset / Recovery', class: 'bg-amber-55 text-amber-600 border border-amber-100' };
      case 'routine':
        return { label: 'Gentle Routine', class: 'bg-[#F2EDFF]/80 text-purple-600 border border-purple-100' };
      case 'admin':
      default:
        return { label: 'Life admin', class: 'bg-slate-100 text-slate-700 border border-slate-200' };
    }
  };

  const dopaminePoints = tasks.filter(t => t.completed).length * 15 + routines.filter(r => r.completed).length * 10;

  return (
    <div className={`min-h-screen flex flex-col justify-between overflow-x-hidden transition-all duration-700 font-sans relative bg-gradient-to-br ${
      isOverwhelmed 
        ? 'from-[#FFF8F2] via-[#FFFDFB] to-[#F3E5D8]' // Calming peach warm cream mode
        : 'from-[#F8F7FF] via-[#FDFDFF] to-[#ECE9FF]' // Beautiful soft lavender gradient
    }`}>
      
      {/* Decorative calm background gradients & glass lights */}
      <div className="absolute top-[-10%] left-[-20%] w-[65%] h-[55%] bg-purple-300/10 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse duration-[10000ms]"></div>
      <div className="absolute top-[25%] right-[-20%] w-[55%] h-[65%] bg-indigo-300/10 rounded-full blur-[160px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[25%] w-[45%] h-[45%] bg-rose-200/5 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>

      {/* Main Container */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:py-8 flex-1 flex flex-col justify-between">
        
        {/* Top Header Row with Frosted Backdrop Glass - hidden in Overwheelmed Mode to protect sensory fields */}
        {!isOverwhelmed && (
          <header className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 mb-8 rounded-[28px] bg-white/40 backdrop-blur-xl border border-white/80 shadow-md shadow-purple-900/5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
                <Sparkles size={22} fill="white" className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-1.5 font-sans">
                  FocusFlow
                </h1>
                <p className="text-[10px] text-purple-650 font-mono tracking-widest uppercase font-bold">ADHD Cognitive Workspace</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Overwhelm Toggle Button */}
              <button
                onClick={() => setIsOverwhelmed(!isOverwhelmed)}
                aria-label={isOverwhelmed ? "Exit overwhelmed mode" : "Activate overwhelmed mode"}
                aria-pressed={isOverwhelmed}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-bold tracking-wider transition-all duration-500 cursor-pointer shadow-sm ${
                  isOverwhelmed 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200 shadow-md shadow-rose-200/20' 
                    : 'bg-white/70 backdrop-blur-md border border-rose-100 hover:border-rose-200 text-rose-600 hover:bg-rose-50'
                }`}
              >
                <AlertOctagon size={14} className={isOverwhelmed ? "text-rose-700 animate-pulse" : ""} />
                {isOverwhelmed ? "ACTIVE: NOISE DISMISSED" : "I'M OVERWHELMED"}
              </button>

              {/* Dynamic Status Indicator Badge */}
              <span className="hidden md:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-[10px] uppercase font-bold tracking-widest bg-white/60 backdrop-blur-md text-slate-500 border border-white/80">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  dopaminePoints === 0 && routines.filter(r => r.completed).length === 0 ? 'bg-slate-400' :
                  dopaminePoints > 0 && dopaminePoints < 30 ? 'bg-amber-400' :
                  dopaminePoints >= 30 && dopaminePoints < 75 ? 'bg-emerald-400' : 'bg-purple-500'
                }`}></span>
                {
                  dopaminePoints === 0 && routines.filter(r => r.completed).length === 0 ? 'Ready to begin' :
                  dopaminePoints > 0 && dopaminePoints < 30 ? 'Momentum building' :
                  dopaminePoints >= 30 && dopaminePoints < 75 ? 'Flow active' : 'Peak momentum'
                }
              </span>
            </div>
          </header>
        )}

        {/* Dynamic Layout Engine */}
        <AnimatePresence mode="wait">
          {isOverwhelmed ? (
            /* ========================================================================= */
            /* 1. OVERWHELM MODE: TRUE COGNITIVE EXHALE WORKSPACE                        */
            /* ========================================================================= */
            <motion.div
              key="overwhelmed-slate"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="max-w-2xl mx-auto py-16 md:py-24 text-center space-y-12 relative"
            >
              {/* Soft breathing pulse for sensory alignment */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none -z-10 overflow-hidden">
                <motion.div
                  animate={{
                    scale: [0.85, 1.15, 0.85],
                    opacity: [0.12, 0.32, 0.12],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="w-full h-full rounded-full bg-gradient-to-tr from-[#FFF0E2] to-[#FFD5B2] blur-3xl opacity-20"
                />
              </div>

              <div className="space-y-4">
                <span className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-700 bg-orange-100/60 border border-orange-200/50 font-mono">
                  🌸 Sensory Break Active
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight font-sans">
                  Simplicity retrieved.
                </h2>
                <p className="text-[#847895] max-w-md mx-auto text-sm md:text-base leading-relaxed font-sans font-medium">
                  We've cleared everything to let you quiet your mind. Focus only on one tiny step. No pressure, no guilt.
                </p>
              </div>

              {/* Minimalist Confirmed Task List */}
              <div className="space-y-4 max-w-lg mx-auto">
                {getFilteredTasks().length > 0 ? (
                  getFilteredTasks().map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-8 bg-white/70 backdrop-blur-xl border border-orange-100/50 rounded-[32px] text-left flex items-center justify-between gap-6 group hover:border-[#FFD500] hover:bg-white transition-all duration-300 shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleTaskCompletion(task.id)}
                          className="w-8 h-8 rounded-full border-2 border-orange-200 hover:border-emerald-500 bg-white hover:bg-[#FFFDFB] flex items-center justify-center cursor-pointer transition-all shrink-0 group"
                        >
                          <Check size={16} strokeWidth={3} className="text-emerald-600 hidden group-hover:block" />
                        </button>
                        <span className="text-lg font-bold text-slate-800 leading-snug font-sans">
                          {task.text}
                        </span>
                      </div>
                      <span className={`text-[9px] uppercase font-bold tracking-wider px-3 py-1 rounded-full font-mono shrink-0 select-none ${
                        getCategoryBadge(task.category).class
                      }`}>
                        {getCategoryBadge(task.category).label}
                      </span>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 bg-white/60 backdrop-blur-xl rounded-[32px] border border-orange-100/40 text-slate-600 text-sm font-sans font-semibold">
                    Unbelievable. Your slate is completely cleared. Take some slow, calm breaths.
                  </div>
                )}
              </div>

              {/* Tranquil Restorer */}
              <div className="pt-6">
                <button
                  onClick={() => setIsOverwhelmed(false)}
                  className="px-8 py-4 rounded-2xl bg-[#5C4D6B] hover:bg-purple-950 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#5C4D6B]/15 hover:shadow-purple-950/20 transition-all duration-300 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  Restore Workspace Options
                </button>
              </div>
            </motion.div>
          ) : (
            /* ========================================================================= */
            /* 2. REGULAR DESKTOP GRID & MOBILE TABS SECTIONS                            */
            /* ========================================================================= */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* 1. LEFT SIDEBAR (Frosted Backdrop Glass - Hidden on mobile) */}
              <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-8 lg:max-h-[calc(100vh-120px)] overflow-y-auto pr-1 hidden lg:block">
                <div className="p-5 bg-white/40 backdrop-blur-xl rounded-[32px] border border-purple-100/60 shadow-lg shadow-purple-900/5 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 font-mono px-3 block mb-2 font-black">Attention Nodes</span>
                  
                  <button
                    onClick={() => { setCurrentView('today'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      currentView === 'today'
                        ? 'bg-purple-100/50 border border-purple-200/20 text-purple-800'
                        : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <LayoutTemplate size={16} className={currentView === 'today' ? 'text-purple-700' : 'text-slate-400'} />
                      <span>Today's Strategy</span>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/80 text-purple-500 font-mono font-bold shadow-sm border border-purple-100/30">
                      {tasks.filter(t => !t.completed).length}
                    </span>
                  </button>

                  <button
                    onClick={() => { setCurrentView('focus'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      currentView === 'focus'
                        ? 'bg-purple-100/50 border border-purple-200/20 text-purple-800'
                        : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Flame size={16} className={currentView === 'focus' ? 'text-purple-700' : 'text-slate-400'} />
                      <span>Focus Workspace</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setCurrentView('brain-dump'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      currentView === 'brain-dump'
                        ? 'bg-purple-100/50 border border-purple-200/20 text-purple-800'
                        : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BrainCircuit size={16} className={currentView === 'brain-dump' ? 'text-purple-700' : 'text-slate-400'} />
                      <span>Cognitive Dump</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setCurrentView('routines'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      currentView === 'routines'
                        ? 'bg-purple-100/50 border border-purple-200/20 text-purple-800'
                        : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle size={16} className={currentView === 'routines' ? 'text-purple-700' : 'text-slate-400'} />
                      <span>Supportive Reset</span>
                    </div>
                  </button>

                  <button
                    onClick={() => { setCurrentView('wins'); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer ${
                      currentView === 'wins'
                        ? 'bg-purple-100/50 border border-purple-200/20 text-purple-800'
                        : 'text-slate-500 hover:text-purple-800 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Award size={16} className={currentView === 'wins' ? 'text-purple-700' : 'text-slate-400'} />
                      <span>Your Milestones</span>
                    </div>
                  </button>
                </div>

                {/* Overwhelm activation shortcut */}
                <div className="p-5 rounded-[32px] bg-rose-50/60 backdrop-blur-xl border border-rose-100 flex flex-col justify-between gap-3 text-rose-900 shadow-sm">
                  <span className="text-xs font-semibold leading-relaxed font-sans">
                    Feeling scattered? Let's clear options instantly.
                  </span>
                  <button
                    onClick={() => setIsOverwhelmed(true)}
                    className="px-3 py-1.5 transition rounded-xl text-[11px] font-bold tracking-wide cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Collapse Noise Now
                  </button>
                </div>
              </aside>

              {/* 2. CENTER SCREEN (Active modules - col-span-12 on mobile, col-span-6 on desktop) */}
              <main className="col-span-12 lg:col-span-6 space-y-8">
                <AnimatePresence mode="wait">
                  {currentView === 'today' && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                  {/* Time-Aware and Personalised Dashboard Title & Subtitle */}
                  <div className="flex flex-col gap-1">
                    {(() => {
                      if (!userName.trim()) {
                        return (
                          <>
                            <h2 className="text-2xl font-black text-purple-950 tracking-tight font-sans">
                              One step at a time.
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold font-sans">Momentum follows action. Start gentle.</p>
                          </>
                        );
                      }

                      const hrs = new Date().getHours();
                      let timeGreeting = "Good morning";
                      if (hrs >= 12 && hrs < 17) {
                        timeGreeting = "Good afternoon";
                      } else if (hrs >= 17) {
                        timeGreeting = "Good evening";
                      }

                      const formattedDate = new Date().toLocaleDateString(undefined, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      });

                      let subtitle = "Your day is wide open. Start with one small thing.";
                      if (planningTime === 'afternoon') {
                        subtitle = "Picking up mid-day. That's perfectly fine.";
                      } else if (planningTime === 'evening') {
                        subtitle = "Evening check-in. Let's close the day gently.";
                      }

                      return (
                        <>
                          <h2 className="text-2xl font-black text-purple-950 tracking-tight font-sans">
                            {timeGreeting}, {userName}.
                          </h2>
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-slate-400 capitalize">
                            <span>{formattedDate}</span>
                          </div>
                          <p className="text-xs text-slate-500 font-semibold font-sans mt-0.5">{subtitle}</p>
                        </>
                      );
                    })()}
                  </div>

                  {/* START HERE recommendation module */}
                  <StartHere
                    tasks={tasks}
                    energyLevel={energyLevel}
                    onComplete={toggleTaskCompletion}
                    onStartFocus={startFocusOnTask}
                    onSetEnergy={setEnergyLevel}
                  />

                  {/* Tasks management dashboard with exquisite glassmorphism */}
                  <div className="p-6 md:p-8 rounded-[32px] bg-white/40 backdrop-blur-xl border border-white/85 shadow-lg shadow-purple-900/5 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 tracking-tight font-sans">
                          {isOverwhelmed ? "Safe Action Items" : "Current Goals Today"}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Press checkbox to finish, or click Focus to start distraction cycle</p>
                      </div>

                      {/* Quick action button to clear finished */}
                      {tasks.some(t => t.completed) && (
                        <button
                          onClick={clearCompletedTasks}
                          className="text-xs text-slate-600 hover:text-purple-700 font-bold px-3 py-1.5 bg-white/85 border border-purple-100/50 rounded-xl cursor-pointer transition-all shadow-sm hover:border-purple-200"
                        >
                          Clear done tasks
                        </button>
                      )}
                    </div>

                    {/* Filter indicators with soft capsule buttons */}
                    {!isOverwhelmed && (
                      <div className="flex items-center gap-2 flex-wrap border-b border-purple-100/40 pb-4">
                        <span className="text-[10px] text-purple-450 font-mono text-purple-600 uppercase font-bold tracking-wider select-none mr-1.5">Energy Cycle:</span>
                        {(['all', 'low', 'medium', 'deep'] as const).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setEnergyLevel(lvl)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              energyLevel === lvl
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                : 'bg-white/60 hover:bg-white text-slate-500 border border-purple-100/30'
                            }`}
                          >
                            {lvl === 'all' ? 'All' : lvl === 'low' ? '⚡ Low' : lvl === 'medium' ? '⚡⚡ Med' : '⚡⚡⚡ Deep'}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Task list container */}
                    <div className="space-y-3">
                      {(() => {
                        const { today: todayTasks, carryForward: carryForwardTasks } = getPartitionedTasks();
                        return (
                          <>
                            {todayTasks.length > 0 ? (
                              todayTasks.map((task) => (
                          <motion.div
                            key={task.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-md hover:bg-white transition-all duration-300 rounded-2xl border border-white/90 shadow-xs hover:shadow-md hover:shadow-purple-900/5 group"
                          >
                            <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
                              <button
                                onClick={() => toggleTaskCompletion(task.id)}
                                aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                                aria-pressed={task.completed}
                                className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${
                                  task.completed
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                                    : 'border-slate-300 hover:border-purple-500 text-transparent hover:bg-purple-50/30'
                                }`}
                              >
                                <Check size={13} strokeWidth={3.5} className={task.completed ? "block" : "hidden"} />
                              </button>

                              <span className={`text-[13px] md:text-sm font-semibold transition duration-300 font-sans leading-relaxed truncate ${
                                task.completed ? 'text-slate-400 line-through font-medium' : 'text-slate-850'
                              }`}>
                                {task.text}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                task.category === 'tiny-win' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                task.category === 'deep-focus' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                task.category === 'recovery' ? 'bg-amber-50 text-amber-700 border border-[#FFE7C4]' :
                                task.category === 'routine' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                                'bg-[#F2EDFF]/60 border border-purple-100 text-purple-650 text-purple-600'
                              }`}>
                                {task.category === 'tiny-win' ? '🌸 Tiny Win' : 
                                 task.category === 'deep-focus' ? '🧠 Focus' : 
                                 task.category === 'recovery' ? '🌱 Reset' : 
                                 task.category === 'routine' ? '☀️ Routine' : 'Life admin'}
                              </span>

                              <span className="hidden md:inline-block text-[10px] text-slate-400 font-bold px-1 font-sans">
                                {task.energyLevel === 'low' ? '⚡ Low' : task.energyLevel === 'medium' ? '⚡⚡ Med' : '⚡⚡⚡ High'}
                              </span>

                              {!task.completed && (
                                <button
                                  onClick={() => startFocusOnTask(task)}
                                  aria-label={`Start focus session for: ${task.text}`}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-600/95 border border-purple-100/70 hover:border-purple-600 transition-all duration-300 text-xs font-semibold cursor-pointer shadow-sm"
                                >
                                  <Play size={10} fill="currentColor" />
                                  Focus
                                </button>
                              )}

                              <button
                                onClick={() => deleteTask(task.id)}
                                aria-label={`Delete task: ${task.text}`}
                                className="p-1.5 rounded-xl text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
                                title="Dismiss thought"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </motion.div>
                              ))
                            ) : (
                              <div className="py-14 text-center text-slate-400 text-xs font-semibold max-w-sm mx-auto font-sans">
                                {energyLevel !== 'all' 
                                  ? `No tasks match the selected energy level right now. Shifting parameters is a great self-care choice!`
                                  : `Your action list today is clean and open. Drop in a quiet thought or gentle routine step whenever you are ready.`}
                              </div>
                            )}

                            {carryForwardTasks.length > 0 && (
                              <div className="mt-6 border-t border-purple-100/40 pt-5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => setIsCarryForwardOpen(!isCarryForwardOpen)}
                                  className="flex items-center justify-between w-full py-2 px-3 rounded-xl hover:bg-purple-50/50 transition duration-200 text-left cursor-pointer group"
                                >
                                  <span className="text-xs font-bold text-slate-400 group-hover:text-purple-650 transition">
                                    Carried forward from earlier — {carryForwardTasks.length} {carryForwardTasks.length === 1 ? 'item' : 'items'}
                                  </span>
                                  <span className="text-xs text-slate-400 font-bold group-hover:text-purple-650 transition">
                                    {isCarryForwardOpen ? '▲ Hide' : '▼ Show'}
                                  </span>
                                </button>
                                
                                {isCarryForwardOpen && (
                                  <div className="space-y-3 mt-3.5">
                                    {carryForwardTasks.map((task) => (
                                      <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-center justify-between p-4 bg-white/75 backdrop-blur-md hover:bg-white transition-all duration-300 rounded-2xl border border-white/90 shadow-xs hover:shadow-md hover:shadow-purple-900/5 group"
                                      >
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0 mr-3">
                                          <button
                                            onClick={() => toggleTaskCompletion(task.id)}
                                            aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
                                            aria-pressed={task.completed}
                                            className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center cursor-pointer ${
                                              task.completed
                                                ? 'border-emerald-500 bg-emerald-500 text-white shadow-xs'
                                                : 'border-slate-300 hover:border-purple-500 text-transparent hover:bg-purple-50/30'
                                            }`}
                                          >
                                            <Check size={13} strokeWidth={3.5} className={task.completed ? "block" : "hidden"} />
                                          </button>

                                          <span className={`text-[13px] md:text-sm font-semibold transition duration-300 font-sans leading-relaxed truncate ${
                                            task.completed ? 'text-slate-400 line-through font-medium' : 'text-slate-850'
                                          }`}>
                                            {task.text}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                                            task.category === 'tiny-win' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            task.category === 'deep-focus' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                            task.category === 'recovery' ? 'bg-amber-50 text-amber-700 border border-[#FFE7C4]' :
                                            task.category === 'routine' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                                            'bg-[#F2EDFF]/60 border border-purple-100 text-purple-650 text-purple-600'
                                          }`}>
                                            {task.category === 'tiny-win' ? '🌸 Tiny Win' : 
                                             task.category === 'deep-focus' ? '🧠 Focus' : 
                                             task.category === 'recovery' ? '🌱 Reset' : 
                                             task.category === 'routine' ? '☀️ Routine' : 'Life admin'}
                                          </span>

                                          <span className="hidden md:inline-block text-[10px] text-slate-400 font-bold px-1 font-sans">
                                            {task.energyLevel === 'low' ? '⚡ Low' : task.energyLevel === 'medium' ? '⚡⚡ Med' : '⚡⚡⚡ High'}
                                          </span>

                                          {!task.completed && (
                                            <button
                                              onClick={() => startFocusOnTask(task)}
                                              aria-label={`Start focus session for: ${task.text}`}
                                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-purple-650 hover:text-white bg-purple-50 hover:bg-purple-600/95 border border-purple-100/70 hover:border-purple-600 transition-all duration-300 text-xs font-semibold cursor-pointer shadow-sm"
                                            >
                                              <Play size={10} fill="currentColor" />
                                              Focus
                                            </button>
                                          )}

                                          <button
                                            onClick={() => deleteTask(task.id)}
                                            aria-label={`Delete task: ${task.text}`}
                                            className="p-1.5 rounded-xl text-slate-350 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200 cursor-pointer"
                                            title="Dismiss thought"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>

                     {/* Small form to manual drop task if not overwhelmed */}
                    {!isOverwhelmed && (
                       <form onSubmit={handleAddTask} className="pt-6 border-t border-purple-100/40 space-y-4 font-sans">
                         <div className="space-y-1">
                           <span className="text-[10px] uppercase font-bold tracking-wider text-purple-650 font-mono block">Unload mental pressure</span>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-2.5">
                           <input
                             type="text"
                             value={newText}
                             onChange={(e) => setNewText(e.target.value)}
                             placeholder="e.g. Sanitize physical desk, write 1 rough sentence..."
                             className="flex-1 px-4 py-3 rounded-2xl bg-purple-50/20 border border-purple-100 text-sm font-sans focus:outline-none focus:border-purple-400 focus:bg-white text-slate-800 placeholder-slate-400 shadow-inner transition-all"
                           />
                           <button
                             type="submit"
                             disabled={!newText.trim()}
                             className="px-6 py-3 rounded-2xl bg-[#6D21A8] disabled:bg-[#ECE6FF] disabled:text-purple-300 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-sm shadow-purple-600/10 hover:bg-purple-700 font-sans shrink-0"
                           >
                             Add Goal & Clear Mind
                           </button>
                         </div>

                         <div className="grid gap-4 sm:grid-cols-2 pt-2">
                           {/* Category Selector Dropdown */}
                           <div className="space-y-1.5 relative" id="cat-dropdown-field">
                             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">What type of task is this?</span>
                             
                             <div className="relative">
                               <button
                                 type="button"
                                 onClick={() => {
                                   setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                                   setIsEnergyDropdownOpen(false);
                                 }}
                                 className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/70 hover:bg-white border border-purple-100 text-xs font-semibold text-slate-800 transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200/40"
                               >
                                 <span className="flex items-center gap-2 truncate">
                                   <span className="text-sm shrink-0">{selectedCat.icon}</span>
                                   <span className="font-bold text-slate-850 truncate">{selectedCat.label}</span>
                                 </span>
                                 <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isCategoryDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                               </button>

                               <AnimatePresence>
                                 {isCategoryDropdownOpen && (
                                   <>
                                     <div className="fixed inset-0 z-40" onClick={() => setIsCategoryDropdownOpen(false)} />
                                     <motion.div
                                       initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                       transition={{ duration: 0.15 }}
                                       className="absolute left-0 right-0 mt-1.5 p-1 bg-white border border-purple-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto animate-none"
                                     >
                                       {CATEGORY_OPTIONS.map((opt) => (
                                         <button
                                           key={opt.val}
                                           type="button"
                                           onClick={() => {
                                             setNewCategory(opt.val as any);
                                             setIsCategoryDropdownOpen(false);
                                           }}
                                           className={`w-full flex flex-col px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                             newCategory === opt.val
                                               ? 'bg-[#F3EEFF] text-[#6D21A8]'
                                               : 'hover:bg-slate-50 text-slate-700'
                                           }`}
                                         >
                                           <div className="flex items-center gap-2">
                                             <span className="text-sm shrink-0 select-none">{opt.icon}</span>
                                             <span className={`text-[12px] font-bold truncate ${newCategory === opt.val ? 'text-purple-900 font-bold' : 'text-slate-800 font-semibold'}`}>
                                               {opt.label}
                                             </span>
                                           </div>
                                           <span className="text-[10px] text-slate-400 ml-6 tracking-tight leading-none font-medium mt-0.5 truncate">{opt.desc}</span>
                                         </button>
                                       ))}
                                     </motion.div>
                                   </>
                                 )}
                               </AnimatePresence>
                             </div>
                           </div>

                           {/* Energy Demand Dropdown */}
                           <div className="space-y-1.5 relative" id="energy-dropdown-field">
                             <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">How demanding will this feel?</span>
                             
                             <div className="relative">
                               <button
                                 type="button"
                                 onClick={() => {
                                   setIsEnergyDropdownOpen(!isEnergyDropdownOpen);
                                   setIsCategoryDropdownOpen(false);
                                 }}
                                 className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white/70 hover:bg-white border border-purple-100 text-xs font-semibold text-slate-800 transition-all duration-200 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200/40"
                               >
                                 <span className="flex items-center gap-2 truncate">
                                   <span className="text-sm shrink-0">{selectedEnergy.icon}</span>
                                   <span className="font-bold text-slate-850 truncate">{selectedEnergy.label}</span>
                                 </span>
                                 <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 shrink-0 ${isEnergyDropdownOpen ? 'rotate-180 text-purple-600' : ''}`} />
                               </button>

                               <AnimatePresence>
                                 {isEnergyDropdownOpen && (
                                   <>
                                     <div className="fixed inset-0 z-40" onClick={() => setIsEnergyDropdownOpen(false)} />
                                     <motion.div
                                       initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                       animate={{ opacity: 1, y: 0, scale: 1 }}
                                       exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                       transition={{ duration: 0.15 }}
                                       className="absolute left-0 right-0 mt-1.5 p-1 bg-white border border-purple-100 rounded-2xl shadow-xl z-50 animate-none"
                                     >
                                       {ENERGY_OPTIONS.map((opt) => (
                                         <button
                                           key={opt.val}
                                           type="button"
                                           onClick={() => {
                                             setNewEnergy(opt.val as any);
                                             setIsEnergyDropdownOpen(false);
                                           }}
                                           className={`w-full flex flex-col px-3.5 py-2 rounded-xl text-left transition-all cursor-pointer ${
                                             newEnergy === opt.val
                                               ? 'bg-[#F3EEFF] text-[#6D21A8]'
                                               : 'hover:bg-slate-50 text-slate-700'
                                           }`}
                                         >
                                           <div className="flex items-center gap-2">
                                             <span className="text-sm shrink-0 select-none">{opt.icon}</span>
                                             <span className={`text-[12px] font-bold truncate ${newEnergy === opt.val ? 'text-purple-900 font-bold' : 'text-slate-800 font-semibold'}`}>
                                               {opt.label}
                                             </span>
                                           </div>
                                           <span className="text-[10px] text-slate-400 ml-8 tracking-tight leading-none font-medium mt-0.5 truncate">{opt.desc}</span>
                                         </button>
                                       ))}
                                     </motion.div>
                                   </>
                                 )}
                               </AnimatePresence>
                             </div>
                           </div>
                         </div>
                       </form>
                     )}
                   </div>
                 </motion.div>
               )}
 
               {currentView === 'focus' && (
                 <FocusMode
                   activeTask={activeFocusTask}
                   onComplete={finishFocusSession}
                   onCancel={() => { setActiveFocusTask(null); setCurrentView('today'); }}
                 />
               )}
 
               {currentView === 'brain-dump' && (
                 <BrainDump onAddTasks={handleAddTasksFromDump} />
               )}
 
               {currentView === 'routines' && (
                 <Routines routines={routines}
                    onToggleRoutine={toggleRoutine}
                    onAddRoutine={handleAddRoutine}
                    onDeleteRoutine={handleDeleteRoutine}
                    onEditRoutine={handleEditRoutine} />
               )}
 
               {currentView === 'wins' && (
                 <WinsMomentum tasks={tasks} routines={routines} winsArchive={winsArchive} />
               )}
             </AnimatePresence>
           </main>
 
           {/* 3. RIGHT PANEL (Dynamic wellness workspace stats - hidden on mobile) */}
           <section className="lg:col-span-3 space-y-6 hidden lg:block">
             
             {/* Momentum Level Panel with glass */}
             <div className="p-6 bg-white/40 backdrop-blur-xl border border-white/80 shadow-md shadow-purple-900/5 rounded-[28px] space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 font-mono">Dopamine meter</span>
                 <span className="text-[9px] px-2.5 py-0.5 rounded-full bg-purple-50 text-[#6D21A8] font-mono font-bold uppercase tracking-wider">
                   {dopaminePoints < 30 ? '🌸 Gentle Start' : dopaminePoints < 60 ? '✨ Flow Active' : '🔥 Golden Momentum'}
                 </span>
               </div>
               
               <div className="space-y-1">
                 <div className="flex flex-col gap-1 w-full pb-1">
                   <div className="flex items-center justify-between text-xs font-sans font-medium">
                     <span className="text-[#5B21B6] font-bold">
                       {dopaminePoints === 0 ? '🍃 Resting Slate' :
                        dopaminePoints < 30 ? '🌱 Spark Lit' :
                        dopaminePoints < 60 ? '✨ Flow Active' :
                        dopaminePoints < 90 ? '🧠 Focus Stream' :
                        '🔥 Golden Flow'}
                     </span>
                     <span className="font-semibold font-mono text-purple-700 text-xs">
                       {dopaminePoints} pts
                     </span>
                   </div>
                 </div>
                 {/* Visual points gauge progress */}
                 <div className="w-full h-2.5 rounded-full bg-purple-100/40 overflow-hidden border border-purple-200/20">
                   <div 
                     className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 transition-all duration-1000"
                     style={{ 
                       width: `${Math.min(
                         ((tasks.filter(t => t.completed).length * 15 + routines.filter(r => r.completed).length * 10) / 100) * 100, 
                       	100
                       )}%` 
                     }}
                   ></div>
                 </div>
               </div>
 
               <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
                 Each completed task adds +15 points. Checked routines generate +10 points to feed focus momentum.
               </div>
             </div>
 
             {/* ADHD Micro Insights carousel with luxurious subtle glass overlay */}
             <div className="p-6 bg-purple-50/40 backdrop-blur-lg border border-purple-150/60 shadow-md shadow-purple-900/5 rounded-[28px] space-y-3">
               <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 font-mono flex items-center gap-1.5 font-semibold">
                 <Compass size={11} className="text-purple-600" />
                 SENSE-CHECK AFFIRMATION
               </span>
               
               <p className="text-xs md:text-sm text-slate-700 italic font-medium font-sans leading-relaxed">
                 "{ADHD_INSIGHTS[currentInsightIdx]}"
               </p>
 
               <div className="flex justify-between items-center pt-2">
                 <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest font-semibold">Rotates automatic</span>
                 <button 
                   onClick={() => setCurrentInsightIdx((prev) => (prev + 1) % ADHD_INSIGHTS.length)}
                   className="p-1 rounded-xl bg-white/60 hover:bg-white text-purple-500 hover:text-purple-700 transition shadow-sm border border-purple-100/30"
                 >
                   <RefreshCw size={11} />
                 </button>
               </div>
             </div>
 
             {/* Scrollable ADHD Routine Progress Tracker */}
             <div className="p-6 bg-white/40 backdrop-blur-xl border border-white/80 shadow-md shadow-purple-900/5 rounded-[28px] space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-[10px] uppercase font-bold tracking-wider text-purple-500 font-mono">Routine completion today</span>
                 <span className="text-[10px] text-slate-500 font-bold font-mono bg-purple-50/50 px-2 py-0.5 rounded-lg border border-purple-100/30">
                   {routines.filter(r => r.completed).length}/{routines.length} Done
                 </span>
               </div>
               
               <div className="max-h-56 overflow-y-auto pr-1 space-y-2" style={{ scrollbarWidth: 'none' }}>
                 {routines.map((r) => (
                   <div 
                     key={r.id}
                     onClick={() => toggleRoutine(r.id)}
                     className={`p-3 rounded-2xl flex items-center justify-between border transition-all cursor-pointer select-none group text-left ${
                       r.completed 
                         ? 'bg-purple-100/40 border-purple-200/55 text-purple-700 shadow-sm' 
                         : 'bg-white/60 hover:bg-white border-purple-100/20 text-slate-600 hover:text-slate-800 shadow-xs'
                     }`}
                   >
                     <div className="flex items-center gap-2.5 min-w-0 flex-1">
                       <span className="text-sm shrink-0">
                         {r.icon === 'water' ? '💧' : r.icon === 'meds' ? '💊' : r.icon === 'stretch' ? '🧘' : r.icon === 'walk' ? '🚶' : r.icon === 'journal' ? '📓' : '☀️'}
                       </span>
                       <span className="text-[11px] font-bold tracking-tight truncate pr-2 leading-none">{r.label}</span>
                     </div>
                     <div className={`w-4 h-4 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                       r.completed 
                         ? 'bg-purple-600 border-purple-600 text-white' 
                         : 'border-slate-300 group-hover:border-purple-400 bg-white/80'
                     }`}>
                       {r.completed && <span className="text-[9px] font-black">✓</span>}
                     </div>
                   </div>
                 ))}
                 {routines.length === 0 && (
                   <div className="text-center py-6 text-slate-400 text-xs">No active routines.</div>
                 )}
               </div>
             </div>
 
           </section>

        </div>
      )}
    </AnimatePresence>

    {/* Global Footer info panel */}
        {/* Global Floating "+" Capture Button available on mobile & desktop */}
        {!isOverwhelmed && (
          <button 
            type="button"
            id="global-plus-button"
            onClick={() => setIsQuickAddOpen(true)}
            aria-label="Quick capture thought"
            className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:bottom-6 right-6 z-[60] bg-gradient-to-br from-[#6D21A8] to-[#581C87] hover:from-purple-750 hover:to-[#581C87] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-purple-950/25 transition-all border border-white/20 cursor-pointer hover:scale-105 active:scale-95 duration-200 animate-bounce-subtle"
            title="Quick capture thought"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        )}

        {/* Global Quick Mind Capture Dialog with premium ADHD touch tags */}
        <AnimatePresence>
          {isQuickAddOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-end sm:items-center justify-center p-4 text-left font-sans">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsQuickAddOpen(false)}
                className="fixed inset-0 bg-purple-950/35 backdrop-blur-xs" 
              />
              
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-lg bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 space-y-5 shadow-2xl relative z-10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-purple-50 rounded-lg text-purple-600 font-sans font-bold text-xs" id="quick-capture-icon">
                      ✨
                    </span>
                    <h3 className="text-base font-black tracking-tight text-slate-900 font-sans" id="quick-capture-title">
                      Quick Mind Capture
                    </h3>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsQuickAddOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold font-sans cursor-pointer"
                    id="quick-capture-close-button"
                  >
                    Cancel
                  </button>
                </div>

                <div className="space-y-4" id="quick-capture-body">
                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      id="quick-capture-input"
                      value={quickAddText}
                      onChange={(e) => setQuickAddText(e.target.value)}
                      onKeyDown={(e) => { 
                        if (e.key === 'Enter' && quickAddText.trim()) { 
                          handleQuickAddSubmit(e); 
                        } 
                      }}
                      placeholder="What is taking space in your thoughts?"
                      className="w-full px-5 py-4 rounded-xl bg-purple-50/20 border border-purple-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-200/40 focus:border-purple-400 focus:bg-white text-slate-800 placeholder-slate-400 shadow-inner transition-all font-sans"
                    />
                    <span className="text-[10px] text-slate-400 font-mono pl-1 block">Press Enter or click drop button below to log your goal.</span>
                  </div>

                  <div className="space-y-2 select-none">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">Category Tag</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { val: 'tiny-win', label: '🌸 Tiny Win', desc: 'Dopamine' },
                        { val: 'deep-focus', label: '🧠 Deep Focus', desc: 'Concentrate' },
                        { val: 'admin', label: '💼 Life Admin', desc: 'Chores' },
                        { val: 'recovery', label: '🌱 Self-Care', desc: 'Recovery' },
                        { val: 'routine', label: '☀️ Habit Flow', desc: 'Routine' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          id={`quick-capture-tag-${item.val}`}
                          onClick={() => setQuickAddCategory(item.val as any)}
                          className={`p-2 rounded-xl text-left border transition-all text-[11px] font-bold leading-tight cursor-pointer ${
                            quickAddCategory === item.val
                              ? 'bg-purple-100 border-purple-450 text-purple-800 ring-2 ring-purple-100/50'
                              : 'bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-600'
                          }`}
                        >
                          <div className="truncate">{item.label}</div>
                          <div className="text-[8px] font-medium text-slate-450 mt-0.5 truncate">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 select-none">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block font-mono">How demanding is this?</span>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'low', label: '⚡ Low Demand', desc: 'Gentle pace' },
                        { val: 'medium', label: '⚡⚡ Moderate', desc: 'Normal effort' },
                        { val: 'deep', label: '⚡⚡⚡ High energy', desc: 'Deep focus' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          id={`quick-capture-energy-${item.val}`}
                          onClick={() => setQuickAddEnergy(item.val as any)}
                          className={`p-2 rounded-xl text-center border transition-all text-[11px] font-bold leading-tight cursor-pointer ${
                            quickAddEnergy === item.val
                              ? 'bg-purple-100 border-purple-450 text-purple-800 ring-2 ring-purple-100/50'
                              : 'bg-slate-50 hover:bg-slate-100/60 border-slate-100 text-slate-600'
                          }`}
                        >
                          <div>{item.label}</div>
                          <div className="text-[8px] font-medium text-slate-450 mt-0.5 truncate">{item.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleQuickAddSubmit}
                    disabled={!quickAddText.trim()}
                    className="w-full py-3.5 rounded-2xl bg-[#6D21A8] disabled:bg-[#ECE6FF] disabled:text-purple-300 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/10 transition cursor-pointer font-sans"
                  >
                    Release into safe slate list — Breathe out 🍃
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Personalized ADHD Onboarding Dialog */}
        <AnimatePresence>
          {showOnboarding && (
            <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4 text-left font-sans">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-purple-950/35 backdrop-blur-xs" 
              />
              
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="w-full max-w-md bg-white border border-purple-100 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 text-center"
              >
                {onboardingStep === 1 ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-purple-900/15">
                        ⚡
                      </div>
                      <h2 className="text-xl font-black text-purple-950 tracking-tight font-sans">
                        Before we begin — what should we call you?
                      </h2>
                      <p className="text-xs text-slate-500 font-sans font-medium">
                        Just a first name. No password, no email, no cloud tracking.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={onboardingName}
                        onChange={(e) => setOnboardingName(e.target.value)}
                        placeholder="Your first name"
                        className="w-full px-5 py-3.5 rounded-2xl bg-purple-50/20 border border-purple-100 text-sm font-sans focus:outline-none focus:border-purple-400 focus:bg-white text-slate-800 placeholder-slate-400 shadow-inner text-center transition-all"
                      />
                      <button
                        type="button"
                        disabled={onboardingName.trim().length < 2}
                        onClick={() => setOnboardingStep(2)}
                        className="w-full py-3.5 rounded-2xl bg-[#6D21A8] disabled:bg-[#ECE6FF] disabled:text-purple-300 hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/10 transition cursor-pointer font-sans"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-xl font-black text-purple-950 tracking-tight font-sans">
                        Good to meet you, {onboardingName.trim()}.
                      </h2>
                      <p className="text-xs text-slate-500 font-sans font-semibold">
                        When do you usually plan your day?
                      </p>
                    </div>
                    
                    <div className="space-y-3 font-sans">
                      {(['morning', 'afternoon', 'evening'] as const).map((time) => {
                        const details = {
                          morning: { emoji: '☀️', title: 'Morning', desc: 'Gentle focus to startup the day' },
                          afternoon: { emoji: '🌤️', title: 'Afternoon', desc: 'Mid-day reset & alignment' },
                          evening: { emoji: '🌙', title: 'Evening', desc: 'Quiet reflection & setup' }
                        }[time];

                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setOnboardingPlanningTime(time)}
                            className={`w-full p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-center gap-4 ${
                              onboardingPlanningTime === time
                                ? 'bg-purple-50/70 border-purple-400 ring-2 ring-purple-100/30'
                                : 'bg-slate-50/60 hover:bg-slate-100/60 border-slate-100/40 text-slate-650'
                            }`}
                          >
                            <span className="text-2xl">{details.emoji}</span>
                            <div className="flex-grow min-w-0">
                              <div className="text-xs font-bold text-slate-800 leading-none">{details.title}</div>
                              <div className="text-[10px] text-slate-500 mt-1 truncate font-medium">{details.desc}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const trimmedName = onboardingName.trim();
                        storage.saveUserName(trimmedName);
                        storage.saveUserPlanningTime(onboardingPlanningTime);
                        setUserName(trimmedName);
                        setPlanningTime(onboardingPlanningTime);
                        dismissOnboarding();
                      }}
                      className="w-full py-3.5 rounded-2xl bg-[#6D21A8] hover:bg-purple-700 text-white font-black text-xs uppercase tracking-wider shadow-md shadow-purple-600/10 transition cursor-pointer font-sans"
                    >
                      Let's begin
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Elegant Task Completion Dopamine Celebration Toast */}
        <AnimatePresence>
          {lastCompletedTaskName && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-55 w-full max-w-sm px-4"
            >
              <div className="bg-slate-900 border border-slate-800 text-white p-5 rounded-[24px] shadow-2xl flex items-center gap-4 relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl -z-10 animate-pulse" />
                
                <span className="p-3 bg-purple-600 rounded-full text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                  ✨
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block font-mono">Dopamine Unlocked +15 pts</span>
                  <div className="text-[13px] font-bold text-slate-100 truncate mt-0.5 leading-snug">
                    "{lastCompletedTaskName}"
                  </div>
                  <span className="text-[10px] text-slate-300 block mt-0.5 font-medium">Goal achieved! Let the reward settle. 🍃</span>
                </div>
                <button 
                  onClick={() => setLastCompletedTaskName(null)}
                  className="text-slate-400 hover:text-white p-1 text-xs font-bold font-sans cursor-pointer transition shrink-0"
                  type="button"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

    <footer className="mt-12 pt-6 border-t border-purple-100/50 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-1 text-teal-600 font-semibold uppercase tracking-widest bg-teal-50 px-2.5 py-0.5 rounded-full text-[9px]">
        <CheckCircle size={10} className="fill-teal-100 stroke-teal-600" />
        ADHD cognitive safety architecture applied
      </div>
      <div>FocusFlow respects your tempo. Clean operations. No pressure.</div>
    </footer>

  </div>

       {/* Floating Mobile Bottom Tab Bar (Only visible when not in pure Overwhelm sensory reset mode) */}
       {!isOverwhelmed && (
         <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pt-3 px-3 bg-white/80 backdrop-blur-xl border-t border-purple-100/60 shadow-[0_-10px_30px_rgba(107,33,168,0.08)] flex justify-around items-center" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
           <button
             onClick={() => setCurrentView('today')}
             className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 cursor-pointer ${
               currentView === 'today' ? 'text-purple-600 scale-102 font-extrabold' : 'text-slate-400 hover:text-purple-500'
             }`}
           >
             <LayoutTemplate size={18} />
             <span className="text-[9px] font-bold">Today</span>
           </button>
           <button
             onClick={() => setCurrentView('focus')}
             className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 cursor-pointer ${
               currentView === 'focus' ? 'text-purple-600 scale-102 font-extrabold' : 'text-slate-400 hover:text-purple-500'
             }`}
           >
             <Flame size={18} />
             <span className="text-[9px] font-bold">Focus</span>
           </button>
           <button
             onClick={() => setCurrentView('brain-dump')}
             className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 cursor-pointer ${
               currentView === 'brain-dump' ? 'text-purple-600 scale-102 font-extrabold' : 'text-slate-400 hover:text-purple-500'
             }`}
           >
             <BrainCircuit size={18} />
             <span className="text-[9px] font-bold">Capture</span>
           </button>
           <button
             onClick={() => setCurrentView('routines')}
             className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 cursor-pointer ${
               currentView === 'routines' ? 'text-purple-600 scale-102 font-extrabold' : 'text-slate-400 hover:text-purple-500'
             }`}
           >
             <CheckCircle size={18} />
             <span className="text-[9px] font-bold">Routines</span>
           </button>
           <button
             onClick={() => setCurrentView('wins')}
             className={`flex flex-col items-center gap-1 p-2 transition-all duration-300 cursor-pointer ${
               currentView === 'wins' ? 'text-purple-600 scale-102 font-extrabold' : 'text-slate-400 hover:text-purple-500'
             }`}
           >
             <Award size={18} />
             <span className="text-[9px] font-bold">Wins</span>


             
           </button>
         </div>
       )}

    </div>
  );
}
