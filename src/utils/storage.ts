import { DailyStats, PomodoroSettings, TaskItem } from '../types';

const SETTINGS_KEY = 'tempo_pomodoro_settings_v1';
const STATS_KEY = 'tempo_pomodoro_stats_v1';
const TASKS_KEY = 'tempo_pomodoro_tasks_v1';

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  ambientSound: 'none',
  ambientVolume: 0.45,
  soundVolume: 0.75,
  theme: 'dark-glass',
  dailyMinutesGoal: 120,
  dailySessionsGoal: 4,
  notificationsEnabled: false,
};

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Architect design system & typography',
    category: 'Design',
    completed: false,
    pomodorosSpent: 1,
    targetPomodoros: 3,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'task-2',
    title: 'Refactor state machine & audio engine',
    category: 'Engineering',
    completed: false,
    pomodorosSpent: 2,
    targetPomodoros: 4,
    createdAt: Date.now() - 7200000,
  },
  {
    id: 'task-3',
    title: 'Review production launch checklist',
    category: 'Review',
    completed: true,
    pomodorosSpent: 1,
    targetPomodoros: 1,
    createdAt: Date.now() - 10800000,
  },
];

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function loadSettings(): PomodoroSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PomodoroSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore quota issues
  }
}

export function loadTasks(): TaskItem[] {
  if (typeof window === 'undefined') return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return DEFAULT_TASKS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TASKS;
  } catch {
    return DEFAULT_TASKS;
  }
}

export function saveTasks(tasks: TaskItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore
  }
}

export function loadStats(): DailyStats {
  const today = getTodayKey();
  const defaultTodayStats: DailyStats = {
    date: today,
    focusMinutesToday: 45,
    sessionsCompletedToday: 2,
    streakDays: 3,
    history: [
      {
        id: 'rec-1',
        timestamp: Date.now() - 3600000 * 3,
        mode: 'focus',
        durationMinutes: 25,
        taskTitle: 'Architect design system & typography',
      },
      {
        id: 'rec-2',
        timestamp: Date.now() - 3600000 * 1.5,
        mode: 'focus',
        durationMinutes: 20,
        taskTitle: 'Refactor state machine & audio engine',
      },
    ],
  };

  if (typeof window === 'undefined') return defaultTodayStats;

  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      saveStats(defaultTodayStats);
      return defaultTodayStats;
    }
    const parsed: DailyStats = JSON.parse(raw);

    // If date changed to a new day
    if (parsed.date !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      const streakContinues = parsed.date === yesterdayKey && parsed.sessionsCompletedToday > 0;
      const newStreak = streakContinues ? (parsed.streakDays || 1) + 1 : 1;

      const rolledStats: DailyStats = {
        date: today,
        focusMinutesToday: 0,
        sessionsCompletedToday: 0,
        streakDays: newStreak,
        history: parsed.history ? parsed.history.slice(0, 15) : [],
      };
      saveStats(rolledStats);
      return rolledStats;
    }

    return parsed;
  } catch {
    return defaultTodayStats;
  }
}

export function saveStats(stats: DailyStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore
  }
}
