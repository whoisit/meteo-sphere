'use client';

import React from 'react';
import { X, Sparkles, Moon, Sun, Sliders, Eye } from 'lucide-react';
import { GlobeSettings, GlobeTheme, UnitSystem } from '../../types/weather';

interface VisualSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobeSettings;
  onUpdateSettings: (newSettings: Partial<GlobeSettings>) => void;
}

export const VisualSettingsModal: React.FC<VisualSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const themes: { id: GlobeTheme; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
    {
      id: 'realistic',
      label: 'Photorealistic Earth',
      icon: Sun,
      desc: 'Day/night terminator, specular ocean, city night lights',
    },
    {
      id: 'dark-holo',
      label: 'Cyberpunk Hologram',
      icon: Sparkles,
      desc: 'Glowing continental neon networks on deep onyx void',
    },
    {
      id: 'tactical-blue',
      label: 'Tactical Command',
      icon: Moon,
      desc: 'High-contrast meteorological radar HUD aesthetic',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Viewport & Atmosphere Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Visual Theme */}
          <div>
            <label className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase mb-2 block">
              Planetary Rendering Mode
            </label>
            <div className="space-y-2">
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onUpdateSettings({ theme: t.id })}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 text-white shadow-lg shadow-sky-500/10'
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl ${
                        isSelected ? 'bg-sky-500/20 text-sky-400' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">{t.label}</div>
                      <div className="text-[11px] text-zinc-500">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Unit System */}
          <div>
            <label className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase mb-2 block">
              Measurement Units
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['metric', 'imperial'] as UnitSystem[]).map((u) => (
                <button
                  key={u}
                  onClick={() => onUpdateSettings({ units: u })}
                  className={`py-2 px-3 rounded-xl text-xs font-mono capitalize transition-all border ${
                    settings.units === u
                      ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40'
                  }`}
                >
                  {u === 'metric' ? 'Metric (°C, km/h, hPa)' : 'Imperial (°F, mph, inHg)'}
                </button>
              ))}
            </div>
          </div>

          {/* Atmosphere Glow Toggle & Slider */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300">Rayleigh Atmosphere Glow</span>
              <button
                onClick={() => onUpdateSettings({ atmosphereGlow: !settings.atmosphereGlow })}
                className={`p-1.5 rounded-lg border text-xs font-mono ${
                  settings.atmosphereGlow
                    ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
            {settings.atmosphereGlow && (
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={settings.atmosphereGlowIntensity}
                  onChange={(e) =>
                    onUpdateSettings({ atmosphereGlowIntensity: parseFloat(e.target.value) })
                  }
                  className="w-full accent-sky-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <span className="text-xs font-mono text-zinc-400 w-8 text-right">
                  {settings.atmosphereGlowIntensity.toFixed(1)}x
                </span>
              </div>
            )}
          </div>

          {/* Auto Rotation Speed */}
          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
              <span>Planetary Orbit Velocity</span>
              <span className="text-sky-400">{settings.autoRotateSpeed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.0"
              step="0.1"
              value={settings.autoRotateSpeed}
              onChange={(e) =>
                onUpdateSettings({ autoRotateSpeed: parseFloat(e.target.value) })
              }
              className="w-full accent-sky-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
