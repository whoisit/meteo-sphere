'use client';

import React from 'react';
import { 
  X, 
  Wind, 
  Droplets, 
  Gauge, 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudLightning, 
  Snowflake, 
  CloudFog,
  Navigation,
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';
import { CurrentWeatherTelemetry, UnitSystem } from '../../types/weather';
import { formatTemp, formatWind, formatPressure, windDegToCompass } from '../../services/weatherService';

interface WeatherHUDProps {
  weather: CurrentWeatherTelemetry | null;
  loading: boolean;
  onClose: () => void;
  units: UnitSystem;
  forecastHourOffset?: number;
}

export const WeatherHUD: React.FC<WeatherHUDProps> = ({
  weather,
  loading,
  onClose,
  units,
  forecastHourOffset = 0,
}) => {
  if (!weather && !loading) return null;

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="w-8 h-8 text-amber-400 animate-spin" style={{ animationDuration: '20s' }} />;
    if (code === 1 || code === 2) return <CloudSun className="w-8 h-8 text-amber-300" />;
    if (code === 3) return <Cloud className="w-8 h-8 text-zinc-300" />;
    if (code === 45 || code === 48) return <CloudFog className="w-8 h-8 text-zinc-400" />;
    if (code >= 51 && code <= 65) return <CloudRain className="w-8 h-8 text-sky-400" />;
    if (code >= 71 && code <= 86) return <Snowflake className="w-8 h-8 text-sky-200" />;
    if (code >= 95) return <CloudLightning className="w-8 h-8 text-amber-400 animate-bounce" />;
    return <CloudSun className="w-8 h-8 text-sky-300" />;
  };

  const uvRisk = (uv: number) => {
    if (uv <= 2) return { label: 'Low', color: 'text-emerald-400' };
    if (uv <= 5) return { label: 'Moderate', color: 'text-amber-400' };
    if (uv <= 7) return { label: 'High', color: 'text-orange-400' };
    return { label: 'Very High', color: 'text-rose-400' };
  };

  // Extract forecasted temperature and wind at the active timeline hour
  const hIndex = Math.min(forecastHourOffset, 23);
  const activeTemp = weather?.hourlyForecast?.temperature?.[hIndex] ?? weather?.temperature ?? 0;
  const activeWind = weather?.hourlyForecast?.windSpeed?.[hIndex] ?? weather?.windSpeed ?? 0;
  const activePrecipProb = weather?.hourlyForecast?.precipitationProbability?.[hIndex] ?? 0;

  return (
    <div className="absolute top-20 right-4 md:right-6 z-30 w-[90vw] max-w-sm rounded-3xl bg-zinc-950/85 border border-zinc-800/80 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 pointer-events-auto">
      {/* Header Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-emerald-400 to-amber-400" />

      {loading ? (
        <div className="p-6 flex flex-col items-center justify-center gap-3 text-center min-h-[260px]">
          <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
          <div className="font-mono text-xs text-zinc-400 tracking-wider">
            INTERCEPTING ATMOSPHERIC TELEMETRY...
          </div>
        </div>
      ) : weather ? (
        <div className="p-5 space-y-4">
          {/* Top Bar: Location & Close */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  {weather.locationName}
                </h2>
                {weather.country && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300">
                    {weather.country}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-sky-400/90 mt-0.5">
                {weather.lat >= 0 ? `${weather.lat.toFixed(2)}°N` : `${Math.abs(weather.lat).toFixed(2)}°S`},{' '}
                {weather.lon >= 0 ? `${weather.lon.toFixed(2)}°E` : `${Math.abs(weather.lon).toFixed(2)}°W`}
                {weather.elevation ? ` • ${Math.round(weather.elevation)}m ASL` : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Main Temp & Condition */}
          <div className="flex items-center justify-between py-2 border-y border-zinc-800/70">
            <div className="flex items-center gap-3">
              {getWeatherIcon(weather.weatherCode)}
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-white font-mono">
                    {formatTemp(activeTemp, units)}
                  </span>
                  {forecastHourOffset > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      <Clock className="w-3 h-3" />
                      +{forecastHourOffset}h Outlook
                    </span>
                  )}
                </div>
                <div className="text-xs text-zinc-400">
                  {forecastHourOffset === 0
                    ? `Feels like ${formatTemp(weather.apparentTemperature, units)}`
                    : `Precipitation probability: ${activePrecipProb}%`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">
                {weather.weatherDescription}
              </span>
              <div className="text-[11px] font-mono text-zinc-500 mt-1">
                {weather.isDay ? 'Daylight cycle' : 'Night hemisphere'}
              </div>
            </div>
          </div>

          {/* Meteorological Metric Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Wind Vector */}
            <div className="p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-mono">Wind Vector</span>
                <Wind className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="flex items-center gap-2">
                <Navigation
                  className="w-3.5 h-3.5 text-sky-400 transition-transform"
                  style={{ transform: `rotate(${weather.windDirection}deg)` }}
                />
                <span className="text-sm font-semibold font-mono text-zinc-100">
                  {formatWind(activeWind, units)}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {windDegToCompass(weather.windDirection)}
                </span>
              </div>
            </div>

            {/* Barometric Pressure */}
            <div className="p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-mono">Pressure</span>
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm font-semibold font-mono text-zinc-100">
                {formatPressure(weather.surfacePressure, units)}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                {weather.surfacePressure > 1013.25 ? 'High Pressure' : 'Low Pressure'}
              </div>
            </div>

            {/* Relative Humidity */}
            <div className="p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-mono">Humidity</span>
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold font-mono text-zinc-100">
                {weather.relativeHumidity}%
              </div>
              <div className="text-[10px] text-zinc-500 font-mono">
                Clouds: {weather.cloudCover}%
              </div>
            </div>

            {/* UV Radiation Index */}
            <div className="p-2.5 rounded-2xl bg-zinc-900/50 border border-zinc-800/60">
              <div className="flex items-center justify-between text-zinc-400 mb-1">
                <span className="text-[11px] font-mono">UV Radiation</span>
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold font-mono text-zinc-100">
                  {weather.uvIndex.toFixed(1)}
                </span>
                <span className={`text-[10px] font-mono ${uvRisk(weather.uvIndex).color}`}>
                  ({uvRisk(weather.uvIndex).label})
                </span>
              </div>
            </div>
          </div>

          {/* 24-Hour Mini Forecast Chart */}
          {weather.hourlyForecast && weather.hourlyForecast.temperature.length > 0 && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-sky-400" />
                  24-Hour Outlook
                </span>
                <span className="text-[10px] text-zinc-500">Hourly Forecast</span>
              </div>

              {/* Sparkline Columns with Active Timeline Highlight */}
              <div className="flex items-end gap-1 h-14 w-full bg-zinc-900/40 p-1.5 rounded-xl border border-zinc-800/50 overflow-x-auto">
                {weather.hourlyForecast.temperature.slice(0, 16).map((t, idx) => {
                  const min = Math.min(...weather.hourlyForecast.temperature);
                  const max = Math.max(...weather.hourlyForecast.temperature);
                  const range = Math.max(1, max - min);
                  const heightPct = Math.max(15, ((t - min) / range) * 85);
                  const timeLabel = weather.hourlyForecast.time[idx]?.split('T')[1]?.slice(0, 5) || `${idx}h`;
                  const isCurrentHour = idx === hIndex;

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                      title={`${timeLabel}: ${formatTemp(t, units)}`}
                    >
                      <div
                        className={`w-full rounded-t-sm transition-all ${
                          isCurrentHour
                            ? 'bg-amber-400 shadow-md shadow-amber-400/50 ring-1 ring-amber-300'
                            : 'bg-sky-500/60 group-hover:bg-sky-400'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
