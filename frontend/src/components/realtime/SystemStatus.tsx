// ====================
// COMPONENTE SYSTEM STATUS - FIXED
// ====================

// components/realtime/SystemStatus.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";
import { RealtimeData, ApiResponse } from "@/types/realtime";

interface SystemStatusProps {
  latest: RealtimeData | null;
  data: RealtimeData[];
  lastUpdateTime: Date | null;
  meta: ApiResponse["meta"] | null;
}

export const SystemStatus = ({
  latest,
  data,
  lastUpdateTime,
  meta,
}: SystemStatusProps) => {
  const getStatusInfo = (status: number) => {
    // Aggiungi controllo di sicurezza all'inizio
    if (status === undefined || status === null || typeof status !== "number") {
      return {
        color: "gray",
        text: "N/A",
        icon: Activity,
        errors: [],
        warnings: [],
        info: [],
        binary: "N/A",
        statusBits: {},
      };
    }

    const statusBits = {
      bit0: (status & 1) !== 0,
      bit1: (status & 2) !== 0,
      bit2: (status & 4) !== 0,
      bit3: (status & 8) !== 0,
      bit6: (status & 64) !== 0,
      bit10: (status & 1024) !== 0,
      bit11: (status & 2048) !== 0,
      bit13: (status & 8192) !== 0,
      bit14: (status & 16384) !== 0,
    };

    const errors = [];
    const warnings = [];
    const info = [];

    if (statusBits.bit0) errors.push("Flash settings error");
    if (statusBits.bit1) errors.push("Flash calibration error");
    if (statusBits.bit10) errors.push("Energy storing error");
    if (statusBits.bit11) errors.push("Energy initialization error");

    if (statusBits.bit2) warnings.push("Voltage Over Range");
    if (statusBits.bit3) warnings.push("Voltage Under Range");
    if (statusBits.bit13) warnings.push("Current Over Range");
    if (statusBits.bit14) warnings.push("Current Under Range");

    if (statusBits.bit6) info.push("Zero crossing detecting");

    let color, text, icon;
    if (errors.length > 0) {
      color = "red";
      text = `ERRORE (${errors.length})`;
      icon = AlertTriangle;
    } else if (warnings.length > 0) {
      color = "yellow";
      text = `WARNING (${warnings.length})`;
      icon = AlertTriangle;
    } else {
      color = "green";
      text = "OK";
      icon = Activity;
    }

    return {
      color,
      text,
      icon,
      errors,
      warnings,
      info,
      binary: status.toString(2).padStart(16, "0"), // Ora status è sicuramente un numero
      statusBits,
    };
  };

  // Controlla sia latest che latest.status
  const statusInfo =
    latest && latest.status !== undefined ? getStatusInfo(latest.status) : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Device Status</p>
              <div className="flex items-center">
                {statusInfo ? (
                  <>
                    <statusInfo.icon
                      className={`w-4 h-4 mr-2 text-${statusInfo.color}-500`}
                    />
                    <span className={`font-mono text-${statusInfo.color}-500`}>
                      {statusInfo.text}
                    </span>
                  </>
                ) : (
                  <span className="font-mono text-gray-500">N/A</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Status Code</p>
              <div className="space-y-1">
                <p className="font-mono">{latest?.status ?? "---"}</p>
                {statusInfo && statusInfo.binary !== "N/A" && (
                  <p className="text-xs text-muted-foreground font-mono">
                    0b{statusInfo.binary}
                  </p>
                )}
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Data Points</p>
              <p className="font-mono">{data.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Update Rate</p>
              <p className="font-mono">1.0 Hz</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Connection Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Last Update</p>
              <p className="font-mono">
                {lastUpdateTime?.toLocaleTimeString("it-IT") ?? "---"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Points</p>
              <p className="font-mono">{meta?.totalPoints ?? "---"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Range</p>
              <p className="font-mono text-xs">
                {meta?.dataRange
                  ? `${new Date(meta.dataRange.from).toLocaleTimeString(
                      "it-IT"
                    )} - ${new Date(meta.dataRange.to).toLocaleTimeString(
                      "it-IT"
                    )}`
                  : "---"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Server Time</p>
              <p className="font-mono text-xs">
                {meta?.updateTime
                  ? new Date(meta.updateTime).toLocaleTimeString("it-IT")
                  : "---"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
