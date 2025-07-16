// ====================
// COMPONENTE ENERGY METRICS SECTION
// ====================

// components/dashboard/EnergyMetricsSection.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";

interface EnergyMetricsSectionProps {
  title: string;
  subtitle: string;
  metrics: Array<{
    title: string;
    value: number | string | null;
    unit: string;
    icon: any;
    trend?: number;
    description?: string;
    isLoading?: boolean;
    variant?: "default" | "success" | "warning" | "destructive";
    precision?: number;
  }>;
  showTrendText?: boolean;
  isLive?: boolean;
}

export const EnergyMetricsSection = ({
  title,
  subtitle,
  metrics,
  showTrendText = false,
  isLive = false,
}: EnergyMetricsSectionProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {isLive && (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
            <Clock className="w-3 h-3 mr-1" />
            Live
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} showTrendText={showTrendText} />
        ))}
      </div>
    </div>
  );
};
