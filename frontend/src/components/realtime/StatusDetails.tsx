// ====================
// COMPONENTE STATUS DETAILS - FIXED
// ====================

// components/realtime/StatusDetails.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, AlertTriangle } from "lucide-react";
import { RealtimeData } from "@/types/realtime";

interface StatusDetailsProps {
  latest: RealtimeData | null;
}

export const StatusDetails = ({ latest }: StatusDetailsProps) => {
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
      };
    }

    // Stessa logica di getStatusInfo dal componente SystemStatus
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
    };
  };

  // Controlla sia latest che latest.status
  const statusInfo =
    latest && latest.status !== undefined ? getStatusInfo(latest.status) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <Activity className="w-4 h-4 mr-2" />
          Status Details - {statusInfo?.text || "N/A"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {statusInfo?.errors && statusInfo.errors.length > 0 && (
          <div>
            <p className="text-sm font-medium text-red-600 mb-1">🚨 Errori:</p>
            <ul className="text-xs space-y-1">
              {statusInfo.errors.map((error, index) => (
                <li key={index} className="text-red-600">
                  • {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {statusInfo?.warnings && statusInfo.warnings.length > 0 && (
          <div>
            <p className="text-sm font-medium text-yellow-600 mb-1">
              ⚠️ Warning:
            </p>
            <ul className="text-xs space-y-1">
              {statusInfo.warnings.map((warning, index) => (
                <li key={index} className="text-yellow-600">
                  • {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {statusInfo?.info && statusInfo.info.length > 0 && (
          <div>
            <p className="text-sm font-medium text-blue-600 mb-1">ℹ️ Info:</p>
            <ul className="text-xs space-y-1">
              {statusInfo.info.map((info, index) => (
                <li key={index} className="text-blue-600">
                  • {info}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Binary:</span>{" "}
            {statusInfo?.binary || "N/A"}
            <span className="ml-4 font-medium">Decimal:</span>{" "}
            {latest?.status ?? "N/A"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
