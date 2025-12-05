// app/api/weather/hourly/route.ts
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/postgres-settings";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Cache in-memory per ridurre chiamate API
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const hourlyCache: Map<string, CacheEntry<any>> = new Map();
const geocodeCache: Map<string, CacheEntry<any>> = new Map();

// TTL: 2 ore per hourly forecast (ridotto per limitare costi), permanente per geocoding
const HOURLY_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 ore
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
    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Google Maps API key non configurata" },
        { status: 500 }
      );
    }

    // Recupera parametri dalla query string
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get("hours") || "6"); // Default 6 ore

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

    // Step 2: Hourly Forecast API (con cache di 1 ora)
    const hourlyCacheKey = `${lat},${lng},${hours}`;
    let hourlyData = getCached(hourlyCache, hourlyCacheKey, HOURLY_CACHE_TTL);

    if (!hourlyData) {
      // https://developers.google.com/maps/documentation/weather/hourly-forecast
      const hourlyUrl = `https://weather.googleapis.com/v1/forecast/hours:lookup?key=${GOOGLE_MAPS_API_KEY}&location.latitude=${lat}&location.longitude=${lng}&hours=${hours}`;

      const hourlyResponse = await fetch(hourlyUrl, {
        method: "GET",
      });

      // Verifica il content-type prima di parsare JSON
      const contentType = hourlyResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await hourlyResponse.text();
        console.error("Hourly Forecast API returned non-JSON response:", textResponse.substring(0, 500));
        return NextResponse.json(
          {
            success: false,
            error: `API Hourly Forecast ha restituito un errore. Verifica che l'API sia abilitata e che la chiave sia valida. Status: ${hourlyResponse.status}`,
          },
          { status: hourlyResponse.status || 500 }
        );
      }

      hourlyData = await hourlyResponse.json();

      // Log rimosso per ridurre spam console

      if (!hourlyResponse.ok || hourlyData.error) {
        return NextResponse.json(
          {
            success: false,
            error: hourlyData.error?.message || hourlyData.error || "Errore nel recupero previsioni orarie",
          },
          { status: hourlyResponse.status || 500 }
        );
      }

      // Salva in cache
      setCached(hourlyCache, hourlyCacheKey, hourlyData);
    }

    // L'API restituisce 'forecastHours'
    const forecastHours = hourlyData.forecastHours || [];

    // Mappa le previsioni orarie
    const hourlyForecasts = forecastHours.map((hour: any) => ({
      time: hour.displayDateTime
        ? `${String(hour.displayDateTime.hours).padStart(2, "0")}:${String(hour.displayDateTime.minutes || 0).padStart(2, "0")}`
        : null,
      date: hour.displayDateTime
        ? `${hour.displayDateTime.year}-${String(hour.displayDateTime.month).padStart(2, "0")}-${String(hour.displayDateTime.day).padStart(2, "0")}`
        : null,
      temperature: hour.temperature?.degrees,
      condition: hour.weatherCondition?.description?.text || hour.weatherCondition?.type,
      conditionType: hour.weatherCondition?.type,
      conditionIcon: hour.weatherCondition?.iconBaseUri,
      isDaytime: hour.isDaytime,
      humidity: hour.relativeHumidity,
      precipitationProbability: hour.precipitation?.probability?.percent,
      precipitationType: hour.precipitation?.probability?.type,
      cloudCover: hour.cloudCover?.percent,
      uvIndex: hour.uvIndex,
      windSpeed: hour.wind?.speedKph || hour.wind?.speed?.value,
      windDirection: hour.wind?.direction?.degrees,
      windCardinal: hour.wind?.direction?.cardinal,
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
        timeZone: hourlyData.timeZone?.id,
        forecasts: hourlyForecasts,
      },
    });
  } catch (error) {
    console.error("Error fetching hourly forecast:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

