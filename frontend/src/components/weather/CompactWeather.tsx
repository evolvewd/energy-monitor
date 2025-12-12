"use client";

import { Sun, Cloud } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CompactWeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
}

interface CompactWeatherProps {
  data: CompactWeatherData | null;
}

export function CompactWeather({ data }: CompactWeatherProps) {
  const getWeatherIcon = () => {
    if (!data?.condition) return null;
    const condition = data.condition.toLowerCase();
    // Controlla sia termini inglesi che italiani
    if (condition.includes("sun") || condition.includes("clear") || condition.includes("soleggiato") || condition.includes("sereno") || condition.includes("seren")) {
      return <Sun className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: "#fbbf24" }} />;
    }
    return <Cloud className="h-8 w-8 sm:h-10 sm:w-10" style={{ color: "#818181" }} />;
  };

  return (
    <div className="flex flex-col w-full sm:w-72 md:w-80 lg:w-96 space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0">
      <Card variant="tesla" className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          {getWeatherIcon()}
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
              Meteo
            </h3>
            <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
              {data?.location || "Torino"}
            </p>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-2" style={{ color: "#fefefe" }}>
            {data?.temperature ? `${Math.round(data.temperature)}°C` : "--"}
          </div>
          <div className="text-base sm:text-lg" style={{ color: "#818181" }}>
            {data?.condition || "N/A"}
          </div>
        </div>

        <div className="pt-4 border-t" style={{ borderColor: "#252525" }}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
            <div>
              <div style={{ color: "#818181" }}>Umidità</div>
              <div className="font-semibold text-lg sm:text-xl" style={{ color: "#fefefe" }}>
                {data?.humidity ? `${Math.round(data.humidity)}%` : "--"}
              </div>
            </div>
            <div>
              <div style={{ color: "#818181" }}>Vento</div>
              <div className="font-semibold text-lg sm:text-xl" style={{ color: "#fefefe" }}>
                {data?.windSpeed ? `${Math.round(data.windSpeed)} km/h` : "--"}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

