// ====================
// COMPONENTI CONDIVISI
// ====================

// components/shared/MetricCard.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | string | null;
  unit: string;
  icon: any;
  trend?: number;
  description?: string;
  isLoading?: boolean;
  variant?: "default" | "success" | "warning" | "destructive";
  precision?: number;
  // Props per homepage
  showTrendText?: boolean;
}

export const MetricCard = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  description,
  isLoading = false,
  variant = "default",
  precision = 2,
  showTrendText = false,
}: MetricCardProps) => {
  const variantStyles = {
    default: "border-border",
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    destructive: "border-red-500/20 bg-red-500/5",
  };

  const displayValue =
    value !== null && value !== undefined
      ? typeof value === "number"
        ? value.toFixed(precision)
        : value
      : "---";

  if (isLoading) {
    return (
      <Card className={`${variantStyles[variant]} transition-colors`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${variantStyles[variant]} transition-all duration-200 hover:shadow-lg`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
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
              showTrendText
                ? trend > 0
                  ? "text-red-600"
                  : trend < 0
                  ? "text-green-600"
                  : "text-muted-foreground"
                : Math.abs(trend) < 0.1
                ? "text-muted-foreground"
                : trend > 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {showTrendText ? (
              <>
                {trend > 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : trend < 0 ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : null}
                {trend > 0 ? "+" : ""}
                {trend}% da ieri
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};
