// app/api/weather/route.ts
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
    const GOOGLE_MAPS_API_KEY = await getGoogleMapsApiKey();
    
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Maps API key non configurata. Configurala in plant.yaml (settings.weather.api_key) o nella variabile d'ambiente GOOGLE_MAPS_API_KEY" },
        { status: 500 }
      );
    }

    // Recupera la città dalla configurazione YAML
    let city: string | null = null;
    let address: string | null = null;
    try {
      city = await getSetting("location_city");
      address = await getSetting("location_address");
    } catch (configError) {
      console.error("Errore nel recupero settings dalla configurazione:", configError);
      // Continua con valori null, useremo un fallback
    }

    // Fallback se non ci sono settings nel database
    const locationQuery = address || city || "Torino, Italy";
    
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
      const weatherUrl = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_MAPS_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&languageCode=it`;

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
      
      // Log per verificare se ci sono errori
      if (weatherData.error) {
        console.error("Weather API Error:", weatherData.error);
        return NextResponse.json(
          {
            success: false,
            error: weatherData.error?.message || weatherData.error || "Errore nel recupero dati meteo",
          },
          { status: weatherResponse.status || 500 }
        );
      }
      
      // Verifica che la risposta sia valida
      if (!weatherData || !weatherData.temperature) {
        console.error("Weather API - Risposta non valida:", weatherData);
        return NextResponse.json(
          {
            success: false,
            error: "Risposta API non valida",
          },
          { status: 500 }
        );
      }

      // Log completo della risposta raw di Google per debug
      console.log("=== GOOGLE WEATHER API - RISPOSTA COMPLETA (Current Conditions) ===");
      console.log("Risposta raw completa:", JSON.stringify(weatherData, null, 2));
      console.log("Dettagli campi specifici:", {
        uvIndex: weatherData.uvIndex,
        uvIndexType: typeof weatherData.uvIndex,
        cloudCover: weatherData.cloudCover,
        cloudCoverType: typeof weatherData.cloudCover,
        cloudCoverObject: JSON.stringify(weatherData.cloudCover),
        cloudCoverPercent: weatherData.cloudCover?.percent,
        cloudCoverPercentType: typeof weatherData.cloudCover?.percent,
        humidity: weatherData.relativeHumidity,
        windSpeed: weatherData.wind?.speedKph,
        airPressure: weatherData.airPressure?.meanSeaLevelMillibars,
        precipitationProbability: weatherData.precipitation?.probability?.percent,
        isDaytime: weatherData.isDaytime,
        currentTime: weatherData.currentTime,
        weatherCondition: weatherData.weatherCondition,
      });
      console.log("=== FINE LOG GOOGLE WEATHER API ===");

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

