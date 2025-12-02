// components/charts/InfluxStyleChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format } from "date-fns";

export interface InfluxDataPoint {
  timestamp: Date | string;
  [key: string]: Date | string | number | undefined;
}

export interface InfluxStyleChartProps {
  data: InfluxDataPoint[];
  series: Array<{
    key: string;
    label: string;
    color: string;
    unit?: string;
    yAxisId?: "left" | "right";
  }>;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  timeFormat?: string;
  className?: string;
}

// Tooltip personalizzato stile InfluxDB
const InfluxTooltip = ({ active, payload, label, series }: any) => {
  if (active && payload && payload.length) {
    const timestamp = typeof label === "string" ? new Date(label) : label;
    
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-md shadow-lg px-3 py-2 text-sm">
        <div className="text-[#a1a1aa] text-xs mb-2 font-mono">
          {format(timestamp, "yyyy-MM-dd HH:mm:ss")}
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            const seriesConfig = series.find((s: any) => s.key === entry.dataKey);
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-[#e4e4e7] text-xs">
                    {seriesConfig?.label || entry.dataKey}
                  </span>
                </div>
                <span className="text-[#fafafa] font-mono text-xs">
                  {typeof entry.value === "number"
                    ? entry.value.toFixed(2)
                    : entry.value}
                  {seriesConfig?.unit && (
                    <span className="text-[#a1a1aa] ml-1">{seriesConfig.unit}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export function InfluxStyleChart({
  data,
  series,
  height = 400,
  showGrid = true,
  showLegend = true,
  timeFormat = "HH:mm:ss",
  className,
}: InfluxStyleChartProps) {
  // Prepara i dati per recharts
  const chartData = data.map((point) => {
    const result: any = {
      timestamp: point.timestamp instanceof Date 
        ? point.timestamp.toISOString() 
        : point.timestamp,
    };
    
    series.forEach((s) => {
      result[s.key] = point[s.key];
    });
    
    return result;
  });

  // Formatter per asse X (timestamp)
  const formatTime = (value: string) => {
    try {
      const date = new Date(value);
      return format(date, timeFormat);
    } catch {
      return value;
    }
  };

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#27272a"
              opacity={0.5}
            />
          )}
          
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            tickFormatter={formatTime}
            interval="preserveStartEnd"
            stroke="#3f3f46"
          />
          
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            stroke="#3f3f46"
            width={60}
          />
          
          {series.some((s) => s.yAxisId === "right") && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              stroke="#3f3f46"
              width={60}
            />
          )}
          
          <Tooltip
            content={<InfluxTooltip series={series} />}
            cursor={{ stroke: "#52525b", strokeWidth: 1, strokeOpacity: 0.3 }}
          />
          
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              iconType="line"
              formatter={(value) => {
                const seriesConfig = series.find((s) => s.key === value);
                return seriesConfig?.label || value;
              }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                
                return (
                  <div className="flex flex-wrap gap-4 justify-center px-4">
                    {payload.map((entry, index) => {
                      const seriesConfig = series.find((s) => s.key === entry.dataKey);
                      return (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <div
                            className="w-3 h-0.5"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-[#a1a1aa]">
                            {seriesConfig?.label || entry.dataKey}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
          
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3, fill: s.color, strokeWidth: 2, stroke: "#18181b" }}
              isAnimationActive={true}
              animationDuration={300}
              yAxisId={s.yAxisId || "left"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

