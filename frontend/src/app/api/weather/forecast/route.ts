// app/api/weather/forecast/route.ts
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/yaml-settings";

// La chiave API viene letta dal YAML (plant.settings.weather.api_key)
// Fallback a variabile d'ambiente per retrocompatibilità
async function getGoogleMapsApiKey(): Promise<string | null> {
  const yamlKey = await getSetting("weather_api_key");
  return yamlKey || process.env.GOOGLE_MAPS_API_KEY || null;
}

// Cache in-memory per ridurre chiamate API
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const forecastCache: Map<string, CacheEntry<any>> = new Map();
const geocodeCache: Map<string, CacheEntry<any>> = new Map();

// TTL: 12 ore per forecast (ridotto per limitare costi), permanente per geocoding
const FORECAST_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 ore
const GEOCODE_CACHE_TTL = Infinity; // Geocoding non cambia mai

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: Request) {
  try {
    const GOOGLE_MAPS_API_KEY = await getGoogleMapsApiKey();
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Maps API key non configurata" },
        { status: 500 }
      );
    }

    // Recupera parametri dalla query string
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7"); // Default 7 giorni

    // Recupera la città dal database
    const city = await getSetting("location_city");
    const address = await getSetting("location_address");

    if (!city && !address) {
      return NextResponse.json(
        { success: false, error: "Città o indirizzo non configurati" },
        { status: 400 }
      );
    }

    // Usa la città o l'indirizzo per geocoding
    const locationQuery = address || city;
    if (!locationQuery) {
      return NextResponse.json(
        { success: false, error: "Città o indirizzo non configurati" },
        { status: 400 }
      );
    }

    // Step 1: Geocoding per ottenere lat/lng (con cache)
    let geocodeData = getCached(geocodeCache, locationQuery, GEOCODE_CACHE_TTL);
    let lat: number;
    let lng: number;

    if (!geocodeData) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        locationQuery
      )}&key=${GOOGLE_MAPS_API_KEY}`;

      const geocodeResponse = await fetch(geocodeUrl);
      geocodeData = await geocodeResponse.json();

      if (geocodeData.status !== "OK" || !geocodeData.results?.[0]) {
        return NextResponse.json(
          { success: false, error: "Impossibile trovare la località" },
          { status: 404 }
        );
      }

      // Salva in cache
      setCached(geocodeCache, locationQuery, geocodeData);
    }

    const location = geocodeData.results[0].geometry.location;
    lat = location.lat;
    lng = location.lng;

    // Step 2: Forecast API (con cache di 6 ore)
    const forecastCacheKey = `${lat},${lng},${days}`;
    let forecastData = getCached(forecastCache, forecastCacheKey, FORECAST_CACHE_TTL);

    if (!forecastData) {
      const forecastUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${GOOGLE_MAPS_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&days=${days}&languageCode=it`;

      const forecastResponse = await fetch(forecastUrl, {
        method: "GET",
      });

      // Verifica il content-type prima di parsare JSON
      const contentType = forecastResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await forecastResponse.text();
        console.error("Forecast API returned non-JSON response:", textResponse.substring(0, 500));
        return NextResponse.json(
          {
            success: false,
            error: `API Forecast ha restituito un errore. Verifica che l'API sia abilitata e che la chiave sia valida. Status: ${forecastResponse.status}`,
          },
          { status: forecastResponse.status || 500 }
        );
      }

      forecastData = await forecastResponse.json();

      // Log completo della risposta raw di Google per debug
      console.log("=== GOOGLE WEATHER API - RISPOSTA COMPLETA (Forecast 7 Giorni) ===");
      console.log("Risposta raw completa:", JSON.stringify(forecastData, null, 2));
      
      // Log specifico per oggi (primo giorno)
      if (forecastData.forecastDays && forecastData.forecastDays.length > 0) {
        const oggi = forecastData.forecastDays[0];
        console.log("=== DATI DI OGGI (dal forecast 7 giorni) ===");
        console.log("Data:", `${oggi.displayDate?.year}-${oggi.displayDate?.month}-${oggi.displayDate?.day}`);
        console.log("Dati completi di oggi:", JSON.stringify(oggi, null, 2));
        console.log("Dettagli specifici di oggi:", {
          uvIndexDaytime: oggi.daytimeForecast?.uvIndex,
          uvIndexNighttime: oggi.nighttimeForecast?.uvIndex,
          cloudCoverDaytime: oggi.daytimeForecast?.cloudCover,
          cloudCoverDaytimeObject: JSON.stringify(oggi.daytimeForecast?.cloudCover),
          cloudCoverNighttime: oggi.nighttimeForecast?.cloudCover,
          cloudCoverNighttimeObject: JSON.stringify(oggi.nighttimeForecast?.cloudCover),
          cloudCoverDaytimePercent: oggi.daytimeForecast?.cloudCover?.percent,
          cloudCoverNighttimePercent: oggi.nighttimeForecast?.cloudCover?.percent,
          humidityDaytime: oggi.daytimeForecast?.relativeHumidity,
          humidityNighttime: oggi.nighttimeForecast?.relativeHumidity,
          maxTemp: oggi.maxTemperature?.degrees,
          minTemp: oggi.minTemperature?.degrees,
          precipitationDaytime: oggi.daytimeForecast?.precipitation?.probability?.percent,
          precipitationNighttime: oggi.nighttimeForecast?.precipitation?.probability?.percent,
          conditionDaytime: oggi.daytimeForecast?.weatherCondition,
          conditionNighttime: oggi.nighttimeForecast?.weatherCondition,
        });
        console.log("=== FINE DATI DI OGGI ===");
      }
      
      // Log UV Index per tutti i 7 giorni
      console.log("Dettagli UV Index per i prossimi 7 giorni:");
      if (forecastData.forecastDays) {
        forecastData.forecastDays.forEach((day: any, index: number) => {
          console.log(`Giorno ${index + 1} (${day.displayDate?.year}-${day.displayDate?.month}-${day.displayDate?.day}):`, {
            uvIndexDaytime: day.daytimeForecast?.uvIndex,
            uvIndexNighttime: day.nighttimeForecast?.uvIndex,
            cloudCoverDaytime: day.daytimeForecast?.cloudCover,
            cloudCoverNighttime: day.nighttimeForecast?.cloudCover,
            cloudCoverDaytimePercent: day.daytimeForecast?.cloudCover?.percent,
            cloudCoverNighttimePercent: day.nighttimeForecast?.cloudCover?.percent,
          });
        });
      }
      console.log("=== FINE LOG GOOGLE FORECAST API ===");

      if (!forecastResponse.ok || forecastData.error) {
        return NextResponse.json(
          {
            success: false,
            error: forecastData.error?.message || forecastData.error || "Errore nel recupero previsioni",
          },
          { status: forecastResponse.status || 500 }
        );
      }

      // Salva in cache
      setCached(forecastCache, forecastCacheKey, forecastData);
    }

    // L'API restituisce 'forecastDays' non 'dailyForecasts'!
    const dailyForecasts = forecastData.forecastDays || [];

    // Mappa le previsioni giornaliere (include anche i dati raw completi)
    const forecasts = dailyForecasts.map((day: any) => ({
      date: day.displayDate
        ? `${day.displayDate.year}-${String(day.displayDate.month).padStart(2, "0")}-${String(day.displayDate.day).padStart(2, "0")}`
        : null,
      maxTemperature: day.maxTemperature?.degrees,
      minTemperature: day.minTemperature?.degrees,
      feelsLikeMax: day.feelsLikeMaxTemperature?.degrees,
      feelsLikeMin: day.feelsLikeMinTemperature?.degrees,
      maxHeatIndex: day.maxHeatIndex?.degrees,
      daytimeForecast: {
        condition: day.daytimeForecast?.weatherCondition?.description?.text || day.daytimeForecast?.weatherCondition?.type,
        conditionType: day.daytimeForecast?.weatherCondition?.type,
        conditionIcon: day.daytimeForecast?.weatherCondition?.iconBaseUri,
        humidity: day.daytimeForecast?.relativeHumidity,
        uvIndex: day.daytimeForecast?.uvIndex,
        precipitation: {
          probability: day.daytimeForecast?.precipitation?.probability?.percent,
          quantity: day.daytimeForecast?.precipitation?.qpf?.quantity,
          type: day.daytimeForecast?.precipitation?.probability?.type,
        },
        thunderstormProbability: day.daytimeForecast?.thunderstormProbability,
        wind: {
          speed: day.daytimeForecast?.wind?.speed?.value,
          direction: day.daytimeForecast?.wind?.direction?.degrees,
          cardinal: day.daytimeForecast?.wind?.direction?.cardinal,
          gust: day.daytimeForecast?.wind?.gust?.value,
        },
        // cloudCover può essere un numero diretto o un oggetto con .percent
        cloudCover: typeof day.daytimeForecast?.cloudCover === 'number' 
          ? day.daytimeForecast.cloudCover 
          : day.daytimeForecast?.cloudCover?.percent,
      },
      nighttimeForecast: {
        condition: day.nighttimeForecast?.weatherCondition?.description?.text || day.nighttimeForecast?.weatherCondition?.type,
        conditionType: day.nighttimeForecast?.weatherCondition?.type,
        conditionIcon: day.nighttimeForecast?.weatherCondition?.iconBaseUri,
        humidity: day.nighttimeForecast?.relativeHumidity,
        uvIndex: day.nighttimeForecast?.uvIndex,
        precipitation: {
          probability: day.nighttimeForecast?.precipitation?.probability?.percent,
          quantity: day.nighttimeForecast?.precipitation?.qpf?.quantity,
          type: day.nighttimeForecast?.precipitation?.probability?.type,
        },
        thunderstormProbability: day.nighttimeForecast?.thunderstormProbability,
        wind: {
          speed: day.nighttimeForecast?.wind?.speed?.value,
          direction: day.nighttimeForecast?.wind?.direction?.degrees,
          cardinal: day.nighttimeForecast?.wind?.direction?.cardinal,
          gust: day.nighttimeForecast?.wind?.gust?.value,
        },
        // cloudCover può essere un numero diretto o un oggetto con .percent
        cloudCover: typeof day.nighttimeForecast?.cloudCover === 'number' 
          ? day.nighttimeForecast.cloudCover 
          : day.nighttimeForecast?.cloudCover?.percent,
      },
      sunEvents: {
        sunrise: day.sunEvents?.sunriseTime,
        sunset: day.sunEvents?.sunsetTime,
      },
      moonEvents: {
        phase: day.moonEvents?.moonPhase,
        moonrise: day.moonEvents?.moonriseTimes?.[0],
        moonset: day.moonEvents?.moonsetTimes?.[0],
      },
      iceThickness: day.iceThickness?.thickness,
      // Salva TUTTI i dati raw originali per il dialog tecnico
      fullData: day,
    }));

    return NextResponse.json({
      success: true,
      data: {
        location: {
          city: city || geocodeData.results[0].formatted_address,
          address: address || geocodeData.results[0].formatted_address,
          latitude: lat,
          longitude: lng,
        },
        timeZone: forecastData.timeZone?.id,
        forecasts,
      },
    });
  } catch (error) {
    console.error("Error fetching forecast:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

