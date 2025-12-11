"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

// Dati simulati per i grafici
const generateData = (points: number = 60) => {
  const data = [];
  const now = new Date();
  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000); // Ogni 5 secondi
    data.push({
      time: time.toLocaleTimeString("it-IT", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      timestamp: time.getTime(),
      voltage: 220 + Math.random() * 20,
      current: 3 + Math.random() * 1,
      power: 600 + Math.random() * 200,
    });
  }
  return data;
};

export default function ChartsDemoPage() {
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  const voltageData = useMemo(() => generateData(60), []);
  const currentData = useMemo(() => generateData(60), []);
  const powerData = useMemo(() => generateData(60), []);

  // Configurazioni chart
  const lineChartConfig: ChartConfig = {
    voltage: {
      label: "Tensione",
      color: "#3b82f6",
    },
  };

  const areaChartConfig: ChartConfig = {
    power: {
      label: "Potenza",
      color: "#f97316",
    },
  };

  const multiLineChartConfig: ChartConfig = {
    voltage: {
      label: "Tensione",
      color: "#a855f7",
    },
    current: {
      label: "Corrente",
      color: "#3b82f6",
    },
  };

  const barChartConfig: ChartConfig = {
    power: {
      label: "Potenza",
      color: "#10b981",
    },
  };

  const smoothAreaChartConfig: ChartConfig = {
    voltage: {
      label: "Tensione",
      color: "#8b5cf6",
    },
  };

  const stepLineChartConfig: ChartConfig = {
    power: {
      label: "Potenza",
      color: "#ef4444",
    },
  };

  const charts = [
    {
      id: "line",
      title: "Line Chart",
      description: "Grafico a linee semplice - ideale per trend temporali",
      config: lineChartConfig,
      component: (
        <ChartContainer config={lineChartConfig} className="h-[200px]">
          <LineChart data={voltageData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    `${Number(value).toFixed(1).replace(/\.0$/, "")} V`,
                    "Tensione",
                  ]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="voltage"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      ),
    },
    {
      id: "area",
      title: "Area Chart",
      description: "Grafico ad area con gradiente - mostra l'area sotto la curva",
      config: areaChartConfig,
      component: (
        <ChartContainer config={areaChartConfig} className="h-[200px]">
          <AreaChart data={powerData}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
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
              dataKey="power"
              stroke="#f97316"
              fill="url(#areaGradient)"
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      ),
    },
    {
      id: "multi-line",
      title: "Multi-Line Chart",
      description: "Grafico con più linee - perfetto per confrontare più parametri",
      config: multiLineChartConfig,
      component: (
        <ChartContainer config={multiLineChartConfig} className="h-[200px]">
          <LineChart data={voltageData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
              stroke="#a855f7"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
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
              dataKey="voltage"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="current"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      ),
    },
    {
      id: "bar",
      title: "Bar Chart",
      description: "Grafico a barre - utile per valori discreti",
      config: barChartConfig,
      component: (
        <ChartContainer config={barChartConfig} className="h-[200px]">
          <BarChart data={powerData.slice(-20)}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
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
            <Bar dataKey="power" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      ),
    },
    {
      id: "smooth-area",
      title: "Smooth Area Chart",
      description: "Area chart con curva smooth - molto fluido e professionale",
      config: smoothAreaChartConfig,
      component: (
        <ChartContainer config={smoothAreaChartConfig} className="h-[200px]">
          <AreaChart data={voltageData}>
            <defs>
              <linearGradient id="smoothAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(1).replace(/\.0$/, "")}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [
                    `${Number(value).toFixed(1).replace(/\.0$/, "")} V`,
                    "Tensione",
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="voltage"
              stroke="#8b5cf6"
              fill="url(#smoothAreaGradient)"
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      ),
    },
    {
      id: "stepline",
      title: "Step Line Chart",
      description: "Grafico a gradini - mostra cambiamenti discreti",
      config: stepLineChartConfig,
      component: (
        <ChartContainer config={stepLineChartConfig} className="h-[200px]">
          <LineChart data={powerData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={40}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11 }}
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
            <Line
              type="stepAfter"
              dataKey="power"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Shadcn/ui Charts Demo</h1>
          <p className="text-muted-foreground">
            Scegli il tipo di grafico più adatto per la tua dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {charts.map((chart) => (
            <Card
              key={chart.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedChart === chart.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() =>
                setSelectedChart(selectedChart === chart.id ? null : chart.id)
              }
            >
              <CardHeader>
                <CardTitle className="text-lg">{chart.title}</CardTitle>
                <CardDescription className="text-xs">
                  {chart.description}
                </CardDescription>
              </CardHeader>
              <CardContent>{chart.component}</CardContent>
            </Card>
          ))}
        </div>

        {selectedChart && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                {charts.find((c) => c.id === selectedChart)?.title} - Vista
                Dettagliata
              </CardTitle>
              <CardDescription>
                {charts.find((c) => c.id === selectedChart)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                {charts.find((c) => c.id === selectedChart)?.component}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Configurazione Ottimizzata per 1024x768</CardTitle>
            <CardDescription>
              Tutti i grafici sono configurati per essere compatti e leggibili
              su schermo 4:3
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Altezza consigliata:</strong> 180-200px per card,
              300-400px per vista dettagliata
            </p>
            <p>
              <strong>Font size:</strong> 11px per labels e tooltip
            </p>
            <p>
              <strong>Colori:</strong> Palette professionale con buon contrasto
            </p>
            <p>
              <strong>Libreria:</strong> Shadcn/ui Charts basato su Recharts
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
