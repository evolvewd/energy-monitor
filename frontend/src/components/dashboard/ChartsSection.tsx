// components/dashboard/ChartsSection.tsx
"use client";

import { useMemo } from "react";
import { EnergyChart } from "@/components/charts/EnergyChart";
import { FrigateChartDataPoint } from "@/components/charts/FrigateChart";
import { useOptaCombined } from "@/hooks/useOptaData";
import { Loader2 } from "lucide-react";

export const ChartsSection = () => {
  const { realtime, power } = useOptaCombined();

  // Prepara dati per grafico Tensione (V RMS)
  const voltageData: FrigateChartDataPoint[] = useMemo(() => {
    if (!realtime.timeSeries?.timestamps || !realtime.timeSeries?.v_rms) {
      return [];
    }
    
    const timestamps = realtime.timeSeries.timestamps;
    const values = realtime.timeSeries.v_rms;
    
    // Prendi solo gli ultimi 60 punti per performance
    const last60 = Math.min(60, timestamps.length);
    const startIndex = Math.max(0, timestamps.length - last60);
    
    return timestamps.slice(startIndex).map((timestamp, idx) => ({
      timestamp: new Date(timestamp),
      value: values[startIndex + idx] || 0,
    }));
  }, [realtime.timeSeries]);

  // Prepara dati per grafico Corrente (I RMS)
  const currentData: FrigateChartDataPoint[] = useMemo(() => {
    if (!realtime.timeSeries?.timestamps || !realtime.timeSeries?.i_rms) {
      return [];
    }
    
    const timestamps = realtime.timeSeries.timestamps;
    const values = realtime.timeSeries.i_rms;
    
    const last60 = Math.min(60, timestamps.length);
    const startIndex = Math.max(0, timestamps.length - last60);
    
    return timestamps.slice(startIndex).map((timestamp, idx) => ({
      timestamp: new Date(timestamp),
      value: values[startIndex + idx] || 0,
    }));
  }, [realtime.timeSeries]);

  // Prepara dati per grafico Potenza Attiva
  const powerData: FrigateChartDataPoint[] = useMemo(() => {
    if (!power.timeSeries?.timestamps || !power.timeSeries?.p_active) {
      return [];
    }
    
    const timestamps = power.timeSeries.timestamps;
    const values = power.timeSeries.p_active;
    
    const last60 = Math.min(60, timestamps.length);
    const startIndex = Math.max(0, timestamps.length - last60);
    
    return timestamps.slice(startIndex).map((timestamp, idx) => ({
      timestamp: new Date(timestamp),
      value: values[startIndex + idx] || 0,
    }));
  }, [power.timeSeries]);

  // Prepara dati per grafico Energia Totale
  const energyData: FrigateChartDataPoint[] = useMemo(() => {
    if (!power.timeSeries?.timestamps || !power.timeSeries?.energy_total) {
      return [];
    }
    
    const timestamps = power.timeSeries.timestamps;
    const values = power.timeSeries.energy_total;
    
    const last60 = Math.min(60, timestamps.length);
    const startIndex = Math.max(0, timestamps.length - last60);
    
    return timestamps.slice(startIndex).map((timestamp, idx) => ({
      timestamp: new Date(timestamp),
      value: values[startIndex + idx] || 0,
    }));
  }, [power.timeSeries]);

  // Loading state
  if (realtime.isLoading && power.isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-2 flex items-center justify-center h-[300px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Caricamento dati grafici...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (realtime.error || power.error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="col-span-2 p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
          <p className="text-sm text-destructive">
            Errore nel caricamento dati: {realtime.error || power.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tensione RMS */}
      <EnergyChart
        title="Tensione"
        description="Tensione RMS in tempo reale"
        data={voltageData}
        currentValue={realtime.latest?.v_rms}
        unit="V"
        color="hsl(var(--chart-1))"
        height={250}
      />

      {/* Corrente RMS */}
      <EnergyChart
        title="Corrente"
        description="Corrente RMS in tempo reale"
        data={currentData}
        currentValue={realtime.latest?.i_rms}
        unit="A"
        color="hsl(var(--chart-2))"
        height={250}
      />

      {/* Potenza Attiva */}
      <EnergyChart
        title="Potenza Attiva"
        description="Potenza attiva in tempo reale"
        data={powerData}
        currentValue={power.latest?.p_active}
        unit="W"
        color="hsl(var(--chart-3))"
        height={250}
      />

      {/* Energia Totale */}
      <EnergyChart
        title="Energia Totale"
        description="Energia totale accumulata"
        data={energyData}
        currentValue={power.latest?.energy_total}
        unit="kWh"
        color="hsl(var(--chart-4))"
        height={250}
      />
    </div>
  );
};
