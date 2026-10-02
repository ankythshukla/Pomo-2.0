import React from 'react';
import { TimerMode } from '../types';
import { playTickSound } from '../utils/audio';

interface ModeSelectorProps {
  mode: TimerMode;
  onSelectMode: (mode: TimerMode) => void;
  isRunning: boolean;
  soundEnabled: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onSelectMode,
  isRunning: _isRunning,
  soundEnabled,
}) => {
  const modes: { id: TimerMode; label: string }[] = [
    { id: 'focus', label: 'Focus' },
    { id: 'shortBreak', label: 'Short Break' },
    { id: 'longBreak', label: 'Long Break' },
  ];

  const handleSelect = (selectedId: TimerMode) => {
    if (soundEnabled) {
      playTickSound(0.25);
    }
    onSelectMode(selectedId);
  };

  return (
    <div
      role="tablist"
      aria-label="Pomodoro modes"
      className="relative flex items-center p-1 rounded-2xl bg-neutral-900/40 backdrop-blur-xl border border-white/10 shadow-inner w-full max-w-md mx-auto"
    >
      {modes.map((item) => {
        const isActive = mode === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(item.id)}
            className={`relative flex-1 py-2 px-3 text-xs md:text-sm font-medium rounded-xl transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${
              isActive
                ? 'text-white font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {isActive && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-all duration-200"
              />
            )}
            <span className="relative z-10 block truncate text-center">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
