import { Task, Routine } from '../types';

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
  }
};
