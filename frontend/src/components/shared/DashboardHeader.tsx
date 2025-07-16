// ====================
// COMPONENTE DASHBOARD HEADER UNIFICATO
// ====================

// components/shared/DashboardHeader.tsx
"use client";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Play, Pause, RotateCcw, Wifi, WifiOff } from "lucide-react";

interface BaseDashboardHeaderProps {
  title: string;
  subtitle: string;
  currentTime: Date | null;
  healthPercentage: number;
  showIcon?: boolean;
}

interface RealtimeControlsProps {
  isRunning: boolean;
  updateCount: number;
  onToggleUpdates: () => void;
  onResetData: () => void;
}

interface DashboardHeaderProps extends BaseDashboardHeaderProps {
  // Props opzionali per modalità realtime
  realtimeControls?: RealtimeControlsProps;
  // Stile del contenitore
  variant?: "full-header" | "content-only";
}

export const DashboardHeader = ({
  title,
  subtitle,
  currentTime,
  healthPercentage,
  showIcon = true,
  realtimeControls,
  variant = "full-header",
}: DashboardHeaderProps) => {
  const HeaderContent = () => (
    <div className="container mx-auto px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Sezione Sinistra - Titolo */}
        <div>
          <div className="flex items-center space-x-3">
            {showIcon && (
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <h1
                // verificare l'operatore ternario inutile per il cambio grandezza font
                className={`font-bold tracking-tight ${
                  realtimeControls ? "text-2xl" : "text-2xl"
                }`}
              >
                {title}
              </h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
          </div>
        </div>

        {/* Sezione Destra - Info Sistema + Controlli Realtime */}
        <div className="flex items-center space-x-4">
          {/* Controlli Realtime (se presenti) */}
          {realtimeControls && (
            <>
              <Badge
                variant={realtimeControls.isRunning ? "default" : "secondary"}
                className="px-3 py-1"
              >
                {realtimeControls.isRunning ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" /> Live
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" /> Paused
                  </>
                )}
                • {realtimeControls.updateCount} updates
              </Badge>
              <Button
                onClick={realtimeControls.onToggleUpdates}
                variant="outline"
                size="sm"
              >
                {realtimeControls.isRunning ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
              <Button
                onClick={realtimeControls.onResetData}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {/* Separatore solo se non siamo in modalità realtime-only */}
              {variant === "full-header" && (
                <Separator orientation="vertical" className="h-12" />
              )}
            </>
          )}

          {/* Info Sistema (solo in modalità full-header) */}
          {variant === "full-header" && (
            <>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {currentTime?.toLocaleDateString("it-IT", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) || "--"}
                </p>
                <p className="text-lg font-mono font-semibold">
                  {currentTime?.toLocaleTimeString("it-IT") || "--:--:--"}
                </p>
              </div>
              <Separator orientation="vertical" className="h-12" />
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthPercentage === 100
                      ? "bg-green-500"
                      : healthPercentage >= 80
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  Sistema {healthPercentage === 100 ? "Operativo" : "Parziale"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Se è content-only, restituisci solo il contenuto
  if (variant === "content-only") {
    return <HeaderContent />;
  }

  // Altrimenti restituisci l'header completo
  return (
    <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <HeaderContent />
    </header>
  );
};
