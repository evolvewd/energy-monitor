"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Sun, Cloud, Droplets, Wind } from "lucide-react";

interface DayForecast {
  date: string | null;
  maxTemperature: number;
  minTemperature: number;
  daytimeForecast: {
    condition: string;
    humidity?: number;
    uvIndex?: number;
    precipitation: {
      probability?: number;
    };
    wind: {
      speed?: number;
    };
    cloudCover?: number;
  };
  nighttimeForecast: {
    condition: string;
  };
  sunEvents: {
    sunrise?: string;
    sunset?: string;
  };
}

interface ForecastWeatherData {
  location: {
    city: string;
  };
  forecasts: DayForecast[];
}

interface ForecastWeatherProps {
  days?: number;
  className?: string;
}

export function ForecastWeather({ days = 7, className }: ForecastWeatherProps) {
  const [data, setData] = useState<ForecastWeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await fetch(`/api/weather/forecast?days=${days}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            // Log per debug - Dati di oggi dai 7 giorni
            if (result.data.forecasts && result.data.forecasts.length > 0) {
              const oggi = result.data.forecasts[0];
              console.log("=== FORECASTWEATHER - DATI DI OGGI (dal forecast 7 giorni) ===");
              console.log("Data:", oggi.date);
              console.log("Dati completi di oggi:", JSON.stringify(oggi, null, 2));
              console.log("Dettagli specifici di oggi:", {
                uvIndex: oggi.daytimeForecast?.uvIndex,
                cloudCover: oggi.daytimeForecast?.cloudCover,
                cloudCoverType: typeof oggi.daytimeForecast?.cloudCover,
                cloudCoverValue: oggi.daytimeForecast?.cloudCover,
                humidity: oggi.daytimeForecast?.humidity,
                maxTemp: oggi.maxTemperature,
                minTemp: oggi.minTemperature,
                precipitation: oggi.daytimeForecast?.precipitation?.probability,
              });
              console.log("=== FINE DATI DI OGGI (FORECAST) ===");
            }
            
            // Log per tutti i giorni per verificare cloudCover
            if (result.data.forecasts) {
              console.log("=== FORECASTWEATHER - CLOUDCOVER PER TUTTI I GIORNI ===");
              result.data.forecasts.forEach((forecast: any, index: number) => {
                console.log(`Giorno ${index + 1}:`, {
                  date: forecast.date,
                  cloudCover: forecast.daytimeForecast?.cloudCover,
                  cloudCoverType: typeof forecast.daytimeForecast?.cloudCover,
                  cloudCoverValue: forecast.daytimeForecast?.cloudCover,
                });
              });
              console.log("=== FINE CLOUDCOVER LOG ===");
            }
            
            // Log per tutti i 7 giorni
            console.log("=== FORECASTWEATHER - DATI COMPLETI 7 GIORNI ===");
            console.log("Dati completi:", JSON.stringify(result.data, null, 2));
            if (result.data.forecasts) {
              console.log("UV Index per i prossimi 7 giorni:");
              result.data.forecasts.forEach((forecast: any, index: number) => {
                console.log(`Giorno ${index + 1} (${forecast.date}):`, {
                  uvIndex: forecast.daytimeForecast?.uvIndex,
                  cloudCover: forecast.daytimeForecast?.cloudCover,
                });
              });
            }
            console.log("=== FINE LOG FORECASTWEATHER ===");
            setData(result.data);
          }
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
    const interval = setInterval(fetchForecast, 60 * 60 * 1000); // Aggiorna ogni ora
    return () => clearInterval(interval);
  }, [days]);

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Cloud className="h-5 w-5" style={{ color: "#818181" }} />;
    const cond = condition.toLowerCase();
    // Controlla sia termini inglesi che italiani
    if (cond.includes("sun") || cond.includes("clear") || cond.includes("soleggiato") || cond.includes("sereno") || cond.includes("seren")) {
      return <Sun className="h-5 w-5" style={{ color: "#fbbf24" }} />;
    }
    return <Cloud className="h-5 w-5" style={{ color: "#818181" }} />;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col w-full sm:w-96 md:w-[32rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0 ${className}`}>
        <Card variant="tesla" className="p-4 sm:p-6">
          <div className="text-center py-8" style={{ color: "#818181" }}>
            Caricamento previsioni...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-shrink-0 h-full ${className}`} style={{ flex: '1 1 0', minWidth: 0 }}>
      <Card variant="tesla" className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        <div className="mb-3 sm:mb-4 flex-shrink-0">
          <h3 className="text-xl sm:text-2xl font-semibold mb-1" style={{ color: "#fefefe" }}>
            Previsioni {days} Giorni
          </h3>
          <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
            {data?.location.city || "Torino"}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {data?.forecasts && data.forecasts.length > 0 ? (
            data.forecasts.slice(0, days).map((forecast, index) => {
              // Debug: verifica quanti giorni vengono mostrati
              if (index === 0) {
                console.log(`ForecastWeather: Mostrando ${Math.min(data.forecasts.length, days)} giorni su ${data.forecasts.length} disponibili, richiesti ${days}`);
              }
              return (
              <div
                key={index}
                className="py-2 border-b last:border-b-0"
                style={{ borderColor: "#252525" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(forecast.daytimeForecast.condition)}
                    <div>
                      <div className="text-base font-medium" style={{ color: "#fefefe" }}>
                        {formatDate(forecast.date)}
                      </div>
                      <div className="text-sm" style={{ color: "#818181" }}>
                        {forecast.daytimeForecast.condition}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold" style={{ color: "#fefefe" }}>
                      {forecast.maxTemperature ? `${Math.round(forecast.maxTemperature)}°` : "--"}
                    </div>
                    <div className="text-sm" style={{ color: "#818181" }}>
                      {forecast.minTemperature ? `${Math.round(forecast.minTemperature)}°` : "--"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mt-1.5">
                  {forecast.daytimeForecast.uvIndex !== undefined && forecast.daytimeForecast.uvIndex !== null && (
                    <div className="flex items-center gap-1">
                      <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} />
                      <span style={{ color: "#818181" }}>UV {forecast.daytimeForecast.uvIndex}</span>
                    </div>
                  )}
                  {forecast.daytimeForecast.precipitation?.probability !== undefined && forecast.daytimeForecast.precipitation?.probability !== null && (
                    <div className="flex items-center gap-1">
                      <Droplets className="h-4 w-4" style={{ color: "#3be4b4" }} />
                      <span style={{ color: "#818181" }}>{Math.round(forecast.daytimeForecast.precipitation.probability)}%</span>
                    </div>
                  )}
                  {forecast.daytimeForecast.cloudCover !== undefined && forecast.daytimeForecast.cloudCover !== null && (
                    <div className="flex items-center gap-1">
                      <Cloud className="h-4 w-4" style={{ color: "#818181" }} />
                      <span style={{ color: "#818181" }}>{Math.round(forecast.daytimeForecast.cloudCover)}%</span>
                    </div>
                  )}
                </div>
              </div>
            );
            })
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

