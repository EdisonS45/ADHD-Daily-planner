import { Task, Routine, WinRecord, WinsArchive } from '../types';

export interface PersistedState {
  tasks: Task[];
  routines: Routine[];
  isOverwhelmed: boolean;
  currentView: 'today' | 'focus' | 'brain-dump' | 'routines' | 'wins';
  showOnboarding: boolean;
  energyLevel: 'all' | 'low' | 'medium' | 'deep';
  dopaminePoints: number;
}

const STORAGE_PREFIX = 'focusflow_';

export const storage = {
  loadTasks: (defaultTasks: Task[]): Task[] => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}tasks`);
      return saved ? JSON.parse(saved) : defaultTasks;
    } catch (e) {
      console.warn("Storage API failed, fallbacking onto default state", e);
      return defaultTasks;
    }
  },

  saveTasks: (tasks: Task[]) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}tasks`, JSON.stringify(tasks));
    } catch (e) {
      console.error("Storage save failed", e);
    }
  },

  loadRoutines: (defaultRoutines: Routine[]): Routine[] => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}routines`);
      return saved ? JSON.parse(saved) : defaultRoutines;
    } catch (e) {
      console.warn("Storage API failed, loading default routines", e);
      return defaultRoutines;
    }
  },

  saveRoutines: (routines: Routine[]) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}routines`, JSON.stringify(routines));
    } catch (e) {
      console.error("Storage save failed", e);
    }
  },

  loadPreferences: () => {
    try {
      const savedOverwhelmed = localStorage.getItem(`${STORAGE_PREFIX}is_overwhelmed`);
      const savedView = localStorage.getItem(`${STORAGE_PREFIX}current_view`);
      const savedOnboarding = localStorage.getItem(`${STORAGE_PREFIX}show_onboarding`);
      const savedEnergy = localStorage.getItem(`${STORAGE_PREFIX}energy_level`);
      
      return {
        isOverwhelmed: savedOverwhelmed === 'true',
        currentView: (savedView || 'today') as PersistedState['currentView'],
        showOnboarding: savedOnboarding !== 'false',
        energyLevel: (savedEnergy || 'all') as PersistedState['energyLevel'],
      };
    } catch (e) {
      return {
        isOverwhelmed: false,
        currentView: 'today' as const,
        showOnboarding: true,
        energyLevel: 'all' as const,
      };
    }
  },

  savePreferences: (prefs: {
    isOverwhelmed: boolean;
    currentView: string;
    showOnboarding: boolean;
    energyLevel: string;
  }) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}is_overwhelmed`, prefs.isOverwhelmed ? 'true' : 'false');
      localStorage.setItem(`${STORAGE_PREFIX}current_view`, prefs.currentView);
      localStorage.setItem(`${STORAGE_PREFIX}show_onboarding`, prefs.showOnboarding ? 'true' : 'false');
      localStorage.setItem(`${STORAGE_PREFIX}energy_level`, prefs.energyLevel);
    } catch (e) {
      console.error("Preferences save failed", e);
    }
  },

  loadWinsArchive: (): WinsArchive => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}wins_archive`);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.warn("Storage API failed, loading empty wins archive", e);
      return {};
    }
  },

  saveWinsArchive: (archive: WinsArchive) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}wins_archive`, JSON.stringify(archive));
    } catch (e) {
      console.error("Wins archive save failed", e);
    }
  },

  appendWinToArchive: (win: WinRecord) => {
    try {
      const archive = storage.loadWinsArchive();
      const today = new Date().toISOString().split('T')[0];
      if (!archive[today]) {
        archive[today] = [];
      }
      if (!archive[today].some(item => item.id === win.id)) {
        archive[today].push(win);
      }
      storage.saveWinsArchive(archive);
    } catch (e) {
      console.error("Append win to archive failed", e);
    }
  }
};

export const checkAndResetRoutinesIfNewDay = (
  routines: import('../types').Routine[],
  saveRoutines: (r: import('../types').Routine[]) => void
): import('../types').Routine[] => {
  try {
    const lastReset = localStorage.getItem('focusflow_last_routine_reset');
    const today = new Date().toISOString().split('T')[0];
    if (lastReset !== today) {
      const reset = routines.map(r => ({ ...r, completed: false }));
      saveRoutines(reset);
      localStorage.setItem('focusflow_last_routine_reset', today);
      return reset;
    }
    return routines;
  } catch {
    return routines;
  }
};

