'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, MapPin, Compass, ArrowRight, Loader2 } from 'lucide-react';
import { CityPreset } from '../../types/weather';
import { searchCities, CITY_PRESETS } from '../../services/weatherService';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: CityPreset) => void;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CityPreset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await searchCities(query.trim());
      setResults(res);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl overflow-hidden">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800/80">
          <Search className="w-5 h-5 text-sky-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any global city, coordinate, or region..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none font-sans"
          />
          {loading && <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />}
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-96 overflow-y-auto space-y-4">
          {/* Query Results */}
          {results.length > 0 && (
            <div>
              <h3 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase mb-2">
                Search Results
              </h3>
              <div className="space-y-1">
                {results.map((r, i) => (
                  <button
                    key={`${r.name}-${r.lat}-${i}`}
                    onClick={() => {
                      onSelectCity(r);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-zinc-800/60 transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="text-sm font-medium text-white group-hover:text-sky-300">
                          {r.name}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {r.country}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                      <span>{r.lat.toFixed(1)}°, {r.lon.toFixed(1)}°</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-sky-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preset Hotspots */}
          <div>
            <h3 className="text-xs font-mono font-semibold tracking-wider text-zinc-400 uppercase mb-2 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              Global Meteorological Hubs
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {CITY_PRESETS.slice(0, 8).map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    onSelectCity(city);
                    onClose();
                  }}
                  className="flex flex-col p-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-800/70 border border-zinc-800/60 hover:border-zinc-700 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white group-hover:text-sky-300">
                      {city.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {city.country}
                    </span>
                  </div>
                  {city.highlight && (
                    <span className="text-[10px] text-sky-400/80 font-mono truncate mt-0.5">
                      {city.highlight}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
