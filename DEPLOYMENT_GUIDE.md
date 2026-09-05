# METEO-SPHERE // Deployment & Setup Guide 🌍

This guide walks you through deploying **METEO-SPHERE** for free and running it locally.

* **GitHub Repository**: [https://github.com/whoisit/meteo-sphere](https://github.com/whoisit/meteo-sphere)
* **Tech Stack**: Next.js 15 (Turbopack), React 19, TypeScript, Three.js, Tailwind CSS, NASA GIBS, NOAA GFS.

---

## 🚀 Option 1: 1-Click Free Hosting on Vercel (Recommended)

Vercel provides free global edge hosting, automatic SSL certificates, and zero configuration for Next.js projects.

### Step-by-Step:
1. Log in to [Vercel](https://vercel.com) (sign in with your GitHub account **whoisit**).
2. Go to [https://vercel.com/new](https://vercel.com/new).
3. Under **Import Git Repository**, search for and select:
   ```
   whoisit/meteo-sphere
   ```
4. Keep the default settings:
   * **Framework Preset**: Next.js (automatically detected)
   * **Root Directory**: `./`
   * **Build Command**: `npm run build`
   * **Output Directory**: `.next`
   * **Environment Variables**: *None needed!* (All NASA and Open-Meteo services are free and open-source).
5. Click **Deploy**.
6. Within ~45 seconds, your 3D weather globe will be live at a URL like:
   ```
   https://meteo-sphere.vercel.app
   ```
7. *(Optional)* In Vercel's **Settings > Domains**, you can bind your own custom domain for free.

> Every time you run `git push` to your `master` branch in the future, Vercel will automatically build and deploy the update.

---

## 💻 Option 2: Running Locally

If you want to run or test the project locally on your machine:

```bash
# 1. Clone the repository (if on another machine)
git clone https://github.com/whoisit/meteo-sphere.git
cd meteo-sphere

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

Open your browser and visit:
[http://localhost:3000](http://localhost:3000)

---

## 📦 Option 3: Static Export to GitHub Pages

If you prefer hosting on GitHub Pages instead of Vercel:

```bash
# In PowerShell:
$env:STATIC_EXPORT="true"; npm run build

# Or in bash:
STATIC_EXPORT=true npm run build
```

This compiles the static HTML/JS assets into the `/out` folder, which can be deployed directly to GitHub Pages or any static CDN.

---

## 🔬 Project Architecture & Features

| Feature | Details |
| :--- | :--- |
| **High-Res Earth Surface** | Photographic NASA Blue Marble 2K surface, night lights, specular ocean reflections, and topography elevation with $16\times$ anisotropic filtering. |
| **NASA GIBS Precipitation** | Real satellite radar observations from the NASA/JAXA **GPM / IMERG** mission (`IMERG_Precipitation_Rate`). |
| **NASA GIBS Clouds** | Real optical satellite captures from NASA's **MODIS Terra** radiometer (`MODIS_Terra_CorrectedReflectance_TrueColor`). |
| **NASA GIBS Moisture** | Atmospheric column water vapor soundings (`MODIS_Terra_Water_Vapor_5km_Day`). |
| **NASA GIBS Temperature** | Global Sea & Land Surface thermal radiometry (`GHRSST_L4_MUR_Sea_Surface_Temperature`). |
| **Wind Flow Dynamics** | 8,000 streamline particles driven by the **NOAA GFS** physical vector field. |
| **Horizon Culling Optimization** | Camera-aware culling skips calculations for particles on the dark/hidden side of the Earth, cutting CPU/GPU costs by 50%. |
| **24-Hour Browser Disk Cache** | Uses the browser's `CacheStorage` API (`window.caches`) to store downloaded satellite imagery for 24 hours. Repeat visits make 0 network requests to NASA. |
| **Free 3D Orbit Controls** | Unrestricted 3D orbital inspection with smooth damping and no forced camera repositioning. |
