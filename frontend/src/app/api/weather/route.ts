// app/api/weather/route.ts
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/postgres-settings";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Cache in-memory per ridurre chiamate API
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const weatherCache: Map<string, CacheEntry<any>> = new Map();
const geocodeCache: Map<string, CacheEntry<any>> = new Map();

// TTL: 2 ore per weather (ridotto per limitare costi API), permanente per geocoding
const WEATHER_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 ore
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

export async function GET() {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Maps API key non configurata" },
        { status: 500 }
      );
    }

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

    // Step 2: Weather API (con cache di 10 minuti)
    const weatherCacheKey = `${lat},${lng}`;
    let weatherData = getCached(weatherCache, weatherCacheKey, WEATHER_CACHE_TTL);

    if (!weatherData) {
      const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}&location.latitude=${lat}&location.longitude=${lng}`;

      const weatherResponse = await fetch(weatherUrl, {
        method: "GET",
      });

      // Verifica il content-type prima di parsare JSON
      const contentType = weatherResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await weatherResponse.text();
        console.error("Weather API returned non-JSON response:", textResponse.substring(0, 500));
        return NextResponse.json(
          {
            success: false,
            error: `API Weather ha restituito un errore. Verifica che l'API sia abilitata e che la chiave sia valida. Status: ${weatherResponse.status}`,
          },
          { status: weatherResponse.status || 500 }
        );
      }

      weatherData = await weatherResponse.json();

      // Log rimosso per ridurre spam console

      if (!weatherResponse.ok || weatherData.error) {
        return NextResponse.json(
          {
            success: false,
            error: weatherData.error?.message || weatherData.error || "Errore nel recupero dati meteo",
          },
          { status: weatherResponse.status || 500 }
        );
      }

      // Salva in cache
      setCached(weatherCache, weatherCacheKey, weatherData);
    }

    // Mappa la risposta dell'API Weather al formato del widget
    // La risposta ha questa struttura (secondo documentazione):
    // {
    //   "currentTime": "2025-07-01T12:33:24.606422609Z",
    //   "timeZone": { "id": "America/Los_Angeles" },
    //   "isDaytime": false,
    //   "weatherCondition": {
    //     "iconBaseUri": "https://maps.gstatic.com/weather/v1/partly_clear",
    //     "description": { "text": "Partly cloudy", "languageCode": "en" },
    //     "type": "PARTLY_CLOUDY"
    //   },
    //   "temperature": { "degrees": 16, "unit": "CELSIUS" },
    //   "feelsLikeTemperature": { "degrees": 16, "unit": "CELSIUS" },
    //   "dewPoint": { "degrees": 12, "unit": "CELSIUS" },
    //   "heatIndex": { "degrees": 16, "unit": "CELSIUS" },
    //   "windChill": { "degrees": 16, "unit": "CELSIUS" },
    //   "relativeHumidity": 78,
    //   "uvIndex": 0,
    //   "precipitation": {
    //     "probability": { "percent": 3, "type": "RAIN" },
    //     "snowQpf": { "quantity": 0, "unit": "MILLIMETERS" },
    //     "qpf": { "quantity": 0, "unit": "MILLIMETERS" }
    //   },
    //   "thunderstormProbability": 0,
    //   "airPressure": { "meanSeaLevelMillibars": 1011.5 },
    //   "wind": { "speedKph": 10, "direction": {...} },
    //   "cloudCover": { "percent": 50 }
    // }
    
    return NextResponse.json({
      success: true,
      data: {
        location: {
          city: city || geocodeData.results[0].formatted_address,
          address: address || geocodeData.results[0].formatted_address,
          latitude: lat,
          longitude: lng,
        },
        weather: {
          // Dati base
          temperature: weatherData.temperature?.degrees || 0,
          condition: weatherData.weatherCondition?.description?.text || weatherData.weatherCondition?.type || "Unknown",
          conditionType: weatherData.weatherCondition?.type,
          conditionIcon: weatherData.weatherCondition?.iconBaseUri,
          humidity: weatherData.relativeHumidity,
          
          // Temperatura
          feelsLike: weatherData.feelsLikeTemperature?.degrees,
          dewPoint: weatherData.dewPoint?.degrees,
          heatIndex: weatherData.heatIndex?.degrees,
          windChill: weatherData.windChill?.degrees,
          
          // Vento
          windSpeed: weatherData.wind?.speedKph,
          windDirection: weatherData.wind?.direction?.degrees,
          
          // Precipitazioni
          precipitation: weatherData.precipitation?.qpf?.quantity,
          precipitationUnit: weatherData.precipitation?.qpf?.unit,
          precipitationProbability: weatherData.precipitation?.probability?.percent,
          precipitationType: weatherData.precipitation?.probability?.type,
          snowQpf: weatherData.precipitation?.snowQpf?.quantity,
          thunderstormProbability: weatherData.thunderstormProbability,
          
          // Altro
          cloudCover: weatherData.cloudCover?.percent,
          uvIndex: weatherData.uvIndex,
          airPressure: weatherData.airPressure?.meanSeaLevelMillibars,
          
          // Tempo
          currentTime: weatherData.currentTime,
          timeZone: weatherData.timeZone?.id,
          isDaytime: weatherData.isDaytime,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching weather:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

