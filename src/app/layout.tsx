import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#030712",
};

export const metadata: Metadata = {
  title: "AERO-SPHERE // 3D Interactive Weather Globe",
  description:
    "Interactive 3D Planetary Weather Intelligence with real-time wind streamlines, thermal heatmaps, atmospheric pressure isobars, cloud radar, and global telemetry.",
  keywords: [
    "Weather Globe",
    "3D Weather",
    "Three.js",
    "WebGL",
    "Next.js",
    "Wind Particles",
    "Meteorology",
    "Portfolio Showcase",
  ],
  authors: [{ name: "Alex Doss" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full w-full overflow-hidden bg-black text-white">{children}</body>
    </html>
  );
}
