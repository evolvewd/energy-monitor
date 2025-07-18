// app/analytics/page.tsx
"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOptaCombined } from "@/hooks/useOptaCombined";
import { useDashboard } from "@/hooks/useDashboard";
import {
  Activity,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Battery,
  Bolt,
  Waves,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const opta = useOptaCombined();
  const {
    connectionStatus,
    isTestingConnections,
    healthPercentage,
    currentTime,
    testConnections,
  } = useDashboard();

  const formatValue = (
    value: number | null | undefined,
    unit: string = "",
    decimals: number = 2
  ) => {
    if (value === null || value === undefined || isNaN(value)) return "N/A";
    return `${value.toFixed(decimals)}${unit}`;
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString("it-IT", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTrendIcon = (value: number) => {
    if (value > 0.1) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (value < -0.1) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return null; // Rimuoviamo il "-" quando non c'è trend significativo
  };

  // Prepara dati per grafici realtime (ultimi 60 punti)
  const realtimeChartData = opta.realtime.data
    .slice(-60)
    .map((item, index) => ({
      time: formatTime(item._time),
      timestamp: item._time,
      index: index, // Aggiungiamo indice per transizioni più fluide
      frequency: item.frequency || 0,
      v_rms: item.v_rms || 0,
      i_rms: item.i_rms || 0,
      p_active: item.p_active || 0,
      thd: item.thd || 0,
      v_peak: item.v_peak || 0,
      i_peak: item.i_peak || 0,
    }));

  // Prepara dati per grafici power (ultimi 30 punti)
  const powerChartData = opta.power.data.slice(-30).map((item, index) => ({
    time: formatTime(item._time),
    timestamp: item._time,
    index: index, // Aggiungiamo indice per transizioni più fluide
    energy_positive: item.energy_positive || 0,
    energy_negative: Math.abs(item.energy_negative || 0),
    energy_total: item.energy_total || 0,
    p_active: item.p_active || 0,
    q_reactive: item.q_reactive || 0,
    s_apparent: item.s_apparent || 0,
    cos_phi: item.cos_phi || 0,
  }));

  // Tooltip professionale minimale
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-muted-foreground">
              {`${entry.name}: ${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Calcola statistiche per le metriche principali
  const stats = {
    frequency: {
      current: opta.realtime.latest?.frequency || 0,
      avg:
        opta.realtime.data.length > 0
          ? opta.realtime.data.reduce(
              (sum, item) => sum + (item.frequency || 0),
              0
            ) / opta.realtime.data.length
          : 0,
    },
    voltage: {
      current: opta.realtime.latest?.v_rms || 0,
      peak: opta.realtime.latest?.v_peak || 0,
    },
    power: {
      current: opta.realtime.latest?.p_active || 0,
      avg:
        opta.realtime.data.length > 0
          ? opta.realtime.data.reduce(
              (sum, item) => sum + (item.p_active || 0),
              0
            ) / opta.realtime.data.length
          : 0,
    },
    energy: {
      total: opta.power.latest?.energy_total || 0,
      positive: opta.power.latest?.energy_positive || 0,
      negative: opta.power.latest?.energy_negative || 0,
    },
  };

  return (
    <DashboardLayout
      pageTitle="Analytics"
      pageSubtitle="Analisi dei dati energetici in tempo reale"
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

        {/* Metriche principali in tempo reale - Layout pulito */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Frequenza */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Waves className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Frequenza
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatValue(stats.frequency.current, " Hz")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Media: {formatValue(stats.frequency.avg, " Hz")}
                  </p>
                </div>
                <div className="text-muted-foreground">{getTrendIcon(0)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Tensione */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Bolt className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Tensione
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatValue(stats.voltage.current, " V")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Picco: {formatValue(stats.voltage.peak, " V")}
                  </p>
                </div>
                <div className="text-muted-foreground">{getTrendIcon(0)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Potenza */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Potenza
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatValue(stats.power.current, " W")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Media: {formatValue(stats.power.avg, " W")}
                  </p>
                </div>
                <div className="text-muted-foreground">{getTrendIcon(0)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Energia */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Energia
                    </p>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatValue(stats.energy.total, " kWh")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pos: {formatValue(stats.energy.positive, " kWh")}
                  </p>
                </div>
                <div className="text-muted-foreground">{getTrendIcon(0)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs per i grafici con icone */}
        <Tabs defaultValue="realtime" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Real-time
            </TabsTrigger>
            <TabsTrigger value="power" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Potenze
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analisi
            </TabsTrigger>
          </TabsList>

          {/* Tab Real-time */}
          <TabsContent value="realtime" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafico Tensione e Frequenza */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Tensione e Frequenza</span>
                    <Badge variant="secondary">1s</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={realtimeChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="voltage"
                        orientation="left"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="frequency"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="voltage"
                        type="monotone"
                        dataKey="v_rms"
                        stroke="#2563eb"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                        animationDuration={300}
                        name="Tensione RMS (V)"
                      />
                      <Line
                        yAxisId="frequency"
                        type="monotone"
                        dataKey="frequency"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                        animationDuration={300}
                        name="Frequenza (Hz)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grafico Corrente e Potenza */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Corrente e Potenza</span>
                    <Badge variant="secondary">1s</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={realtimeChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="current"
                        orientation="left"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <YAxis
                        yAxisId="power"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="current"
                        type="monotone"
                        dataKey="i_rms"
                        stroke="#16a34a"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                        animationDuration={300}
                        name="Corrente RMS (A)"
                      />
                      <Line
                        yAxisId="power"
                        type="monotone"
                        dataKey="p_active"
                        stroke="#ea580c"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                        animationDuration={300}
                        name="Potenza Attiva (W)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Potenze */}
          <TabsContent value="power" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Grafico Energie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Bilancio Energetico</span>
                    <Badge variant="secondary">5s</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={powerChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="energy_positive"
                        stackId="1"
                        stroke="#16a34a"
                        fill="#16a34a"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        animationDuration={300}
                        name="Energia Positiva (kWh)"
                      />
                      <Area
                        type="monotone"
                        dataKey="energy_negative"
                        stackId="2"
                        stroke="#dc2626"
                        fill="#dc2626"
                        fillOpacity={0.6}
                        strokeWidth={2}
                        animationDuration={300}
                        name="Energia Negativa (kWh)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Grafico Potenze */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Potenze Elettriche</span>
                    <Badge variant="secondary">5s</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={powerChartData.slice(-15)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="p_active"
                        fill="#2563eb"
                        stroke="#2563eb"
                        strokeWidth={1}
                        animationDuration={300}
                        name="Potenza Attiva (W)"
                      />
                      <Bar
                        dataKey="q_reactive"
                        fill="#7c3aed"
                        stroke="#7c3aed"
                        strokeWidth={1}
                        animationDuration={300}
                        name="Potenza Reattiva (VAr)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Analisi */}
          <TabsContent value="analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* THD */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>THD - Distorsione Armonica</span>
                    <Badge variant="secondary">Real-time</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsLineChart data={realtimeChartData.slice(-30)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="thd"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={false}
                        animationDuration={300}
                        name="THD (%)"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Valori Estremi */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Valori Estremi</span>
                    <Badge variant="secondary">30s</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium mb-2">
                          Frequenza (Hz)
                        </p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min:</span>
                            <span className="font-mono">
                              {formatValue(
                                opta.extremes.latest?.freq_min,
                                " Hz"
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-mono">
                              {formatValue(
                                opta.extremes.latest?.freq_max,
                                " Hz"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Tensione (V)</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.v_min, " V")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.v_max, " V")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Corrente (A)</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.i_min, " A")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.i_max, " A")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Potenza (W)</p>
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.p_min, " W")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Max:</span>
                            <span className="font-mono">
                              {formatValue(opta.extremes.latest?.p_max, " W")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sistema Realtime</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updates:</span>
                <span className="font-mono">{opta.realtime.updateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Punti dati:</span>
                <span className="font-mono">{opta.realtime.data.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervallo:</span>
                <Badge variant="outline" className="text-xs">
                  {opta.intervals.realtime}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sistema Power</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updates:</span>
                <span className="font-mono">{opta.power.updateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Punti dati:</span>
                <span className="font-mono">{opta.power.data.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervallo:</span>
                <Badge variant="outline" className="text-xs">
                  {opta.intervals.power}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sistema Extremes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Updates:</span>
                <span className="font-mono">{opta.extremes.updateCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Punti dati:</span>
                <span className="font-mono">{opta.extremes.data.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Intervallo:</span>
                <Badge variant="outline" className="text-xs">
                  {opta.intervals.extremes}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
