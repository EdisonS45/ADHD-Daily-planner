export interface Task {
  id: string;
  text: string;
  category: 'tiny-win' | 'deep-focus' | 'admin' | 'recovery' | 'routine';
  energyLevel: 'low' | 'medium' | 'deep';
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  durationSeconds?: number;
}

export interface Routine {
  id: string;
  label: string;
  completed: boolean;
  frequencyType: 'morning' | 'afternoon' | 'anytime';
  icon: string;
}

export interface MomentumDay {
  date: string; // YYYY-MM-DD
  points: number; // calculated from tasks starting, doing, routines checked
  completedCount: number;
}

export interface AppState {
  currentView: 'today' | 'focus' | 'brain-dump' | 'routines' | 'wins';
  isOverwhelmed: boolean;
  energyLevel: 'all' | 'low' | 'medium' | 'deep';
}

export interface WinRecord {
  id: string;
  text: string;
  category: 'tiny-win' | 'deep-focus' | 'admin' | 'recovery' | 'routine';
  energyLevel: 'low' | 'medium' | 'deep';
  completedAt: string;
}

export type WinsArchive = Record<string, WinRecord[]>;
