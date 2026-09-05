'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { TopNav } from '../components/UI/TopNav';
import { LayerDock } from '../components/UI/LayerDock';
import { WeatherHUD } from '../components/UI/WeatherHUD';
import { CitySearchModal } from '../components/UI/CitySearchModal';
import { VisualSettingsModal } from '../components/UI/VisualSettingsModal';
import { TimelineScrubber } from '../components/UI/TimelineScrubber';
import { 
  GlobeSettings, 
  Coordinate, 
  CityPreset, 
  CurrentWeatherTelemetry,
  WeatherLayerType 
} from '../types/weather';
import { fetchWeatherTelemetry, CITY_PRESETS } from '../services/weatherService';

// Dynamic import of 3D WebGL Canvas to prevent SSR hydration errors
const WeatherGlobe = dynamic(
  () => import('../components/Globe/WeatherGlobe').then((mod) => mod.WeatherGlobe),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-sky-400 font-mono text-sm gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
        <div className="tracking-widest uppercase animate-pulse">
          INITIALIZING PLANETARY SPHERE & ATMOSPHERIC VECTORS...
        </div>
      </div>
    ),
  }
);

export default function Home() {
  // Global Settings State (autoRotate disabled for free orbit)
  const [settings, setSettings] = useState<GlobeSettings>({
    theme: 'realistic',
    units: 'metric',
    autoRotate: false,
    autoRotateSpeed: 0.5,
    activeLayer: 'wind',
    showWindParticles: true,
    windParticleSpeed: 1.0,
    windParticleDensity: 1.0,
    layerOpacity: 0.85,
    atmosphereGlow: true,
    atmosphereGlowIntensity: 1.2,
    dayNightCycle: true,
    forecastHourOffset: 0,
    activeFrameIndex: 4,
  });

  // Free Coordinates & Telemetry
  const [selectedCoord, setSelectedCoord] = useState<Coordinate | null>(null);
  const [hoverCoord, setHoverCoord] = useState<Coordinate | null>(null);

  // Telemetry Data State
  const [telemetry, setTelemetry] = useState<CurrentWeatherTelemetry | null>(null);
  const [loadingTelemetry, setLoadingTelemetry] = useState<boolean>(false);

  // Modals
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Fetch telemetry whenever selected coordinate changes
  const loadTelemetry = useCallback(async (coord: Coordinate) => {
    setLoadingTelemetry(true);
    try {
      const data = await fetchWeatherTelemetry(coord.lat, coord.lon);
      setTelemetry(data);
    } catch (err) {
      console.error('Failed to load telemetry:', err);
    } finally {
      setLoadingTelemetry(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCoord) {
      loadTelemetry(selectedCoord);
    }
  }, [selectedCoord, loadTelemetry]);

  // Handlers - Completely free camera, stays where user puts it
  const handleSelectCoordinate = (coord: Coordinate) => {
    setSelectedCoord(coord);
  };

  const handleSelectPreset = (city: CityPreset) => {
    setSelectedCoord({ lat: city.lat, lon: city.lon });
  };

  const handleUpdateSettings = (newPartial: Partial<GlobeSettings>) => {
    setSettings((prev) => ({ ...prev, ...newPartial }));
  };

  const getLayerLabel = (layer: WeatherLayerType): string => {
    switch (layer) {
      case 'wind': return 'Wind Jet Streams & Vortices';
      case 'temp': return 'Global Thermal Field';
      case 'pressure': return 'Mean Sea Level Pressure & Isobars';
      case 'clouds': return 'Satellite Cloud Swirls & Radar';
      case 'humidity': return 'Water Vapor & Moisture';
      case 'precipitation': return 'Precipitation Doppler';
      default: return layer;
    }
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* 3D WebGL Planetary Globe */}
      <WeatherGlobe
        settings={settings}
        selectedCoordinate={selectedCoord}
        onSelectCoordinate={handleSelectCoordinate}
        onHoverCoordinate={setHoverCoord}
      />

      {/* Top Header & Navigation */}
      <TopNav
        hoverCoord={hoverCoord}
        autoRotate={settings.autoRotate}
        onToggleAutoRotate={() => handleUpdateSettings({ autoRotate: !settings.autoRotate })}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSelectPreset={handleSelectPreset}
        activeLayerName={getLayerLabel(settings.activeLayer)}
      />

      {/* Weather Telemetry HUD Card (Right Panel) */}
      <WeatherHUD
        weather={telemetry}
        loading={loadingTelemetry}
        onClose={() => setSelectedCoord(null)}
        units={settings.units}
        forecastHourOffset={settings.forecastHourOffset}
      />

      {/* NASA Satellite Timeline Scrubber (Bottom Right) */}
      <TimelineScrubber
        activeFrameIndex={settings.activeFrameIndex}
        onChangeFrameIndex={(idx) => handleUpdateSettings({ activeFrameIndex: idx })}
      />

      {/* Bottom Floating Meteorological Layer Dock */}
      <LayerDock
        activeLayer={settings.activeLayer}
        onChangeLayer={(layer) => handleUpdateSettings({ activeLayer: layer })}
        showWindParticles={settings.showWindParticles}
        onToggleWindParticles={() =>
          handleUpdateSettings({ showWindParticles: !settings.showWindParticles })
        }
        windParticleSpeed={settings.windParticleSpeed}
        onChangeWindSpeed={(speed) => handleUpdateSettings({ windParticleSpeed: speed })}
        layerOpacity={settings.layerOpacity}
        onChangeOpacity={(opacity) => handleUpdateSettings({ layerOpacity: opacity })}
        units={settings.units}
      />

      {/* City Search & Preset Dialog */}
      <CitySearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCity={handleSelectPreset}
      />

      {/* Visual Settings & Aesthetic Customization Dialog */}
      <VisualSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Vignette Edge Shading */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]" />
    </main>
  );
}
