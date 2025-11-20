"use client";

import { ReactNode } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { TopHeader } from "./TopHeader";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageSubtitle?: string;
  headerActions?: ReactNode;
  notifications?: number;
  healthPercentage?: number;
  currentTime?: string | Date | null;
  systemStatus?: "online" | "offline" | "maintenance";
  className?: string;
  // Aggiungiamo i dati del SystemStatus
  connectionStatus?: {
    influxdb: "online" | "offline" | "warning" | "testing";
    mqtt: "online" | "offline" | "warning" | "testing";
    nodered: "online" | "offline" | "warning" | "testing";
  };
  isTestingConnections?: boolean;
  onTestConnections?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  pageTitle,
  pageSubtitle,
  headerActions,
  notifications = 0,
  healthPercentage = 85,
  currentTime,
  systemStatus = "online",
  connectionStatus,
  isTestingConnections,
  onTestConnections,
  className,
}) => {
  return (
    <div className="h-screen bg-background">
      {/* Sidebar */}
      <DashboardSidebar
        healthPercentage={healthPercentage}
        currentTime={currentTime}
        systemStatus={systemStatus}
        connectionStatus={connectionStatus}
        isTestingConnections={isTestingConnections}
        onTestConnections={onTestConnections}
      />

      {/* Main Content Area */}
      <div className="pl-64">
        {/* Top Header */}
        <TopHeader
          title={pageTitle}
          subtitle={pageSubtitle}
          actions={headerActions}
          notifications={notifications}
        />

        {/* Page Content */}
        <main className={cn("flex-1 overflow-auto p-6", className)}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Esempio di utilizzo nel componente della pagina:
export const ExampleUsage = () => {
  return (
    <DashboardLayout
      pageTitle="Dashboard Principale"
      pageSubtitle="Panoramica del sistema di monitoraggio energetico"
      notifications={3}
      healthPercentage={92}
      systemStatus="online"
    >
      {/* Il contenuto della tua pagina va qui */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Consumo Attuale</h3>
          <p className="text-3xl font-bold text-primary">1,250 kW</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Efficienza</h3>
          <p className="text-3xl font-bold text-green-500">94%</p>
        </div>

        <div className="bg-card p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Risparmio Mensile</h3>
          <p className="text-3xl font-bold text-blue-500">€2,340</p>
        </div>
      </div>
    </DashboardLayout>
  );
};
