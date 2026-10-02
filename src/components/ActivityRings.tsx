import React from 'react';
import { Flame, Clock, CheckCircle2, History } from 'lucide-react';
import { DailyStats, PomodoroSettings } from '../types';

interface ActivityRingsProps {
  stats: DailyStats;
  settings: PomodoroSettings;
}

export const ActivityRings: React.FC<ActivityRingsProps> = ({ stats, settings }) => {
  // Goals calculations
  const minutesGoal = settings.dailyMinutesGoal || 120;
  const sessionsGoal = settings.dailySessionsGoal || 4;
  const streakGoal = 7; // Weekly target

  const minutesFraction = Math.min(1.5, stats.focusMinutesToday / minutesGoal);
  const sessionsFraction = Math.min(1.5, stats.sessionsCompletedToday / sessionsGoal);
  const streakFraction = Math.min(1.5, stats.streakDays / streakGoal);

  // Concentric Rings Dimensions
  const size = 180;
  const center = size / 2;
  const strokeWidth = 10;
  const gap = 4;

  const r1 = center - strokeWidth / 2 - 2; // Outer (Focus time)
  const r2 = r1 - strokeWidth - gap;      // Middle (Sessions)
  const r3 = r2 - strokeWidth - gap;      // Inner (Streak)

  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;

  const offset1 = c1 * (1 - Math.min(1, minutesFraction));
  const offset2 = c2 * (1 - Math.min(1, sessionsFraction));
  const offset3 = c3 * (1 - Math.min(1, streakFraction));

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/10 p-5 md:p-6 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Activity Rings</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Daily focus metrics and progress
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="font-mono tabular-nums text-white font-medium">{stats.streakDays}</span>
          <span>day streak</span>
        </div>
      </div>

      {/* Main Rings and Legend */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mt-6">
        {/* SVG Concentric Rings */}
        <div className="relative w-[180px] h-[180px] shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            <defs>
              <linearGradient id="ring1Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3B30" />
                <stop offset="100%" stopColor="#FF6B4A" />
              </linearGradient>
              <linearGradient id="ring2Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#30D158" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
              <linearGradient id="ring3Gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0A84FF" />
                <stop offset="100%" stopColor="#5E5CE6" />
              </linearGradient>
            </defs>

            {/* Background Tracks */}
            <circle cx={center} cy={center} r={r1} fill="none" stroke="#FF3B30" strokeOpacity={0.15} strokeWidth={strokeWidth} />
            <circle cx={center} cy={center} r={r2} fill="none" stroke="#30D158" strokeOpacity={0.15} strokeWidth={strokeWidth} />
            <circle cx={center} cy={center} r={r3} fill="none" stroke="#0A84FF" strokeOpacity={0.15} strokeWidth={strokeWidth} />

            {/* Ring 1: Focus Minutes (Outer - Red) */}
            <circle
              cx={center}
              cy={center}
              r={r1}
              fill="none"
              stroke="url(#ring1Gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={c1}
              strokeDashoffset={offset1}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Ring 2: Sessions (Middle - Green) */}
            <circle
              cx={center}
              cy={center}
              r={r2}
              fill="none"
              stroke="url(#ring2Gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={c2}
              strokeDashoffset={offset2}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />

            {/* Ring 3: Streak (Inner - Blue) */}
            <circle
              cx={center}
              cy={center}
              r={r3}
              fill="none"
              stroke="url(#ring3Gradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={c3}
              strokeDashoffset={offset3}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
        </div>

        {/* Legend & Numbers */}
        <div className="flex-1 w-full space-y-3">
          {/* Item 1: Focus Time */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] shadow-[0_0_8px_rgba(255,59,48,0.6)]" />
              <div>
                <p className="text-xs font-medium text-neutral-300">Focus Time</p>
                <p className="text-[11px] text-neutral-400">Target {minutesGoal}m</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono tabular-nums text-white">
                {stats.focusMinutesToday}
                <span className="text-xs text-neutral-400 ml-0.5">m</span>
              </p>
              <p className="text-[10px] font-mono text-neutral-400">
                {Math.round((stats.focusMinutesToday / minutesGoal) * 100)}%
              </p>
            </div>
          </div>

          {/* Item 2: Completed Sessions */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.6)]" />
              <div>
                <p className="text-xs font-medium text-neutral-300">Cycles Completed</p>
                <p className="text-[11px] text-neutral-400">Target {sessionsGoal} sessions</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono tabular-nums text-white">
                {stats.sessionsCompletedToday}
                <span className="text-xs text-neutral-400 ml-0.5">/{sessionsGoal}</span>
              </p>
              <p className="text-[10px] font-mono text-neutral-400">
                {Math.round((stats.sessionsCompletedToday / sessionsGoal) * 100)}%
              </p>
            </div>
          </div>

          {/* Item 3: Daily Streak */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF] shadow-[0_0_8px_rgba(10,132,255,0.6)]" />
              <div>
                <p className="text-xs font-medium text-neutral-300">Consistency</p>
                <p className="text-[11px] text-neutral-400">Consecutive days</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold font-mono tabular-nums text-white">
                {stats.streakDays}
                <span className="text-xs text-neutral-400 ml-0.5">d</span>
              </p>
              <p className="text-[10px] font-mono text-neutral-400">Daily Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-400 mb-3">
          <History className="w-3.5 h-3.5" />
          <span>Today's Sessions Timeline</span>
        </div>

        {stats.history.length === 0 ? (
          <p className="text-xs text-neutral-500 py-4 text-center">
            No completed sessions recorded today yet.
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {stats.history.map((record) => {
              const timeStr = new Date(record.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-neutral-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        record.mode === 'focus'
                          ? 'bg-orange-400'
                          : record.mode === 'shortBreak'
                          ? 'bg-emerald-400'
                          : 'bg-blue-400'
                      }`}
                    />
                    <span className="font-medium text-white truncate">
                      {record.taskTitle || (record.mode === 'focus' ? 'Deep Work' : 'Break')}
                    </span>
                  </div>

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-2 text-neutral-400 font-mono tabular-nums shrink-0 ml-3">
                    <span>{record.durationMinutes}m</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-500">{timeStr}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
