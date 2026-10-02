export type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

export type AppTheme = 'dark-glass' | 'midnight-carbon' | 'pure-silver';

export type AmbientSoundType = 'none' | 'rain' | 'white-noise' | 'binaural' | 'deep-drone';

export interface TaskItem {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  pomodorosSpent: number;
  targetPomodoros: number;
  createdAt: number;
}

export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // cycles before long break
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number; // 0 to 1
  soundVolume: number; // 0 to 1
  theme: AppTheme;
  dailyMinutesGoal: number;
  dailySessionsGoal: number;
  notificationsEnabled: boolean;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  mode: TimerMode;
  durationMinutes: number;
  taskTitle?: string;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  focusMinutesToday: number;
  sessionsCompletedToday: number;
  streakDays: number;
  history: SessionRecord[];
}
