// ====================
// COMPONENTE QUICK ACTIONS
// ====================

// components/dashboard/QuickActions.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Zap,
  Database,
  ExternalLink,
} from "lucide-react";
import { ServiceStatus } from "@/types/connections";

interface QuickActionsProps {
  connectionStatus: ServiceStatus;
}

export const QuickActions = ({ connectionStatus }: QuickActionsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Azioni Rapide</span>
        </CardTitle>
        <CardDescription>Accesso diretto ai servizi di sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => (window.location.href = "/realtime")}
          >
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-medium">Real-time</p>
              <p className="text-xs text-muted-foreground">Live dashboard</p>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => window.open("http://localhost:8086", "_blank")}
            disabled={connectionStatus.influxdb === "offline"}
          >
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-center">
              <p className="font-medium">InfluxDB</p>
              <p className="text-xs text-muted-foreground">Database</p>
            </div>
            <ExternalLink className="w-3 h-3" />
          </Button>

          <Button
            variant="outline"
            className="h-auto p-4 flex flex-col items-center space-y-2"
            onClick={() => (window.location.href = "/data")}
          >
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Database className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="font-medium">Dati Live</p>
              <p className="text-xs text-muted-foreground">
                InfluxDB real-time
              </p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
