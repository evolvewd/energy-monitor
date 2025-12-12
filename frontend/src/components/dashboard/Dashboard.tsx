"use client";

import { useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
} from "lucide-react";
import Image from "next/image";
import houseImage from "@/images/house.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeslaSidebar } from "@/components/shared/TeslaSidebar";
import { TeslaTopBar } from "@/components/shared/TeslaTopBar";
import { FullWeather } from "@/components/weather/FullWeather";
import { CompactWeather } from "@/components/weather/CompactWeather";
import { ForecastWeather } from "@/components/weather/ForecastWeather";
import { PhotovoltaicSummary } from "@/components/dashboard/PhotovoltaicSummary";

interface AlloggioData {
  id: string;
  name: string;
  v_rms: number;
  i_rms: number;
  p_active: number;
  range: number;
  consumption: number;
  capacity: number;
}

export function Dashboard() {
  const [currentSpeed, setCurrentSpeed] = useState(64);
  const [selectedGear, setSelectedGear] = useState("D");
  const [isPlaying, setIsPlaying] = useState(false);
  const [acTemperature, setAcTemperature] = useState(24);
  const [alloggiData, setAlloggiData] = useState<AlloggioData[]>([]);
  const [compactWeatherData, setCompactWeatherData] = useState<{
    location: string;
    temperature: number;
    condition: string;
    humidity?: number;
    windSpeed?: number;
  } | null>(null);
  const [plantName, setPlantName] = useState<string>("Energy Monitor System");
  const [plantLocation, setPlantLocation] = useState<string>("");

  // Fetch dati reali
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch informazioni impianto
        const plantRes = await fetch("/api/plant/info");
        if (plantRes.ok) {
          const plantInfo = await plantRes.json();
          if (plantInfo.success) {
            setPlantName(plantInfo.data.name || "Energy Monitor System");
            setPlantLocation(plantInfo.data.location || "");
          }
        }

        // Fetch dati alloggi
        const realtimeRes = await fetch("/api/influx/opta-realtime");
        if (realtimeRes.ok) {
          const realtimeData = await realtimeRes.json();
          if (realtimeData.success && realtimeData.data?.alloggi) {
            const alloggi = realtimeData.data.alloggi.map((a: any) => {
              const latest = a.latest || {};
              // Calcola range basato su consumo (stima)
              const efficiency = 0.15; // kWh/km
              const capacity = 50; // kWh
              const consumption = latest.p_active ? latest.p_active / 1000 : 0; // kW
              const range = consumption > 0 ? (capacity / (consumption * efficiency)) * 1000 : 0;

              return {
                id: a.alloggio_id,
                name: a.name,
                v_rms: latest.v_rms || 0,
                i_rms: latest.i_rms || 0,
                p_active: latest.p_active || 0,
                range: Math.round(range),
                consumption: Math.round((latest.p_active || 0) / 10) / 100, // Wh/km
                capacity: 35.5,
              };
            });
            setAlloggiData(alloggi);

            // Calcola velocità media basata su potenza (stima)
            if (alloggi.length > 0) {
              const totalPower = alloggi.reduce((sum: number, a: AlloggioData) => sum + a.p_active, 0);
              const estimatedSpeed = Math.min(160, Math.max(0, (totalPower / 100) * 40));
              setCurrentSpeed(Math.round(estimatedSpeed));
            }
          }
        }

        // Fetch meteo per CompactWeather
        const weatherRes = await fetch("/api/weather");
        if (weatherRes.ok) {
          const weather = await weatherRes.json();
          if (weather.success && weather.data) {
            setCompactWeatherData({
              location: weather.data.location.city || "Torino",
              temperature: Math.round(weather.data.weather.temperature),
              condition: weather.data.weather.condition || "Sunny",
              humidity: weather.data.weather.humidity,
              windSpeed: weather.data.weather.windSpeed,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calcola percentuale batteria basata su consumo
  const batteryPercentage = alloggiData.length > 0
    ? Math.max(0, Math.min(100, 100 - (alloggiData[0].consumption * 2)))
    : 72;

  const gears = ["R", "P", "N", "D", "S"];

  return (
    <div
      className="h-screen w-full overflow-hidden relative"
      style={{
        background: "radial-gradient(ellipse 120% 100% at 50% 0%, #2d2d2d 0%, #252525 40%, #1e1e1e 100%)"
      }}
    >
      {/* Overlay gradient per profondità */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(45,45,45,0.3) 0%, transparent 30%, transparent 70%, rgba(30,30,30,0.4) 100%)"
        }}
      />

      {/* Sidebar e TopBar - fixed positioning con z-index alto */}
      <TeslaSidebar />
      <TeslaTopBar notifications={0} />

      {/* Main Content Area */}
      <div className="relative z-0">
        <div
          className="flex flex-row gap-2 sm:gap-4 md:gap-6 overflow-hidden mt-24 sm:mt-28 md:mt-32 mb-2 sm:mb-4 ml-16 sm:ml-28 md:ml-32 mr-2 sm:mr-4 h-[calc(100vh-6rem-0.5rem)] sm:h-[calc(100vh-7rem-1rem)] md:h-[calc(100vh-8rem-1rem)]"
        >
          <div className="flex flex-row gap-2 sm:gap-4 md:gap-6 h-full w-full">
            {/* Componenti Meteo in fila da sinistra */}
            {/* FullWeather - Prima posizione */}
            <FullWeather />

            {/* CompactWeather - Card Meteo Compatta - Nascosta per ora */}
            {/* <CompactWeather data={compactWeatherData} /> */}

            {/* ForecastWeather - Previsioni Giornaliere */}
            <ForecastWeather days={7} />

            {/* PhotovoltaicSummary - Riepilogo Stato Fotovoltaico */}
            <PhotovoltaicSummary />

            {/* Card Principale - Nascosta per ora */}
            {/* 
            <div className="flex flex-col w-full sm:w-96 md:w-[32rem] lg:w-[40rem] xl:w-[50rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0">
              <Card
                variant="tesla"
                className="p-4 sm:p-6"
              >
                <div className="mb-4 sm:mb-6">
                  <Image
                    src={houseImage}
                    alt="Energy Monitor House"
                    width={800}
                    height={600}
                    className="object-contain w-full h-64 sm:h-80 md:h-96 lg:h-[28rem]"
                    priority
                  />
                  <div className="mt-3 sm:mt-4 text-center">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold" style={{ color: "#fefefe" }}>
                      {plantName}
                    </h2>
                    <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
                      {plantLocation || "Impianto Fotovoltaico"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            */}

          </div>
        </div>
      </div>
    </div>
  );
}

