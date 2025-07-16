// ====================
// COMPONENTE CHARTS PLACEHOLDER
// ====================

// components/dashboard/ChartsSection.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Activity } from "lucide-react";

export const ChartsSection = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Consumo Energetico</CardTitle>
          <CardDescription>Ultime 24 ore</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Grafico in sviluppo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Dati real-time da InfluxDB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trend Settimanale</CardTitle>
          <CardDescription>Analisi dei consumi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <Activity className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">Grafico in sviluppo</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analisi predittiva
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
