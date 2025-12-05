// frontend/src/app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { EnergyMetricsSection } from "@/components/dashboard/EnergyMetricsSection";
// import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { WeatherComplete } from "@/components/dashboard/WeatherComplete";
import { SensorCard } from "@/components/dashboard/SensorCard";
// import { CameraWidget } from "@/components/shared/CameraWidget";
import { useDashboard } from "@/hooks/useDashboard";
// import { useTvccSettings } from "@/contexts/TvccContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, Loader2, AlertCircle, Zap, ChevronUp, ChevronDown } from "lucide-react";
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
  const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "last_week" | "last_month" | "previous_month">("today");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

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

  // Gestione scroll card per card
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScrollPosition = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setCanScrollUp(scrollTop > 0);
      setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10); // 10px di tolleranza
    };

    // Controlla posizione iniziale
    checkScrollPosition();

    // Aggiungi listener per scroll
    container.addEventListener("scroll", checkScrollPosition);

    // Controlla anche quando cambiano i contenuti
    const resizeObserver = new ResizeObserver(checkScrollPosition);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", checkScrollPosition);
      resizeObserver.disconnect();
    };
  }, [systemSettings?.lettori]);

  const scrollToCard = (direction: "up" | "down") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const cards = container.querySelectorAll('[data-sensor-card]');

    if (cards.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;

    let targetCard: Element | null = null;

    if (direction === "down") {
      // Scroll giù: trova la prima card completamente sotto il centro visibile
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardRect = card.getBoundingClientRect();
        const cardTop = cardRect.top;

        // Se la card è completamente sotto il centro, questa è la prossima
        if (cardTop > containerCenter + 50) { // 50px di margine
          targetCard = card;
          break;
        }
      }
      // Se non trovata, vai all'ultima card
      if (!targetCard) {
        targetCard = cards[cards.length - 1];
      }
    } else {
      // Scroll su: trova la card precedente rispetto a quella attualmente visibile
      // Prima trova quale card è più vicina al centro (o sopra)
      let currentCardIndex = -1;
      let minDistance = Infinity;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.top + cardRect.height / 2;
        const distance = Math.abs(cardCenter - containerCenter);

        // Se la card è sopra o vicino al centro, potrebbe essere quella corrente
        if (cardCenter <= containerCenter + 100 && distance < minDistance) {
          minDistance = distance;
          currentCardIndex = i;
        }
      }

      // Se trovata una card corrente, prendi quella precedente
      if (currentCardIndex > 0) {
        targetCard = cards[currentCardIndex - 1];
      } else if (currentCardIndex === 0) {
        // Se siamo già sulla prima, vai alla prima
        targetCard = cards[0];
      } else {
        // Se non trovata, cerca l'ultima card completamente sopra il centro
        for (let i = cards.length - 1; i >= 0; i--) {
          const card = cards[i];
          const cardRect = card.getBoundingClientRect();
          const cardBottom = cardRect.bottom;

          if (cardBottom < containerCenter) {
            targetCard = card;
            break;
          }
        }
        // Fallback: prima card
        if (!targetCard) {
          targetCard = cards[0];
        }
      }
    }

    if (targetCard) {
      const cardElement = targetCard as HTMLElement;
      const cardOffsetTop = cardElement.offsetTop;
      const containerHeight = containerRect.height;
      const cardHeight = cardElement.offsetHeight;

      // Calcola la posizione per centrare la card nel viewport
      const targetScrollTop = cardOffsetTop - (containerHeight / 2) + (cardHeight / 2);

      container.scrollTo({
        top: Math.max(0, Math.min(targetScrollTop, container.scrollHeight - containerHeight)),
        behavior: "smooth",
      });
    }
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Meteo - Metà sinistra */}
        <div className="lg:col-span-1">
          <WeatherComplete />
        </div>

        {/* Sensori - Metà destra */}
        <div className="lg:col-span-1 flex flex-col h-full">
          <div className="space-y-4 flex flex-col h-full">
            <div className="flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-xl font-semibold mb-1">Sensori Monitorati</h2>
                <p className="text-sm text-muted-foreground">
                  Dati in tempo reale dai lettori Modbus
                </p>
              </div>
              <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Seleziona periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Oggi</SelectItem>
                  <SelectItem value="yesterday">Ieri</SelectItem>
                  <SelectItem value="last_week">Questa settimana</SelectItem>
                  <SelectItem value="last_month">Questo mese</SelectItem>
                  <SelectItem value="previous_month">Mese scorso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Controlli scroll */}
            {systemSettings?.lettori && systemSettings.lettori.length > 1 && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollToCard("up")}
                  disabled={!canScrollUp}
                  className="h-8 w-8"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {systemSettings.lettori.length} sensori
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => scrollToCard("down")}
                  disabled={!canScrollDown}
                  className="h-8 w-8"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Lista sensori - Scrollabile senza scrollbar con snap */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scrollbar-hide scroll-smooth"
              style={{
                maxHeight: 'calc(100vh - 320px)',
                scrollSnapType: 'y proximity',
                scrollPaddingTop: '1rem'
              }}
            >
              {systemSettings?.lettori && systemSettings.lettori.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 pr-1">
                  {systemSettings.lettori.map((lettore: any) => {
                    // Trova l'alloggio corrispondente
                    const alloggio = systemSettings?.alloggi?.find(
                      (a: any) => a.alloggio_id === lettore.alloggio_id
                    );

                    // Determina il colore in base al tipo
                    const getColorByType = (type: string) => {
                      switch (type) {
                        case "produzione":
                          return "#10b981"; // Verde per produzione
                        case "accumulo_ac":
                        case "accumulo_dc":
                          return "#8b5cf6"; // Viola per accumulo
                        case "parti_comuni":
                          return "#f97316"; // Arancione per parti comuni
                        case "alloggio":
                        default:
                          return "#3b82f6"; // Blu per consumo/alloggio
                      }
                    };

                    return (
                      <div key={lettore.reader_id} data-sensor-card style={{ scrollSnapAlign: 'center' }}>
                        <SensorCard
                          sensorName={alloggio?.name || `Sensore ${lettore.modbus_address}`}
                          modbusAddress={lettore.modbus_address}
                          model={lettore.model || "6m"}
                          alloggioId={lettore.alloggio_id}
                          color={getColorByType(lettore.type || "alloggio")}
                          timeRange={timeRange}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nessun sensore configurato. Configura i lettori Modbus nella pagina Setup.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
