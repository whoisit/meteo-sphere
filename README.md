# AERO-SPHERE // Planetary Weather Intelligence 🌍

An interactive, portfolio-grade 3D WebGL Weather Globe built with **Next.js 15+**, **Three.js**, custom **GLSL atmospheric shaders**, and live meteorological data from **Open-Meteo**.

![Globe Preview](https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/og.jpg)

---

## ✨ Key Showcase Features

1. **Interactive 3D Planetary Orbit**:
   - Smooth orbital rotation, zoom (from orbit to continental scale), and auto-rotation toggle.
   - Dynamic **Rayleigh atmospheric scattering glow** shader responding to camera angle and sun vector.
   - **Day/Night Terminator** with city night light networks across continents and ocean specular light reflections.

2. **Meteorological Channels & Overlays**:
   - **Wind Flow Streamlines**: Over 7,500 real-time particles streaming along global jet streams, trade winds, and cyclonic vortices with speed-dependent color coding.
   - **Thermal Scalar Field**: Dynamic global temperature heatmap with Kelvin/Celsius color ramp.
   - **Atmospheric Pressure & Isobars**: Mean Sea Level Pressure (hPa) contours with labeled Highs (`H`) and Lows (`L`).
   - **Clouds & Doppler Radar**: Swirling vortex storm spirals and equatorial convergence rain bands.
   - **Moisture & Relative Humidity**: Global water vapor saturation field.
   - **Precipitation**: Radar Doppler accumulation.

3. **Raycast Telemetry & Reverse Geocoding**:
   - Click anywhere on the oceans or land to drop a **pulsating 3D radar beacon**.
   - Samples exact Lat/Lon and fetches real-time Open-Meteo data:
     - Current temperature & "feels like"
     - Barometric surface pressure
     - Wind vector (speed, direction compass, gusts)
     - Relative humidity & cloud cover %
     - UV radiation risk index
     - 24-hour hourly forecast trend sparkline

4. **Global Search & Atmospheric Hotspots**:
   - Instant geocoding search for any city or region worldwide.
   - Quick fly-to presets (Tokyo Typhoon corridor, Icelandic Arctic Low, Sahara Subtropical High, London Jet Stream, Sydney, Rio de Janeiro, etc.).

5. **Visual Themes & Aesthetic Customization**:
   - **Photorealistic Earth** (Day/night lighting, specular water, city night lights)
   - **Cyberpunk Dark Hologram** (Neon continental networks, deep onyx void)
   - **Tactical Command** (High-contrast meteorological radar HUD)
   - Unit switching: Metric (°C, km/h, hPa) ⇄ Imperial (°F, mph, inHg)
   - Atmosphere glow intensity and streamline rate tuning sliders.

6. **Forecast Timeline Scrubber**:
   - Step through or auto-play hourly forecast horizons (Now, +3h, +6h, +12h, +24h, +48h).

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 100% Free Hosting Deployment

### Option A: Vercel (Recommended - 1 Click)
1. Push this repository to your **GitHub** account.
2. Visit [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Click **Deploy** (no environment variables or API keys required!).
5. Your portfolio showcase is live with free global CDN and SSL.

### Option B: GitHub Pages (Static Export)
Build the static site:
```bash
npm run build
```
Or export static HTML:
```bash
STATIC_EXPORT=true npm run build
```
The output will be placed in the `out/` directory, ready to be served by GitHub Pages or any static host.
