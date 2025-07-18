// app/test-opta/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOptaCombined } from "@/hooks/useOptaData";
import { Activity, Zap, TrendingUp, AlertTriangle } from "lucide-react";

export default function TestOptaPage() {
  const optaData = useOptaCombined();

  const formatValue = (
    value: number | null | undefined,
    unit: string = "",
    decimals: number = 2
  ) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return `${value.toFixed(decimals)} ${unit}`;
  };

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleTimeString("it-IT");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test OPTA Data</h1>
          <p className="text-muted-foreground">
            Test delle nuove API per dati OPTA • Ultimo aggiornamento:{" "}
            {formatTime(optaData.meta.lastUpdate)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={optaData.meta.isRunning ? "default" : "secondary"}>
            {optaData.meta.isRunning ? "Running" : "Stopped"} •{" "}
            {optaData.meta.updateCount} updates
          </Badge>
          <Button
            onClick={optaData.toggleAllUpdates}
            variant={optaData.meta.isRunning ? "destructive" : "default"}
          >
            {optaData.meta.isRunning ? "Stop All" : "Start All"}
          </Button>
          <Button onClick={optaData.resetAllData} variant="outline">
            Reset All
          </Button>
        </div>
      </div>

      {/* Status Generale */}
      {optaData.hasAnyError && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-500 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Errori di connessione rilevati:
              {optaData.realtime.error && (
                <div className="ml-2">Realtime: {optaData.realtime.error}</div>
              )}
              {optaData.power.error && (
                <div className="ml-2">Power: {optaData.power.error}</div>
              )}
              {optaData.extremes.error && (
                <div className="ml-2">Extremes: {optaData.extremes.error}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dati Realtime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Realtime Data
              <Badge variant="outline" className="ml-2">
                1s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optaData.realtime.error ? (
              <div className="text-red-500 text-sm">
                Errore: {optaData.realtime.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Status</div>
                  <div className="text-muted-foreground">
                    {optaData.realtime.latest?.status ?? "N/A"}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Frequenza</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.realtime.latest?.frequency, "Hz")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Tensione RMS</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.realtime.latest?.v_rms, "V")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Corrente RMS</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.realtime.latest?.i_rms, "A")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Attiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.realtime.latest?.p_active, "W")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">THD</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.realtime.latest?.thd, "%")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Punti dati: {optaData.realtime.data.length} | Loading:{" "}
                  {optaData.realtime.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dati Power */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Power Data
              <Badge variant="outline" className="ml-2">
                5s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optaData.power.error ? (
              <div className="text-red-500 text-sm">
                Errore: {optaData.power.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Energia Totale</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.energy_total, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Energia Positiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.energy_positive, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Energia Negativa</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.energy_negative, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Reattiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.q_reactive, "VAr")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Apparente</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.s_apparent, "VA")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Cos φ</div>
                  <div className="text-muted-foreground">
                    {formatValue(optaData.power.latest?.cos_phi, "")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Punti dati: {optaData.power.data.length} | Loading:{" "}
                  {optaData.power.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dati Extremes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Extremes Data
              <Badge variant="outline" className="ml-2">
                30s
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {optaData.extremes.error ? (
              <div className="text-red-500 text-sm">
                Errore: {optaData.extremes.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Frequenza</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(optaData.extremes.latest?.freq_min, "Hz")}{" "}
                    | Max:{" "}
                    {formatValue(optaData.extremes.latest?.freq_max, "Hz")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Tensione</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(optaData.extremes.latest?.v_min, "V")} |
                    Max: {formatValue(optaData.extremes.latest?.v_max, "V")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Corrente</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(optaData.extremes.latest?.i_min, "A")} |
                    Max: {formatValue(optaData.extremes.latest?.i_max, "A")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(optaData.extremes.latest?.p_min, "W")} |
                    Max: {formatValue(optaData.extremes.latest?.p_max, "W")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">THD</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(optaData.extremes.latest?.thd_min, "%")} |
                    Max: {formatValue(optaData.extremes.latest?.thd_max, "%")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Punti dati: {optaData.extremes.data.length} | Loading:{" "}
                  {optaData.extremes.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <div className="font-medium mb-2">Realtime Trends</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(optaData.realtime.trends, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-medium mb-2">Power Trends</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(optaData.power.trends, null, 2)}
              </pre>
            </div>
            <div>
              <div className="font-medium mb-2">Extremes Summary</div>
              <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(optaData.extremes.extremes, null, 2)}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="font-medium mb-2">Raw Latest Values</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Realtime Latest
                </div>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(optaData.realtime.latest, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Power Latest
                </div>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(optaData.power.latest, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Extremes Latest
                </div>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                  {JSON.stringify(optaData.extremes.latest, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
