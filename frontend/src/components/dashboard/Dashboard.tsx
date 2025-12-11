"use client";

import { useEffect, useState, useRef } from "react";
import {
  Music,
  Grid3x3,
  Settings,
  MapPin,
  Navigation,
  Battery,
  Zap,
  Gauge,
  Droplets,
  Wind,
  Sun,
  Cloud,
  Play,
  Pause,
  Volume2,
  Lock,
  Unlock,
  Lightbulb,
  Snowflake,
  Phone,
  AlertTriangle,
  RotateCw
} from "lucide-react";
import Image from "next/image";
import houseImage from "@/images/house.png";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TeslaSidebar } from "@/components/shared/TeslaSidebar";
import { TeslaTopBar } from "@/components/shared/TeslaTopBar";

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

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
}

export function Dashboard() {
  const [currentSpeed, setCurrentSpeed] = useState(64);
  const [selectedGear, setSelectedGear] = useState("D");
  const [isPlaying, setIsPlaying] = useState(false);
  const [acTemperature, setAcTemperature] = useState(24);
  const [alloggiData, setAlloggiData] = useState<AlloggioData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
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

        // Fetch meteo
        const weatherRes = await fetch("/api/weather");
        if (weatherRes.ok) {
          const weather = await weatherRes.json();
          if (weather.success && weather.data) {
            setWeatherData({
              location: weather.data.location.city || "Torino",
              temperature: Math.round(weather.data.weather.temperature),
              condition: weather.data.weather.condition || "Sunny",
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

  // Mouse drag scroll handler
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.getBoundingClientRect().left;
      const walk = (x - startX) * 2;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, startX, scrollLeft]);

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
      <div className="relative z-10">
        <TeslaSidebar />
        <TeslaTopBar notifications={0} />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10">
        <div
          ref={scrollContainerRef}
          className="flex-1 flex flex-row p-2 sm:p-4 md:p-6 gap-2 sm:gap-4 overflow-x-auto overflow-y-hidden mt-14 sm:mt-20 md:mt-24 ml-16 sm:ml-28 md:ml-32 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)]"
          style={{
            touchAction: "pan-x",
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex flex-row gap-2 sm:gap-4 md:gap-6 min-w-max">
            {/* Card Principale */}
            <div className="flex flex-col w-full sm:w-96 md:w-[32rem] lg:w-[40rem] xl:w-[50rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0">
              {/* Main Building Info Card */}
              <Card
                variant="tesla"
                className="p-4 sm:p-6"
              >
                {/* Building Image */}
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

                {/* Speedometer */}
                <div className="mb-6 sm:mb-8">
                  <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                      {/* Background Circle */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#252525"
                        strokeWidth="12"
                      />
                      {/* Yellow Arc (20-65 km/h equivalent) */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 85 * 0.28}`}
                        strokeDashoffset={`${2 * Math.PI * 85 * 0.36}`}
                      />
                      {/* Speed Arc */}
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="#3be4b4"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 85}`}
                        strokeDashoffset={`${2 * Math.PI * 85 * (1 - currentSpeed / 160)}`}
                        style={{ transition: "stroke-dashoffset 0.5s ease" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-4xl sm:text-5xl lg:text-6xl font-bold" style={{ color: "#fefefe" }}>
                        {currentSpeed}
                      </div>
                      <div className="text-sm sm:text-base" style={{ color: "#818181" }}>
                        kW
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <div className="text-lg sm:text-xl font-bold" style={{ color: "#fefefe" }}>
                      {alloggiData[0]?.range || 240} km
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                      Remaining
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold" style={{ color: "#fefefe" }}>
                      {alloggiData[0]?.consumption || 128} Wh/km
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                      Average
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold" style={{ color: "#fefefe" }}>
                      {alloggiData[0]?.capacity || 35.5} kWh
                    </div>
                    <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                      Full Capacity
                    </div>
                  </div>
                </div>

                {/* Gear Selector */}
                <div className="flex gap-2 mb-4 sm:mb-6">
                  {gears.map((gear) => (
                    <button
                      key={gear}
                      onClick={() => setSelectedGear(gear)}
                      className={`flex-1 py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${selectedGear === gear
                        ? "bg-[#3be4b4]"
                        : "bg-[#252525] hover:bg-[#323232]"
                        }`}
                      style={{
                        color: selectedGear === gear ? "#232323" : "#818181",
                      }}
                    >
                      {gear}
                    </button>
                  ))}
                </div>

                {/* Music Player */}
                <div
                  className="bg-[#252525] rounded-lg p-3 sm:p-4 flex items-center gap-3 sm:gap-4"
                  style={{
                    boxShadow: "0 5px 15px rgba(16, 16, 16, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  }}
                >
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-full bg-[#3be4b4] hover:bg-[#3be4b4]/80 transition-colors"
                    style={{ color: "#232323" }}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm sm:text-base font-medium truncate" style={{ color: "#fefefe" }}>
                      Energy Monitor Theme
                    </div>
                    <div className="text-xs sm:text-sm truncate" style={{ color: "#818181" }}>
                      System Audio
                    </div>
                  </div>
                  <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#818181" }} />
                </div>
              </Card>
            </div>

            {/* Card Meteo Laterale */}
            <div className="flex flex-col w-full sm:w-72 md:w-80 lg:w-96 space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0">
              <Card
                variant="tesla"
                className="p-4 sm:p-6"
              >
                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  {weatherData?.condition.includes("Sun") || weatherData?.condition.includes("Clear") ? (
                    <Sun className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: "#fbbf24" }} />
                  ) : weatherData?.condition.includes("Cloud") ? (
                    <Cloud className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: "#818181" }} />
                  ) : (
                    <Cloud className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: "#818181" }} />
                  )}
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold" style={{ color: "#fefefe" }}>
                      Meteo
                    </h3>
                    <p className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                      {weatherData?.location || "Torino"}
                    </p>
                  </div>
                </div>

                <div className="mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2" style={{ color: "#fefefe" }}>
                    {weatherData?.temperature || "--"}°C
                  </div>
                  <div className="text-sm sm:text-base" style={{ color: "#818181" }}>
                    {weatherData?.condition || "N/A"}
                  </div>
                </div>

                <div className="pt-4 border-t" style={{ borderColor: "#252525" }}>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <div style={{ color: "#818181" }}>Umidità</div>
                      <div className="font-semibold text-base sm:text-lg" style={{ color: "#fefefe" }}>
                        {weatherData?.condition ? "65%" : "--"}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: "#818181" }}>Vento</div>
                      <div className="font-semibold text-base sm:text-lg" style={{ color: "#fefefe" }}>
                        {weatherData?.condition ? "12 km/h" : "--"}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

