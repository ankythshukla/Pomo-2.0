import React from 'react';
import { Volume2, VolumeX, CloudRain, Wind, Waves, Radio } from 'lucide-react';
import { AmbientSoundType } from '../types';
import { ambientPlayer, playTickSound } from '../utils/audio';

interface AmbientSoundBarProps {
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onChangeSound: (type: AmbientSoundType) => void;
  onChangeVolume: (volume: number) => void;
  soundEnabled: boolean;
}

export const AmbientSoundBar: React.FC<AmbientSoundBarProps> = ({
  ambientSound,
  ambientVolume,
  onChangeSound,
  onChangeVolume,
  soundEnabled,
}) => {
  const soundOptions: { id: AmbientSoundType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'none', label: 'Off', icon: VolumeX },
    { id: 'rain', label: 'Rain', icon: CloudRain },
    { id: 'white-noise', label: 'White Noise', icon: Wind },
    { id: 'binaural', label: 'Alpha 10Hz', icon: Waves },
    { id: 'deep-drone', label: 'Deep Space', icon: Radio },
  ];

  const handleSelect = (type: AmbientSoundType) => {
    if (soundEnabled) playTickSound(0.25);
    onChangeSound(type);
    ambientPlayer.play(type, ambientVolume);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeVolume(val);
    ambientPlayer.setVolume(val);
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/10 p-4 md:p-5 shadow-xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-neutral-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            Ambient Background Audio
          </span>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambientVolume}
            onChange={handleVolumeChange}
            disabled={ambientSound === 'none'}
            className="w-24 md:w-32 accent-white disabled:opacity-30 disabled:pointer-events-none"
            aria-label="Ambient volume"
          />
          <span className="text-xs font-mono tabular-nums text-neutral-400 w-8 text-right">
            {Math.round(ambientVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Preset pills */}
      <div className="grid grid-cols-5 gap-1.5 p-1 bg-black/30 rounded-2xl border border-white/5">
        {soundOptions.map((item) => {
          const isActive = ambientSound === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs transition-all duration-200 ${
                isActive
                  ? 'bg-white/15 text-white font-medium shadow-sm border border-white/15'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
              <span className="text-[11px] truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
