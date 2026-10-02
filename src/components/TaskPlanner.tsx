import React, { useState } from 'react';
import { Plus, Check, Trash2, Target, Circle, CheckCircle } from 'lucide-react';
import { TaskItem } from '../types';
import { playTickSound } from '../utils/audio';

interface TaskPlannerProps {
  tasks: TaskItem[];
  activeTaskId: string | null;
  onSelectActiveTask: (taskId: string | null) => void;
  onAddTask: (title: string, category: string, targetPomodoros: number) => void;
  onToggleCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  soundEnabled: boolean;
}

export const TaskPlanner: React.FC<TaskPlannerProps> = ({
  tasks,
  activeTaskId,
  onSelectActiveTask,
  onAddTask,
  onToggleCompleteTask,
  onDeleteTask,
  soundEnabled,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Deep Work');
  const [targetCount, setTargetCount] = useState(2);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const categories = ['Deep Work', 'Engineering', 'Design', 'Writing', 'Reading'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    if (soundEnabled) playTickSound(0.25);
    onAddTask(newTitle.trim(), newCategory, targetCount);
    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/10 p-5 md:p-6 shadow-2xl">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">Focus Tasks</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Link an active task to your timer cycles
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-black/30 rounded-xl border border-white/5">
          {(['all', 'active', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (soundEnabled) playTickSound(0.2);
                setFilter(tab);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                filter === tab
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Task Form */}
      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Add a task to focus on..."
            className="flex-1 bg-black/30 text-white placeholder-neutral-500 text-sm px-3.5 py-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all"
          />
          <button
            type="submit"
            disabled={!newTitle.trim()}
            className="flex items-center gap-1 px-4 py-2.5 bg-white text-neutral-950 font-medium text-xs rounded-xl hover:bg-neutral-200 disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Category & Target Pomodoros Options */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400 px-1">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider">Tag:</span>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`px-2 py-0.5 rounded-md text-[11px] transition-colors ${
                  newCategory === cat
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">Target cycles:</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 6].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setTargetCount(num)}
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                    targetCount === num
                      ? 'bg-orange-500 text-white font-bold'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* Task List */}
      <div className="mt-5 space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 text-xs">
            {filter === 'completed'
              ? 'No completed tasks yet. Finish a focus cycle to check items off!'
              : 'No tasks in this list. Enter a task above to structure your focus.'}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isActive = activeTaskId === task.id;
            return (
              <div
                key={task.id}
                className={`group flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all duration-200 ${
                  isActive
                    ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(255,107,74,0.1)]'
                    : 'bg-white/5 hover:bg-white/[0.08] border-white/5'
                }`}
              >
                {/* Complete Checkbox */}
                <button
                  onClick={() => {
                    if (soundEnabled) playTickSound(0.25);
                    onToggleCompleteTask(task.id);
                  }}
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0 ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-white/30 hover:border-white/60 text-transparent'
                  }`}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm font-medium truncate ${
                        task.completed ? 'line-through text-neutral-500' : 'text-neutral-100'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>

                  {/* Clean unboxed metadata (anti-pill rule) */}
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                    {task.category && (
                      <>
                        <span className="text-neutral-400">{task.category}</span>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                      </>
                    )}
                    <span className="font-mono tabular-nums text-neutral-400">
                      {task.pomodorosSpent} of {task.targetPomodoros} cycles
                    </span>
                    {isActive && (
                      <>
                        <span aria-hidden="true" className="text-neutral-600">·</span>
                        <span className="text-orange-400 font-medium">Currently active</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Focus on this toggle */}
                  {!task.completed && (
                    <button
                      onClick={() => {
                        if (soundEnabled) playTickSound(0.25);
                        onSelectActiveTask(isActive ? null : task.id);
                      }}
                      className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition-colors ${
                        isActive
                          ? 'bg-orange-500 text-white font-medium'
                          : 'bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white'
                      }`}
                      title={isActive ? 'Clear focus' : 'Focus on this task'}
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isActive ? 'Focused' : 'Focus'}</span>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (soundEnabled) playTickSound(0.2);
                      onDeleteTask(task.id);
                    }}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
