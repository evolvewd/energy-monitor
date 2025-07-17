// frontend/src/app/page.tsx
"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { EnergyMetricsSection } from "@/components/dashboard/EnergyMetricsSection";
import { CameraWidget } from "@/components/shared/CameraWidget";
import { useDashboard } from "@/hooks/useDashboard";
import { useTvccSettings } from "@/contexts/TvccContext";
import { Button } from "@/components/ui/button";
import { Camera, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  const { settings } = useTvccSettings();
  const router = useRouter();

  // Filtra solo le telecamere abilitate e con IP configurato
  const enabledCameras = settings.cameras.filter(
    (camera) => camera.enabled && camera.ipAddress.trim() !== ""
  );

  return (
    <DashboardLayout
      pageTitle="Energy Monitor Dashboard"
      pageSubtitle="Monitoraggio energetico in tempo reale"
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="space-y-6">
        {/* Energy Metrics */}
        <EnergyMetricsSection
          title="Metriche Energetiche"
          subtitle="Dati in tempo reale dal sistema"
          metrics={[]} // TODO: implementare energyMetrics
          showTrendText={true}
          isLive={true}
        />

        {/* TVCC Section - Mostrata solo se abilitata */}
        {settings.tvccEnabled && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Sistema TVCC
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {enabledCameras.length > 0
                      ? `${
                          enabledCameras.length
                        } telecamere attive - Aggiornamento ${
                          parseInt(settings.refreshInterval) / 1000
                        }sec`
                      : "Nessuna telecamera configurata"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configura
              </Button>
            </div>

            {enabledCameras.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {enabledCameras.map((camera) => (
                  <CameraWidget
                    key={camera.id}
                    cameraName={camera.name}
                    ipAddress={camera.ipAddress}
                    username={camera.username}
                    password={camera.password}
                    status={camera.status}
                    refreshInterval={parseInt(settings.refreshInterval)}
                  />
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Nessuna telecamera configurata
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configura le telecamere nelle impostazioni per iniziare a
                  visualizzare le immagini.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Vai alle Impostazioni
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Messaggio quando TVCC è disabilitato */}
        {!settings.tvccEnabled && (
          <div className="bg-muted/50 border border-muted rounded-lg p-6 text-center">
            <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              Sistema TVCC Disabilitato
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Il sistema di videosorveglianza è attualmente disabilitato. Puoi
              abilitarlo nelle impostazioni.
            </p>
            <Button variant="outline" onClick={() => router.push("/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Abilita TVCC
            </Button>
          </div>
        )}

        {/* Charts Section - Commentato per ora */}
        {/* <ChartsSection /> */}

        {/* Quick Actions - Commentato per ora */}
        {/* <QuickActions connectionStatus={connectionStatus} /> */}
      </div>
    </DashboardLayout>
  );
}
