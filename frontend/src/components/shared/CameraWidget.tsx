// frontend/src/components/shared/CameraWidget.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Video, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CameraStatus = "connected" | "disconnected" | "testing";

interface CameraWidgetProps {
  cameraName?: string;
  ipAddress: string;
  username?: string;
  password?: string;
  status?: CameraStatus;
  width?: string;
  height?: string;
  refreshInterval?: number;
  className?: string;
}

export const CameraWidget: React.FC<CameraWidgetProps> = ({
  cameraName = "Telecamera",
  ipAddress,
  username = "admin",
  password = "",
  status = "connected",
  width = "320px",
  height = "240px",
  refreshInterval = 5000,
  className = "",
}) => {
  const [imageKey, setImageKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Costruisce l'URL della telecamera
  const getCameraUrl = () => {
    if (!ipAddress) return null;
    const credentials = username && password ? `${username}:${password}@` : "";
    return `http://${credentials}${ipAddress}/ISAPI/Streaming/channels/1/picture`;
  };

  const cameraUrl = getCameraUrl();

  // Fix SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-refresh solo se la telecamera è connessa
  useEffect(() => {
    if (!isMounted || status !== "connected" || !cameraUrl) return;

    const interval = setInterval(() => {
      setImageKey((prev) => prev + 1);
      setLastUpdate(new Date());
      setImageError(false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMounted, status, cameraUrl, refreshInterval]);

  const handleRefresh = () => {
    if (status === "connected" && cameraUrl) {
      setImageKey((prev) => prev + 1);
      setLastUpdate(new Date());
      setImageError(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getStatusIcon = () => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "disconnected":
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case "testing":
        return <RefreshCw className="h-3 w-3 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "LIVE";
      case "disconnected":
        return "OFFLINE";
      case "testing":
        return "TESTING";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "disconnected":
        return "text-red-500";
      case "testing":
        return "text-yellow-500";
    }
  };

  if (!isMounted) {
    return (
      <Card
        className={cn("overflow-hidden", className)}
        style={{ width, height }}
      >
        <CardContent className="w-full h-full flex items-center justify-center bg-gray-900">
          <Video className="h-8 w-8 text-gray-500 opacity-50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn("overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Header compatto */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-2 px-3">
        <div className="flex items-center space-x-2">
          <Video className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium truncate">{cameraName}</span>
          <Badge
            variant="outline"
            className={cn(
              "h-4 px-1.5 text-[10px] leading-none",
              status === "connected"
                ? "border-green-500 text-green-500"
                : status === "disconnected"
                ? "border-red-500 text-red-500"
                : "border-yellow-500 text-yellow-500"
            )}
          >
            {getStatusIcon()}
            <span className="ml-1">{getStatusText()}</span>
          </Badge>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          disabled={status !== "connected" || !cameraUrl}
        >
          <RefreshCw
            className={cn(
              "h-2.5 w-2.5",
              status === "testing" && "animate-spin"
            )}
          />
        </Button>
      </CardHeader>

      {/* Contenuto video */}
      <CardContent className="p-0 flex-1">
        <div className="relative bg-gray-900 h-full min-h-[180px]">
          {status === "connected" && cameraUrl && !imageError ? (
            <>
              <img
                key={imageKey}
                src={`${cameraUrl}?_t=${imageKey}`}
                alt={cameraName}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />

              {/* Overlay REC - solo se connessa */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <div className="flex justify-between items-end text-white text-xs">
                  <Badge
                    variant="secondary"
                    className="bg-red-600 text-white border-0 h-5 px-2 shadow-lg"
                  >
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse mr-1" />
                    <span className="font-medium text-[10px]">REC</span>
                  </Badge>
                  <div className="text-right">
                    <div className="text-white font-mono text-[10px] drop-shadow-lg">
                      {lastUpdate.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Stato placeholder per telecamere disconnesse o in errore */
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              {status === "testing" ? (
                <>
                  <RefreshCw className="h-8 w-8 animate-spin mb-2" />
                  <span className="text-sm">Testing connessione...</span>
                </>
              ) : status === "disconnected" ? (
                <>
                  <AlertTriangle className="h-8 w-8 mb-2 text-red-500" />
                  <span className="text-sm text-center">
                    Telecamera
                    <br />
                    disconnessa
                  </span>
                  {ipAddress && (
                    <span className="text-xs text-gray-500 mt-1">
                      {ipAddress}
                    </span>
                  )}
                </>
              ) : imageError ? (
                <>
                  <AlertTriangle className="h-8 w-8 mb-2 text-orange-500" />
                  <span className="text-sm text-center">
                    Errore di
                    <br />
                    connessione
                  </span>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                  >
                    Riprova
                  </Button>
                </>
              ) : (
                <>
                  <Video className="h-8 w-8 mb-2" />
                  <span className="text-sm text-center">Nessun segnale</span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
