// hooks/useOptaCombinedFixed.ts
"use client";

import {
  useOptaRealtime,
  useOptaPower,
  useOptaExtremes,
} from "@/hooks/useOptaSimple";
import { useState, useEffect } from "react";

export interface OptaCombinedData {
  realtime: {
    data: any[];
    latest: any;
    error: string | null;
    isLoading: boolean;
    updateCount: number;
  };
  power: {
    data: any[];
    latest: any;
    error: string | null;
    isLoading: boolean;
    updateCount: number;
  };
  extremes: {
    data: any[];
    latest: any;
    error: string | null;
    isLoading: boolean;
    updateCount: number;
  };
  meta: {
    lastUpdate: Date | null;
    totalUpdates: number;
    isAnyRunning: boolean;
    hasAnyError: boolean;
  };
  controls: {
    startAll: () => void;
    stopAll: () => void;
    resetAll: () => void;
    toggleAll: () => void;
  };
  intervals: {
    realtime: string;
    power: string;
    extremes: string;
  };
}

export const useOptaCombined = (): OptaCombinedData => {
  const realtime = useOptaRealtime();
  const power = useOptaPower();
  const extremes = useOptaExtremes();

  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Aggiorna lastUpdate quando qualsiasi dato cambia
  useEffect(() => {
    if (
      realtime.updateCount > 0 ||
      power.updateCount > 0 ||
      extremes.updateCount > 0
    ) {
      setLastUpdate(new Date());
    }
  }, [realtime.updateCount, power.updateCount, extremes.updateCount]);

  const totalUpdates =
    realtime.updateCount + power.updateCount + extremes.updateCount;
  const isAnyRunning =
    realtime.isRunning || power.isRunning || extremes.isRunning;
  const hasAnyError = Boolean(realtime.error || power.error || extremes.error);

  const startAll = () => {
    if (!realtime.isRunning) realtime.start();
    if (!power.isRunning) power.start();
    if (!extremes.isRunning) extremes.start();
  };

  const stopAll = () => {
    if (realtime.isRunning) realtime.stop();
    if (power.isRunning) power.stop();
    if (extremes.isRunning) extremes.stop();
  };

  const resetAll = () => {
    realtime.reset();
    power.reset();
    extremes.reset();
    setLastUpdate(null);
  };

  const toggleAll = () => {
    if (isAnyRunning) {
      stopAll();
    } else {
      startAll();
    }
  };

  return {
    realtime: {
      data: realtime.data,
      latest: realtime.latest,
      error: realtime.error,
      isLoading: realtime.isLoading,
      updateCount: realtime.updateCount,
    },
    power: {
      data: power.data,
      latest: power.latest,
      error: power.error,
      isLoading: power.isLoading,
      updateCount: power.updateCount,
    },
    extremes: {
      data: extremes.data,
      latest: extremes.latest,
      error: extremes.error,
      isLoading: extremes.isLoading,
      updateCount: extremes.updateCount,
    },
    meta: {
      lastUpdate,
      totalUpdates,
      isAnyRunning,
      hasAnyError,
    },
    controls: {
      startAll,
      stopAll,
      resetAll,
      toggleAll,
    },
    intervals: {
      realtime: "1s",
      power: "5s",
      extremes: "30s",
    },
  };
};
