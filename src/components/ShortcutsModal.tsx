import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Start or Pause the active timer' },
    { key: 'R', desc: 'Reset timer to phase starting duration' },
    { key: 'S', desc: 'Skip to next interval (Focus / Break)' },
    { key: 'F', desc: 'Toggle Zen distraction-free mode' },
    { key: 'M', desc: 'Mute / unmute background ambient audio' },
    { key: '1, 2, 3', desc: 'Switch modes (Focus, Short Break, Long Break)' },
    { key: 'Esc', desc: 'Exit Zen mode or close modal' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-neutral-900/95 border border-white/15 p-6 shadow-2xl backdrop-blur-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-neutral-400" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {shortcuts.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-xs"
            >
              <span className="text-neutral-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-200 font-mono text-[11px] border border-white/10 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-950 bg-white rounded-xl hover:bg-neutral-200 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
