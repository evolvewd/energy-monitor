"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sun, Cloud, Droplets } from "lucide-react";

interface HourlyForecast {
  time: string | null;
  date: string | null;
  temperature: number;
  condition: string;
  conditionType?: string;
  humidity?: number;
  precipitationProbability?: number;
  cloudCover?: number;
  uvIndex?: number;
  windSpeed?: number;
  isDaytime?: boolean;
}

interface HourlyWeatherData {
  location: {
    city: string;
  };
  forecasts: HourlyForecast[];
}

interface HourlyWeatherProps {
  hours?: number;
  className?: string;
}

export function HourlyWeather({ hours = 6, className }: HourlyWeatherProps) {
  const [data, setData] = useState<HourlyWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHourly = async () => {
      try {
        const res = await fetch(`/api/weather/hourly?hours=${hours}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setData(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching hourly weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHourly();
    const interval = setInterval(fetchHourly, 30 * 60 * 1000); // Aggiorna ogni 30 minuti
    return () => clearInterval(interval);
  }, [hours]);

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Cloud className="h-4 w-4" style={{ color: "#818181" }} />;
    const cond = condition.toLowerCase();
    // Controlla sia termini inglesi che italiani
    if (cond.includes("sun") || cond.includes("clear") || cond.includes("soleggiato") || cond.includes("sereno") || cond.includes("seren")) {
      return <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} />;
    }
    return <Cloud className="h-4 w-4" style={{ color: "#818181" }} />;
  };

  if (loading) {
    return (
      <div className={`flex flex-col w-full sm:w-96 md:w-[32rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0 ${className}`}>
        <Card variant="tesla" className="p-4 sm:p-6">
          <div className="text-center py-8" style={{ color: "#818181" }}>
            Caricamento previsioni orarie...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col w-full sm:w-72 md:w-80 space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0 ${className}`}>
      <Card variant="tesla" className="p-4 sm:p-6">
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xl sm:text-2xl font-semibold mb-1" style={{ color: "#fefefe" }}>
            Previsioni Orarie
          </h3>
          <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
            {data?.location.city || "Torino"} - Prossime {hours} ore
          </p>
        </div>

        <div className="space-y-2">
          {data?.forecasts && data.forecasts.length > 0 ? (
            data.forecasts.slice(0, hours).map((forecast, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                style={{ borderColor: "#252525" }}
              >
                <div className="flex items-center gap-3 flex-1">
                  {getWeatherIcon(forecast.condition)}
                  <div className="flex-1">
                    <div className="text-base font-medium" style={{ color: "#fefefe" }}>
                      {forecast.time || "--:--"}
                    </div>
                    <div className="text-sm" style={{ color: "#818181" }}>
                      {forecast.condition || "N/A"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-base">
                  <div className="text-right">
                    <div className="font-semibold" style={{ color: "#fefefe" }}>
                      {forecast.temperature ? `${Math.round(forecast.temperature)}°C` : "--"}
                    </div>
                    {forecast.precipitationProbability !== undefined && (
                      <div className="flex items-center gap-1 text-sm" style={{ color: "#3be4b4" }}>
                        <Droplets className="h-4 w-4" />
                        {Math.round(forecast.precipitationProbability)}%
                      </div>
                    )}
                  </div>
                  {forecast.uvIndex !== undefined && (
                    <div className="text-sm text-right" style={{ color: "#818181" }}>
                      <div>UV</div>
                      <div className="font-semibold">{forecast.uvIndex}</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4" style={{ color: "#818181" }}>
              Nessun dato disponibile
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

