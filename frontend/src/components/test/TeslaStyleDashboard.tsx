"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Car,
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
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export function TeslaStyleDashboard() {
  const [currentSpeed, setCurrentSpeed] = useState(64);
  const [selectedGear, setSelectedGear] = useState("D");
  const [isPlaying, setIsPlaying] = useState(false);
  const [acTemperature, setAcTemperature] = useState(24);
  const [alloggiData, setAlloggiData] = useState<AlloggioData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  // Fetch dati reali
  useEffect(() => {
    const fetchData = async () => {
      try {
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
  const navItems = [
    { icon: Home, active: true },
    { icon: Car, active: false },
    { icon: Music, active: false },
    { icon: Grid3x3, active: false },
    { icon: Settings, active: false },
  ];

  return (
    <div className="h-screen w-full overflow-hidden" style={{ backgroundColor: "#232323" }}>
      <div className="h-full w-full flex">
        {/* Vertical Navigation Bar */}
        <div className="w-16 sm:w-20 flex flex-col items-center py-6 gap-4" style={{ backgroundColor: "#252525" }}>
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className={`p-3 rounded-lg transition-all ${item.active ? "bg-[#3be4b4]" : "hover:bg-[#323232]"
                  }`}
                style={{ color: item.active ? "#232323" : "#818181" }}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
            {/* Left Column - Main Car Card */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Main Car Info Card */}
              <Card
                className="p-4 sm:p-6 hover:scale-[1.01]"
                style={{
                  backgroundColor: "#323232",
                  boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                  transform: "translateY(-2px)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  border: "1px solid rgba(59, 228, 180, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(16, 16, 16, 0.6), 0 8px 20px rgba(16, 16, 16, 0.4)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
              >
                {/* Car Image Placeholder */}
                <div className="mb-4 sm:mb-6">
                  <div className="h-32 sm:h-48 bg-[#252525] rounded-lg flex items-center justify-center">
                    <Car className="h-16 w-16 sm:h-24 sm:w-24" style={{ color: "#3be4b4" }} />
                  </div>
                  <div className="mt-3">
                    <h2 className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                      Energy Monitor System
                    </h2>
                    <p className="text-sm" style={{ color: "#818181" }}>
                      2024 Release Edition
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

              {/* Alloggi Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {alloggiData.map((alloggio) => (
                  <Card
                    key={alloggio.id}
                    className="p-4 sm:p-6 hover:scale-[1.01]"
                    style={{
                      backgroundColor: "#323232",
                      boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                      transform: "translateY(-2px)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      border: "1px solid rgba(59, 228, 180, 0.1)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 15px 40px rgba(16, 16, 16, 0.6), 0 8px 20px rgba(16, 16, 16, 0.4)";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: "#fefefe" }}>
                          {alloggio.name}
                        </h3>
                        <p className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                          Alloggio {alloggio.id}
                        </p>
                      </div>
                      <Battery
                        className="h-8 w-8 sm:h-10 sm:w-10"
                        style={{ color: "#3be4b4" }}
                        fill={batteryPercentage > 20 ? "#3be4b4" : "transparent"}
                      />
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold" style={{ color: "#fefefe" }}>
                          {alloggio.range} km
                        </div>
                        <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                          Left
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                            {batteryPercentage}%
                          </div>
                          <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                            Charging
                          </div>
                        </div>
                        <div>
                          <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                            {alloggio.consumption} Wh/km
                          </div>
                          <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                            Distance Traveled
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t" style={{ borderColor: "#252525" }}>
                        <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                          <div>
                            <div style={{ color: "#818181" }}>V</div>
                            <div className="font-semibold" style={{ color: "#fefefe" }}>
                              {alloggio.v_rms.toFixed(1)}V
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#818181" }}>I</div>
                            <div className="font-semibold" style={{ color: "#fefefe" }}>
                              {alloggio.i_rms.toFixed(2)}A
                            </div>
                          </div>
                          <div>
                            <div style={{ color: "#818181" }}>P</div>
                            <div className="font-semibold" style={{ color: "#fefefe" }}>
                              {alloggio.p_active.toFixed(0)}W
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Navigation Card */}
              <Card
                className="p-4 sm:p-6 hover:scale-[1.01]"
                style={{
                  backgroundColor: "#323232",
                  boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                  transform: "translateY(-2px)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  border: "1px solid rgba(59, 228, 180, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(16, 16, 16, 0.6), 0 8px 20px rgba(16, 16, 16, 0.4)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
              >
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-base sm:text-lg font-semibold" style={{ color: "#fefefe" }}>
                    Location Live
                  </h3>
                  <MapPin className="h-5 w-5" style={{ color: "#818181" }} />
                </div>
                <div className="h-32 sm:h-40 bg-[#252525] rounded-lg mb-3 sm:mb-4 flex items-center justify-center">
                  <Navigation className="h-8 w-8 sm:h-12 sm:w-12" style={{ color: "#3be4b4" }} />
                </div>
                <div className="mb-3 sm:mb-4">
                  <div className="text-sm sm:text-base font-medium mb-1" style={{ color: "#fefefe" }}>
                    Energy Monitor HQ
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                    3.2 km • 16 mnt
                  </div>
                </div>
                <button
                  className="w-full py-2 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors"
                  style={{ backgroundColor: "#3be4b4", color: "#232323" }}
                >
                  Start Now
                </button>
              </Card>

              {/* Weather & Battery Card */}
              <Card
                className="p-4 sm:p-6 hover:scale-[1.01]"
                style={{
                  backgroundColor: "#323232",
                  boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                  transform: "translateY(-2px)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  border: "1px solid rgba(59, 228, 180, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(16, 16, 16, 0.6), 0 8px 20px rgba(16, 16, 16, 0.4)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
              >
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    {weatherData?.condition.includes("Sun") || weatherData?.condition.includes("Clear") ? (
                      <Sun className="h-5 w-5" style={{ color: "#fbbf24" }} />
                    ) : (
                      <Cloud className="h-5 w-5" style={{ color: "#818181" }} />
                    )}
                    <div>
                      <div className="text-base sm:text-lg font-semibold" style={{ color: "#fefefe" }}>
                        {weatherData?.location || "Torino"}
                      </div>
                      <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                        Outdoor Temperature
                      </div>
                    </div>
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold" style={{ color: "#fefefe" }}>
                    {weatherData?.temperature || 20}°C
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <Battery
                    className="h-12 w-12 sm:h-16 sm:w-16"
                    style={{ color: "#3be4b4" }}
                    fill="#3be4b4"
                  />
                  <div className="flex-1">
                    <div className="text-xl sm:text-2xl font-bold" style={{ color: "#fefefe" }}>
                      {alloggiData[0]?.range || 450} km Left
                    </div>
                    <div className="text-sm sm:text-base" style={{ color: "#818181" }}>
                      {batteryPercentage}% Charging
                    </div>
                    <div className="text-xs sm:text-sm mt-1" style={{ color: "#818181" }}>
                      {alloggiData[0]?.consumption || 2099} km Distance Traveled
                    </div>
                  </div>
                </div>
              </Card>

              {/* Air Conditioner Widget */}
              <Card
                className="p-4 sm:p-6 hover:scale-[1.01]"
                style={{
                  backgroundColor: "#323232",
                  boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                  transform: "translateY(-2px)",
                  transition: "transform 0.3s ease, box-shadow 0.3s ease",
                  border: "1px solid rgba(59, 228, 180, 0.1)"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(16, 16, 16, 0.6), 0 8px 20px rgba(16, 16, 16, 0.4)";
                  e.currentTarget.style.transform = "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
              >
                <h3 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6" style={{ color: "#fefefe" }}>
                  Air Conditioner
                </h3>
                <div className="relative h-32 sm:h-40 mb-4 sm:mb-6">
                  <svg className="w-full h-full" viewBox="0 0 200 100">
                    {/* Gradient Arc */}
                    <defs>
                      <linearGradient id="acGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#3be4b4" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 20 80 A 80 80 0 0 1 180 80"
                      fill="none"
                      stroke="url(#acGradient)"
                      strokeWidth="8"
                    />
                    {/* Indicator */}
                    <circle
                      cx={20 + ((acTemperature - 16) / (35 - 16)) * 160}
                      cy={80 - Math.sin(((acTemperature - 16) / (35 - 16)) * Math.PI) * 80}
                      r="8"
                      fill="#3be4b4"
                    />
                  </svg>
                  <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs sm:text-sm" style={{ color: "#818181" }}>
                    <span>16°C</span>
                    <span>35°C</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "#fefefe" }}>
                    Cooling to {acTemperature}°C
                  </div>
                  <div className="text-xs sm:text-sm" style={{ color: "#818181" }}>
                    Under 5 mnt
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Control Panel */}
          <div className="mt-4 sm:mt-6">
            <Card
              className="p-4 sm:p-6"
              style={{
                backgroundColor: "#323232",
                boxShadow: "0 10px 30px rgba(16, 16, 16, 0.5), 0 5px 15px rgba(16, 16, 16, 0.3)",
                transform: "translateY(-2px)",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                border: "1px solid rgba(59, 228, 180, 0.1)"
              }}
            >
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4">
                {[
                  { icon: Lightbulb, label: "Lights" },
                  { icon: Snowflake, label: "AC" },
                  { icon: Lock, label: "Lock" },
                  { icon: Car, label: "Car" },
                  { icon: AlertTriangle, label: "Alert" },
                  { icon: Phone, label: "Phone" },
                  { icon: RotateCw, label: "Steering" },
                  { icon: Droplets, label: "Wash" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg bg-[#252525] hover:bg-[#323232] transition-colors"
                    >
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#818181" }} />
                      <span className="text-xs" style={{ color: "#818181" }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

