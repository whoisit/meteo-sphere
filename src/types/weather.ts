export type WeatherLayerType = 
  | 'wind'
  | 'temp'
  | 'pressure'
  | 'clouds'
  | 'humidity'
  | 'precipitation';

export type GlobeTheme = 'realistic' | 'dark-holo' | 'tactical-blue';

export type UnitSystem = 'metric' | 'imperial';

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface CityPreset {
  name: string;
  country: string;
  lat: number;
  lon: number;
  highlight?: string;
}

export interface CurrentWeatherTelemetry {
  lat: number;
  lon: number;
  locationName: string;
  country?: string;
  elevation?: number;
  temperature: number; // Celsius
  apparentTemperature: number;
  relativeHumidity: number; // %
  surfacePressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts?: number;
  cloudCover: number; // %
  uvIndex: number;
  precipitation: number; // mm
  weatherCode: number;
  weatherDescription: string;
  isDay: boolean;
  hourlyForecast: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    windSpeed: number[];
  };
}

export interface GlobeSettings {
  theme: GlobeTheme;
  units: UnitSystem;
  autoRotate: boolean;
  autoRotateSpeed: number;
  activeLayer: WeatherLayerType;
  showWindParticles: boolean;
  windParticleSpeed: number;
  windParticleDensity: number;
  layerOpacity: number;
  atmosphereGlow: boolean;
  atmosphereGlowIntensity: number;
  dayNightCycle: boolean;
  forecastHourOffset: number; // 0, 3, 6, 12, 24, 48
  activeFrameIndex: number; // 0..4 (NASA multi-day sequence)
}

export interface LayerMetadata {
  id: WeatherLayerType;
  label: string;
  shortDescription: string;
  unitMetric: string;
  unitImperial: string;
  colorRamp: { val: number; color: string }[];
  minVal: number;
  maxVal: number;
}
