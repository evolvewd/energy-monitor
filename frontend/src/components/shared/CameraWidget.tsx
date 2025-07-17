"use client";

import React, { useState, useEffect } from "react";
import { Video, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CameraWidgetProps {
  cameraName?: string;
  ipAddress: string; // IP obbligatorio
  username?: string;
  password?: string;
  width?: string;
  height?: string;
  refreshInterval?: number;
  className?: string;
}

export const CameraWidget: React.FC<CameraWidgetProps> = ({
  cameraName = "Telecamera",
  width = "320px",
  height = "240px",
  refreshInterval = 5000,
  className = "",
}) => {
  const [imageKey, setImageKey] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  const CAMERA_URL =
    "http://admin:Assistec@192.168.2.234/ISAPI/Streaming/channels/1/picture";

  // Fix SSR
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setImageKey((prev) => prev + 1);
      setLastUpdate(new Date());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isMounted, refreshInterval]);

  const handleRefresh = () => {
    setImageKey((prev) => prev + 1);
    setLastUpdate(new Date());
  };

  if (!isMounted) {
    return (
      <Card className={className} style={{ width, height }}>
        <CardContent className="w-full h-full flex items-center justify-center bg-gray-900">
          <Video className="h-8 w-8 text-gray-500 opacity-50" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`} style={{ width, height }}>
      {/* Header ultra-compatto */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-0 px-3">
        <div className="flex items-center space-x-2">
          <Video className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium">{cameraName}</span>
          <Badge
            variant="outline"
            className="h-3.5 px-1 text-[10px] leading-none"
          >
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse mr-0.5" />
            LIVE
          </Badge>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
        >
          <RefreshCw className="h-2.5 w-2.5" />
        </Button>
      </CardHeader>

      {/* Contenuto video */}
      <CardContent className="p-0 flex-1">
        <div className="relative bg-gray-900 h-full">
          <img
            key={imageKey}
            src={`${CAMERA_URL}?_t=${imageKey}`}
            alt={cameraName}
            className="w-full h-full object-cover"
          />

          {/* Overlay informazioni - posizionato meglio */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pb-4">
            <div className="flex justify-between items-end text-white text-xs">
              <Badge
                variant="secondary"
                className="bg-red-600 text-white border-0 h-6 px-3 shadow-lg"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse mr-1.5" />
                <span className="font-medium">REC</span>
              </Badge>
              <div className="text-right">
                <div className="text-white font-mono text-sm drop-shadow-lg">
                  {lastUpdate.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
