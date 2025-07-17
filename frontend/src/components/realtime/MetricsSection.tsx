// ====================
// COMPONENTE METRICS SECTION
// ====================

// components/realtime/MetricsSection.tsx
"use client";

import { MetricCard } from "./MetricCard";
import { Gauge, Activity, Zap, TrendingUp } from "lucide-react";
import { RealtimeData } from "@/types/realtime";

interface MetricsSectionProps {
  title: string;
  latest: RealtimeData | null;
  trends: { [key: string]: number };
  type: "instantaneous" | "peak";
}

export const MetricsSection = ({
  title,
  latest,
  trends,
  type,
}: MetricsSectionProps) => {
  if (type === "instantaneous") {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Tensione RMS"
            value={latest?.v_rms ?? null}
            unit="V"
            icon={Gauge}
            trend={trends.v_rms}
            precision={2}
          />
          <MetricCard
            title="Corrente RMS"
            value={latest?.i_rms ? latest.i_rms : null}
            unit="A"
            icon={Activity}
            trend={trends.i_rms}
            precision={3}
          />
          <MetricCard
            title="Potenza Attiva"
            value={latest?.p_active ?? null}
            unit="W"
            icon={Zap}
            trend={trends.p_active}
            precision={1}
          />
          <MetricCard
            title="Frequenza"
            value={latest?.frequency ?? null}
            unit="Hz"
            icon={Activity}
            trend={trends.frequency}
            precision={2}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Tensione Peak"
          value={latest?.v_peak ?? null}
          unit="V"
          icon={TrendingUp}
          trend={trends.v_peak}
          precision={1}
        />
        <MetricCard
          title="Corrente Peak"
          value={latest?.i_peak ? latest.i_peak / 1000 : null}
          unit="A"
          icon={TrendingUp}
          trend={trends.i_peak}
          precision={3}
        />
        <MetricCard
          title="THD"
          value={latest?.thd ?? null}
          unit="%"
          icon={Activity}
          trend={trends.thd}
          precision={2}
        />
      </div>
    </div>
  );
};
