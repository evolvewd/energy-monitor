// components/charts/FrigateChart.tsx
"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

export interface FrigateChartDataPoint {
  timestamp: Date | string;
  value: number;
  label?: string;
}

export interface FrigateChartProps {
  data: FrigateChartDataPoint[];
  title?: string;
  unit?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  domain?: [number | string, number | string];
  yAxisFormatter?: (value: number) => string;
  xAxisFormatter?: (value: string) => string;
  className?: string;
}

// Tooltip personalizzato stile Frigate
const FrigateTooltip = ({ active, payload, unit }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const timestamp = data.timestamp instanceof Date 
      ? data.timestamp 
      : new Date(data.timestamp);
    
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg px-3 py-2 text-sm">
        <div className="text-muted-foreground text-xs mb-1">
          {format(timestamp, "HH:mm:ss")}
        </div>
        <div className="font-medium">
          {payload[0].value.toFixed(2)}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        </div>
      </div>
    );
  }
  return null;
};

export function FrigateChart({
  data,
  title,
  unit,
  color = "hsl(var(--chart-1))",
  height = 200,
  showGrid = true,
  showTooltip = true,
  domain,
  yAxisFormatter,
  xAxisFormatter,
  className,
}: FrigateChartProps) {
  // Prepara i dati per recharts
  const chartData = data.map((point) => ({
    timestamp: point.timestamp instanceof Date 
      ? point.timestamp.toISOString() 
      : point.timestamp,
    value: point.value,
    label: point.label,
  }));

  // Converte HSL CSS variable in colore RGB/hex per recharts
  const getColorValue = () => {
    // Se è già un colore hex o rgb, usalo direttamente
    if (color.startsWith("#") || color.startsWith("rgb")) {
      return color;
    }
    // Se è un CSS variable HSL, usa colori predefiniti basati sul tema
    if (color.includes("chart-1")) return "#8884d8";
    if (color.includes("chart-2")) return "#82ca9d";
    if (color.includes("chart-3")) return "#ffc658";
    if (color.includes("chart-4")) return "#ff7300";
    if (color.includes("chart-5")) return "#00ff00";
    // Default: blu
    return "#3b82f6";
  };

  const colorValue = getColorValue();
  
  // Genera un ID univoco per il gradient (usa useMemo o una variabile stabile)
  const gradientId = `gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}-${colorValue.replace(/[^a-zA-Z0-9]/g, "")}`;

  // Formatter di default per asse X
  const defaultXAxisFormatter = (value: string) => {
    try {
      const date = new Date(value);
      return format(date, "HH:mm");
    } catch {
      return value;
    }
  };

  // Formatter di default per asse Y
  const defaultYAxisFormatter = (value: number) => {
    if (yAxisFormatter) {
      return yAxisFormatter(value);
    }
    return value.toFixed(1);
  };

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colorValue} stopOpacity={0.4} />
              <stop offset="50%" stopColor={colorValue} stopOpacity={0.15} />
              <stop offset="100%" stopColor={colorValue} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.2}
            />
          )}
          
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={xAxisFormatter || defaultXAxisFormatter}
            interval="preserveStartEnd"
          />
          
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={defaultYAxisFormatter}
            domain={domain || ["auto", "auto"]}
            width={50}
          />
          
          {showTooltip && (
            <Tooltip
              content={<FrigateTooltip unit={unit} />}
              cursor={{ stroke: colorValue, strokeWidth: 1, strokeOpacity: 0.3 }}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="value"
            stroke={colorValue}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            dot={false}
            activeDot={{ r: 3, fill: colorValue, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            isAnimationActive={true}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

