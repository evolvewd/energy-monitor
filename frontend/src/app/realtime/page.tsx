// ====================
// REALTIME PAGE AGGIORNATA
// ====================

// app/realtime/page.tsx (versione aggiornata)

"use client";

import { DashboardHeader } from "@/components/shared/DashboardHeader";
import { ErrorDisplay } from "@/components/realtime/ErrorDisplay";
import { SystemStatus } from "@/components/realtime/SystemStatus";
import { StatusDetails } from "@/components/realtime/StatusDetails";
import { MetricsSection } from "@/components/realtime/MetricsSection";
import { useRealtimeData } from "@/hooks/useRealtimeData";
import { useDashboard } from "@/hooks/useDashboard";

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
  } = useRealtimeData();

  const { currentTime, healthPercentage } = useDashboard();

  return (
    <div className="min-h-screen bg-background">
      {/* Header Unificato con Controlli Realtime */}
      <DashboardHeader
        title="Energy Monitor"
        subtitle="Monitoraggio in tempo reale • Aggiornamento ogni secondo"
        currentTime={currentTime}
        healthPercentage={healthPercentage}
        variant="full-header"
        realtimeControls={{
          isRunning,
          updateCount,
          onToggleUpdates: toggleUpdates,
          onResetData: resetData,
        }}
      />

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Error Display */}
        {error && <ErrorDisplay error={error} />}

        {/* Status e System Info */}
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
      </main>
    </div>
  );
}
