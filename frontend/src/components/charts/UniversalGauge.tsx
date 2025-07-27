"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface UniversalGaugeProps {
  // Dati del valore
  value: number;
  label: string;
  unit: string;

  // Configurazione gauge
  min: number;
  max: number;

  // Stile e colore
  color?: string;
  icon?: LucideIcon;

  // Opzionali
  description?: string;
  status?: "normal" | "warning" | "danger";
  trend?: "up" | "down" | "stable";

  // Layout
  className?: string;
}

export function UniversalGauge({
  value,
  label,
  unit,
  min,
  max,
  color = "#2563eb",
  icon: Icon,
  description,
  status = "normal",
  trend,
  className,
}: UniversalGaugeProps) {
  // State per animazione
  const [animatedValue, setAnimatedValue] = useState(min);
  const [isInitialized, setIsInitialized] = useState(false);

  // Effetto per animazione iniziale e aggiornamenti
  useEffect(() => {
    if (!isInitialized) {
      // Animazione iniziale dopo un piccolo delay
      const timer = setTimeout(() => {
        setAnimatedValue(value);
        setIsInitialized(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      // Aggiornamenti successivi
      setAnimatedValue(value);
    }
  }, [value, isInitialized]);

  // Calcola la percentuale del valore animato rispetto al range
  const percentage = Math.min(
    Math.max(((animatedValue - min) / (max - min)) * 100, 0),
    100
  );

  // Angolo per il gauge (da -90° a +90°, totale 180°)
  const angle = (percentage / 100) * 180 - 90;

  // Colori status
  const statusColors = {
    normal: color,
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const currentColor = statusColors[status];

  // SVG per il gauge
  const radius = 50;
  const strokeWidth = 10;
  const center = 65;

  // Calcola il path dell'arco
  const createArcPath = (startAngle: number, endAngle: number) => {
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(" ");
  };

  function polarToCartesian(
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  // Path per il background dell'arco (sempre completo)
  const backgroundPath = createArcPath(-90, 90);

  // Path per il valore corrente (da -90° fino alla posizione attuale)
  const valuePath = createArcPath(-90, angle);

  // Per l'animazione smooth dell'arco, usiamo stroke-dasharray
  const arcLength = Math.PI * radius; // Lunghezza del semicerchio
  const fillLength = (percentage / 100) * arcLength;

  // Icona trend
  const getTrendIcon = () => {
    if (!trend) return null;

    const icons = {
      up: "↗",
      down: "↘",
      stable: "→",
    };

    const colors = {
      up: "text-green-500",
      down: "text-red-500",
      stable: "text-gray-500",
    };

    return <span className={`text-xs ${colors[trend]}`}>{icons[trend]}</span>;
  };

  const formatValue = (val: number) => {
    return val.toFixed(1);
  };

  return (
    <Card
      className={`aspect-square ${className} bg-gradient-to-br from-background to-muted/20 border-border/50`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {Icon && (
                <Icon className="h-4 w-4" style={{ color: currentColor }} />
              )}
              {label}
            </CardTitle>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          {trend && (
            <div className="flex items-center gap-1">{getTrendIcon()}</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col items-center justify-center space-y-4">
        {/* SVG Gauge */}
        <div className="relative">
          <svg
            width="130"
            height="85"
            viewBox="0 0 130 85"
            className="overflow-visible drop-shadow-sm"
          >
            {/* Background arc - sempre completo */}
            <path
              d={backgroundPath}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={0.2}
            />

            {/* Value arc con animazione stroke-dasharray */}
            <path
              d={backgroundPath}
              fill="none"
              stroke={currentColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={`${fillLength} ${arcLength}`}
              strokeDashoffset={0}
              style={{
                transition:
                  "stroke-dasharray 1500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), stroke 300ms ease",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
              }}
            />

            {/* Center dot con gradient */}
            <defs>
              <radialGradient
                id={`centerGradient-${label}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={currentColor} stopOpacity={0.8} />
                <stop
                  offset="100%"
                  stopColor={currentColor}
                  stopOpacity={0.3}
                />
              </radialGradient>
            </defs>
            <circle
              cx={center}
              cy={center}
              r="4"
              fill={`url(#centerGradient-${label})`}
              stroke={currentColor}
              strokeWidth="1"
            />

            {/* Needle con styling migliore */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - (radius - 8)}
              stroke={currentColor}
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transform: `rotate(${angle}deg)`,
                transformOrigin: `${center}px ${center}px`,
                transition:
                  "transform 1500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              }}
            />
          </svg>
        </div>

        {/* Valore principale */}
        <div className="text-center space-y-2">
          <div
            className="text-3xl font-bold transition-all duration-700 ease-out"
            style={{ color: currentColor }}
          >
            {formatValue(animatedValue)}
            <span className="text-lg text-muted-foreground ml-1 font-normal">
              {unit}
            </span>
          </div>

          {/* Range con styling migliore */}
          <div className="text-xs text-muted-foreground/70 font-medium">
            {formatValue(min)} - {formatValue(max)} {unit}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
