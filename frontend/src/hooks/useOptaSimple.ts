// hooks/useOptaSimple.ts
"use client";

import { useState, useEffect, useRef } from "react";

interface OptaHookReturn {
  data: any[];
  latest: any;
  error: string | null;
  isRunning: boolean;
  updateCount: number;
  isLoading: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useOptaRealtime = (): OptaHookReturn => {
  const [state, setState] = useState({
    data: [] as any[],
    latest: null as any,
    error: null as string | null,
    isRunning: true,
    updateCount: 0,
    isLoading: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        console.log("🔄 [HOOK] Fetching realtime data...");

        const response = await fetch("/api/influx/opta-realtime", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!mountedRef.current) return;

        if (result.status === "error" || result.error) {
          throw new Error(result.error || "Unknown API error");
        }

        setState((prev) => ({
          ...prev,
          data: result.data || [],
          latest: result.latest || null,
          error: null,
          updateCount: prev.updateCount + 1,
          isLoading: false,
        }));

        console.log("✅ [HOOK] Realtime data updated:", {
          points: result.data?.length || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("❌ [HOOK] Error:", err);

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    };

    const startInterval = () => {
      if (!mountedRef.current) return;

      console.log("🚀 [HOOK] Starting realtime interval...");
      fetchData(); // Initial fetch

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log("⏰ [HOOK] Realtime interval tick");
          fetchData();
        }
      }, 1000);
    };

    const stopInterval = () => {
      console.log("⏹️ [HOOK] Stopping realtime interval...");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (state.isRunning) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => {
      console.log("🧹 [HOOK] Cleanup realtime...");
      mountedRef.current = false;
      stopInterval();
    };
  }, [state.isRunning]); // Solo dipendenza da isRunning

  const start = () => {
    setState((prev) => ({ ...prev, isRunning: true }));
  };

  const stop = () => {
    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      data: [],
      latest: null,
      updateCount: 0,
      error: null,
    }));
  };

  return {
    data: state.data,
    latest: state.latest,
    error: state.error,
    isRunning: state.isRunning,
    updateCount: state.updateCount,
    isLoading: state.isLoading,
    start,
    stop,
    reset,
  };
};

export const useOptaPower = (): OptaHookReturn => {
  const [state, setState] = useState({
    data: [] as any[],
    latest: null as any,
    error: null as string | null,
    isRunning: true,
    updateCount: 0,
    isLoading: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        console.log("🔄 [HOOK] Fetching power data...");

        const response = await fetch("/api/influx/opta-power", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!mountedRef.current) return;

        if (result.status === "error" || result.error) {
          throw new Error(result.error || "Unknown API error");
        }

        setState((prev) => ({
          ...prev,
          data: result.data || [],
          latest: result.latest || null,
          error: null,
          updateCount: prev.updateCount + 1,
          isLoading: false,
        }));

        console.log("✅ [HOOK] Power data updated:", {
          points: result.data?.length || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("❌ [HOOK] Error:", err);

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    };

    const startInterval = () => {
      if (!mountedRef.current) return;

      console.log("🚀 [HOOK] Starting power interval...");
      fetchData(); // Initial fetch

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log("⏰ [HOOK] Power interval tick");
          fetchData();
        }
      }, 5000); // 5 secondi
    };

    const stopInterval = () => {
      console.log("⏹️ [HOOK] Stopping power interval...");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (state.isRunning) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => {
      console.log("🧹 [HOOK] Cleanup power...");
      mountedRef.current = false;
      stopInterval();
    };
  }, [state.isRunning]); // Solo dipendenza da isRunning

  const start = () => {
    setState((prev) => ({ ...prev, isRunning: true }));
  };

  const stop = () => {
    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      data: [],
      latest: null,
      updateCount: 0,
      error: null,
    }));
  };

  return {
    data: state.data,
    latest: state.latest,
    error: state.error,
    isRunning: state.isRunning,
    updateCount: state.updateCount,
    isLoading: state.isLoading,
    start,
    stop,
    reset,
  };
};

export const useOptaExtremes = (): OptaHookReturn => {
  const [state, setState] = useState({
    data: [] as any[],
    latest: null as any,
    error: null as string | null,
    isRunning: true,
    updateCount: 0,
    isLoading: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchData = async () => {
      if (!mountedRef.current) return;

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        console.log("🔄 [HOOK] Fetching extremes data...");

        const response = await fetch("/api/influx/opta-extremes", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!mountedRef.current) return;

        if (result.status === "error" || result.error) {
          throw new Error(result.error || "Unknown API error");
        }

        setState((prev) => ({
          ...prev,
          data: result.data || [],
          latest: result.latest || null,
          error: null,
          updateCount: prev.updateCount + 1,
          isLoading: false,
        }));

        console.log("✅ [HOOK] Extremes data updated:", {
          points: result.data?.length || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        if (!mountedRef.current) return;

        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        console.error("❌ [HOOK] Error:", err);

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
    };

    const startInterval = () => {
      if (!mountedRef.current) return;

      console.log("🚀 [HOOK] Starting extremes interval...");
      fetchData(); // Initial fetch

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          console.log("⏰ [HOOK] Extremes interval tick");
          fetchData();
        }
      }, 30000); // 30 secondi
    };

    const stopInterval = () => {
      console.log("⏹️ [HOOK] Stopping extremes interval...");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (state.isRunning) {
      startInterval();
    } else {
      stopInterval();
    }

    return () => {
      console.log("🧹 [HOOK] Cleanup extremes...");
      mountedRef.current = false;
      stopInterval();
    };
  }, [state.isRunning]); // Solo dipendenza da isRunning

  const start = () => {
    setState((prev) => ({ ...prev, isRunning: true }));
  };

  const stop = () => {
    setState((prev) => ({ ...prev, isRunning: false }));
  };

  const reset = () => {
    setState((prev) => ({
      ...prev,
      data: [],
      latest: null,
      updateCount: 0,
      error: null,
    }));
  };

  return {
    data: state.data,
    latest: state.latest,
    error: state.error,
    isRunning: state.isRunning,
    updateCount: state.updateCount,
    isLoading: state.isLoading,
    start,
    stop,
    reset,
  };
};
