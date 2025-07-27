"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOptaCombined } from "@/hooks/useOptaCombined";
import { useDashboard } from "@/hooks/useDashboard";
import { InstantVoltageChart } from "@/components/charts/InstantVoltageChart";
import { UniversalGauge } from "@/components/charts/UniversalGauge";
import {
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Gauge,
  Power,
} from "lucide-react";

export default function AnalyticsPage() {
  const opta = useOptaCombined();
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  // Ottieni i valori correnti dai dati reali OPTA
  const currentVoltage = opta.realtime.latest?.v_rms || 0;
  const currentCurrent = opta.realtime.latest?.i_rms || 0;
  const currentFrequency = opta.realtime.latest?.frequency || 0;
  const currentPower = opta.realtime.latest?.p_active || 0;

  return (
    <DashboardLayout
      pageTitle="Analytics"
      pageSubtitle="Analisi dati energetici e monitoraggio avanzato"
      headerActions={
        <>
          <Button
            onClick={opta.controls.toggleAll}
            variant={opta.meta.isAnyRunning ? "destructive" : "default"}
            size="sm"
          >
            {opta.meta.isAnyRunning ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pausa
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Avvia
              </>
            )}
          </Button>
          <Button onClick={opta.controls.resetAll} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </>
      }
      notifications={opta.meta.hasAnyError ? 1 : 0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="space-y-6">
        {/* Alert per errori */}
        {opta.meta.hasAnyError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Errori di connessione rilevati. Verificare i sistemi.
            </AlertDescription>
          </Alert>
        )}

        <InstantVoltageChart
          currentVoltage={currentVoltage}
          className="lg:col-span-2 xl:col-span-3"
        />
        {/* Griglia dei grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-4  gap-5 ">
          {/* Grafico Tensione Istantanea */}

          {/* Gauge Tensione */}
          <UniversalGauge
            value={currentVoltage}
            label="Tensione"
            unit="V"
            min={210}
            max={250}
            color="#3d71beff"
            icon={Zap}
            description="RMS"
            status={
              currentVoltage < 210 || currentVoltage > 240
                ? "warning"
                : "normal"
            }
          />

          {/* Gauge Frequenza */}
          <UniversalGauge
            value={currentFrequency}
            label="Frequenza"
            unit="Hz"
            min={49}
            max={51}
            color="#10b981"
            icon={Activity}
            description="Rete"
            status={
              currentFrequency < 49.5 || currentFrequency > 50.5
                ? "warning"
                : "normal"
            }
          />

          {/* Gauge Corrente */}
          <UniversalGauge
            value={currentCurrent}
            label="Corrente"
            unit="A"
            min={0}
            max={30}
            color="#3b82f6"
            icon={Gauge}
            description="RMS"
            status={
              currentCurrent > 30
                ? "danger"
                : currentCurrent > 30
                ? "warning"
                : "normal"
            }
          />

          {/* Gauge Potenza */}
          <UniversalGauge
            value={currentPower / 1000} // Converte W in kW
            label="Potenza"
            unit="kW"
            min={0}
            max={6.5}
            color="#8b5cf6"
            icon={Power}
            description="Attiva"
            status={
              currentPower > 6500
                ? "danger"
                : currentPower > 5000
                ? "warning"
                : "normal"
            }
          />

          {/* Placeholder per prossimi gauge */}
          <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground aspect-square flex flex-col justify-center">
            <p className="text-sm font-medium">Prossimo Gauge</p>
            <p className="text-xs mt-1">In sviluppo</p>
          </div>

          <div className="bg-muted/50 border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground aspect-square flex flex-col justify-center">
            <p className="text-sm font-medium">Prossimo Gauge</p>
            <p className="text-xs mt-1">In sviluppo</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
