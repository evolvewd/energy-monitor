// frontend/src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { EnergyMetricsSection } from "@/components/dashboard/EnergyMetricsSection";
// import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { WeatherComplete } from "@/components/dashboard/WeatherComplete";
// import { CameraWidget } from "@/components/shared/CameraWidget";
import { useDashboard } from "@/hooks/useDashboard";
// import { useTvccSettings } from "@/contexts/TvccContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Loader2, AlertCircle, Zap } from "lucide-react";
// import { Camera } from "lucide-react";

export default function HomePage() {
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  // const { settings } = useTvccSettings();
  const router = useRouter();
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [systemSettings, setSystemSettings] = useState<any>(null);

  // Verifica configurazione al mount
  useEffect(() => {
    const checkConfiguration = async () => {
      try {
        const response = await fetch("/api/settings/check");
        const data = await response.json();

        if (data.success && data.isConfigured) {
          setIsConfigured(true);
          // Carica le settings complete
          const settingsResponse = await fetch("/api/settings");
          const settingsData = await settingsResponse.json();
          if (settingsData.success) {
            setSystemSettings(settingsData.data);
          }
        } else {
          setIsConfigured(false);
        }
      } catch (error) {
        console.error("Error checking configuration:", error);
        setIsConfigured(false);
      } finally {
        setIsCheckingConfig(false);
      }
    };

    checkConfiguration();
  }, []);

  // TVCC - Temporaneamente disabilitato
  // Filtra solo le telecamere abilitate e con IP configurato
  // const enabledCameras = settings.cameras.filter(
  //   (camera) => camera.enabled && camera.ipAddress.trim() !== ""
  // );

  // Mostra loading durante verifica configurazione
  if (isCheckingConfig) {
    return (
      <DashboardLayout
        pageTitle="Energy Monitor Dashboard"
        pageSubtitle="Verifica configurazione..."
        notifications={0}
        healthPercentage={healthPercentage}
        currentTime={currentTime}
        systemStatus="online"
        connectionStatus={connectionStatus}
        isTestingConnections={isTestingConnections}
        onTestConnections={testConnections}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Verifica configurazione sistema...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Se non configurato, mostra messaggio centrale con pulsante per configurare
  if (!isConfigured) {
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
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Zap className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Nessun impianto presente</CardTitle>
              <CardDescription className="text-base mt-2">
                Configura il sistema di monitoraggio energetico per iniziare
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Aggiungi un impianto e imposta i parametri per iniziare a monitorare
                i consumi energetici.
              </p>
              <Button
                onClick={() => router.push("/setup")}
                className="w-full"
                size="lg"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configura Impianto
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

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
        {/* Sistema Produzione (se abilitato) */}
        {systemSettings?.settings?.produzione_fv === "true" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Sistema Produzione Fotovoltaica
              </CardTitle>
              <CardDescription>
                Monitoraggio produzione energia fotovoltaica
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Dashboard produzione in sviluppo...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Alloggi */}
        {/*  {systemSettings?.alloggi && systemSettings.alloggi.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Alloggi Monitorati</CardTitle>
              <CardDescription>
                {systemSettings.alloggi.length} alloggio/i configurato/i
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemSettings.alloggi.map((alloggio: any) => {
                  // Trova il lettore modbus corrispondente
                  const lettore = systemSettings?.lettori?.find(
                    (l: any) => l.reader_id === `alloggio_${alloggio.alloggio_id}`
                  );
                  return (
                    <Card key={alloggio.alloggio_id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{alloggio.name}</CardTitle>
                        <CardDescription>ID: {alloggio.alloggio_id}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Topic: </span>
                          <span className="font-mono">
                            {alloggio.topic_prefix || `alloggio_${alloggio.alloggio_id}`}
                          </span>
                        </div>
                        {lettore && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Indirizzo Modbus: </span>
                            <span className="font-mono font-semibold">
                              {lettore.modbus_address || "Non configurato"}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Dashboard in sviluppo...
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Energy Metrics */}
        {/*  <EnergyMetricsSection
          title="Metriche Energetiche"
          subtitle="Dati in tempo reale dal sistema"
          metrics={[]} // TODO: implementare energyMetrics
          showTrendText={true}
          isLive={true}
        /> */}

        {/* TVCC Section - Temporaneamente disabilitato */}
        {/* {settings.tvccEnabled && (
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
                      ? `${enabledCameras.length
                      } telecamere attive - Aggiornamento ${parseInt(settings.refreshInterval) / 1000
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
        )} */}

        {/* Charts Section - Temporaneamente disabilitato */}
        {/* <ChartsSection /> */}

        {/* Weather Complete - Componente unificato meteo */}
        <WeatherComplete />

        {/* Quick Actions - Commentato per ora */}
        {/* <QuickActions connectionStatus={connectionStatus} /> */}
      </div>
    </DashboardLayout>
  );
}
