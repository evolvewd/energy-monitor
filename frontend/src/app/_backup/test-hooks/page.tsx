// app/test-hooks/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOptaRealtime } from "@/hooks/useOptaSimple";
import { Activity } from "lucide-react";

export default function TestHooksPage() {
  const realtime = useOptaRealtime();

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
            Test Hook Semplificato
          </h1>
          <p className="text-muted-foreground">
            Hook React ottimizzato • Update count: {realtime.updateCount}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={realtime.isRunning ? "default" : "secondary"}>
            {realtime.isRunning ? "Running" : "Stopped"} •{" "}
            {realtime.updateCount} updates
          </Badge>
          <Button
            onClick={realtime.isRunning ? realtime.stop : realtime.start}
            variant={realtime.isRunning ? "destructive" : "default"}
          >
            {realtime.isRunning ? "Stop" : "Start"}
          </Button>
          <Button onClick={realtime.reset} variant="outline">
            Reset
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {realtime.error && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-red-500 text-sm">Errore: {realtime.error}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dati Realtime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Realtime Data (Hook Stabile)
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
                  {realtime.latest?.status ?? "N/A"}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Frequenza</div>
                <div className="text-muted-foreground">
                  {formatValue(realtime.latest?.frequency, "Hz")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Tensione RMS</div>
                <div className="text-muted-foreground">
                  {formatValue(realtime.latest?.v_rms, "V")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Corrente RMS</div>
                <div className="text-muted-foreground">
                  {formatValue(realtime.latest?.i_rms, "A")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">Potenza Attiva</div>
                <div className="text-muted-foreground">
                  {formatValue(realtime.latest?.p_active, "W")}
                </div>
              </div>
              <div className="text-sm">
                <div className="font-medium">THD</div>
                <div className="text-muted-foreground">
                  {formatValue(realtime.latest?.thd, "%")}
                </div>
              </div>
              <div className="text-xs text-muted-foreground border-t pt-2">
                Punti dati: {realtime.data.length} | Loading:{" "}
                {realtime.isLoading ? "Si" : "No"}
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
                <div className="text-muted-foreground">
                  {realtime.updateCount}
                </div>
              </div>
              <div>
                <div className="font-medium">Is Running</div>
                <div className="text-muted-foreground">
                  {realtime.isRunning ? "True" : "False"}
                </div>
              </div>
              <div>
                <div className="font-medium">Is Loading</div>
                <div className="text-muted-foreground">
                  {realtime.isLoading ? "True" : "False"}
                </div>
              </div>
              <div>
                <div className="font-medium">Data Length</div>
                <div className="text-muted-foreground">
                  {realtime.data.length}
                </div>
              </div>
              <div>
                <div className="font-medium">Error</div>
                <div className="text-muted-foreground">
                  {realtime.error || "None"}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="font-medium mb-2">Latest Raw Data</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(realtime.latest, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
