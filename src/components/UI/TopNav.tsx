'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Search, 
  Sliders, 
  RotateCw, 
  Compass, 
  MapPin, 
  Activity,
  Layers
} from 'lucide-react';
import { Coordinate, CityPreset } from '../../types/weather';
import { CITY_PRESETS } from '../../services/weatherService';

interface TopNavProps {
  hoverCoord: Coordinate | null;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onSelectPreset: (city: CityPreset) => void;
  activeLayerName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  hoverCoord,
  autoRotate,
  onToggleAutoRotate,
  onOpenSearch,
  onOpenSettings,
  onSelectPreset,
  activeLayerName,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [presetOpen, setPresetOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 md:px-6 pointer-events-none">
      {/* Brand & Mission Status */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-400/30 text-sky-400 backdrop-blur-md shadow-lg shadow-sky-500/5">
          <Globe2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold tracking-widest text-sky-400 uppercase">
              METEO-SPHERE
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1" />
              LIVE TELEMETRY
            </span>
          </div>
          <h1 className="text-sm md:text-base font-medium tracking-tight text-zinc-100 drop-shadow-md">
            Planetary Weather Intelligence
          </h1>
        </div>
      </div>

      {/* Center: Live Hover Telemetry & UTC Clock */}
      <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-full bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md text-xs font-mono text-zinc-300 pointer-events-auto shadow-xl">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span>{utcTime || 'SYNCHRONIZING UTC...'}</span>
        </div>

        <span className="w-1 h-1 rounded-full bg-zinc-700" />

        <div className="flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            {hoverCoord ? (
              <span>
                {hoverCoord.lat >= 0
                  ? `${hoverCoord.lat.toFixed(1)}°N`
                  : `${Math.abs(hoverCoord.lat).toFixed(1)}°S`}
                ,{' '}
                {hoverCoord.lon >= 0
                  ? `${hoverCoord.lon.toFixed(1)}°E`
                  : `${Math.abs(hoverCoord.lon).toFixed(1)}°W`}
              </span>
            ) : (
              <span className="text-zinc-500">ORBIT VIEWPORT</span>
            )}
          </span>
        </div>

        <span className="w-1 h-1 rounded-full bg-zinc-700" />

        <div className="flex items-center gap-1.5 text-sky-300">
          <Layers className="w-3.5 h-3.5" />
          <span className="uppercase">{activeLayerName}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Preset Locations Dropdown */}
        <div className="relative">
          <button
            onClick={() => setPresetOpen(!presetOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-md text-xs font-medium text-zinc-200 transition-all shadow-lg"
            title="Meteorological Presets"
          >
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Presets</span>
          </button>

          {presetOpen && (
            <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[10px] font-mono font-semibold tracking-wider text-zinc-400 uppercase border-b border-zinc-800/60 mb-1">
                Atmospheric Hotspots
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1">
                {CITY_PRESETS.map((city) => (
                  <button
                    key={city.name}
                    onClick={() => {
                      onSelectPreset(city);
                      setPresetOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-800/70 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-zinc-100 group-hover:text-sky-300">
                        {city.name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {city.country}
                      </span>
                    </div>
                    {city.highlight && (
                      <p className="text-[10px] text-sky-400/80 font-mono truncate mt-0.5">
                        {city.highlight}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search City Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-md text-xs font-medium text-zinc-200 transition-all shadow-lg group"
          title="Search Global Coordinates & Cities"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400 group-hover:text-sky-400 transition-colors" />
          <span className="hidden sm:inline">Search</span>
        </button>

        {/* Auto Rotate Toggle */}
        <button
          onClick={onToggleAutoRotate}
          className={`p-2 rounded-xl border backdrop-blur-md transition-all shadow-lg ${
            autoRotate
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              : 'bg-zinc-900/70 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
          }`}
          title={autoRotate ? 'Pause Rotation' : 'Auto Rotate Globe'}
        >
          <RotateCw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
        </button>

        {/* Settings Modal Trigger */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-zinc-900/70 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 backdrop-blur-md text-zinc-300 hover:text-white transition-all shadow-lg"
          title="Visual Theme & Units"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
