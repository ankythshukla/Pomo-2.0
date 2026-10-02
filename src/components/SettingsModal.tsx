import React from 'react';
import { X, Bell, Moon, Sun, Laptop, User as UserIcon, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';
import { AppTheme, PomodoroSettings } from '../types';
import { playTickSound, playChimeSound } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PomodoroSettings;
  onUpdateSettings: (newSettings: PomodoroSettings) => void;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  user,
  onOpenAuth,
  onLogout,
}) => {
  if (!isOpen) return null;

  const update = <K extends keyof PomodoroSettings>(key: K, value: PomodoroSettings[K]) => {
    if (settings.soundEnabled) playTickSound(0.2);
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleRequestNotifications = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        update('notificationsEnabled', true);
        if (settings.soundEnabled) playChimeSound(0.5);
      } else {
        update('notificationsEnabled', false);
      }
    }
  };

  const themes: { id: AppTheme; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dark-glass', label: 'Dark Glass', icon: Laptop },
    { id: 'midnight-carbon', label: 'Midnight', icon: Moon },
    { id: 'pure-silver', label: 'Silver Light', icon: Sun },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-neutral-900/95 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">Preferences</h3>
            <p className="text-xs text-neutral-400 mt-0.5">Customize timer durations, flow, and appearance</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Apple ID Account Card */}
        <div className="mt-5 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border border-white/20 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white shrink-0">
                <UserIcon className="w-5 h-5 text-neutral-300" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user ? user.displayName || user.email?.split('@')[0] : 'Guest Session'}
              </p>
              <p className="text-xs text-neutral-400 truncate">
                {user ? user.email : 'Sign in to sync your streak & tasks to the cloud'}
              </p>
            </div>
          </div>

          {user ? (
            <button
              onClick={() => {
                if (settings.soundEnabled) playTickSound(0.25);
                onLogout();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-rose-200 text-xs font-medium transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          ) : (
            <button
              onClick={() => {
                if (settings.soundEnabled) playTickSound(0.25);
                onClose();
                onOpenAuth();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-neutral-950 font-medium text-xs hover:bg-neutral-200 transition-colors shrink-0 shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>

        {/* Section 1: Timer Durations */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Time & Intervals
          </h4>

          {/* Focus Duration */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Focus Duration</p>
              <p className="text-xs text-neutral-400">Target work session</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="90"
                step="5"
                value={settings.focusDuration}
                onChange={(e) => update('focusDuration', parseInt(e.target.value, 10))}
                className="w-24 md:w-32"
              />
              <span className="text-xs font-mono tabular-nums text-white w-10 text-right font-medium">
                {settings.focusDuration}m
              </span>
            </div>
          </div>

          {/* Short Break */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Short Break</p>
              <p className="text-xs text-neutral-400">Rest between cycles</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={settings.shortBreakDuration}
                onChange={(e) => update('shortBreakDuration', parseInt(e.target.value, 10))}
                className="w-24 md:w-32"
              />
              <span className="text-xs font-mono tabular-nums text-white w-10 text-right font-medium">
                {settings.shortBreakDuration}m
              </span>
            </div>
          </div>

          {/* Long Break */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Long Break</p>
              <p className="text-xs text-neutral-400">Extended pause after set</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="45"
                step="5"
                value={settings.longBreakDuration}
                onChange={(e) => update('longBreakDuration', parseInt(e.target.value, 10))}
                className="w-24 md:w-32"
              />
              <span className="text-xs font-mono tabular-nums text-white w-10 text-right font-medium">
                {settings.longBreakDuration}m
              </span>
            </div>
          </div>

          {/* Long Break Interval */}
          <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Long Break Interval</p>
              <p className="text-xs text-neutral-400">Focus cycles before long break</p>
            </div>
            <div className="flex items-center gap-1.5">
              {[2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  onClick={() => update('longBreakInterval', num)}
                  className={`w-7 h-7 rounded-lg text-xs font-mono transition-colors ${
                    settings.longBreakInterval === num
                      ? 'bg-white text-neutral-900 font-bold'
                      : 'bg-white/10 text-neutral-300 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Automation & Flow */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Flow & Automation
          </h4>

          {/* Auto-start Breaks */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Auto-start Breaks</p>
              <p className="text-xs text-neutral-400">Transition into rest immediately</p>
            </div>
            <button
              onClick={() => update('autoStartBreaks', !settings.autoStartBreaks)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 outline-none ${
                settings.autoStartBreaks ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
              role="switch"
              aria-checked={settings.autoStartBreaks}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Auto-start Pomodoros */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Auto-start Focus Sessions</p>
              <p className="text-xs text-neutral-400">Resume timer after break completes</p>
            </div>
            <button
              onClick={() => update('autoStartPomodoros', !settings.autoStartPomodoros)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 outline-none ${
                settings.autoStartPomodoros ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
              role="switch"
              aria-checked={settings.autoStartPomodoros}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.autoStartPomodoros ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 3: Audio & Notifications */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Audio & Notifications
          </h4>

          {/* Sound Enabled */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Tactile & Chime Sounds</p>
              <p className="text-xs text-neutral-400">Apple synthesized audio feedback</p>
            </div>
            <button
              onClick={() => {
                const nextVal = !settings.soundEnabled;
                update('soundEnabled', nextVal);
                if (nextVal) playChimeSound(0.5);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 outline-none ${
                settings.soundEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
              role="switch"
              aria-checked={settings.soundEnabled}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notifications Button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
            <div>
              <p className="text-sm font-medium text-neutral-200">Desktop Notifications</p>
              <p className="text-xs text-neutral-400">Alert when a cycle completes</p>
            </div>
            <button
              onClick={handleRequestNotifications}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                settings.notificationsEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-neutral-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{settings.notificationsEnabled ? 'Enabled' : 'Enable'}</span>
            </button>
          </div>
        </div>

        {/* Section 4: Appearance */}
        <div className="mt-6 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Appearance
          </h4>

          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => update('theme', t.id)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'bg-white/15 border-white text-white shadow-sm'
                      : 'bg-white/5 border-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-medium text-neutral-950 bg-white rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
