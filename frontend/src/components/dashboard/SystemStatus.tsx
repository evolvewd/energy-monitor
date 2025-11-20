// ====================
// COMPONENTE SYSTEM STATUS
// ====================

// components/dashboard/SystemStatus.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, RefreshCw } from "lucide-react";
import { StatusIndicator } from "@/components/shared/StatusIndicator";
import { ServiceStatus } from "@/types/connections";

interface SystemStatusProps {
  connectionStatus: ServiceStatus;
  isTestingConnections: boolean;
  systemHealth: number;
  totalServices: number;
  healthPercentage: number;
  onTestConnections: () => void;
}

export const SystemStatus = ({
  connectionStatus,
  isTestingConnections,
  systemHealth,
  totalServices,
  healthPercentage,
  onTestConnections,
}: SystemStatusProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Stato Sistema</span>
            </CardTitle>
            <CardDescription>
              Monitoraggio connessioni e servizi ({systemHealth}/{totalServices}{" "}
              online)
            </CardDescription>
          </div>
          <Button
            onClick={onTestConnections}
            disabled={isTestingConnections}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                isTestingConnections ? "animate-spin" : ""
              }`}
            />
            {isTestingConnections ? "Testing..." : "Aggiorna"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={healthPercentage} className="h-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatusIndicator
            label="InfluxDB"
            status={connectionStatus.influxdb}
            description="Database time-series"
          />
          <StatusIndicator
            label="MQTT Broker"
            status={connectionStatus.mqtt}
            description="Messaggi IoT"
          />
          <StatusIndicator
            label="Node-RED"
            status={connectionStatus.nodered}
            description="Flow automation"
          />
        </div>
      </CardContent>
    </Card>
  );
};
