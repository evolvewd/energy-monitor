// ====================
// COMPONENTE METRIC CARD
// ====================

// components/realtime/MetricCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | null;
  unit: string;
  icon: any;
  trend?: number;
  precision?: number;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  precision = 2,
}: MetricCardProps) => {
  const displayValue =
    value !== null && value !== undefined ? value.toFixed(precision) : "---";

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {displayValue}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {unit}
          </span>
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center text-xs mt-1 ${
              Math.abs(trend) < 0.1
                ? "text-muted-foreground"
                : trend > 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {Math.abs(trend) < 0.1 ? (
              <Minus className="w-3 h-3 mr-1" />
            ) : trend > 0 ? (
              <TrendingUp className="w-3 h-3 mr-1" />
            ) : (
              <TrendingDown className="w-3 h-3 mr-1" />
            )}
            {Math.abs(trend) < 0.1
              ? "Stabile"
              : `${trend > 0 ? "+" : ""}${trend.toFixed(1)}%`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
