/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, logoutUser } from './firebase';
import {
  subscribeToUserStats,
  saveUserStatsToFirestore,
  subscribeToUserTasks,
  saveTaskToFirestore,
  deleteTaskFromFirestore,
  subscribeToUserHistory,
  saveSessionHistoryToFirestore,
} from './utils/firestoreSync';
import { TimerMode, PomodoroSettings, TaskItem, DailyStats, AmbientSoundType, SessionRecord } from './types';
import {
  loadSettings,
  saveSettings,
  loadTasks,
  saveTasks,
  loadStats,
  saveStats,
} from './utils/storage';
import {
  playTickSound,
  playChimeSound,
  playModeChangeSound,
  ambientPlayer,
} from './utils/audio';
import { Header, MainTab } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { TimerDial } from './components/TimerDial';
import { TaskPlanner } from './components/TaskPlanner';
import { ActivityRings } from './components/ActivityRings';
import { AmbientSoundBar } from './components/AmbientSoundBar';
import { SettingsModal } from './components/SettingsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ZenOverlay } from './components/ZenOverlay';
import { AuthModal } from './components/AuthModal';
import { Sparkles, ArrowRight, Cloud, Check } from 'lucide-react';

export default function App() {
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Persistence states
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings);
  const [tasks, setTasks] = useState<TaskItem[]>(loadTasks);
  const [stats, setStats] = useState<DailyStats>(loadStats);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // App navigation & Modals
  const [currentTab, setCurrentTab] = useState<MainTab>('timer');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isZenOpen, setIsZenOpen] = useState(false);

  // Timer Core State
  const [mode, setMode] = useState<TimerMode>('focus');
  const [cycleCount, setCycleCount] = useState(0); // 0 to settings.longBreakInterval
  const [timeLeft, setTimeLeft] = useState<number>(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Completion alert state
  const [completedNotice, setCompletedNotice] = useState<{
    show: boolean;
    prevMode: TimerMode;
    nextMode: TimerMode;
    message: string;
  } | null>(null);

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Track Firebase Auth state & Firestore sync
  useEffect(() => {
    let unsubStats: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubHistory: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      // Clean up previous listeners if any
      if (unsubStats) unsubStats();
      if (unsubTasks) unsubTasks();
      if (unsubHistory) unsubHistory();

      if (currentUser) {
        const userName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Friend';
        setSyncToast(`Welcome back, ${userName}! Your streak, progress, and tasks are synced.`);
        setTimeout(() => setSyncToast(null), 5000);

        // 1. Subscribe to User Stats
        unsubStats = subscribeToUserStats(currentUser.uid, (cloudStats) => {
          if (cloudStats.date) {
            setStats((prev) => ({
              ...prev,
              date: cloudStats.date || prev.date,
              focusMinutesToday: cloudStats.focusMinutesToday ?? prev.focusMinutesToday,
              sessionsCompletedToday: cloudStats.sessionsCompletedToday ?? prev.sessionsCompletedToday,
              streakDays: cloudStats.streakDays ?? prev.streakDays,
            }));
          } else {
            // Initial sync: push current stats to cloud
            saveUserStatsToFirestore(currentUser.uid, stats);
          }
        });

        // 2. Subscribe to User Tasks
        unsubTasks = subscribeToUserTasks(currentUser.uid, (cloudTasks) => {
          if (cloudTasks && cloudTasks.length > 0) {
            setTasks(cloudTasks);
          } else if (tasks.length > 0) {
            // Upload local tasks to cloud
            tasks.forEach((t) => saveTaskToFirestore(currentUser.uid, t));
          }
        });

        // 3. Subscribe to Session History
        unsubHistory = subscribeToUserHistory(currentUser.uid, (cloudHistory) => {
          if (cloudHistory && cloudHistory.length > 0) {
            setStats((prev) => ({
              ...prev,
              history: cloudHistory,
            }));
          }
        });
      }
    });

    return () => {
      unsubAuth();
      if (unsubStats) unsubStats();
      if (unsubTasks) unsubTasks();
      if (unsubHistory) unsubHistory();
    };
  }, []);

  // Calculate current total duration for the active mode
  const getModeDurationSeconds = useCallback(
    (targetMode: TimerMode): number => {
      switch (targetMode) {
        case 'focus':
          return settings.focusDuration * 60;
        case 'shortBreak':
          return settings.shortBreakDuration * 60;
        case 'longBreak':
          return settings.longBreakDuration * 60;
      }
    },
    [settings]
  );

  const totalDuration = getModeDurationSeconds(mode);

  // Ref to hold mutable states for timer interval tick
  const stateRef = useRef({
    mode,
    timeLeft,
    isRunning,
    cycleCount,
    settings,
    tasks,
    activeTaskId,
    stats,
    user,
  });

  useEffect(() => {
    stateRef.current = {
      mode,
      timeLeft,
      isRunning,
      cycleCount,
      settings,
      tasks,
      activeTaskId,
      stats,
      user,
    };
  });

  // Save settings whenever they change
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Save tasks to local storage
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // Save stats to local storage
  useEffect(() => {
    saveStats(stats);
  }, [stats]);

  // Sync tab title with timer countdown
  useEffect(() => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const modeLabel = mode === 'focus' ? 'Focus' : mode === 'shortBreak' ? 'Short Break' : 'Long Break';

    if (isRunning) {
      document.title = `(${formatted}) ${modeLabel} · Tempo`;
    } else {
      document.title = `Tempo Focus - Apple-Inspired Pomodoro Timer`;
    }
  }, [timeLeft, isRunning, mode]);

  // Handle Mode Change
  const switchMode = useCallback(
    (newMode: TimerMode, autoStart = false) => {
      setMode(newMode);
      const newDuration = getModeDurationSeconds(newMode);
      setTimeLeft(newDuration);
      setIsRunning(autoStart);
      setCompletedNotice(null);
    },
    [getModeDurationSeconds]
  );

  // Switch mode when user clicks segmented tabs
  const handleSelectMode = (newMode: TimerMode) => {
    if (newMode === mode) return;
    if (settings.soundEnabled) playModeChangeSound(0.3);
    switchMode(newMode, false);
  };

  // Session completion handler
  const handleSessionComplete = useCallback(() => {
    const s = stateRef.current;
    if (s.settings.soundEnabled) {
      playChimeSound(0.7);
    }

    // Browser Notification
    if (
      s.settings.notificationsEnabled &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      const title =
        s.mode === 'focus'
          ? 'Focus Session Completed! ✨'
          : 'Break Finished! Ready to focus?';
      const body =
        s.mode === 'focus'
          ? 'Great job on your deep work interval. Time for a well-deserved rest.'
          : 'Break time is over. Return to your flow session.';
      new Notification(title, { body, icon: '/favicon.ico' });
    }

    if (s.mode === 'focus') {
      const completedMinutes = s.settings.focusDuration;
      const newCycles = s.cycleCount + 1;
      const willTakeLongBreak = newCycles >= s.settings.longBreakInterval;
      const nextMode: TimerMode = willTakeLongBreak ? 'longBreak' : 'shortBreak';

      // Update Daily Stats
      const newRecord: SessionRecord = {
        id: `rec-${Date.now()}`,
        timestamp: Date.now(),
        mode: 'focus',
        durationMinutes: completedMinutes,
        taskTitle: s.activeTaskId
          ? s.tasks.find((t) => t.id === s.activeTaskId)?.title
          : undefined,
      };

      const updatedStats: DailyStats = {
        ...s.stats,
        focusMinutesToday: s.stats.focusMinutesToday + completedMinutes,
        sessionsCompletedToday: s.stats.sessionsCompletedToday + 1,
        history: [newRecord, ...s.stats.history].slice(0, 30),
      };

      setStats(updatedStats);

      // Cloud Firestore sync if logged in
      if (s.user) {
        saveUserStatsToFirestore(s.user.uid, updatedStats);
        saveSessionHistoryToFirestore(s.user.uid, newRecord);
      }

      // Increment active task pomodoros
      if (s.activeTaskId) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === s.activeTaskId) {
              const updated = { ...t, pomodorosSpent: t.pomodorosSpent + 1 };
              if (s.user) {
                saveTaskToFirestore(s.user.uid, updated);
              }
              return updated;
            }
            return t;
          })
        );
      }

      setCycleCount(willTakeLongBreak ? 0 : newCycles);

      setCompletedNotice({
        show: true,
        prevMode: 'focus',
        nextMode,
        message: willTakeLongBreak
          ? `Outstanding! You finished ${s.settings.longBreakInterval} cycles. Enjoy a long break!`
          : `Deep work session done! Take a brief breather.`,
      });

      if (s.settings.autoStartBreaks) {
        switchMode(nextMode, true);
      } else {
        switchMode(nextMode, false);
      }
    } else {
      // Break finished
      setCompletedNotice({
        show: true,
        prevMode: s.mode,
        nextMode: 'focus',
        message: `Break complete. Ready to enter deep focus?`,
      });

      if (s.settings.autoStartPomodoros) {
        switchMode('focus', true);
      } else {
        switchMode('focus', false);
      }
    }
  }, [switchMode]);

  // Main Timer Interval Loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, handleSessionComplete]);

  // Actions
  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
    setCompletedNotice(null);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getModeDurationSeconds(mode));
  };

  const handleSkip = () => {
    if (mode === 'focus') {
      const nextMode = cycleCount + 1 >= settings.longBreakInterval ? 'longBreak' : 'shortBreak';
      setCycleCount((prev) => (prev + 1 >= settings.longBreakInterval ? 0 : prev + 1));
      switchMode(nextMode, false);
    } else {
      switchMode('focus', false);
    }
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    setTimeLeft((prev) => Math.max(60, prev + deltaSeconds));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (settings.soundEnabled) playTickSound(0.25);
        handleTogglePlay();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        if (settings.soundEnabled) playTickSound(0.25);
        handleReset();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (settings.soundEnabled) playTickSound(0.25);
        handleSkip();
      } else if (e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsZenOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        if (settings.ambientSound === 'none') {
          setSettings((prev) => ({ ...prev, ambientSound: 'rain' }));
          ambientPlayer.play('rain', settings.ambientVolume);
        } else {
          setSettings((prev) => ({ ...prev, ambientSound: 'none' }));
          ambientPlayer.stop();
        }
      } else if (e.key === '1') {
        handleSelectMode('focus');
      } else if (e.key === '2') {
        handleSelectMode('shortBreak');
      } else if (e.key === '3') {
        handleSelectMode('longBreak');
      } else if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === ',') {
        setIsSettingsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings, handleTogglePlay, handleReset, handleSkip, handleSelectMode]);

  // Tasks Handlers
  const handleAddTask = (title: string, category: string, targetPomodoros: number) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title,
      category,
      completed: false,
      pomodorosSpent: 0,
      targetPomodoros,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
    if (user) {
      saveTaskToFirestore(user.uid, newTask);
    }
  };

  const handleToggleCompleteTask = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, completed: !t.completed };
          if (user) {
            saveTaskToFirestore(user.uid, updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (activeTaskId === taskId) {
      setActiveTaskId(null);
    }
    if (user) {
      deleteTaskFromFirestore(user.uid, taskId);
    }
  };

  const handleLogout = async () => {
    try {
      if (settings.soundEnabled) playTickSound(0.25);
      await logoutUser();
      setUser(null);
      setSyncToast('Logged out. Your sessions are saved in local storage.');
      setTimeout(() => setSyncToast(null), 4000);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Theme Classes
  const getThemeClass = () => {
    switch (settings.theme) {
      case 'midnight-carbon':
        return 'theme-midnight-carbon bg-black text-neutral-100';
      case 'pure-silver':
        return 'theme-pure-silver bg-[#F5F5F7] text-neutral-900';
      case 'dark-glass':
      default:
        return 'theme-dark-glass bg-[#0c0d12] text-neutral-100';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 relative overflow-x-hidden ${getThemeClass()}`}>
      {/* Background Subtle Apple Gradients */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {settings.theme === 'pure-silver' ? (
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-200/20 via-orange-100/20 to-transparent blur-3xl opacity-70" />
        ) : (
          <>
            <div
              className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[480px] rounded-full blur-[140px] transition-colors duration-1000 ${
                mode === 'focus'
                  ? 'bg-orange-600/15'
                  : mode === 'shortBreak'
                  ? 'bg-emerald-600/15'
                  : 'bg-blue-600/15'
              }`}
            />
            <div className="absolute bottom-0 right-10 w-96 h-96 rounded-full bg-indigo-900/10 blur-[120px]" />
          </>
        )}
      </div>

      {/* Apple Top Bar Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onToggleZen={() => setIsZenOpen(true)}
        soundEnabled={settings.soundEnabled}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        streakDays={stats.streakDays}
        focusMinutesToday={stats.focusMinutesToday}
        savedTasksCount={tasks.length}
      />

      {/* Cloud Sync Toast Notification */}
      {syncToast && (
        <div className="w-full max-w-lg mx-auto px-4 mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white/10 dark:bg-neutral-800/90 backdrop-blur-2xl border border-white/15 text-xs text-neutral-200 shadow-xl">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{syncToast}</span>
            </div>
            <button
              onClick={() => setSyncToast(null)}
              className="text-neutral-400 hover:text-white transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Completion Pill Banner (Apple Dynamic Island style) */}
      {completedNotice && completedNotice.show && (
        <div className="w-full max-w-lg mx-auto px-4 mt-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/10 dark:bg-neutral-800/90 backdrop-blur-2xl border border-white/20 shadow-2xl">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="p-1.5 rounded-full bg-orange-500/20 text-orange-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <p className="text-xs font-medium truncate text-white">
                {completedNotice.message}
              </p>
            </div>
            <button
              onClick={() => {
                if (settings.soundEnabled) playTickSound(0.25);
                switchMode(completedNotice.nextMode, true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-neutral-950 font-medium text-xs hover:bg-neutral-200 transition-colors shrink-0 shadow-sm"
            >
              <span>Start {completedNotice.nextMode === 'focus' ? 'Focus' : 'Break'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-start">
        {currentTab === 'timer' && (
          <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in duration-300">
            {/* Segmented Mode Selector */}
            <ModeSelector
              mode={mode}
              onSelectMode={handleSelectMode}
              isRunning={isRunning}
              soundEnabled={settings.soundEnabled}
            />

            {/* Apple Precision Timer Dial */}
            <TimerDial
              mode={mode}
              timeLeft={timeLeft}
              totalDuration={totalDuration}
              isRunning={isRunning}
              onTogglePlay={handleTogglePlay}
              onReset={handleReset}
              onSkip={handleSkip}
              onAdjustTime={handleAdjustTime}
              currentCycle={cycleCount}
              totalCycles={settings.longBreakInterval}
              activeTask={activeTask}
              soundEnabled={settings.soundEnabled}
              onOpenTasks={() => setCurrentTab('tasks')}
            />

            {/* Integrated Ambient Audio Controller */}
            <div className="w-full pt-2">
              <AmbientSoundBar
                ambientSound={settings.ambientSound}
                ambientVolume={settings.ambientVolume}
                onChangeSound={(soundType: AmbientSoundType) =>
                  setSettings((prev) => ({ ...prev, ambientSound: soundType }))
                }
                onChangeVolume={(volume: number) =>
                  setSettings((prev) => ({ ...prev, ambientVolume: volume }))
                }
                soundEnabled={settings.soundEnabled}
              />
            </div>
          </div>
        )}

        {currentTab === 'tasks' && (
          <div className="w-full py-2 animate-in fade-in duration-300">
            <TaskPlanner
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectActiveTask={(taskId) => {
                setActiveTaskId(taskId);
                if (taskId) setCurrentTab('timer');
              }}
              onAddTask={handleAddTask}
              onToggleCompleteTask={handleToggleCompleteTask}
              onDeleteTask={handleDeleteTask}
              soundEnabled={settings.soundEnabled}
            />
          </div>
        )}

        {currentTab === 'activity' && (
          <div className="w-full py-2 animate-in fade-in duration-300">
            <ActivityRings stats={stats} settings={settings} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-5 border-t border-white/5 text-center text-xs text-neutral-400">
        <div className="flex items-center justify-center gap-3">
          <span>Tempo Focus</span>
          <span aria-hidden="true">·</span>
          <span>{user ? `Signed in as ${user.displayName || user.email}` : 'Guest Session'}</span>
          <span aria-hidden="true">·</span>
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="hover:text-neutral-200 transition-colors"
          >
            Shortcuts
          </button>
        </div>
      </footer>

      {/* Preferences / Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Zen Fullscreen Focus Mode */}
      <ZenOverlay
        isOpen={isZenOpen}
        onClose={() => setIsZenOpen(false)}
        mode={mode}
        timeLeft={timeLeft}
        totalDuration={totalDuration}
        isRunning={isRunning}
        onTogglePlay={handleTogglePlay}
        onReset={handleReset}
        onSkip={handleSkip}
        activeTask={activeTask}
        soundEnabled={settings.soundEnabled}
        ambientSound={settings.ambientSound}
        ambientVolume={settings.ambientVolume}
        onChangeAmbientSound={(soundType) =>
          setSettings((prev) => ({ ...prev, ambientSound: soundType }))
        }
      />

      {/* Sign In & Sign Up Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        soundEnabled={settings.soundEnabled}
      />
    </div>
  );
}
