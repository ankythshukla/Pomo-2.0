import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Settings, Command, User as UserIcon, LogOut, Flame, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import { User } from 'firebase/auth';
import { playTickSound } from '../utils/audio';

export type MainTab = 'timer' | 'tasks' | 'activity';

interface HeaderProps {
  currentTab: MainTab;
  onSelectTab: (tab: MainTab) => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onToggleZen: () => void;
  soundEnabled: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  streakDays: number;
  focusMinutesToday: number;
  savedTasksCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  onOpenShortcuts,
  onToggleZen,
  soundEnabled,
  user,
  onOpenAuth,
  onLogout,
  streakDays,
  focusMinutesToday,
  savedTasksCount,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navTabs: { id: MainTab; label: string }[] = [
    { id: 'timer', label: 'Timer' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'activity', label: 'Activity' },
  ];

  // Named Greeting Calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getFirstName = () => {
    if (!user) return null;
    if (user.displayName) {
      return user.displayName.split(' ')[0];
    }
    if (user.email) {
      const prefix = user.email.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return 'Friend';
  };

  const firstName = getFirstName();

  return (
    <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 backdrop-blur-xl">
      {/* Zone 1: Brand & Named Greeting */}
      <div className="flex items-center gap-3">
        <a
          href="#timer"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('timer');
          }}
          className="text-lg font-semibold tracking-tight text-white hover:opacity-90 transition-opacity"
        >
          Tempo
        </a>

        {/* Named greeting display */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-400 pl-3 border-l border-white/10">
          <span>{getGreeting()}</span>
          {firstName && (
            <span className="font-medium text-white">, {firstName}</span>
          )}
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-6 text-xs md:text-sm font-medium order-3 sm:order-2">
        {navTabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (soundEnabled) playTickSound(0.2);
                onSelectTab(tab.id);
              }}
              className={`relative py-1 transition-colors ${
                isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Account, Shortcuts & Settings */}
      <div className="flex items-center gap-2 order-2 sm:order-3">
        {/* User Account Pill or Sign In Button */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 transition-all text-xs font-medium text-white shadow-sm"
              title="Account menu"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={firstName || 'User'}
                  className="w-5 h-5 rounded-full object-cover border border-white/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 text-[10px] text-white font-bold flex items-center justify-center">
                  {(firstName || 'U').charAt(0)}
                </div>
              )}
              <span className="hidden md:inline max-w-[100px] truncate">{firstName}</span>
              <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Apple Style Account Popover */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-neutral-900/95 border border-white/15 p-4 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="pb-3 border-b border-white/10">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.displayName || firstName}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                </div>

                {/* Cloud Synced Stats Summary */}
                <div className="py-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Current Streak</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-white">
                      {streakDays} days
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Today's Focus</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-white">
                      {focusMinutesToday}m
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="flex items-center gap-1.5 text-neutral-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Saved Tasks</span>
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-white">
                      {savedTasksCount}
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-white/5 hover:border-rose-500/30 text-xs font-medium transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              if (soundEnabled) playTickSound(0.25);
              onOpenAuth();
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-medium text-white transition-all shadow-sm"
          >
            <UserIcon className="w-3.5 h-3.5 text-neutral-300" />
            <span>Sign In</span>
          </button>
        )}

        {/* Shortcuts */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onOpenShortcuts();
          }}
          className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
        >
          <Command className="w-4 h-4" />
        </button>

        {/* Zen */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onToggleZen();
          }}
          className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          title="Zen Fullscreen Mode (F)"
          aria-label="Zen mode"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.25);
            onOpenSettings();
          }}
          className="p-2 text-neutral-300 hover:text-white rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all"
          title="Settings (,)"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
