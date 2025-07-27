// components/charts/InstantVoltageChart.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Zap } from "lucide-react";

interface InstantVoltageChartProps {
  currentVoltage: number;
  className?: string;
}

// Dati fittizi per 24 ore (un punto ogni ora)
const generateMockData = () => {
  const data = [];
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(now);
    time.setHours(now.getHours() - i);

    // Simula variazioni di tensione realistiche (220V ± 10V)
    const baseVoltage = 220;
    const variation =
      Math.sin((i / 24) * 2 * Math.PI) * 5 + Math.random() * 4 - 2;
    const voltage = baseVoltage + variation;

    data.push({
      time: time.toISOString(),
      hour: time.getHours().toString().padStart(2, "0"),
      voltage: Math.round(voltage * 10) / 10, // Arrotonda a 1 decimale
    });
  }

  return data;
};

const chartData = generateMockData();

// Tooltip personalizzato
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium">{`Ore ${label}:00`}</p>
        <p className="text-sm text-blue-600">
          {`Tensione: ${payload[0].value.toFixed(1)}V`}
        </p>
      </div>
    );
  }
  return null;
};

export function InstantVoltageChart({
  currentVoltage,
  className,
}: InstantVoltageChartProps) {
  const formatVoltage = (value: number) => {
    return `${value.toFixed(1)}V`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Tensione Istantanea
            </CardTitle>
            <CardDescription>
              Monitoraggio tensione RMS - Ultime 24 ore
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {formatVoltage(currentVoltage)}
            </div>
            <div className="text-xs text-muted-foreground">Valore attuale</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 12,
              bottom: 12,
            }}
          >
            <defs>
              <linearGradient id="voltageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval="preserveStartEnd"
              tickFormatter={(value) => `${value}:00`}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={["dataMin - 5", "dataMax + 5"]}
              tickFormatter={(value) => `${value}V`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              dataKey="voltage"
              type="natural"
              fill="url(#voltageGradient)"
              fillOpacity={0.6}
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
