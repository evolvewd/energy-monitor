// hooks/useOptaDataFixed.ts
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  OptaRealtimeData,
  OptaPowerData,
  OptaExtremesData,
  OptaRealtimeTimeSeries,
  OptaPowerTimeSeries,
  OptaExtremesTimeSeries,
  OptaExtremes,
  OptaRealtimeApiResponse,
  OptaPowerApiResponse,
  OptaExtremesApiResponse,
} from "@/types/opta";

// Hook combinato OTTIMIZZATO con intervalli corretti
export const useOptaCombined = () => {
  // Stati per realtime
  const [realtimeData, setRealtimeData] = useState<OptaRealtimeData[]>([]);
  const [realtimeLatest, setRealtimeLatest] = useState<OptaRealtimeData | null>(
    null
  );
  const [realtimeTimeSeries, setRealtimeTimeSeries] =
    useState<OptaRealtimeTimeSeries | null>(null);
  const [realtimeTrends, setRealtimeTrends] = useState<{
    [key: string]: number;
  }>({});
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  const [realtimeLoading, setRealtimeLoading] = useState(false);
  const [realtimeUpdateCount, setRealtimeUpdateCount] = useState(0);

  // Stati per power
  const [powerData, setPowerData] = useState<OptaPowerData[]>([]);
  const [powerLatest, setPowerLatest] = useState<OptaPowerData | null>(null);
  const [powerTimeSeries, setPowerTimeSeries] =
    useState<OptaPowerTimeSeries | null>(null);
  const [powerTrends, setPowerTrends] = useState<{ [key: string]: number }>({});
  const [powerError, setPowerError] = useState<string | null>(null);
  const [powerLoading, setPowerLoading] = useState(false);
  const [powerUpdateCount, setPowerUpdateCount] = useState(0);

  // Stati per extremes
  const [extremesData, setExtremesData] = useState<OptaExtremesData[]>([]);
  const [extremesLatest, setExtremesLatest] = useState<OptaExtremesData | null>(
    null
  );
  const [extremesTimeSeries, setExtremesTimeSeries] =
    useState<OptaExtremesTimeSeries | null>(null);
  const [extremesExtremes, setExtremesExtremes] = useState<OptaExtremes>({});
  const [extremesError, setExtremesError] = useState<string | null>(null);
  const [extremesLoading, setExtremesLoading] = useState(false);
  const [extremesUpdateCount, setExtremesUpdateCount] = useState(0);

  // Stati generali
  const [isRunning, setIsRunning] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Refs per gli intervalli
  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const powerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const extremesIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch function per realtime
  const fetchRealtimeData = useCallback(async () => {
    if (realtimeLoading) return;

    setRealtimeLoading(true);
    try {
      const response = await fetch("/api/influx/opta-realtime", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: OptaRealtimeApiResponse = await response.json();

      if (result.status === "error" || result.error) {
        throw new Error(result.error || "Unknown API error");
      }

      setRealtimeData(result.data || []);
      setRealtimeLatest(result.latest || null);
      setRealtimeTimeSeries(result.timeSeries || null);
      setRealtimeTrends(result.trends || {});
      setRealtimeError(null);
      setRealtimeUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date());

      console.log("OPTA Realtime data updated:", {
        points: result.data?.length || 0,
        latest: result.latest,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching OPTA realtime data:", err);
      setRealtimeError(errorMessage);
    } finally {
      setRealtimeLoading(false);
    }
  }, [realtimeLoading]);

  // Fetch function per power
  const fetchPowerData = useCallback(async () => {
    if (powerLoading) return;

    setPowerLoading(true);
    try {
      const response = await fetch("/api/influx/opta-power", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: OptaPowerApiResponse = await response.json();

      if (result.status === "error" || result.error) {
        throw new Error(result.error || "Unknown API error");
      }

      setPowerData(result.data || []);
      setPowerLatest(result.latest || null);
      setPowerTimeSeries(result.timeSeries || null);
      setPowerTrends(result.trends || {});
      setPowerError(null);
      setPowerUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date());

      console.log("OPTA Power data updated:", {
        points: result.data?.length || 0,
        latest: result.latest,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching OPTA power data:", err);
      setPowerError(errorMessage);
    } finally {
      setPowerLoading(false);
    }
  }, [powerLoading]);

  // Fetch function per extremes
  const fetchExtremesData = useCallback(async () => {
    if (extremesLoading) return;

    setExtremesLoading(true);
    try {
      const response = await fetch("/api/influx/opta-extremes", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: OptaExtremesApiResponse = await response.json();

      if (result.status === "error" || result.error) {
        throw new Error(result.error || "Unknown API error");
      }

      setExtremesData(result.data || []);
      setExtremesLatest(result.latest || null);
      setExtremesTimeSeries(result.timeSeries || null);
      setExtremesExtremes(result.extremes || {});
      setExtremesError(null);
      setExtremesUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date());

      console.log("OPTA Extremes data updated:", {
        points: result.data?.length || 0,
        latest: result.latest,
        extremes: result.extremes,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching OPTA extremes data:", err);
      setExtremesError(errorMessage);
    } finally {
      setExtremesLoading(false);
    }
  }, [extremesLoading]);

  // Setup degli intervalli con timing specifici
  useEffect(() => {
    if (isRunning) {
      // Realtime: ogni 1 secondo
      fetchRealtimeData();
      realtimeIntervalRef.current = setInterval(fetchRealtimeData, 1000);

      // Power: ogni 5 secondi
      fetchPowerData();
      powerIntervalRef.current = setInterval(fetchPowerData, 5000);

      // Extremes: ogni 30 secondi
      fetchExtremesData();
      extremesIntervalRef.current = setInterval(fetchExtremesData, 30000);
    } else {
      // Pulisci tutti gli intervalli
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
        realtimeIntervalRef.current = null;
      }
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current);
        powerIntervalRef.current = null;
      }
      if (extremesIntervalRef.current) {
        clearInterval(extremesIntervalRef.current);
        extremesIntervalRef.current = null;
      }
    }

    return () => {
      if (realtimeIntervalRef.current)
        clearInterval(realtimeIntervalRef.current);
      if (powerIntervalRef.current) clearInterval(powerIntervalRef.current);
      if (extremesIntervalRef.current)
        clearInterval(extremesIntervalRef.current);
    };
  }, [isRunning, fetchRealtimeData, fetchPowerData, fetchExtremesData]);

  // Controlli globali
  const toggleAllUpdates = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const resetAllData = useCallback(() => {
    setRealtimeData([]);
    setRealtimeLatest(null);
    setRealtimeTimeSeries(null);
    setRealtimeTrends({});
    setRealtimeUpdateCount(0);

    setPowerData([]);
    setPowerLatest(null);
    setPowerTimeSeries(null);
    setPowerTrends({});
    setPowerUpdateCount(0);

    setExtremesData([]);
    setExtremesLatest(null);
    setExtremesTimeSeries(null);
    setExtremesExtremes({});
    setExtremesUpdateCount(0);

    setLastUpdate(null);

    if (isRunning) {
      fetchRealtimeData();
      fetchPowerData();
      fetchExtremesData();
    }
  }, [isRunning, fetchRealtimeData, fetchPowerData, fetchExtremesData]);

  const totalUpdateCount =
    realtimeUpdateCount + powerUpdateCount + extremesUpdateCount;
  const hasAnyError = realtimeError || powerError || extremesError;

  return {
    realtime: {
      data: realtimeData,
      latest: realtimeLatest,
      timeSeries: realtimeTimeSeries,
      trends: realtimeTrends,
      isLoading: realtimeLoading,
      error: realtimeError,
    },
    power: {
      data: powerData,
      latest: powerLatest,
      timeSeries: powerTimeSeries,
      trends: powerTrends,
      isLoading: powerLoading,
      error: powerError,
    },
    extremes: {
      data: extremesData,
      latest: extremesLatest,
      timeSeries: extremesTimeSeries,
      extremes: extremesExtremes,
      isLoading: extremesLoading,
      error: extremesError,
    },
    meta: {
      lastUpdate,
      updateCount: totalUpdateCount,
      isRunning,
    },
    // Controlli globali
    toggleAllUpdates,
    resetAllData,
    hasAnyError,
    // Info debug sugli intervalli
    intervals: {
      realtime: "1s",
      power: "5s",
      extremes: "30s",
    },
    updateCounts: {
      realtime: realtimeUpdateCount,
      power: powerUpdateCount,
      extremes: extremesUpdateCount,
    },
  };
};
