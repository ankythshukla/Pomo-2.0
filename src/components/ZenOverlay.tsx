import React, { useEffect } from 'react';
import { Minimize2, Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { TimerMode, TaskItem, AmbientSoundType } from '../types';
import { playTickSound, ambientPlayer } from '../utils/audio';

interface ZenOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  mode: TimerMode;
  timeLeft: number;
  totalDuration: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  activeTask?: TaskItem;
  soundEnabled: boolean;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onChangeAmbientSound: (type: AmbientSoundType) => void;
}

export const ZenOverlay: React.FC<ZenOverlayProps> = ({
  isOpen,
  onClose,
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  onTogglePlay,
  onReset,
  onSkip,
  activeTask,
  soundEnabled,
  ambientSound,
  ambientVolume,
  onChangeAmbientSound,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalDuration > 0 ? (totalDuration - timeLeft) / totalDuration : 0;

  const modeColors: Record<TimerMode, { aura: string; accent: string; label: string }> = {
    focus: {
      aura: 'from-orange-600/25 via-red-600/15 to-transparent',
      accent: '#FF6B4A',
      label: 'Deep Focus',
    },
    shortBreak: {
      aura: 'from-emerald-600/25 via-teal-600/15 to-transparent',
      accent: '#30D158',
      label: 'Short Break',
    },
    longBreak: {
      aura: 'from-blue-600/25 via-indigo-600/15 to-transparent',
      accent: '#0A84FF',
      label: 'Long Rest',
    },
  };

  const currentTheme = modeColors[mode];

  const handleToggleAmbient = () => {
    if (soundEnabled) playTickSound(0.2);
    if (ambientSound === 'none') {
      onChangeAmbientSound('rain');
      ambientPlayer.play('rain', ambientVolume);
    } else {
      onChangeAmbientSound('none');
      ambientPlayer.stop();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-neutral-950 text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* Background Breathing Ambient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-radial ${currentTheme.aura} pointer-events-none ${
          isRunning ? 'animate-apple-breathe' : 'opacity-30'
        }`}
      />

      {/* Top Floating Bar */}
      <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-medium">
            {currentTheme.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Ambient quick toggle */}
          <button
            onClick={handleToggleAmbient}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-neutral-300 hover:text-white"
            title={ambientSound === 'none' ? 'Turn on ambient sound' : 'Mute ambient sound'}
          >
            {ambientSound === 'none' ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* Exit Zen */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 transition-colors text-neutral-300 hover:text-white"
            title="Exit Zen mode (Esc or F)"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centered Large Display */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {/* Active Task (if any) */}
        {activeTask && (
          <p className="text-sm md:text-base font-medium text-neutral-300 max-w-md truncate mb-4">
            {activeTask.title}
          </p>
        )}

        {/* Big Digital Tabular Numbers */}
        <div className="font-mono text-7xl sm:text-8xl md:text-9xl font-semibold tracking-tighter tabular-nums drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
          <span>{String(minutes).padStart(2, '0')}</span>
          <span className={`inline-block ${isRunning ? 'animate-pulse' : 'opacity-50'}`}>:</span>
          <span>{String(seconds).padStart(2, '0')}</span>
        </div>

        {/* Minimal Progress Bar */}
        <div className="w-64 sm:w-80 h-1.5 rounded-full bg-white/10 mt-8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progress * 100}%`,
              backgroundColor: currentTheme.accent,
            }}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-5 mt-10">
          <button
            onClick={() => {
              if (soundEnabled) playTickSound(0.25);
              onReset();
            }}
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/10 transition-all active:scale-95"
            title="Reset (R)"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playTickSound(0.3);
              onTogglePlay();
            }}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 border border-white/20 shadow-xl ${
              isRunning
                ? 'bg-neutral-800 text-white hover:bg-neutral-700'
                : 'bg-white text-neutral-950 hover:bg-neutral-200 scale-105'
            }`}
            title={isRunning ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isRunning ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          <button
            onClick={() => {
              if (soundEnabled) playTickSound(0.25);
              onSkip();
            }}
            className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white border border-white/10 transition-all active:scale-95"
            title="Skip (S)"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="relative z-10 text-xs text-neutral-500 font-mono">
        Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">Space</kbd> to toggle,{' '}
        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">Esc</kbd> to exit
      </div>
    </div>
  );
};
