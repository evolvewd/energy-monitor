// components/dashboard/WeatherComplete.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Cloud, CloudRain, Sun, CloudSun, Clock, Calendar, Moon, Zap, Lightbulb, AlertCircle, Thermometer, Droplets, Wind, Gauge, Eye, Snowflake, CloudLightning, Sunrise, Sunset, Activity, BarChart3, Waves } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";

interface CurrentWeather {
  location: {
    city: string;
    address: string;
  };
  temperature: number;
  condition: string;
  conditionType?: string;
  isDaytime?: boolean;
  cloudCover?: number;
  uvIndex?: number;
  precipitationProbability?: number;
  humidity?: number;
  windSpeed?: number;
  airPressure?: number;
}

interface HourlyForecast {
  time: string;
  temperature: number;
  condition: string;
  conditionType?: string;
  isDaytime?: boolean;
}

interface DailyForecast {
  date: string | null;
  maxTemperature?: number;
  minTemperature?: number;
  condition?: string;
  conditionType?: string;
  precipitationProbability?: number;
  // Dati completi per il dialog tecnico
  fullData?: any;
}

export function WeatherComplete() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [hourlyForecasts, setHourlyForecasts] = useState<HourlyForecast[]>([]);
  const [dailyForecasts, setDailyForecasts] = useState<DailyForecast[]>([]);
  const [fullDailyForecasts, setFullDailyForecasts] = useState<any[]>([]); // Salva tutti i dati completi
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [todaySunrise, setTodaySunrise] = useState<string | null>(null);
  const [todaySunset, setTodaySunset] = useState<string | null>(null);

  // Calcola isDaytime usando i dati di sunrise/sunset di Google
  const calculateIsDaytime = (date: Date = new Date(), sunrise?: string | null, sunset?: string | null): boolean => {
    // Se abbiamo sunrise/sunset da Google, usali (più accurato)
    if (sunrise && sunset) {
      try {
        const now = date.getTime();
        const sunriseTime = new Date(sunrise).getTime();
        const sunsetTime = new Date(sunset).getTime();
        return now >= sunriseTime && now < sunsetTime;
      } catch (e) {
        console.warn("Errore nel calcolo sunrise/sunset, uso fallback", e);
      }
    }
    
    // Fallback: usa isDaytime dall'API Google se disponibile
    // Se non disponibile, usa un range conservativo basato sull'ora locale
    const romeTime = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    const hour = romeTime.getHours();
    // Range conservativo per l'Italia: 7:00 - 18:00
    return hour >= 7 && hour < 18;
  };

  useEffect(() => {
    const fetchAllWeatherData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch tutti i dati in parallelo
        const [currentRes, hourlyRes, dailyRes] = await Promise.all([
          fetch("/api/weather"),
          fetch("/api/weather/hourly?hours=12"),
          fetch("/api/weather/forecast?days=7"),
        ]);

        const [currentData, hourlyData, dailyData] = await Promise.all([
          currentRes.json(),
          hourlyRes.json(),
          dailyRes.json(),
        ]);

        // Dati attuali (salva tutti i dati utili per autoconsumo)
        if (currentData.success && currentData.data) {
          const weatherData = currentData.data.weather;
          // Usa isDaytime dall'API Google se disponibile, altrimenti calcolalo con sunrise/sunset
          // Nota: sunrise/sunset verranno impostati dopo il fetch delle previsioni giornaliere
          let isDaytimeValue = weatherData.isDaytime;
          
          // Se l'API dice isDaytime ma non abbiamo ancora sunrise/sunset, usiamo quello dell'API
          // Altrimenti ricalcoliamo dopo aver ricevuto sunrise/sunset
          setCurrentWeather({
            location: currentData.data.location,
            temperature: weatherData.temperature,
            condition: weatherData.condition,
            conditionType: weatherData.conditionType,
            isDaytime: isDaytimeValue, // Usa quello dell'API Google
            cloudCover: weatherData.cloudCover,
            uvIndex: weatherData.uvIndex,
            precipitationProbability: weatherData.precipitationProbability,
            humidity: weatherData.humidity,
            windSpeed: weatherData.windSpeed,
            airPressure: weatherData.airPressure,
          });
        }

        // Previsioni giornaliere (salva sia dati semplificati che completi)
        // Processiamo prima le previsioni giornaliere per ottenere sunrise/sunset
        let localSunrise: string | null = null;
        let localSunset: string | null = null;
        
        if (dailyData.success && dailyData.data?.forecasts) {
          // Salva dati semplificati per la visualizzazione (fullData è già incluso dall'API)
          const forecasts = dailyData.data.forecasts.map((day: any) => ({
            date: day.date,
            maxTemperature: day.maxTemperature,
            minTemperature: day.minTemperature,
            condition: day.daytimeForecast?.condition,
            conditionType: day.daytimeForecast?.conditionType,
            precipitationProbability: day.daytimeForecast?.precipitation?.probability,
            fullData: day.fullData, // Usa i dati raw completi dall'API
            sunEvents: day.sunEvents, // Salva sunrise/sunset (struttura: {sunrise, sunset})
          }));
          setDailyForecasts(forecasts);
          
          // Estrai sunrise/sunset di oggi (prima previsione) per calcolare isDaytime
          const today = forecasts[0];
          if (today?.sunEvents?.sunrise && today?.sunEvents?.sunset) {
            localSunrise = today.sunEvents.sunrise;
            localSunset = today.sunEvents.sunset;
            setTodaySunrise(localSunrise);
            setTodaySunset(localSunset);
            
            // Ricalcola isDaytime con i dati reali di sunrise/sunset
            try {
              const accurateIsDaytime = calculateIsDaytime(new Date(), localSunrise, localSunset);
              setCurrentWeather(prev => prev ? { ...prev, isDaytime: accurateIsDaytime } : null);
            } catch (e) {
              console.warn("Errore nel calcolo isDaytime con sunrise/sunset:", e);
              // Continua senza aggiornare isDaytime
            }
          }
        }

        // Previsioni orarie (processate dopo per avere accesso a sunrise/sunset)
        if (hourlyData.success && hourlyData.data?.forecasts) {
          setHourlyForecasts(
            hourlyData.data.forecasts.slice(0, 12).map((hour: any) => {
              // Usa isDaytime dall'API Google se disponibile (più accurato)
              if (hour.isDaytime !== undefined) {
                return {
                  time: hour.time,
                  temperature: hour.temperature,
                  condition: hour.condition,
                  conditionType: hour.conditionType,
                  isDaytime: hour.isDaytime, // Usa quello dell'API Google
                };
              }
              
              // Fallback: calcola basandosi sull'ora e sunrise/sunset se disponibili
              let hourDate: Date;
              if (hour.date && hour.time) {
                const [hours, minutes] = hour.time.split(':').map(Number);
                const [year, month, day] = hour.date.split('-').map(Number);
                hourDate = new Date(year, month - 1, day, hours, minutes);
              } else {
                hourDate = new Date();
              }
              return {
                time: hour.time,
                temperature: hour.temperature,
                condition: hour.condition,
                conditionType: hour.conditionType,
                isDaytime: calculateIsDaytime(hourDate, localSunrise, localSunset),
              };
            })
          );
        }
      } catch (err) {
        console.error("Error fetching weather data:", err);
        setError("Errore di connessione");
      } finally {
        setLoading(false);
      }
    };

    fetchAllWeatherData();
    // Aggiorna ogni 2 ore invece di 30 minuti per ridurre drasticamente i costi API
    const interval = setInterval(fetchAllWeatherData, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Aggiorna data/ora ogni secondo (in timezone Europe/Rome)
  // E ricalcola isDaytime usando sunrise/sunset di Google se disponibili
  useEffect(() => {
    const timer = setInterval(() => {
      // Crea una data che rappresenta l'ora locale di Roma
      const now = new Date();
      const romeTimeString = now.toLocaleString("en-US", { timeZone: "Europe/Rome" });
      setCurrentDateTime(new Date(romeTimeString));
      
      // Ricalcola isDaytime con sunrise/sunset se disponibili
      if (todaySunrise && todaySunset) {
        setCurrentWeather(prev => {
          if (!prev) return null;
          const accurateIsDaytime = calculateIsDaytime(now, todaySunrise, todaySunset);
          // Aggiorna solo se è cambiato per evitare re-render inutili
          if (prev.isDaytime !== accurateIsDaytime) {
            return { ...prev, isDaytime: accurateIsDaytime };
          }
          return prev;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [todaySunrise, todaySunset]);

  const getWeatherIcon = (
    condition: string | undefined,
    size: "small" | "medium" | "large" = "medium",
    isDaytime: boolean = true
  ) => {
    const sizeClasses = {
      small: "h-4 w-4 sm:h-5 sm:w-5",
      medium: "h-5 w-5 sm:h-6 sm:w-6",
      large: "h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16",
    };
    const iconSize = sizeClasses[size];

    if (!condition) {
      return isDaytime ? (
        <Cloud className={`${iconSize} text-gray-500`} />
      ) : (
        <Moon className={`${iconSize} text-gray-400`} />
      );
    }

    const conditionLower = condition.toLowerCase();

    // Pioggia/Temporali (stessa icona giorno/notte)
    if (conditionLower.includes("rain") || conditionLower.includes("storm") || conditionLower.includes("shower")) {
      return <CloudRain className={`${iconSize} text-blue-600`} />;
    }

    // Se è notte, usa icone appropriate
    if (!isDaytime) {
      // Notte serena (clear) → Luna
      if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
        return <Moon className={`${iconSize} text-gray-200`} />;
      }
      // Notte parzialmente nuvolosa (partly, mostly) → Nuvole (controlla PRIMA di "cloud" generico)
      if (conditionLower.includes("partly") || conditionLower.includes("mostly")) {
        return <Cloud className={`${iconSize} text-gray-600`} />;
      }
      // Notte completamente nuvolosa → Nuvole scure (solo se non è già stato catturato da "partly" o "mostly")
      if (conditionLower.includes("cloud")) {
        return <Cloud className={`${iconSize} text-gray-600`} />;
      }
      // Default notte → Luna (se non specificato, assumiamo sereno)
      return <Moon className={`${iconSize} text-gray-300`} />;
    }

    // Se è giorno, usa icone con sole
    if (conditionLower.includes("partly") || conditionLower.includes("mostly")) {
      return <CloudSun className={`${iconSize} text-amber-500`} />;
    }
    if (conditionLower.includes("cloud") && !conditionLower.includes("clear")) {
      return <Cloud className={`${iconSize} text-gray-500`} />;
    }
    if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
      return <Sun className={`${iconSize} text-amber-500`} />;
    }
    return <Sun className={`${iconSize} text-amber-500`} />;
  };

  const formatDate = (dateString: string | null, isToday: boolean = false) => {
    if (!dateString) return "";
    try {
      const date = parseISO(dateString);
      if (isToday) return "Oggi";
      return format(date, "EEE", { locale: it });
    } catch {
      return dateString;
    }
  };

  const getTemperatureBarColor = (min: number, max: number) => {
    const avg = (min + max) / 2;
    if (avg < 10) return "bg-blue-500";
    if (avg < 20) return "bg-green-500";
    if (avg < 25) return "bg-yellow-500";
    return "bg-orange-500";
  };

  // Calcola il suggerimento di autoconsumo basato sul meteo
  const getConsumptionAdvice = (weather: CurrentWeather | null) => {
    if (!weather) return { level: "unknown", message: "Dati non disponibili", color: "default" };

    let score = 0;
    const reasons: string[] = [];

    // Se è notte, produzione FV = 0
    if (!weather.isDaytime) {
      return {
        level: "notte",
        message: "Notte: produzione FV assente",
        color: "secondary",
        score: 0,
      };
    }

    // Indice UV alto = buono (più sole)
    if (weather.uvIndex !== undefined) {
      if (weather.uvIndex >= 7) {
        score += 30;
        reasons.push("Indice UV molto alto");
      } else if (weather.uvIndex >= 4) {
        score += 20;
        reasons.push("Indice UV buono");
      } else if (weather.uvIndex > 0) {
        score += 10;
        reasons.push("Indice UV moderato");
      }
    }

    // Nuvolosità bassa = buono
    if (weather.cloudCover !== undefined) {
      if (weather.cloudCover < 20) {
        score += 30;
        reasons.push("Cielo sereno");
      } else if (weather.cloudCover < 40) {
        score += 20;
        reasons.push("Poche nuvole");
      } else if (weather.cloudCover < 60) {
        score += 10;
        reasons.push("Nuvolosità moderata");
      } else {
        score -= 10;
        reasons.push("Nuvolosità alta");
      }
    }

    // Probabilità pioggia bassa = buono
    if (weather.precipitationProbability !== undefined) {
      if (weather.precipitationProbability < 10) {
        score += 20;
        reasons.push("Nessuna pioggia prevista");
      } else if (weather.precipitationProbability < 30) {
        score += 5;
        reasons.push("Bassa probabilità pioggia");
      } else if (weather.precipitationProbability < 50) {
        score -= 10;
        reasons.push("Media probabilità pioggia");
      } else {
        score -= 30;
        reasons.push("Alta probabilità pioggia");
      }
    }

    // Condizioni meteo
    const conditionLower = (weather.condition || "").toLowerCase();
    if (conditionLower.includes("clear") || conditionLower.includes("sunny")) {
      score += 20;
      reasons.push("Cielo sereno");
    } else if (conditionLower.includes("partly")) {
      score += 10;
      reasons.push("Parzialmente nuvoloso");
    } else if (conditionLower.includes("mostly") || conditionLower.includes("cloud")) {
      score -= 5;
      reasons.push("Nuvoloso");
    } else if (conditionLower.includes("rain") || conditionLower.includes("storm")) {
      score -= 30;
      reasons.push("Pioggia/Temporali");
    }

    // Determina livello e messaggio
    let level: "ottimo" | "buono" | "moderato" | "scarso" | "notte" | "unknown";
    let message: string;
    let color: "default" | "secondary" | "destructive" | "outline";

    if (score >= 60) {
      level = "ottimo";
      message = "Ottimo momento per autoconsumo";
      color = "default";
    } else if (score >= 40) {
      level = "buono";
      message = "Buon momento per autoconsumo";
      color = "default";
    } else if (score >= 20) {
      level = "moderato";
      message = "Produzione FV moderata";
      color = "secondary";
    } else if (score >= 0) {
      level = "scarso";
      message = "Produzione FV limitata";
      color = "secondary";
    } else {
      level = "scarso";
      message = "Autoconsumo sconsigliato: condizioni sfavorevoli";
      color = "destructive";
    }

    return { level, message, color, score, reasons };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) {
    return null;
  }

  const consumptionAdvice = getConsumptionAdvice(currentWeather);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3 sm:space-y-6">
          {/* Badge Suggerimento Autoconsumo */}
          {currentWeather && (
            <div className="flex items-center justify-center">
              <Badge variant={consumptionAdvice.color} className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm">
                <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                {consumptionAdvice.message}
              </Badge>
            </div>
          )}

          {/* Sezione Dati Istantanei */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:justify-between gap-2 sm:gap-4 lg:gap-6">
            {/* Sinistra: Icona meteo grande */}
            <div className="flex items-center justify-center sm:justify-start">
              {getWeatherIcon(
                currentWeather.conditionType || currentWeather.condition,
                "large",
                currentWeather.isDaytime
              )}
            </div>

            {/* Centro: Temperatura e condizione */}
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                {Math.round(currentWeather.temperature)}°
              </div>
              <div className="text-sm sm:text-base lg:text-lg text-muted-foreground capitalize">
                {currentWeather.condition}
              </div>
            </div>

            {/* Destra: Città, data e ora */}
            <div className="flex flex-col items-center sm:items-end text-center sm:text-right gap-0.5 sm:gap-1">
              <div className="text-sm sm:text-base lg:text-lg font-semibold">
                {currentWeather.location.city}
              </div>
              <div className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">
                {currentDateTime.toLocaleDateString("it-IT", {
                  timeZone: "Europe/Rome",
                  weekday: "long",
                  day: "numeric",
                  month: "long"
                })}
              </div>
              <div className="text-sm sm:text-base lg:text-lg font-semibold">
                {currentDateTime.toLocaleTimeString("it-IT", { 
                  timeZone: "Europe/Rome",
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </div>
            </div>
          </div>

          {/* Previsioni Orarie */}
          {hourlyForecasts.length > 0 && (
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>PREVISIONI ORARIE</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid md:grid-cols-12 md:justify-items-center">
                {hourlyForecasts.map((hour, index) => (
                  <div key={index} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-[50px] sm:min-w-[60px] md:min-w-0">
                    <div className="flex flex-col items-center">
                      {getWeatherIcon(
                        hour.conditionType || hour.condition,
                        "small",
                        hour.isDaytime !== undefined ? hour.isDaytime : true
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold">
                      {Math.round(hour.temperature)}°
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                      {hour.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previsioni 7 Giorni */}
          {dailyForecasts.length > 0 && (
            <div className="space-y-1 sm:space-y-2">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>PREVISIONI 7 GIORNI</span>
              </div>
              <div className="space-y-1 sm:space-y-2">
                {dailyForecasts.map((day, index) => {
                  const isToday = index === 0;
                  const minTemp = day.minTemperature || 0;
                  const maxTemp = day.maxTemperature || 0;

                  // Calcola il range globale per normalizzare le barre
                  const allTemps = dailyForecasts.flatMap((d) => [
                    d.minTemperature || 0,
                    d.maxTemperature || 0,
                  ]);
                  const maxGlobal = Math.max(...allTemps);
                  const minGlobal = Math.min(...allTemps);
                  const globalRange = maxGlobal - minGlobal;

                  // Calcola posizione e larghezza della barra
                  const barStart = globalRange > 0 ? ((minTemp - minGlobal) / globalRange) * 100 : 0;
                  const barEnd = globalRange > 0 ? ((maxTemp - minGlobal) / globalRange) * 100 : 100;
                  const barWidth = Math.max(barEnd - barStart, 3); // Minimo 3% per visibilità

                  return (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm cursor-pointer hover:bg-muted/50 rounded-md p-1.5 sm:p-2 transition-colors">
                          {/* Data */}
                          <div className="w-12 sm:w-16 text-left font-medium text-[10px] sm:text-xs">
                            {formatDate(day.date, isToday)}
                          </div>

                          {/* Icona e probabilità pioggia */}
                          <div className="flex items-center gap-1 sm:gap-1.5 min-w-[50px] sm:min-w-[60px]">
                            {getWeatherIcon(day.conditionType || day.condition, "small")}
                            {day.precipitationProbability !== undefined && day.precipitationProbability > 0 && (
                              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                {day.precipitationProbability}%
                              </span>
                            )}
                          </div>

                          {/* Barra temperatura */}
                          <div className="flex-1 relative h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`absolute h-full ${getTemperatureBarColor(minTemp, maxTemp)} rounded-full transition-all`}
                              style={{
                                left: `${barStart}%`,
                                width: `${barWidth}%`,
                              }}
                            />
                          </div>

                          {/* Temperature */}
                          <div className="flex items-center gap-1.5 sm:gap-2 w-16 sm:w-20 justify-end">
                            <span className="text-muted-foreground text-[10px] sm:text-xs">
                              {Math.round(minTemp)}°
                            </span>
                            <span className="font-semibold text-xs sm:text-sm">
                              {Math.round(maxTemp)}°
                            </span>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-full sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader className="pb-2 shrink-0">
                          <DialogTitle className="text-base">
                            Dettagli Tecnici - {formatDate(day.date, isToday)}
                          </DialogTitle>
                        </DialogHeader>
                        {day.fullData && (
                          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {(() => {
                              // Log per debug - mostra tutti i dati disponibili

                              const formatValue = (value: string | number | null | undefined, unit?: string): string => {
                                if (value === undefined || value === null || value === '') return '-';
                                const formatted = typeof value === 'number' ? (Number.isInteger(value) ? value.toString() : value.toFixed(1)) : value;
                                return unit ? `${formatted} ${unit}` : formatted.toString();
                              };

                              const renderRow = (
                                icon: React.ReactNode,
                                name: string,
                                value: string | number | null | undefined,
                                unit?: string
                              ) => {
                                const formattedValue = formatValue(value, unit);
                                if (formattedValue === '-') return null;

                                return (
                                  <tr className="border-b hover:bg-muted/50">
                                    <td className="py-1.5 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="text-muted-foreground shrink-0">{icon}</div>
                                        <span className="text-sm font-medium">{name}</span>
                                      </div>
                                    </td>
                                    <td className="py-1.5 px-3 text-right">
                                      <span className="text-sm font-semibold">{formattedValue}</span>
                                    </td>
                                  </tr>
                                );
                              };

                              const getConditionText = (forecast: any) => {
                                if (!forecast?.weatherCondition) return null;
                                return forecast.weatherCondition.description?.text ||
                                  forecast.weatherCondition.type?.replace(/_/g, ' ') ||
                                  null;
                              };

                              return (
                                <div className="space-y-4">
                                  {/* Dati Generali */}
                                  <div>
                                    <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 sticky top-0 bg-background py-1">
                                      <BarChart3 className="h-3.5 w-3.5" />
                                      Dati Generali
                                    </h3>
                                    <div className="border rounded-md overflow-hidden">
                                      <table className="w-full text-sm">
                                        <tbody>
                                          {renderRow(
                                            <Thermometer className="h-4 w-4" />,
                                            "Temperatura Massima",
                                            day.fullData.maxTemperature?.degrees,
                                            "°C"
                                          )}
                                          {renderRow(
                                            <Thermometer className="h-4 w-4" />,
                                            "Temperatura Minima",
                                            day.fullData.minTemperature?.degrees,
                                            "°C"
                                          )}
                                          {renderRow(
                                            <Activity className="h-4 w-4" />,
                                            "Temperatura Percepita Max",
                                            day.fullData.feelsLikeMaxTemperature?.degrees,
                                            "°C"
                                          )}
                                          {renderRow(
                                            <Activity className="h-4 w-4" />,
                                            "Temperatura Percepita Min",
                                            day.fullData.feelsLikeMinTemperature?.degrees,
                                            "°C"
                                          )}
                                          {renderRow(
                                            <Thermometer className="h-4 w-4" />,
                                            "Indice Calore Massimo",
                                            day.fullData.maxHeatIndex?.degrees,
                                            "°C"
                                          )}
                                          {renderRow(
                                            <Gauge className="h-4 w-4" />,
                                            "Pressione Atmosferica",
                                            day.fullData.airPressure,
                                            "hPa"
                                          )}
                                          {renderRow(
                                            <Eye className="h-4 w-4" />,
                                            "Visibilità",
                                            day.fullData.visibility,
                                            "km"
                                          )}
                                          {day.fullData.iceThickness?.thickness !== undefined && day.fullData.iceThickness.thickness > 0 && renderRow(
                                            <Snowflake className="h-4 w-4" />,
                                            "Spessore Ghiaccio",
                                            day.fullData.iceThickness.thickness,
                                            "mm"
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* Previsione Giorno */}
                                  {day.fullData.daytimeForecast && (
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 sticky top-0 bg-background py-1">
                                        <Sun className="h-3.5 w-3.5" />
                                        Previsione Giorno
                                      </h3>
                                      <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            {renderRow(
                                              <CloudSun className="h-4 w-4" />,
                                              "Condizione Meteo",
                                              getConditionText(day.fullData.daytimeForecast)
                                            )}
                                            {renderRow(
                                              <Droplets className="h-4 w-4" />,
                                              "Umidità Relativa",
                                              day.fullData.daytimeForecast.relativeHumidity,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Sun className="h-4 w-4" />,
                                              "Indice UV",
                                              day.fullData.daytimeForecast.uvIndex
                                            )}
                                            {renderRow(
                                              <Cloud className="h-4 w-4" />,
                                              "Nuvolosità",
                                              day.fullData.daytimeForecast.cloudCover,
                                              "%"
                                            )}
                                            {renderRow(
                                              <CloudRain className="h-4 w-4" />,
                                              `Probabilità Pioggia (${day.fullData.daytimeForecast.precipitation?.probability?.type || 'N/A'})`,
                                              day.fullData.daytimeForecast.precipitation?.probability?.percent,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Droplets className="h-4 w-4" />,
                                              "Quantità Pioggia",
                                              day.fullData.daytimeForecast.precipitation?.qpf?.quantity,
                                              day.fullData.daytimeForecast.precipitation?.qpf?.unit
                                            )}
                                            {renderRow(
                                              <CloudLightning className="h-4 w-4" />,
                                              "Probabilità Temporali",
                                              day.fullData.daytimeForecast.thunderstormProbability,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Wind className="h-4 w-4" />,
                                              `Velocità Vento (${day.fullData.daytimeForecast.wind?.direction?.cardinal || 'N/A'})`,
                                              day.fullData.daytimeForecast.wind?.speed?.value,
                                              day.fullData.daytimeForecast.wind?.speed?.unit
                                            )}
                                            {renderRow(
                                              <Waves className="h-4 w-4" />,
                                              "Raffiche di Vento",
                                              day.fullData.daytimeForecast.wind?.gust?.value,
                                              day.fullData.daytimeForecast.wind?.gust?.unit
                                            )}
                                            {renderRow(
                                              <Wind className="h-4 w-4" />,
                                              "Direzione Vento",
                                              day.fullData.daytimeForecast.wind?.direction?.degrees,
                                              "°"
                                            )}
                                            {day.fullData.daytimeForecast.precipitation?.snowQpf?.quantity !== undefined && day.fullData.daytimeForecast.precipitation.snowQpf.quantity > 0 && renderRow(
                                              <Snowflake className="h-4 w-4" />,
                                              "Quantità Neve",
                                              day.fullData.daytimeForecast.precipitation.snowQpf.quantity,
                                              day.fullData.daytimeForecast.precipitation.snowQpf.unit
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Previsione Notte */}
                                  {day.fullData.nighttimeForecast && (
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 sticky top-0 bg-background py-1">
                                        <Moon className="h-3.5 w-3.5" />
                                        Previsione Notte
                                      </h3>
                                      <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            {renderRow(
                                              <Moon className="h-4 w-4" />,
                                              "Condizione Meteo",
                                              getConditionText(day.fullData.nighttimeForecast)
                                            )}
                                            {renderRow(
                                              <Droplets className="h-4 w-4" />,
                                              "Umidità Relativa",
                                              day.fullData.nighttimeForecast.relativeHumidity,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Cloud className="h-4 w-4" />,
                                              "Nuvolosità",
                                              day.fullData.nighttimeForecast.cloudCover,
                                              "%"
                                            )}
                                            {renderRow(
                                              <CloudRain className="h-4 w-4" />,
                                              `Probabilità Pioggia (${day.fullData.nighttimeForecast.precipitation?.probability?.type || 'N/A'})`,
                                              day.fullData.nighttimeForecast.precipitation?.probability?.percent,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Droplets className="h-4 w-4" />,
                                              "Quantità Pioggia",
                                              day.fullData.nighttimeForecast.precipitation?.qpf?.quantity,
                                              day.fullData.nighttimeForecast.precipitation?.qpf?.unit
                                            )}
                                            {renderRow(
                                              <CloudLightning className="h-4 w-4" />,
                                              "Probabilità Temporali",
                                              day.fullData.nighttimeForecast.thunderstormProbability,
                                              "%"
                                            )}
                                            {renderRow(
                                              <Wind className="h-4 w-4" />,
                                              `Velocità Vento (${day.fullData.nighttimeForecast.wind?.direction?.cardinal || 'N/A'})`,
                                              day.fullData.nighttimeForecast.wind?.speed?.value,
                                              day.fullData.nighttimeForecast.wind?.speed?.unit
                                            )}
                                            {renderRow(
                                              <Waves className="h-4 w-4" />,
                                              "Raffiche di Vento",
                                              day.fullData.nighttimeForecast.wind?.gust?.value,
                                              day.fullData.nighttimeForecast.wind?.gust?.unit
                                            )}
                                            {renderRow(
                                              <Wind className="h-4 w-4" />,
                                              "Direzione Vento",
                                              day.fullData.nighttimeForecast.wind?.direction?.degrees,
                                              "°"
                                            )}
                                            {day.fullData.nighttimeForecast.precipitation?.snowQpf?.quantity !== undefined && day.fullData.nighttimeForecast.precipitation.snowQpf.quantity > 0 && renderRow(
                                              <Snowflake className="h-4 w-4" />,
                                              "Quantità Neve",
                                              day.fullData.nighttimeForecast.precipitation.snowQpf.quantity,
                                              day.fullData.nighttimeForecast.precipitation.snowQpf.unit
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}

                                  {/* Eventi Astronomici */}
                                  {(day.fullData.sunEvents || day.fullData.moonEvents) && (
                                    <div>
                                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 sticky top-0 bg-background py-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Eventi Astronomici
                                      </h3>
                                      <div className="border rounded-md overflow-hidden">
                                        <table className="w-full text-sm">
                                          <tbody>
                                            {day.fullData.sunEvents?.sunriseTime && renderRow(
                                              <Sunrise className="h-4 w-4" />,
                                              "Alba",
                                              format(parseISO(day.fullData.sunEvents.sunriseTime), "HH:mm")
                                            )}
                                            {day.fullData.sunEvents?.sunsetTime && renderRow(
                                              <Sunset className="h-4 w-4" />,
                                              "Tramonto",
                                              format(parseISO(day.fullData.sunEvents.sunsetTime), "HH:mm")
                                            )}
                                            {day.fullData.moonEvents?.moonPhase && renderRow(
                                              <Moon className="h-4 w-4" />,
                                              "Fase Lunare",
                                              day.fullData.moonEvents.moonPhase.replace(/_/g, ' ')
                                            )}
                                            {day.fullData.moonEvents?.moonriseTimes?.[0] && renderRow(
                                              <Moon className="h-4 w-4" />,
                                              "Sorgere Luna",
                                              format(parseISO(day.fullData.moonEvents.moonriseTimes[0]), "HH:mm")
                                            )}
                                            {day.fullData.moonEvents?.moonsetTimes?.[0] && renderRow(
                                              <Moon className="h-4 w-4" />,
                                              "Tramonto Luna",
                                              format(parseISO(day.fullData.moonEvents.moonsetTimes[0]), "HH:mm")
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

