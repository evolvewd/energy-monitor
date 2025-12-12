"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, Droplets, Wind, Gauge, Sunrise, Sunset, Moon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface FullWeatherData {
  location: {
    city: string;
    address?: string;
  };
  weather: {
    temperature: number;
    condition: string;
    conditionType?: string;
    conditionIcon?: string;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    feelsLike?: number;
    cloudCover?: number;
    uvIndex?: number;
    airPressure?: number;
    precipitationProbability?: number;
    isDaytime?: boolean;
  };
}

interface ForecastTodayData {
  maxTemperature?: number;
  minTemperature?: number;
  sunrise?: string;
  sunset?: string;
}

interface HourlyForecast {
  time: string | null;
  temperature: number;
  condition: string;
  conditionType?: string;
  conditionIcon?: string;
  isDaytime?: boolean;
  precipitationProbability?: number;
  uvIndex?: number;
}

interface FullWeatherProps {
  className?: string;
}

export function FullWeather({ className }: FullWeatherProps) {
  const [data, setData] = useState<FullWeatherData | null>(null);
  const [forecastToday, setForecastToday] = useState<ForecastTodayData | null>(null);
  const [hourlyForecasts, setHourlyForecasts] = useState<HourlyForecast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Fetch condizioni attuali
        const res = await fetch("/api/weather");
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            // Log completo per debug lato client
            console.log("=== FULLWEATHER - DATI RICEVUTI DAL SERVER ===");
            console.log("Dati completi:", JSON.stringify(result.data, null, 2));
            console.log("Dettagli weather object:", {
              uvIndex: result.data.weather?.uvIndex,
              uvIndexType: typeof result.data.weather?.uvIndex,
              cloudCover: result.data.weather?.cloudCover,
              cloudCoverType: typeof result.data.weather?.cloudCover,
              humidity: result.data.weather?.humidity,
              windSpeed: result.data.weather?.windSpeed,
              airPressure: result.data.weather?.airPressure,
              precipitationProbability: result.data.weather?.precipitationProbability,
              isDaytime: result.data.weather?.isDaytime,
            });
            console.log("=== FINE LOG FULLWEATHER ===");
            setData(result.data);
          }
        } else {
          console.error("FullWeather - Errore risposta API:", res.status);
        }

        // Fetch forecast di oggi per alba/tramonto e temp max/min
        const forecastRes = await fetch("/api/weather/forecast?days=1");
        if (forecastRes.ok) {
          const forecastResult = await forecastRes.json();
          if (forecastResult.success && forecastResult.data?.forecasts && forecastResult.data.forecasts.length > 0) {
            const today = forecastResult.data.forecasts[0];
            setForecastToday({
              maxTemperature: today.maxTemperature,
              minTemperature: today.minTemperature,
              sunrise: today.sunEvents?.sunrise,
              sunset: today.sunEvents?.sunset,
            });
          }
        }

        // Fetch previsioni orarie
        const hourlyRes = await fetch("/api/weather/hourly?hours=6");
        if (hourlyRes.ok) {
          const hourlyResult = await hourlyRes.json();
          if (hourlyResult.success && hourlyResult.data?.forecasts) {
            setHourlyForecasts(hourlyResult.data.forecasts.slice(0, 6));
          }
        }
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 5 * 60 * 1000); // Aggiorna ogni 5 minuti
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--";
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "--";
    }
  };

  const getWeatherIcon = (forecast?: HourlyForecast) => {
    if (!forecast) return <Cloud className="h-4 w-4" style={{ color: "#818181" }} />;
    
    // Usa isDaytime per determinare se è giorno o notte
    const isDaytime = forecast.isDaytime ?? true; // Default a giorno se non specificato
    
    // Usa conditionIcon dall'API se disponibile, altrimenti usa conditionType o condition
    const conditionIcon = forecast.conditionIcon;
    const conditionType = forecast.conditionType;
    const condition = forecast.condition?.toLowerCase() || "";
    
    // Se è notte e l'icona contiene "clear" o "partly_clear", mostra la luna
    if (!isDaytime) {
      if (conditionIcon?.includes("clear") || conditionIcon?.includes("partly_clear") || 
          conditionType === "CLEAR" || condition.includes("sereno") || condition.includes("clear")) {
        return <Moon className="h-4 w-4" style={{ color: "#a0a0a0" }} />;
      }
      // Notte nuvolosa
      return <Cloud className="h-4 w-4" style={{ color: "#818181" }} />;
    }
    
    // Giorno: usa la logica esistente
    if (conditionIcon?.includes("clear") || conditionType === "CLEAR" || 
        condition.includes("sun") || condition.includes("clear") || 
        condition.includes("soleggiato") || condition.includes("sereno") || condition.includes("seren")) {
      return <Sun className="h-4 w-4" style={{ color: "#fbbf24" }} />;
    }
    
    return <Cloud className="h-4 w-4" style={{ color: "#818181" }} />;
  };

  const getMainWeatherIcon = () => {
    if (!data?.weather) return null;
    
    // Usa isDaytime per determinare se è giorno o notte
    const isDaytime = data.weather.isDaytime ?? true; // Default a giorno se non specificato
    
    // Usa conditionIcon dall'API se disponibile, altrimenti usa conditionType o condition
    const conditionIcon = data.weather.conditionIcon;
    const conditionType = data.weather.conditionType;
    const condition = data.weather.condition?.toLowerCase() || "";
    
    // Se è notte e l'icona contiene "clear" o "partly_clear", mostra la luna
    if (!isDaytime) {
      if (conditionIcon?.includes("clear") || conditionIcon?.includes("partly_clear") || 
          conditionType === "CLEAR" || condition.includes("sereno") || condition.includes("clear")) {
        return <Moon className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: "#a0a0a0" }} />;
      }
      // Notte nuvolosa
      return <Cloud className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: "#818181" }} />;
    }
    
    // Giorno: usa la logica esistente
    if (conditionIcon?.includes("clear") || conditionType === "CLEAR" || 
        condition.includes("sun") || condition.includes("clear") || 
        condition.includes("soleggiato") || condition.includes("sereno") || condition.includes("seren")) {
      return <Sun className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: "#fbbf24" }} />;
    }
    
    return <Cloud className="h-10 w-10 sm:h-12 sm:w-12" style={{ color: "#818181" }} />;
  };

  const getUVIndexLevel = (uv?: number) => {
    if (uv === undefined || uv === null) return { level: "--", color: "#818181" };
    if (uv === 0) return { level: "Nessuno", color: "#818181" };
    if (uv <= 2) return { level: "Basso", color: "#3be4b4" };
    if (uv <= 5) return { level: "Moderato", color: "#fbbf24" };
    if (uv <= 7) return { level: "Alto", color: "#f97316" };
    if (uv <= 10) return { level: "Molto Alto", color: "#ef4444" };
    return { level: "Estremo", color: "#dc2626" };
  };

  if (loading) {
    return (
      <div className={`flex flex-col w-full sm:w-96 md:w-[32rem] lg:w-[36rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0 ${className}`}>
        <Card variant="tesla" className="p-4 sm:p-6">
          <div className="text-center py-8" style={{ color: "#818181" }}>
            Caricamento meteo...
          </div>
        </Card>
      </div>
    );
  }

  const uvInfo = getUVIndexLevel(data?.weather.uvIndex);

  return (
    <div className={`flex flex-col flex-shrink-0 h-full ${className}`} style={{ flex: '2 1 0', minWidth: 0 }}>
      <Card variant="tesla" className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        {/* Header con icona e location */}
        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
          {getMainWeatherIcon()}
          <div className="flex-1">
            <h3 className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
              Condizioni Meteo
            </h3>
            <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
              {data?.location.city || "Torino"}
            </p>
          </div>
        </div>

        {/* Temperatura principale */}
        <div className="mb-4 sm:mb-5">
          <div className="text-5xl sm:text-6xl md:text-7xl font-bold mb-1" style={{ color: "#fefefe" }}>
            {data?.weather.temperature ? `${Math.round(data.weather.temperature)}°C` : "--"}
          </div>
          <div className="text-lg sm:text-xl" style={{ color: "#818181" }}>
            {data?.weather.condition || "N/A"}
          </div>
        </div>

        {/* Sezione TEMPERATURE - Percepita e Range */}
        <div className="mb-3 sm:mb-4">
          <div className="text-sm sm:text-base mb-2 font-medium" style={{ color: "#b0b0b0" }}>Temperature</div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="text-sm mb-1" style={{ color: "#818181" }}>Percepita</div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
                {data?.weather.feelsLike ? `${Math.round(data.weather.feelsLike)}°C` : "--"}
              </div>
            </div>
            <div>
              <div className="text-sm mb-1" style={{ color: "#818181" }}>Max / Min</div>
              <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
                {forecastToday?.maxTemperature !== undefined && forecastToday?.minTemperature !== undefined
                  ? `${Math.round(forecastToday.maxTemperature)}° / ${Math.round(forecastToday.minTemperature)}°`
                  : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Sezione SOLE - Alba, Tramonto, UV */}
        <div className="mb-3 sm:mb-4">
          <div className="text-sm sm:text-base mb-2 font-medium" style={{ color: "#b0b0b0" }}>Sole</div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-start gap-2">
              <Sunrise className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#fbbf24" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Alba</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {formatTime(forecastToday?.sunrise)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sunset className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#f97316" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Tramonto</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {formatTime(forecastToday?.sunset)}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Sun className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#fbbf24" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Indice UV</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.uvIndex !== undefined && data.weather.uvIndex !== null ? data.weather.uvIndex : "--"}
                </div>
                <div className="text-sm" style={{ color: uvInfo.color }}>
                  {uvInfo.level}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sezione CIELO - Condizioni, Nuvole, Precipitazioni */}
        <div className="mb-3 sm:mb-4">
          <div className="text-sm sm:text-base mb-2 font-medium" style={{ color: "#b0b0b0" }}>Cielo</div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="flex items-start gap-2">
              <Cloud className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#818181" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Copertura</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.cloudCover !== undefined && data.weather.cloudCover !== null ? `${Math.round(data.weather.cloudCover)}%` : "--"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Droplets className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#3be4b4" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Precipitazioni</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.precipitationProbability !== undefined && data.weather.precipitationProbability !== null ? `${Math.round(data.weather.precipitationProbability)}%` : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sezione ARIA - Vento, Umidità, Pressione */}
        <div className="mb-3 sm:mb-4 flex-shrink-0">
          <div className="text-sm sm:text-base mb-2 font-medium" style={{ color: "#b0b0b0" }}>Aria</div>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="flex items-start gap-2">
              <Wind className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#818181" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Vento</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.windSpeed !== undefined && data.weather.windSpeed !== null ? `${Math.round(data.weather.windSpeed)} km/h` : "--"}
                </div>
                {data?.weather.windDirection && (
                  <div className="text-sm" style={{ color: "#818181" }}>
                    {Math.round(data.weather.windDirection)}°
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Droplets className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#3be4b4" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Umidità</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.humidity !== undefined && data.weather.humidity !== null ? `${Math.round(data.weather.humidity)}%` : "--"}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Gauge className="h-5 w-5 sm:h-6 sm:w-6 mt-0.5" style={{ color: "#818181" }} />
              <div>
                <div className="text-sm mb-1" style={{ color: "#818181" }}>Pressione</div>
                <div className="text-lg sm:text-xl font-semibold" style={{ color: "#fefefe" }}>
                  {data?.weather.airPressure !== undefined && data.weather.airPressure !== null ? `${Math.round(data.weather.airPressure)} mbar` : "--"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previsioni Orarie - Layout Orizzontale */}
        {hourlyForecasts.length > 0 && (
          <div className="mt-auto flex-shrink-0">
            <div className="text-sm sm:text-base mb-2 font-medium" style={{ color: "#b0b0b0" }}>Prossime 6 ore</div>
            <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
              {hourlyForecasts.map((forecast, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1 px-1 sm:px-1.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: "#252525" }}
                >
                  <div className="text-[10px] sm:text-xs" style={{ color: "#818181" }}>
                    {forecast.time || "--:--"}
                  </div>
                  {getWeatherIcon(forecast)}
                  <div className="text-sm sm:text-base font-semibold" style={{ color: "#fefefe" }}>
                    {forecast.temperature ? `${Math.round(forecast.temperature)}°` : "--"}
                  </div>
                  {forecast.precipitationProbability !== undefined && forecast.precipitationProbability > 0 && (
                    <div className="flex items-center gap-0.5">
                      <Droplets className="h-2.5 w-2.5" style={{ color: "#3be4b4" }} />
                      <span className="text-[10px]" style={{ color: "#3be4b4" }}>
                        {Math.round(forecast.precipitationProbability)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

