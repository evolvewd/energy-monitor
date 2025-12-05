"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2 } from "lucide-react";
import { AlloggioDataStrip } from "@/components/realtime/AlloggioDataStrip";

interface RealtimeData {
  _time: string;
  v_rms?: number;
  i_rms?: number;
  p_active?: number;
  frequency?: number;
  thd?: number;
  status?: number;
  v_peak?: number;
  i_peak?: number;
  modbus_address?: string;
  model?: string;
  reader_id?: string;
}

interface ApiResponse {
  data: RealtimeData[];
  latest: RealtimeData;
  timeSeries: {
    timestamps: string[];
    frequency: number[];
    i_rms: number[];
    v_rms: number[];
    p_active: number[];
    i_peak: number[];
    v_peak: number[];
    thd: number[];
    status: number[];
  };
  trends: { [key: string]: number };
  meta: {
    totalPoints: number;
    updateTime: string;
    queryExecutionTime: number;
    fields: string[];
    measurement: string;
    bucket: string;
    dataRange?: {
      from: string;
      to: string;
    };
  };
  status: string;
  error?: string;
}

interface Alloggio {
  alloggio_id: string;
  name: string;
  topic_prefix?: string | null;
  modbus_address?: number;
}

export default function DatiPage() {
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  const [alloggi, setAlloggi] = useState<Alloggio[]>([]);
  const [alloggiData, setAlloggiData] = useState<Map<string, ApiResponse>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Carica alloggi dalle settings
  useEffect(() => {
    const fetchAlloggi = async () => {
      try {
        const response = await fetch("/api/settings");
        const result = await response.json();
        if (result.success && result.data?.alloggi) {
          setAlloggi(result.data.alloggi);
        }
      } catch (err) {
        console.error("Error fetching alloggi:", err);
      }
    };
    fetchAlloggi();
  }, []);

  // Polling dati per ogni alloggio
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Per ora recupera i dati generali (poi si può filtrare per alloggio)
        const response = await fetch("/api/influx/opta-realtime");
        const result: ApiResponse = await response.json();

        if (result.status === "success") {
          // Se ci sono alloggi, crea dati per ognuno
          if (alloggi.length > 0) {
            const newData = new Map<string, ApiResponse>();
            alloggi.forEach((alloggio) => {
              // Per ora usa gli stessi dati per tutti (poi si può filtrare per modbus_address)
              newData.set(alloggio.alloggio_id, result);
            });
            setAlloggiData(newData);
          } else {
            // Se non ci sono alloggi configurati, mostra un alloggio generico
            const defaultData = new Map<string, ApiResponse>();
            defaultData.set("default", result);
            setAlloggiData(defaultData);
          }
          setLastUpdate(new Date());
          setError(null);
        } else {
          setError(result.error || "Errore nel caricamento dati");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore sconosciuto");
      } finally {
        setIsLoading(false);
      }
    };

    if (alloggi.length > 0 || alloggiData.size === 0) {
      fetchData();
    }
    
    // Aggiorna ogni 2 secondi
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, [alloggi]);

  return (
    <DashboardLayout
      pageTitle="Dati"
      pageSubtitle="Monitoraggio dati in tempo reale"
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="space-y-3 w-full">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Caricamento dati...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center text-red-500 text-sm">
                <Loader2 className="w-4 h-4 mr-2" />
                Errore: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alloggi Data Strips */}
        {!isLoading && !error && alloggiData.size > 0 && (
          <div className="flex flex-col gap-3">
            {alloggi.length > 0 ? (
              // Mostra strip per ogni alloggio configurato
              alloggi.map((alloggio) => {
                const data = alloggiData.get(alloggio.alloggio_id);
                if (!data) return null;

                return (
                  <AlloggioDataStrip
                    key={alloggio.alloggio_id}
                    data={{
                      alloggio_id: alloggio.alloggio_id,
                      name: alloggio.name || `Alloggio ${alloggio.alloggio_id}`,
                      latest: data.latest,
                      timeSeries: data.timeSeries,
                    }}
                  />
                );
              })
            ) : (
              // Se non ci sono alloggi configurati, mostra un alloggio generico
              Array.from(alloggiData.entries()).map(([id, data]) => (
                <AlloggioDataStrip
                  key={id}
                  data={{
                    alloggio_id: "default",
                    name: "Dati Generali",
                    latest: data.latest,
                    timeSeries: data.timeSeries,
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Nessun dato */}
        {!isLoading && !error && alloggiData.size === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Nessun dato disponibile. Verifica che il sensore stia inviando dati.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info ultimo aggiornamento - compatto */}
        {lastUpdate && (
          <Card>
            <CardContent className="pt-3 pb-3">
              <p className="text-xs text-muted-foreground text-center">
                Ultimo aggiornamento: {lastUpdate.toLocaleString("it-IT")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
