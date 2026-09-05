'use client';

import React, { useState } from 'react';
import { 
  Wind, 
  Thermometer, 
  Gauge, 
  CloudRain, 
  Droplets, 
  CloudSun,
  SlidersHorizontal,
  Eye,
  EyeOff,
  Radio
} from 'lucide-react';
import { WeatherLayerType, UnitSystem } from '../../types/weather';

interface LayerDockProps {
  activeLayer: WeatherLayerType;
  onChangeLayer: (layer: WeatherLayerType) => void;
  showWindParticles: boolean;
  onToggleWindParticles: () => void;
  windParticleSpeed: number;
  onChangeWindSpeed: (speed: number) => void;
  layerOpacity: number;
  onChangeOpacity: (opacity: number) => void;
  units: UnitSystem;
}

interface LayerItem {
  id: WeatherLayerType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  source: string;
}

const LAYERS: LayerItem[] = [
  { id: 'wind', label: 'Wind Flow', icon: Wind, description: 'Live GFS vector particle physics', source: 'NOAA GFS / ECMWF 84-Point Grid' },
  { id: 'temp', label: 'Temperature', icon: Thermometer, description: 'Live 2m thermal scalar field', source: 'Open-Meteo GFS Global Model' },
  { id: 'pressure', label: 'Pressure', icon: Gauge, description: 'Live MSLP isobars, Highs & Lows', source: 'DWD ICON / ECMWF Surface Pressure' },
  { id: 'clouds', label: 'Clouds/Radar', icon: CloudSun, description: 'NASA satellite imagery & storm radar', source: 'NASA GIBS (MODIS / VIIRS Terra/Aqua)' },
  { id: 'humidity', label: 'Moisture', icon: Droplets, description: 'Relative humidity & water vapor', source: 'NASA GIBS AIRS / Open-Meteo' },
  { id: 'precipitation', label: 'Precipitation', icon: CloudRain, description: 'NASA IMERG 30-min global radar', source: 'NASA GIBS GPM / IMERG Radar' },
];

export const LayerDock: React.FC<LayerDockProps> = ({
  activeLayer,
  onChangeLayer,
  showWindParticles,
  onToggleWindParticles,
  windParticleSpeed,
  onChangeWindSpeed,
  layerOpacity,
  onChangeOpacity,
  units,
}) => {
  const [controlsOpen, setControlsOpen] = useState(false);

  const currentLayerObj = LAYERS.find(l => l.id === activeLayer) || LAYERS[0];

  const renderLegend = () => {
    switch (activeLayer) {
      case 'temp':
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">{units === 'imperial' ? '-40°F' : '-40°C'}</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-violet-600 via-sky-400 via-emerald-400 via-amber-400 to-rose-600 border border-white/10" />
            <span className="text-[10px] font-mono text-zinc-400">{units === 'imperial' ? '+113°F' : '+45°C'}</span>
          </div>
        );
      case 'pressure':
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-indigo-400">980 L</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-indigo-600 via-sky-500 via-teal-400 to-amber-400 border border-white/10" />
            <span className="text-[10px] font-mono text-amber-400">1035 H</span>
            <span className="text-[9px] font-mono text-zinc-500">hPa</span>
          </div>
        );
      case 'clouds':
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">Clear</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-transparent via-white/70 via-emerald-500 to-rose-600 border border-white/10" />
            <span className="text-[10px] font-mono text-rose-400">Dense</span>
          </div>
        );
      case 'humidity':
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-amber-300">10% Dry</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-amber-700 via-sky-500 to-blue-600 border border-white/10" />
            <span className="text-[10px] font-mono text-sky-400">100% Sat</span>
          </div>
        );
      case 'precipitation':
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400">0 mm</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-transparent via-emerald-500 via-amber-400 via-rose-500 to-fuchsia-600 border border-white/10" />
            <span className="text-[10px] font-mono text-fuchsia-400">50+ mm</span>
          </div>
        );
      case 'wind':
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-sky-400">0</span>
            <div className="h-2 w-28 md:w-36 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-amber-400 to-fuchsia-500 border border-white/10" />
            <span className="text-[10px] font-mono text-fuchsia-400">120+</span>
            <span className="text-[9px] font-mono text-zinc-500">{units === 'imperial' ? 'mph' : 'km/h'}</span>
          </div>
        );
    }
  };

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 pointer-events-auto max-w-[95vw]">
      {/* Real Data Source Indicator Pill */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md text-[10px] font-mono text-zinc-400 shadow-lg">
        <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
        <span className="text-zinc-300 font-semibold uppercase">{currentLayerObj.label}</span>
        <span className="text-zinc-600">•</span>
        <span className="text-sky-400">{currentLayerObj.source}</span>
      </div>

      {/* Expanded Tuning Bar */}
      {controlsOpen && (
        <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 border-r border-zinc-800 pr-3">
            <button
              onClick={onToggleWindParticles}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                showWindParticles
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}
            >
              {showWindParticles ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Streamlines</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">Flow Rate:</span>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={windParticleSpeed}
              onChange={(e) => onChangeWindSpeed(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-zinc-400">Opacity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={layerOpacity}
              onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
              className="w-20 accent-sky-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      )}

      {/* Main Glassmorphic Dock */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-1">
          {LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isActive = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => onChangeLayer(layer.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-500/20 border border-sky-500/40 text-sky-200 shadow-lg shadow-sky-500/10'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent'
                }`}
                title={`${layer.label}: ${layer.description}`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-sky-400' : 'text-zinc-400'
                  }`}
                />
                <span className="hidden sm:inline font-sans">{layer.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-6 w-px bg-zinc-800 mx-1 hidden md:block" />

        <div className="hidden md:flex items-center px-2">
          {renderLegend()}
        </div>

        <div className="h-6 w-px bg-zinc-800 mx-1" />

        <button
          onClick={() => setControlsOpen(!controlsOpen)}
          className={`p-2 rounded-xl border transition-all ${
            controlsOpen
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
          }`}
          title="Layer Tuning Controls"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
