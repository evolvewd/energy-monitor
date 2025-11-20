// app/test-all/page.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOptaCombined } from "@/hooks/useOptaCombined";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";

export default function TestAllPage() {
  const opta = useOptaCombined();

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
          <h1 className="text-3xl font-bold tracking-tight">
            Test Completo OPTA
          </h1>
          <p className="text-muted-foreground">
            Tutti e 3 gli hook con timing corretti • Ultimo aggiornamento:{" "}
            {formatTime(opta.meta.lastUpdate)}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant={opta.meta.isAnyRunning ? "default" : "secondary"}>
            {opta.meta.isAnyRunning ? "Running" : "Stopped"} •{" "}
            {opta.meta.totalUpdates} total updates
          </Badge>
          <Button
            onClick={opta.controls.toggleAll}
            variant={opta.meta.isAnyRunning ? "destructive" : "default"}
            size="sm"
          >
            {opta.meta.isAnyRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Stop All
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" />
                Start All
              </>
            )}
          </Button>
          <Button onClick={opta.controls.resetAll} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset All
          </Button>
        </div>
      </div>

      {/* Status Generale */}
      {opta.meta.hasAnyError && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-500 text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Errori rilevati:
              {opta.realtime.error && (
                <span className="ml-2">Realtime: {opta.realtime.error}</span>
              )}
              {opta.power.error && (
                <span className="ml-2">Power: {opta.power.error}</span>
              )}
              {opta.extremes.error && (
                <span className="ml-2">Extremes: {opta.extremes.error}</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Intervalli */}
      <Card>
        <CardHeader>
          <CardTitle>Intervalli di Aggiornamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {opta.intervals.realtime}
              </div>
              <div className="text-sm text-muted-foreground">Realtime</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {opta.intervals.power}
              </div>
              <div className="text-sm text-muted-foreground">Power</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {opta.intervals.extremes}
              </div>
              <div className="text-sm text-muted-foreground">Extremes</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dati Realtime */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Realtime
              <Badge variant="outline" className="ml-2">
                {opta.intervals.realtime}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opta.realtime.error ? (
              <div className="text-red-500 text-sm">
                Errore: {opta.realtime.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Status</div>
                  <div className="text-muted-foreground">
                    {opta.realtime.latest?.status ?? "N/A"}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Frequenza</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.realtime.latest?.frequency, "Hz")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Tensione RMS</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.realtime.latest?.v_rms, "V")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Corrente RMS</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.realtime.latest?.i_rms, "A")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Attiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.realtime.latest?.p_active, "W")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">THD</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.realtime.latest?.thd, "%")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Updates: {opta.realtime.updateCount} | Punti:{" "}
                  {opta.realtime.data.length} | Loading:{" "}
                  {opta.realtime.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dati Power */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-green-600" />
              Power
              <Badge variant="outline" className="ml-2">
                {opta.intervals.power}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opta.power.error ? (
              <div className="text-red-500 text-sm">
                Errore: {opta.power.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Energia Totale</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.energy_total, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Energia Positiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.energy_positive, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Energia Negativa</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.energy_negative, "kWh")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Reattiva</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.q_reactive, "VAr")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza Apparente</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.s_apparent, "VA")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Cos φ</div>
                  <div className="text-muted-foreground">
                    {formatValue(opta.power.latest?.cos_phi, "")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Updates: {opta.power.updateCount} | Punti:{" "}
                  {opta.power.data.length} | Loading:{" "}
                  {opta.power.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dati Extremes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
              Extremes
              <Badge variant="outline" className="ml-2">
                {opta.intervals.extremes}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opta.extremes.error ? (
              <div className="text-red-500 text-sm">
                Errore: {opta.extremes.error}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <div className="font-medium">Frequenza</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(opta.extremes.latest?.freq_min, "Hz")} |
                    Max: {formatValue(opta.extremes.latest?.freq_max, "Hz")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Tensione</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(opta.extremes.latest?.v_min, "V")} | Max:{" "}
                    {formatValue(opta.extremes.latest?.v_max, "V")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Corrente</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(opta.extremes.latest?.i_min, "A")} | Max:{" "}
                    {formatValue(opta.extremes.latest?.i_max, "A")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Potenza</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(opta.extremes.latest?.p_min, "W")} | Max:{" "}
                    {formatValue(opta.extremes.latest?.p_max, "W")}
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-medium">THD</div>
                  <div className="text-muted-foreground">
                    Min: {formatValue(opta.extremes.latest?.thd_min, "%")} |
                    Max: {formatValue(opta.extremes.latest?.thd_max, "%")}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Updates: {opta.extremes.updateCount} | Punti:{" "}
                  {opta.extremes.data.length} | Loading:{" "}
                  {opta.extremes.isLoading ? "Si" : "No"}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Debug Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Riepilogo Debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium mb-2">
                Realtime ({opta.intervals.realtime})
              </div>
              <div className="text-muted-foreground">
                • Updates: {opta.realtime.updateCount}
                <br />• Dati: {opta.realtime.data.length} punti
                <br />• Loading: {opta.realtime.isLoading ? "Si" : "No"}
                <br />• Errore: {opta.realtime.error || "Nessuno"}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">
                Power ({opta.intervals.power})
              </div>
              <div className="text-muted-foreground">
                • Updates: {opta.power.updateCount}
                <br />• Dati: {opta.power.data.length} punti
                <br />• Loading: {opta.power.isLoading ? "Si" : "No"}
                <br />• Errore: {opta.power.error || "Nessuno"}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">
                Extremes ({opta.intervals.extremes})
              </div>
              <div className="text-muted-foreground">
                • Updates: {opta.extremes.updateCount}
                <br />• Dati: {opta.extremes.data.length} punti
                <br />• Loading: {opta.extremes.isLoading ? "Si" : "No"}
                <br />• Errore: {opta.extremes.error || "Nessuno"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
