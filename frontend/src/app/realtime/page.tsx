// app/realtime/page.tsx

"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { ErrorDisplay } from "@/components/realtime/ErrorDisplay";
import { SystemStatus } from "@/components/realtime/SystemStatus";
import { StatusDetails } from "@/components/realtime/StatusDetails";
import { MetricsSection } from "@/components/realtime/MetricsSection";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useDashboard } from "@/hooks/useDashboard";
import { Button } from "@/components/ui/button";

export default function RealtimePage() {
  const {
    data,
    latest,
    trends,
    meta,
    isRunning,
    error,
    updateCount,
    lastUpdateTime,
    toggleUpdates,
    resetData,
    currentTime,
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    testConnections,
  } = useRealtimeData();

  return (
    <DashboardLayout
      pageTitle="Dati Real-time"
      pageSubtitle="Monitoraggio in tempo reale • Aggiornamento automatico"
      headerActions={
        <>
          <Button
            onClick={toggleUpdates}
            variant={isRunning ? "destructive" : "default"}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
          <Button onClick={resetData} variant="outline">
            Reset
          </Button>
        </>
      }
      notifications={error ? 1 : 0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      {/* Error Display */}
      {error && <ErrorDisplay error={error} />}

      {/* Status e System Info */}
      <div className="space-y-6">
        <SystemStatus
          latest={latest}
          data={data}
          lastUpdateTime={lastUpdateTime}
          meta={meta}
        />

        {/* Status Details */}
        <StatusDetails latest={latest} />

        {/* Valori Istantanei */}
        <MetricsSection
          title="Valori Istantanei"
          latest={latest}
          trends={trends}
          type="instantaneous"
        />

        {/* Valori di Picco */}
        <MetricsSection
          title="Valori di Picco"
          latest={latest}
          trends={trends}
          type="peak"
        />
      </div>
    </DashboardLayout>
  );
}
