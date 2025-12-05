"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Gauge, Zap, Activity, MoreHorizontal, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

interface AlloggioData {
  alloggio_id: string;
  name: string;
  latest: {
    v_rms?: number | null;
    i_rms?: number | null;
    p_active?: number | null;
    frequency?: number | null;
    thd?: number | null;
    v_peak?: number | null;
    i_peak?: number | null;
    status?: number | null;
    _time?: string;
  };
  timeSeries: {
    timestamps: string[];
    v_rms: (number | null)[];
    i_rms: (number | null)[];
    p_active: (number | null)[];
    frequency?: (number | null)[];
    thd?: (number | null)[];
    v_peak?: (number | null)[];
    i_peak?: (number | null)[];
    status?: (number | null)[];
  };
}

interface AlloggioDataStripProps {
  data: AlloggioData;
}

// Helper per ottenere ultimo valore valido
const getLastValidValue = (arr: (number | null)[], index: number): number | null => {
  if (arr[index] !== null && arr[index] !== undefined && !isNaN(arr[index] as number)) {
    return arr[index];
  }
  for (let i = index - 1; i >= 0; i--) {
    if (arr[i] !== null && arr[i] !== undefined && !isNaN(arr[i] as number)) {
      return arr[i];
    }
  }
  return null;
};

export function AlloggioDataStrip({ data }: AlloggioDataStripProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Prepara dati per grafici (ultimi 60 punti per 1024x768)
  const chartData = useMemo(() => {
    const last60 = data.timeSeries.timestamps.slice(-60);
    return last60.map((timestamp, idx) => {
      const actualIndex = Math.max(0, data.timeSeries.timestamps.length - 60) + idx;
      const date = new Date(timestamp);
      return {
        time: date.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        }),
        timestamp: date.getTime(),
        v_rms: getLastValidValue(data.timeSeries.v_rms, actualIndex) ?? 0,
        i_rms: getLastValidValue(data.timeSeries.i_rms, actualIndex) ?? 0,
        p_active: getLastValidValue(data.timeSeries.p_active, actualIndex) ?? 0,
      };
    });
  }, [data.timeSeries]);

  // Configurazione chart per shadcn/ui
  const powerChartConfig = useMemo<ChartConfig>(
    () => ({
      power: {
        label: "Potenza",
        color: "#f97316",
      },
    }),
    []
  );

  const voltageCurrentChartConfig = useMemo<ChartConfig>(
    () => ({
      voltage: {
        label: "Tensione",
        color: "#a855f7",
      },
      current: {
        label: "Corrente",
        color: "#3b82f6",
      },
    }),
    []
  );

  // Valori principali con fallback
  const v_rms = data.latest.v_rms != null && !isNaN(data.latest.v_rms)
    ? data.latest.v_rms
    : data.timeSeries.v_rms.find(v => v != null && !isNaN(v as number)) ?? null;

  const i_rms = data.latest.i_rms != null && !isNaN(data.latest.i_rms)
    ? data.latest.i_rms
    : data.timeSeries.i_rms.find(v => v != null && !isNaN(v as number)) ?? null;

  const p_active = data.latest.p_active != null && !isNaN(data.latest.p_active)
    ? data.latest.p_active
    : data.timeSeries.p_active.find(v => v != null && !isNaN(v as number)) ?? null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Card className="w-full cursor-pointer hover:bg-muted/50 transition-colors border-l-4 border-l-primary">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Nome Alloggio - compatto per 1024px */}
              <div className="flex-shrink-0 min-w-[120px]">
                <h3 className="text-base font-semibold text-foreground truncate">{data.name}</h3>
                <p className="text-xs text-muted-foreground">Alloggio {data.alloggio_id}</p>
              </div>

              {/* Valori Principali - ottimizzati per 1024px */}
              <div className="flex items-center gap-3 flex-1 flex-wrap min-w-0">
                {/* Tensione */}
                <div className="flex items-center gap-2 min-w-[90px]">
                  <Gauge className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tensione</p>
                    <p className="text-lg font-bold truncate">
                      {v_rms != null ? `${v_rms.toFixed(1)}` : "--"} <span className="text-xs text-muted-foreground">V</span>
                    </p>
                  </div>
                </div>

                {/* Corrente */}
                <div className="flex items-center gap-2 min-w-[90px]">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Corrente</p>
                    <p className="text-lg font-bold truncate">
                      {i_rms != null ? `${i_rms.toFixed(3)}` : "--"} <span className="text-xs text-muted-foreground">A</span>
                    </p>
                  </div>
                </div>

                {/* Potenza */}
                <div className="flex items-center gap-2 min-w-[90px]">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Potenza</p>
                    <p className="text-lg font-bold truncate">
                      {p_active != null ? `${p_active.toFixed(1)}` : "--"} <span className="text-xs text-muted-foreground">W</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Pulsante Dettagli */}
              <div className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs h-8"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsDialogOpen(true);
                  }}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                  <span>Dettagli</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      <DialogContent className="max-w-[980px] max-h-[720px] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg">Dettagli Completi - {data.name}</DialogTitle>
          <DialogDescription className="text-xs">
            Tutti i parametri di monitoraggio per l'alloggio {data.alloggio_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Parametri Principali - 3 colonne compatte */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Tensione RMS</p>
                  <p className="text-2xl font-bold">
                    {v_rms != null ? `${v_rms.toFixed(2)}` : "--"} <span className="text-sm text-muted-foreground">V</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Corrente RMS</p>
                  <p className="text-2xl font-bold">
                    {i_rms != null ? `${i_rms.toFixed(3)}` : "--"} <span className="text-sm text-muted-foreground">A</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Potenza Attiva</p>
                  <p className="text-2xl font-bold">
                    {p_active != null ? `${p_active.toFixed(1)}` : "--"} <span className="text-sm text-muted-foreground">W</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Parametri Secondari - 4 colonne compatte */}
          <div className="grid grid-cols-4 gap-2">
            {data.latest.frequency != null && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Frequenza</p>
                    <p className="text-lg font-semibold">
                      {data.latest.frequency.toFixed(2)} <span className="text-xs text-muted-foreground">Hz</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.latest.thd != null && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">THD</p>
                    <p className="text-lg font-semibold">
                      {data.latest.thd.toFixed(2)} <span className="text-xs text-muted-foreground">%</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.latest.v_peak != null && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tensione Picco</p>
                    <p className="text-lg font-semibold">
                      {data.latest.v_peak.toFixed(2)} <span className="text-xs text-muted-foreground">V</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {data.latest.i_peak != null && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Corrente Picco</p>
                    <p className="text-lg font-semibold">
                      {data.latest.i_peak.toFixed(3)} <span className="text-xs text-muted-foreground">A</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Grafici Dettagliati - ottimizzati per 1024x768 */}
          <div className="space-y-3">
            {/* Grafico Potenza */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <h4 className="text-sm font-semibold mb-3">Potenza Attiva</h4>
                <ChartContainer config={powerChartConfig} className="h-[180px]">
                  <AreaChart
                    data={chartData}
                    margin={{
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 20,
                    }}
                  >
                    <defs>
                      <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={50}
                      tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [
                            `${Number(value).toFixed(1).replace(/\.0$/, "")} W`,
                            "Potenza",
                          ]}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="p_active"
                      stroke="#f97316"
                      fill="url(#powerGradient)"
                      fillOpacity={0.6}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Grafico Tensione e Corrente */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <h4 className="text-sm font-semibold mb-3">Tensione e Corrente</h4>
                <ChartContainer config={voltageCurrentChartConfig} className="h-[180px]">
                  <LineChart
                    data={chartData}
                    margin={{
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={40}
                      interval={0}
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 10 }}
                      width={50}
                      tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
                      stroke="#a855f7"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 10 }}
                      width={50}
                      tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
                      stroke="#3b82f6"
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => [
                            `${Number(value).toFixed(1).replace(/\.0$/, "")} ${name === "voltage" ? "V" : "A"}`,
                            name === "voltage" ? "Tensione" : "Corrente",
                          ]}
                        />
                      }
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="v_rms"
                      stroke="#a855f7"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="i_rms"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Info Aggiuntive */}
          {data.latest._time && (
            <Card>
              <CardContent className="pt-3 pb-3">
                <p className="text-xs text-muted-foreground text-center">
                  Ultimo aggiornamento: {new Date(data.latest._time).toLocaleString("it-IT")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Accordion Spiegazione Parametri - compatto */}
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Guida ai Parametri</h4>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="tensione">
                  <AccordionTrigger className="text-xs py-2">Tensione RMS (Volt)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      La <strong>Tensione RMS</strong> (Root Mean Square) rappresenta il valore efficace della tensione elettrica alternata.
                    </p>
                    <p className="mb-2">
                      <strong>Cosa vedere:</strong> In Italia, la tensione di rete standard è di <strong>230V</strong>. Valori compresi tra 220V e 240V sono considerati normali.
                    </p>
                    <p>
                      <strong>Quando preoccuparsi:</strong> Se la tensione scende sotto i 200V o supera i 250V in modo persistente.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="corrente">
                  <AccordionTrigger className="text-xs py-2">Corrente RMS (Ampere)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      La <strong>Corrente RMS</strong> indica l'intensità della corrente elettrica che attraversa il circuito.
                    </p>
                    <p className="mb-2">
                      <strong>Cosa vedere:</strong> La corrente varia in base al consumo dei dispositivi collegati.
                    </p>
                    <p>
                      <strong>Quando preoccuparsi:</strong> Se la corrente supera costantemente la capacità del contatore.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="potenza">
                  <AccordionTrigger className="text-xs py-2">Potenza Attiva (Watt)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      La <strong>Potenza Attiva</strong> rappresenta l'energia effettivamente consumata e utilizzata dai dispositivi elettrici.
                    </p>
                    <p className="mb-2">
                      <strong>Cosa vedere:</strong> Questo è il parametro più importante per monitorare il consumo energetico.
                      La potenza si calcola come <strong>P = V × I</strong>.
                    </p>
                    <p>
                      <strong>Quando preoccuparsi:</strong> Picchi improvvisi e persistenti di potenza possono indicare un malfunzionamento.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="frequenza">
                  <AccordionTrigger className="text-xs py-2">Frequenza (Hertz)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      La <strong>Frequenza</strong> indica quante volte al secondo la corrente alternata cambia direzione.
                    </p>
                    <p className="mb-2">
                      <strong>Cosa vedere:</strong> In Italia, la frequenza di rete standard è di <strong>50 Hz</strong>.
                    </p>
                    <p>
                      <strong>Quando preoccuparsi:</strong> Variazioni significative dalla frequenza nominale (sotto 49.5 Hz o sopra 50.5 Hz).
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="thd">
                  <AccordionTrigger className="text-xs py-2">THD - Distorsione Armonica Totale (%)</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground">
                    <p className="mb-2">
                      Il <strong>THD</strong> (Total Harmonic Distortion) misura la qualità dell'onda elettrica.
                    </p>
                    <p className="mb-2">
                      <strong>Cosa vedere:</strong> Un THD basso (sotto il 5%) indica una buona qualità dell'energia elettrica.
                    </p>
                    <p>
                      <strong>Quando preoccuparsi:</strong> Un THD superiore al 10-15% può causare surriscaldamento dei trasformatori.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
