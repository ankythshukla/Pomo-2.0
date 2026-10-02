import React from 'react';
import { Play, Pause, RotateCcw, SkipForward, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { TimerMode, TaskItem } from '../types';
import { playTickSound } from '../utils/audio';

interface TimerDialProps {
  mode: TimerMode;
  timeLeft: number; // in seconds
  totalDuration: number; // in seconds
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSkip: () => void;
  onAdjustTime: (seconds: number) => void;
  currentCycle: number;
  totalCycles: number;
  activeTask?: TaskItem;
  soundEnabled: boolean;
  onOpenTasks: () => void;
}

export const TimerDial: React.FC<TimerDialProps> = ({
  mode,
  timeLeft,
  totalDuration,
  isRunning,
  onTogglePlay,
  onReset,
  onSkip,
  onAdjustTime,
  currentCycle,
  totalCycles,
  activeTask,
  soundEnabled,
  onOpenTasks,
}) => {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const progressFraction = totalDuration > 0 ? Math.max(0, Math.min(1, (totalDuration - timeLeft) / totalDuration)) : 0;

  // Geometry
  const size = 320;
  const strokeWidth = 8;
  const center = size / 2;
  const radius = center - strokeWidth - 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressFraction);

  // Mode accent colors
  const modeColors: Record<TimerMode, { stroke: string; glow: string; badge: string; text: string }> = {
    focus: {
      stroke: 'url(#focusGradient)',
      glow: 'rgba(255, 107, 74, 0.25)',
      badge: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      text: 'text-orange-400',
    },
    shortBreak: {
      stroke: 'url(#shortBreakGradient)',
      glow: 'rgba(52, 199, 89, 0.25)',
      badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
      text: 'text-emerald-400',
    },
    longBreak: {
      stroke: 'url(#longBreakGradient)',
      glow: 'rgba(10, 132, 255, 0.25)',
      badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      text: 'text-blue-400',
    },
  };

  const currentTheme = modeColors[mode];

  // Calculate tip indicator coordinate
  const angle = progressFraction * 2 * Math.PI - Math.PI / 2;
  const tipX = center + radius * Math.cos(angle);
  const tipY = center + radius * Math.sin(angle);

  // Generate 60 tick marks around the perimeter
  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const tickAngle = (i * 6 * Math.PI) / 180 - Math.PI / 2;
    const isMajor = i % 5 === 0;
    const innerR = radius - (isMajor ? 12 : 6);
    const outerR = radius - 2;
    const x1 = center + innerR * Math.cos(tickAngle);
    const y1 = center + innerR * Math.sin(tickAngle);
    const x2 = center + outerR * Math.cos(tickAngle);
    const y2 = center + outerR * Math.sin(tickAngle);
    return { x1, y1, x2, y2, isMajor, index: i };
  });

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto py-6">
      {/* Dial SVG Container */}
      <div className="relative flex items-center justify-center">
        {/* Ambient subtle back glow */}
        <div
          className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 -z-10"
          style={{ backgroundColor: currentTheme.glow }}
        />

        <svg
          width={size}
          height={size}
          className="transform -rotate-90 select-none overflow-visible"
        >
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF7A45" />
              <stop offset="100%" stopColor="#FF3838" />
            </linearGradient>
            <linearGradient id="shortBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>

          {/* Dial Background Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-white/10"
            strokeWidth={strokeWidth}
          />

          {/* Tick marks */}
          <g className="opacity-35">
            {ticks.map((t) => (
              <line
                key={t.index}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="currentColor"
                strokeWidth={t.isMajor ? 1.5 : 0.75}
                className={t.isMajor ? 'text-white/60' : 'text-white/30'}
                strokeLinecap="round"
              />
            ))}
          </g>

          {/* Progress Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />

          {/* Progress Glowing Bead Tip */}
          {progressFraction > 0.01 && (
            <circle
              cx={tipX}
              cy={tipY}
              r={strokeWidth * 0.75}
              fill="#ffffff"
              filter="drop-shadow(0px 0px 4px rgba(255,255,255,0.8))"
              className="transition-all duration-300 ease-out"
            />
          )}
        </svg>

        {/* Central Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none pointer-events-none">
          {/* Cycle dots indicators */}
          <div className="flex items-center gap-1.5 mb-2 pointer-events-auto">
            {Array.from({ length: totalCycles }).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i < currentCycle
                    ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)] scale-110'
                    : i === currentCycle && isRunning
                    ? 'bg-white/60 animate-pulse'
                    : 'bg-white/20'
                }`}
                title={`Cycle ${i + 1}`}
              />
            ))}
          </div>

          {/* Digital Time Readout */}
          <div className="font-mono text-5xl md:text-6xl font-semibold tracking-tight text-white tabular-nums drop-shadow-sm">
            <span>{String(minutes).padStart(2, '0')}</span>
            <span
              className={`inline-block transition-opacity duration-300 ${
                isRunning ? 'opacity-90 animate-pulse' : 'opacity-60'
              }`}
            >
              :
            </span>
            <span>{String(seconds).padStart(2, '0')}</span>
          </div>

          {/* Mode Subtitle */}
          <p className="mt-1 text-xs md:text-sm font-medium tracking-wide uppercase text-neutral-400">
            {mode === 'focus' ? 'Deep Work' : mode === 'shortBreak' ? 'Short Pause' : 'Extended Rest'}
          </p>

          {/* Active task badge */}
          {activeTask ? (
            <button
              onClick={onOpenTasks}
              className="mt-3 pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/15 text-xs text-neutral-200 transition-all max-w-[200px] truncate"
              title="Click to manage tasks"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              <span className="truncate">{activeTask.title}</span>
            </button>
          ) : (
            <button
              onClick={onOpenTasks}
              className="mt-3 pointer-events-auto text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              + Link a task to focus on
            </button>
          )}
        </div>
      </div>

      {/* Primary Action Controls */}
      <div className="flex items-center gap-4 mt-8">
        {/* Reset button */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.25);
            onReset();
          }}
          className="p-3.5 rounded-full bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Reset timer (R)"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        {/* Play / Pause button */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.35);
            onTogglePlay();
          }}
          className={`flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 active:scale-95 shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-white/25 outline-none focus-visible:ring-4 focus-visible:ring-white/40 ${
            isRunning
              ? 'bg-neutral-800/90 text-white hover:bg-neutral-700/90'
              : 'bg-white text-neutral-950 hover:bg-neutral-100 hover:scale-105'
          }`}
          title={isRunning ? 'Pause (Space)' : 'Start (Space)'}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>

        {/* Skip button */}
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.25);
            onSkip();
          }}
          className="p-3.5 rounded-full bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 backdrop-blur-md transition-all duration-200 active:scale-95 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          title="Skip to next session (S)"
          aria-label="Skip session"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Time Adjusters (+5m / -1m) */}
      <div className="flex items-center gap-2 mt-4 text-xs font-mono text-neutral-400">
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onAdjustTime(-60);
          }}
          disabled={timeLeft <= 60}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5"
          title="Minus 1 minute"
        >
          <Minus className="w-3 h-3" />
          <span>1m</span>
        </button>
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onAdjustTime(60);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          title="Add 1 minute"
        >
          <Plus className="w-3 h-3" />
          <span>1m</span>
        </button>
        <button
          onClick={() => {
            if (soundEnabled) playTickSound(0.2);
            onAdjustTime(300);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          title="Add 5 minutes"
        >
          <Plus className="w-3 h-3" />
          <span>5m</span>
        </button>
      </div>
    </div>
  );
};
