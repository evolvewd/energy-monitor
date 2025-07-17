// ====================
// PAGINA PRINCIPALE REFACTORED
// ====================

// app/page.tsx
"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  Zap,
  Gauge,
  Activity,
  Battery,
  DollarSign,
  TrendingUp,
} from "lucide-react";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { SystemStatus } from "@/components/dashboard/SystemStatus";
import { EnergyMetricsSection } from "@/components/dashboard/EnergyMetricsSection";
import { ChartsSection } from "@/components/dashboard/ChartsSection";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { useDashboard } from "@/hooks/useDashboard";
import { CameraWidget } from "@/components/shared/CameraWidget";

export default function EnergyDashboard() {
  const {
    currentTime,
    connectionStatus,
    isTestingConnections,
    isLoading,
    systemHealth,
    totalServices,
    healthPercentage,
    testConnections,
  } = useDashboard();

  // Mock data - sostituiremo con dati reali
  const [energyData] = useState({
    currentPower: 2.35,
    voltage: 230.2,
    current: 10.2,
    totalConsumption: 156.7,
    costToday: 12.43,
    efficiency: 87.5,
  });

  const energyMetrics = [
    {
      title: "Potenza Attuale",
      value: energyData.currentPower,
      unit: "kW",
      icon: Zap,
      trend: 5.2,
      description: "Consumo istantaneo",
      isLoading,
    },
    {
      title: "Tensione",
      value: energyData.voltage,
      unit: "V",
      icon: Gauge,
      description: "Tensione di rete",
      isLoading,
    },
    {
      title: "Corrente",
      value: energyData.current,
      unit: "A",
      icon: Activity,
      description: "Corrente assorbita",
      isLoading,
    },
    {
      title: "Consumo Oggi",
      value: energyData.totalConsumption,
      unit: "kWh",
      icon: Battery,
      trend: -2.1,
      description: "Totale giornaliero",
      isLoading,
    },
    {
      title: "Costo Oggi",
      value: energyData.costToday,
      unit: "€",
      icon: DollarSign,
      trend: -2.1,
      description: "Spesa elettrica",
      isLoading,
    },
    {
      title: "Efficienza",
      value: energyData.efficiency,
      unit: "%",
      icon: TrendingUp,
      trend: 3.2,
      description: "Performance sistema",
      isLoading,
    },
  ];

  return (
    <DashboardLayout
      pageTitle="Dashboard Principale"
      pageSubtitle="Panoramica del sistema di monitoraggio energetico"
      notifications={2}
      healthPercentage={healthPercentage}
      currentTime={currentTime}
      systemStatus="online"
    >
      {/* Contenuto della dashboard */}

      <div className="space-y-6">
        {/* System Status */}
        <SystemStatus
          connectionStatus={connectionStatus}
          isTestingConnections={isTestingConnections}
          systemHealth={systemHealth}
          totalServices={totalServices}
          healthPercentage={healthPercentage}
          onTestConnections={testConnections}
        />

        {/* Energy Metrics */}
        <EnergyMetricsSection
          title="Metriche Energetiche"
          subtitle="Dati in tempo reale dal sistema"
          metrics={energyMetrics}
          showTrendText={true}
          isLive={true}
        />

        {/* Camera Widget */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">TVCC</h2>
            <p className="text-sm text-muted-foreground">
              Immagini con aggiornamento 2sec
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <CameraWidget cameraName="Retro" ipAddress="192.168.2.234" />
          <CameraWidget cameraName="Magazzino" ipAddress="192.168.2.234" />
          <CameraWidget cameraName="Parcheggio" ipAddress="192.168.2.234" />
          <CameraWidget cameraName="Ingresso" ipAddress="192.168.2.234" />
        </div>

        {/* Charts */}
        <ChartsSection />

        {/* Quick Actions */}
        <QuickActions connectionStatus={connectionStatus} />

        {/* Development Notice */}
      </div>
    </DashboardLayout>
  );
}
