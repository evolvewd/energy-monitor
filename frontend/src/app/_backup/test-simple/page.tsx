// app/test-simple/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export default function TestSimplePage() {
  const [data, setData] = useState<any[]>([]);
  const [latest, setLatest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [updateCount, setUpdateCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      console.log("🔄 Fetching realtime data...");

      const response = await fetch("/api/influx/opta-realtime", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.status === "error" || result.error) {
        throw new Error(result.error || "Unknown API error");
      }

      setData(result.data || []);
      setLatest(result.latest || null);
      setError(null);
      setUpdateCount((prev) => {
        const newCount = prev + 1;
        console.log("✅ Realtime data updated:", {
          points: result.data?.length || 0,
          updateCount: newCount,
          timestamp: new Date().toISOString(),
        });
        return newCount;
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Error fetching realtime data:", err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]); // RIMOSSO updateCount dalle dipendenze

  useEffect(() => {
    if (isRunning) {
      console.log("🚀 Starting realtime data fetch...");
      fetchData();
      intervalRef.current = setInterval(() => {
        console.log("⏰ Interval triggered");
        fetchData();
      }, 1000);
    } else {
      console.log("⏹️ Stopping realtime data fetch...");
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
  }, [isRunning, fetchData]);

  const toggleUpdates = () => {
    setIsRunning(!isRunning);
  };

  const resetData = () => {
    setData([]);
    setLatest(null);
    setUpdateCount(0);
    if (isRunning) {
      fetchData();
    }
  };

  const formatValue = (
    value: number | null | undefined,
    unit: string = "",
    decimals: number = 2
  ) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return `${value.toFixed(decimals)} ${unit}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Test SUPER Semplice
          </h1>
          <p className="text-muted-foreground">
            Hook inline per test • Update count: {updateCount}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? "Running" : "Stopped"} • {updateCount} updates
          </Badge>
          <Button
            onClick={toggleUpdates}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
          <Button onClick={resetData} variant="outline">
            Reset
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-red-500 text-sm">Errore: {error}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dati Realtime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Realtime Data (Hook Inline)
              <Badge variant="outline" className="ml-2">
                1s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm">
                <div className="font-medium">Status</div>
                <div className="text-muted-foreground">
                  {latest?.status ?? "N/A"}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Frequenza</div>
                <div className="text-muted-foreground">
                  {formatValue(latest?.frequency, "Hz")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Tensione RMS</div>
                <div className="text-muted-foreground">
                  {formatValue(latest?.v_rms, "V")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Corrente RMS</div>
                <div className="text-muted-foreground">
                  {formatValue(latest?.i_rms, "A")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Potenza Attiva</div>
                <div className="text-muted-foreground">
                  {formatValue(latest?.p_active, "W")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">THD</div>
                <div className="text-muted-foreground">
                  {formatValue(latest?.thd, "%")}
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2">
                Punti dati: {data.length} | Loading: {isLoading ? "Si" : "No"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium">Update Count</div>
                <div className="text-muted-foreground">{updateCount}</div>
              </div>
              <div>
                <div className="font-medium">Is Running</div>
                <div className="text-muted-foreground">
                  {isRunning ? "True" : "False"}
                </div>
              </div>
              <div>
                <div className="font-medium">Is Loading</div>
                <div className="text-muted-foreground">
                  {isLoading ? "True" : "False"}
                </div>
              </div>
              <div>
                <div className="font-medium">Data Length</div>
                <div className="text-muted-foreground">{data.length}</div>
              </div>
              <div>
                <div className="font-medium">Error</div>
                <div className="text-muted-foreground">{error || "None"}</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="font-medium mb-2">Latest Raw Data</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(latest, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
