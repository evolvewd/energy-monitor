// ====================
// COMPONENTE HEADER DASHBOARD
// ====================

// components/realtime/DashboardHeader.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Wifi, WifiOff } from "lucide-react";

interface DashboardHeaderProps {
  isRunning: boolean;
  updateCount: number;
  onToggleUpdates: () => void;
  onResetData: () => void;
}

export const DashboardHeader = ({
  isRunning,
  updateCount,
  onToggleUpdates,
  onResetData,
}: DashboardHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Real-time ⚡
        </h1>
        <p className="text-muted-foreground">
          Monitoraggio energetico in tempo reale • Aggiornamento ogni secondo
        </p>
      </div>
      <div className="flex items-center space-x-4">
        <Badge
          variant={isRunning ? "default" : "secondary"}
          className="px-3 py-1"
        >
          {isRunning ? (
            <>
              <Wifi className="w-3 h-3 mr-1" /> Live
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 mr-1" /> Paused
            </>
          )}
          • {updateCount} updates
        </Badge>
        <Button onClick={onToggleUpdates} variant="outline" size="sm">
          {isRunning ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        <Button onClick={onResetData} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
