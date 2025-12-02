// components/charts/EnergyChart.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FrigateChart, FrigateChartDataPoint } from "./FrigateChart";
import { Zap, Activity, Gauge, TrendingUp } from "lucide-react";

interface EnergyChartProps {
  title: string;
  description?: string;
  data: FrigateChartDataPoint[];
  currentValue?: number;
  unit: string;
  icon?: React.ReactNode;
  color?: string;
  height?: number;
  className?: string;
}

const iconMap: Record<string, React.ReactNode> = {
  power: <Zap className="h-4 w-4" />,
  voltage: <Gauge className="h-4 w-4" />,
  current: <Activity className="h-4 w-4" />,
  energy: <TrendingUp className="h-4 w-4" />,
};

export function EnergyChart({
  title,
  description,
  data,
  currentValue,
  unit,
  icon,
  color = "hsl(var(--chart-1))",
  height = 250,
  className,
}: EnergyChartProps) {
  const displayIcon = icon || iconMap[title.toLowerCase()] || <Activity className="h-4 w-4" />;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {displayIcon}
              {title.toUpperCase()}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">{description}</CardDescription>
            )}
          </div>
          {currentValue !== undefined && (
            <div className="text-right">
              <div className="text-2xl font-bold">
                {currentValue.toFixed(2)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <FrigateChart
          data={data}
          unit={unit}
          color={color}
          height={height}
          showGrid={true}
          showTooltip={true}
        />
      </CardContent>
    </Card>
  );
}

