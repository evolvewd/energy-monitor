// frontend/src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TvccProvider } from "@/contexts/TvccContext";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Energy Monitor Dashboard | ASSISTEC",
  description:
    "Sistema di monitoraggio energetico in tempo reale con Arduino Opta, InfluxDB e Node-RED",
  keywords:
    "energy monitoring, arduino opta, influxdb, node-red, iot, dashboard",
  authors: [{ name: "ASSISTEC" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#020817" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        style={{ margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#252525', position: 'fixed', width: '100%', height: '100%', touchAction: 'pan-x' }}
        suppressHydrationWarning
      >
        <TvccProvider>{children}</TvccProvider>
      </body>
    </html>
  );
}
