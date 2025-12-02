"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboard } from "@/hooks/useDashboard";
import { Loader2, Activity, TrendingUp, Gauge, Zap } from "lucide-react";
import { SystemStatus } from "@/components/realtime/SystemStatus";
import { InfluxStyleChart, InfluxDataPoint } from "@/components/charts/InfluxStyleChart";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

export default function RealtimePage() {
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  const [data, setData] = useState<RealtimeData[]>([]);
  const [latest, setLatest] = useState<RealtimeData | null>(null);
  const [timeSeries, setTimeSeries] = useState<ApiResponse["timeSeries"] | null>(null);
  const [trends, setTrends] = useState<{ [key: string]: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Polling dati ogni secondo
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/influx/opta-realtime");
        const result: ApiResponse = await response.json();

        if (result.status === "success") {
          setData(result.data);
          setLatest(result.latest);
          setTimeSeries(result.timeSeries);
          setTrends(result.trends);
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

    fetchData();
    // Aggiorna ogni 2 secondi per evitare sovraccarico (i dati arrivano ogni 5s da Node-RED)
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  // Prepara dati per grafici - aggiornati quando cambia timeSeries o lastUpdate
  const chartData = useMemo(() => {
    if (!timeSeries?.timestamps || timeSeries.timestamps.length === 0) return [];

    // Prendi solo gli ultimi 60 punti per evitare sovraccarico
    const timestamps = timeSeries.timestamps;
    const last60 = timestamps.slice(-60);
    const startIndex = Math.max(0, timestamps.length - 60);

    return last60.map((timestamp, idx) => {
      const actualIndex = startIndex + idx;
      return {
        time: new Date(timestamp).toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        "Tensione RMS (V)": timeSeries.v_rms[actualIndex] || 0,
        "Corrente RMS (A)": timeSeries.i_rms[actualIndex] || 0,
        "Potenza Attiva (W)": timeSeries.p_active[actualIndex] || 0,
        "Frequenza (Hz)": timeSeries.frequency[actualIndex] || 0,
      };
    });
  }, [timeSeries, lastUpdate]); // Aggiunto lastUpdate come dipendenza per forzare aggiornamento

  // Prepara dati per grafico InfluxDB style
  const influxChartData = useMemo(() => {
    if (!timeSeries?.timestamps || timeSeries.timestamps.length === 0) return [];

    const timestamps = timeSeries.timestamps;
    const last60 = timestamps.slice(-60);
    const startIndex = Math.max(0, timestamps.length - 60);

    return last60.map((timestamp, idx) => {
      const actualIndex = startIndex + idx;
      return {
        timestamp: new Date(timestamp),
        v_rms: timeSeries.v_rms[actualIndex] || 0,
        i_rms: timeSeries.i_rms[actualIndex] || 0,
        p_active: timeSeries.p_active[actualIndex] || 0,
        frequency: timeSeries.frequency[actualIndex] || 0,
        i_peak: timeSeries.i_peak[actualIndex] || 0,
        v_peak: timeSeries.v_peak[actualIndex] || 0,
        thd: timeSeries.thd[actualIndex] || 0,
      };
    });
  }, [timeSeries, lastUpdate]);

  return (
    <DashboardLayout
      pageTitle="Monitoraggio in Tempo Reale"
      pageSubtitle="Dati sensori in tempo reale"
      notifications={0}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
      connectionStatus={connectionStatus}
      isTestingConnections={isTestingConnections}
      onTestConnections={testConnections}
    >
      <div className="space-y-6">
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
                <Activity className="w-4 h-4 mr-2" />
                Errore: {error}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dati disponibili */}
        {!isLoading && !error && latest && (
          <>
            {/* Informazioni Sensore */}
            {latest.modbus_address && (
              <Card>
                <CardHeader>
                  <CardTitle>Sensore Modbus</CardTitle>
                  <CardDescription>
                    Indirizzo: {latest.modbus_address} | Modello: {latest.model || "N/A"} | Reader: {latest.reader_id || "N/A"}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Metriche con Mini Grafici - Stile Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Tensione RMS */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">TENSIONE RMS</CardTitle>
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    {latest.v_rms?.toFixed(2) || "N/A"} <span className="text-lg text-muted-foreground">V</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60} key={`vrms-${lastUpdate?.getTime()}`}>
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVrms" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="Tensione RMS (V)"
                        stroke="#8884d8"
                        fill="url(#colorVrms)"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Corrente RMS */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">CORRENTE RMS</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    {latest.i_rms?.toFixed(3) || "N/A"} <span className="text-lg text-muted-foreground">A</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60} key={`irms-${lastUpdate?.getTime()}`}>
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIrms" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="Corrente RMS (A)"
                        stroke="#82ca9d"
                        fill="url(#colorIrms)"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Potenza Attiva */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">POTENZA ATTIVA</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    {latest.p_active?.toFixed(1) || "N/A"} <span className="text-lg text-muted-foreground">W</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60} key={`power-${lastUpdate?.getTime()}`}>
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar
                        dataKey="Potenza Attiva (W)"
                        fill="#ff7300"
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Frequenza */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">FREQUENZA</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-4">
                    {latest.frequency?.toFixed(2) || "N/A"} <span className="text-lg text-muted-foreground">Hz</span>
                  </div>
                  <ResponsiveContainer width="100%" height={60} key={`freq-${lastUpdate?.getTime()}`}>
                    <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFreq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00ff00" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00ff00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="Frequenza (Hz)"
                        stroke="#00ff00"
                        fill="url(#colorFreq)"
                        strokeWidth={1.5}
                        isAnimationActive={false}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Grafico Multi-Linea Stile InfluxDB */}
            {influxChartData.length > 0 ? (
              <Card className="bg-[#18181b] border-[#27272a]">
                <CardHeader>
                  <CardTitle className="text-[#e4e4e7]">Dati Realtime - Visualizzazione InfluxDB</CardTitle>
                  <CardDescription className="text-[#a1a1aa]">
                    Monitoraggio continuo delle metriche energetiche - {influxChartData.length} punti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <InfluxStyleChart
                    data={influxChartData}
                    series={[
                      {
                        key: "v_rms",
                        label: "Tensione RMS",
                        color: "#a855f7", // Viola
                        unit: "V",
                        yAxisId: "left",
                      },
                      {
                        key: "i_rms",
                        label: "Corrente RMS",
                        color: "#f97316", // Arancione
                        unit: "A",
                        yAxisId: "left",
                      },
                      {
                        key: "p_active",
                        label: "Potenza Attiva",
                        color: "#ec4899", // Rosa/Magenta
                        unit: "W",
                        yAxisId: "right",
                      },
                      {
                        key: "frequency",
                        label: "Frequenza",
                        color: "#22c55e", // Verde
                        unit: "Hz",
                        yAxisId: "left",
                      },
                      {
                        key: "i_peak",
                        label: "Corrente Picco",
                        color: "#3b82f6", // Blu
                        unit: "A",
                        yAxisId: "left",
                      },
                      {
                        key: "v_peak",
                        label: "Tensione Picco",
                        color: "#06b6d4", // Azzurro
                        unit: "V",
                        yAxisId: "left",
                      },
                      {
                        key: "thd",
                        label: "THD",
                        color: "#ef4444", // Rosso
                        unit: "%",
                        yAxisId: "right",
                      },
                    ]}
                    height={400}
                    showGrid={true}
                    showLegend={true}
                    timeFormat="HH:mm:ss"
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#18181b] border-[#27272a]">
                <CardHeader>
                  <CardTitle className="text-[#e4e4e7]">Dati Realtime - Visualizzazione InfluxDB</CardTitle>
                  <CardDescription className="text-[#a1a1aa]">
                    Nessun dato disponibile per la visualizzazione
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center text-[#a1a1aa]">
                    <p>In attesa di dati dal sensore...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status Sistema */}
            <SystemStatus
              latest={latest}
              data={data}
              lastUpdateTime={lastUpdate}
              meta={{
                totalPoints: data.length,
                updateTime: lastUpdate?.toISOString() || "",
                queryExecutionTime: Date.now(),
                fields: ["v_rms", "i_rms", "p_active", "frequency"],
                measurement: "realtime",
                bucket: "opta",
                dataRange: data.length > 0
                  ? {
                    from: data[data.length - 1]._time,
                    to: data[0]._time,
                  }
                  : undefined,
              }}
            />
          </>
        )}

        {/* Nessun dato */}
        {!isLoading && !error && !latest && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                Nessun dato disponibile. Verifica che il sensore stia inviando dati.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

