"use client";

import { ReactNode, useState } from "react";
import { DashboardSidebar } from "./DashboardSidebar";
import { BottomNavigation } from "./BottomNavigation";
import { TopHeader } from "./TopHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useHideCursor } from "@/hooks/useHideCursor";

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
  // Nascondi cursore dopo 3 secondi di inattività (feeling smartphone)
  useHideCursor(3000);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-screen bg-gradient-to-b from-background to-muted/20 max-w-[1024px] mx-auto flex flex-col overflow-hidden">
        {/* Top Header - Minimale, solo se necessario */}
        {pageTitle && (
          <div className="px-6 pt-4 pb-2">
            <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
            {pageSubtitle && (
              <p className="text-sm text-muted-foreground mt-1">{pageSubtitle}</p>
            )}
          </div>
        )}

        {/* Main Content Area - con padding bottom per la navigation */}
        <main
          className={cn("flex-1 overflow-auto px-4 py-4 pb-24", className)}
          data-scrollable
        >
          {children}
        </main>

        {/* Bottom Navigation */}
        <BottomNavigation />
      </div>
    </TooltipProvider>
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
