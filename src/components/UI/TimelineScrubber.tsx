'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Calendar } from 'lucide-react';
import { getNasaTimeFrames, NasaTimeFrame } from '../../services/nasaGibsService';

interface TimelineScrubberProps {
  activeFrameIndex: number;
  onChangeFrameIndex: (index: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  activeFrameIndex,
  onChangeFrameIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frames, setFrames] = useState<NasaTimeFrame[]>([]);

  useEffect(() => {
    setFrames(getNasaTimeFrames());
  }, []);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) return;

    const interval = setInterval(() => {
      onChangeFrameIndex((activeFrameIndex + 1) % frames.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, activeFrameIndex, frames.length, onChangeFrameIndex]);

  if (frames.length === 0) return null;

  return (
    <div className="absolute bottom-24 right-4 md:right-6 z-30 flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-xl shadow-2xl pointer-events-auto">
      {/* Play / Pause Toggle */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className={`p-2 rounded-xl border transition-all ${
          isPlaying
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10'
            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
        }`}
        title={isPlaying ? 'Pause Satellite Animation' : 'Play NASA Satellite Sequence'}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
      </button>

      {/* Calendar Icon & Dates */}
      <div className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5 text-zinc-500 ml-1 mr-0.5 hidden sm:block" />
        {frames.map((frame) => {
          const isSelected = activeFrameIndex === frame.index;
          return (
            <button
              key={frame.dateStr}
              onClick={() => {
                setIsPlaying(false);
                onChangeFrameIndex(frame.index);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                isSelected
                  ? 'bg-sky-500/25 border border-sky-500/50 text-sky-300 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
              }`}
              title={`NASA Satellite Capture: ${frame.dateStr}`}
            >
              {frame.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
