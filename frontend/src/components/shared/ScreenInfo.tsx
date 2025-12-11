"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ScreenInfo() {
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    devicePixelRatio: 0,
    innerWidth: 0,
    innerHeight: 0,
    outerWidth: 0,
    outerHeight: 0,
    colorDepth: 0,
    pixelDepth: 0,
    userAgent: "",
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo({
        width: window.screen.width,
        height: window.screen.height,
        devicePixelRatio: window.devicePixelRatio || 1,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        colorDepth: window.screen.colorDepth || 0,
        pixelDepth: window.screen.pixelDepth || 0,
        userAgent: navigator.userAgent,
      });
    };

    updateScreenInfo();
    window.addEventListener("resize", updateScreenInfo);
    return () => window.removeEventListener("resize", updateScreenInfo);
  }, []);

  return (
    <Card className="fixed top-4 right-4 z-50 bg-background/95 backdrop-blur-sm border-2 border-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Info Schermo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-xs font-mono">
        <div>
          <span className="text-muted-foreground">Screen: </span>
          <span className="text-primary font-semibold">
            {screenInfo.width} × {screenInfo.height}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Viewport: </span>
          <span className="text-primary font-semibold">
            {screenInfo.innerWidth} × {screenInfo.innerHeight}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">DPR: </span>
          <span className="text-primary font-semibold">{screenInfo.devicePixelRatio}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Color Depth: </span>
          <span className="text-primary font-semibold">{screenInfo.colorDepth} bit</span>
        </div>
        <div>
          <span className="text-muted-foreground">Pixel Depth: </span>
          <span className="text-primary font-semibold">{screenInfo.pixelDepth} bit</span>
        </div>
        <div className="pt-2 border-t">
          <div className="text-muted-foreground text-[10px] break-all">
            {screenInfo.userAgent.substring(0, 80)}...
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

