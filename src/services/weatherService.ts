import { CityPreset, CurrentWeatherTelemetry, UnitSystem } from '../types/weather';

export const CITY_PRESETS: CityPreset[] = [
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, highlight: 'Pacific Typhoon Corridor' },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, highlight: 'Atlantic Nor’easter Zone' },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, highlight: 'North Atlantic Jet Stream' },
  { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lon: -21.9426, highlight: 'Arctic Sub-Polar Low' },
  { name: 'Cairo', country: 'Egypt', lat: 30.0444, lon: 31.2357, highlight: 'Sahara Subtropical High' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, highlight: 'ITCZ Equatorial Convergence' },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093, highlight: 'Tasman Sea Low' },
  { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lon: -43.1729, highlight: 'South Atlantic Anticyclone' },
  { name: 'Honolulu', country: 'Hawaii, USA', lat: 21.3069, lon: -157.8583, highlight: 'Central Pacific Trades' },
  { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lon: 18.4241, highlight: 'Roaring Forties Fringe' },
  { name: 'Dubai', country: 'United Arab Emirates', lat: 25.2048, lon: 55.2708, highlight: 'Arabian Gulf High Pressure' },
  { name: 'Nuuk', country: 'Greenland', lat: 64.1814, lon: -51.6941, highlight: 'Polar Vortex Outflow' },
];

export const WMO_CODE_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear Sky', icon: 'Sun' },
  1: { label: 'Mainly Clear', icon: 'SunMedium' },
  2: { label: 'Partly Cloudy', icon: 'CloudSun' },
  3: { label: 'Overcast', icon: 'Cloud' },
  45: { label: 'Fog', icon: 'CloudFog' },
  48: { label: 'Depositing Rime Fog', icon: 'CloudFog' },
  51: { label: 'Light Drizzle', icon: 'CloudDrizzle' },
  53: { label: 'Moderate Drizzle', icon: 'CloudDrizzle' },
  55: { label: 'Dense Drizzle', icon: 'CloudDrizzle' },
  61: { label: 'Slight Rain', icon: 'CloudRain' },
  63: { label: 'Moderate Rain', icon: 'CloudRain' },
  65: { label: 'Heavy Rain', icon: 'CloudRainWind' },
  71: { label: 'Slight Snow', icon: 'CloudSnow' },
  73: { label: 'Moderate Snow', icon: 'CloudSnow' },
  75: { label: 'Heavy Snow', icon: 'Snowflake' },
  77: { label: 'Snow Grains', icon: 'Snowflake' },
  80: { label: 'Slight Rain Showers', icon: 'CloudRain' },
  81: { label: 'Moderate Rain Showers', icon: 'CloudRain' },
  82: { label: 'Violent Rain Showers', icon: 'CloudRainWind' },
  85: { label: 'Slight Snow Showers', icon: 'CloudSnow' },
  86: { label: 'Heavy Snow Showers', icon: 'Snowflake' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning' },
  96: { label: 'Thunderstorm with Hail', icon: 'CloudLightning' },
  99: { label: 'Severe Thunderstorm', icon: 'CloudLightning' },
};

export function getWeatherDescription(code: number): { label: string; icon: string } {
  return WMO_CODE_MAP[code] || { label: 'Partly Cloudy', icon: 'CloudSun' };
}

// Convert units
export function formatTemp(tempC: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const f = (tempC * 9) / 5 + 32;
    return `${Math.round(f)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export function formatWind(speedKmh: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const mph = speedKmh * 0.621371;
    return `${Math.round(mph)} mph`;
  }
  return `${Math.round(speedKmh)} km/h`;
}

export function formatPressure(hPa: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const inHg = hPa * 0.02953;
    return `${inHg.toFixed(2)} inHg`;
  }
  return `${Math.round(hPa)} hPa`;
}

export function windDegToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// Reverse geocode via Open-Meteo or fallback nearest city
export async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country?: string }> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`, {
      headers: { 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const name = addr.city || addr.town || addr.village || addr.county || addr.state || data.name || 'Ocean Region';
      const country = addr.country || '';
      return { name, country };
    }
  } catch {
    // Fall through to nearest preset check
  }

  // Fallback: calculate nearest preset or oceanic quadrant
  let closest = CITY_PRESETS[0];
  let minDistance = Infinity;

  for (const city of CITY_PRESETS) {
    const dLat = city.lat - lat;
    const dLon = city.lon - lon;
    const dist = Math.sqrt(dLat * dLat + dLon * dLon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  if (minDistance < 6) {
    return { name: closest.name, country: closest.country };
  }

  const latHem = lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`;
  const lonHem = lon >= 0 ? `${lon.toFixed(1)}°E` : `${Math.abs(lon).toFixed(1)}°W`;
  return { name: `${latHem}, ${lonHem}`, country: 'Global Telemetry Point' };
}

// Fetch live weather telemetry for coordinates from Open-Meteo
export async function fetchWeatherTelemetry(lat: number, lon: number): Promise<CurrentWeatherTelemetry> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&hourly=temperature_2m,precipitation_probability,wind_speed_10m&forecast_days=2`;

  const geoPromise = reverseGeocode(lat, lon);
  const weatherPromise = fetch(url).then(r => {
    if (!r.ok) throw new Error(`Weather API returned ${r.status}`);
    return r.json();
  });

  const [geo, data] = await Promise.all([geoPromise, weatherPromise]);
  const current = data.current;
  const hourly = data.hourly;
  const weatherDesc = getWeatherDescription(current.weather_code);

  return {
    lat,
    lon,
    locationName: geo.name,
    country: geo.country,
    elevation: data.elevation,
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature,
    relativeHumidity: current.relative_humidity_2m,
    surfacePressure: current.surface_pressure,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    windGusts: current.wind_gusts_10m,
    cloudCover: current.cloud_cover,
    uvIndex: current.uv_index || 0,
    precipitation: current.precipitation || 0,
    weatherCode: current.weather_code,
    weatherDescription: weatherDesc.label,
    isDay: Boolean(current.is_day),
    hourlyForecast: {
      time: hourly.time.slice(0, 24),
      temperature: hourly.temperature_2m.slice(0, 24),
      precipitationProbability: hourly.precipitation_probability.slice(0, 24),
      windSpeed: hourly.wind_speed_10m.slice(0, 24),
    },
  };
}

// Geocoding search for city autocomplete
export async function searchCities(query: string): Promise<CityPreset[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.results) return [];

    return data.results.map((r: { name: string; country: string; latitude: number; longitude: number; admin1?: string }) => ({
      name: r.name,
      country: r.admin1 ? `${r.admin1}, ${r.country}` : r.country,
      lat: r.latitude,
      lon: r.longitude,
    }));
  } catch {
    return [];
  }
}
