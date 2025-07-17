// ====================
// HOOK PERSONALIZZATO PER API
// ====================

// hooks/useRealtimeData.ts
"use client";

import { useState, useEffect, useRef } from "react";
import { RealtimeData, TimeSeries, ApiResponse } from "@/types/realtime";
import { useDashboard } from "./useDashboard";

export const useRealtimeData = () => {
  const [data, setData] = useState<RealtimeData[]>([]);
  const [latest, setLatest] = useState<RealtimeData | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeries | null>(null);
  const [trends, setTrends] = useState<{ [key: string]: number }>({});
  const [meta, setMeta] = useState<ApiResponse["meta"] | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    currentTime,
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    testConnections,
  } = useDashboard();

  const fetchRealtimeData = async () => {
    try {
      const response = await fetch("/api/influx/realtime", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();

      if (result.status === "error" || result.error) {
        throw new Error(result.error || "Unknown API error");
      }

      setData(result.data || []);
      setLatest(result.latest || null);
      setTimeSeries(result.timeSeries || null);
      setTrends(result.trends || {});
      setMeta(result.meta || null);
      setError(null);
      setUpdateCount((prev) => prev + 1);
      setLastUpdateTime(new Date());

      console.log("Data updated:", {
        points: result.data?.length || 0,
        latest: result.latest,
        meta: result.meta,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error fetching real-time data:", err);
      setError(errorMessage);
    }
  };

  const toggleUpdates = () => {
    setIsRunning(!isRunning);
  };

  const resetData = () => {
    setData([]);
    setLatest(null);
    setTimeSeries(null);
    setTrends({});
    setMeta(null);
    setUpdateCount(0);
    setLastUpdateTime(null);
    if (isRunning) {
      fetchRealtimeData();
    }
  };

  useEffect(() => {
    if (isRunning) {
      fetchRealtimeData();
      intervalRef.current = setInterval(fetchRealtimeData, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  return {
    data,
    latest,
    timeSeries,
    trends,
    meta,
    isRunning,
    error,
    updateCount,
    lastUpdateTime,
    toggleUpdates,
    resetData,
    // Dati dashboard
    currentTime,
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    testConnections,
  };
};
