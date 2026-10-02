import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Settings, Command, User as UserIcon, LogOut, Flame, Clock, CheckCircle2, ChevronDown, Palette, Laptop, Moon, Sun, Sparkles, Trees, Check } from 'lucide-react';
import { User } from 'firebase/auth';
import { AppTheme } from '../types';
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
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
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
  currentTheme,
  onSelectTheme,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
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
  const isLight = currentTheme === 'pure-silver';

  return (
    <header
      className={`w-full max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b backdrop-blur-xl transition-colors duration-300 ${
        isLight ? 'border-neutral-300/80 text-neutral-900' : 'border-white/10 text-white'
      }`}
    >
      {/* Zone 1: Brand & Named Greeting */}
      <div className="flex items-center gap-3">
        <a
          href="#timer"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('timer');
          }}
          className={`text-lg font-semibold tracking-tight transition-opacity hover:opacity-90 ${
            isLight ? 'text-neutral-950' : 'text-white'
          }`}
        >
          Tempo
        </a>

        {/* Named greeting display */}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs pl-3 border-l ${
            isLight ? 'text-neutral-600 border-neutral-300' : 'text-neutral-400 border-white/10'
          }`}
        >
          <span>{getGreeting()}</span>
          {firstName && (
            <span className={`font-medium ${isLight ? 'text-neutral-900' : 'text-white'}`}>
              , {firstName}
            </span>
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
                isActive
                  ? isLight
                    ? 'text-neutral-950 font-semibold'
                    : 'text-white font-semibold'
                  : isLight
                  ? 'text-neutral-500 hover:text-neutral-900'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  className={`absolute bottom-0 left-0 right-0 h-[2px] rounded-full ${
                    isLight ? 'bg-neutral-900' : 'bg-white'
                  }`}
                />
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
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full border text-xs font-medium transition-all shadow-sm ${
              isLight
                ? 'bg-neutral-900/10 hover:bg-neutral-900/20 border-neutral-300 text-neutral-900'
                : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
            }`}
          >
            <UserIcon className={`w-3.5 h-3.5 ${isLight ? 'text-neutral-700' : 'text-neutral-300'}`} />
            <span>Sign In</span>
          </button>
        )}

        {/* Quick Theme Switcher */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => {
              if (soundEnabled) playTickSound(0.2);
              setIsThemeMenuOpen(!isThemeMenuOpen);
            }}
            className={`p-2 rounded-xl border transition-all ${
              isLight
                ? 'text-neutral-700 hover:text-neutral-950 bg-neutral-900/5 hover:bg-neutral-900/15 border-neutral-300'
                : 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/15 border-white/10'
            }`}
            title="Theme Switcher"
            aria-label="Theme Switcher"
          >
            <Palette className="w-4 h-4" />
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-neutral-900/95 border border-white/15 p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-neutral-300">Theme Palette</span>
                <span className="text-[10px] text-neutral-400">5 Themes</span>
              </div>
              <div className="space-y-1">
                {[
                  { id: 'dark-glass', label: 'Dark Glass', icon: Laptop, dotBg: 'bg-[#0c0d12]' },
                  { id: 'midnight-carbon', label: 'Midnight Carbon', icon: Moon, dotBg: 'bg-black' },
                  { id: 'pure-silver', label: 'Pure Silver', icon: Sun, dotBg: 'bg-[#F5F5F7]' },
                  { id: 'sunset-aurora', label: 'Sunset Aurora', icon: Sparkles, dotBg: 'bg-[#0e091c]' },
                  { id: 'emerald-forest', label: 'Emerald Forest', icon: Trees, dotBg: 'bg-[#06140d]' },
                ].map((t) => {
                  const Icon = t.icon;
                  const isSelected = currentTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (soundEnabled) playTickSound(0.25);
                        onSelectTheme(t.id as AppTheme);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors ${
                        isSelected
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full ${t.dotBg} border border-white/30 shrink-0`} />
                        <span>{t.label}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onOpenShortcuts();
          }}
          className={`p-2 rounded-xl transition-colors ${
            isLight
              ? 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/10'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
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
          className={`p-2 rounded-xl transition-colors ${
            isLight
              ? 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-900/10'
              : 'text-neutral-400 hover:text-white hover:bg-white/10'
          }`}
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
          className={`p-2 rounded-xl border transition-all ${
            isLight
              ? 'text-neutral-700 hover:text-neutral-950 bg-neutral-900/5 hover:bg-neutral-900/15 border-neutral-300'
              : 'text-neutral-300 hover:text-white bg-white/5 hover:bg-white/15 border-white/10'
          }`}
          title="Settings (,)"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
