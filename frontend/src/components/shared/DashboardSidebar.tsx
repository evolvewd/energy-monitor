"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Activity,
  Settings,
  FileText,
  Users,
  Zap,
  Circle,
  Wifi,
  Server,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

interface DashboardSidebarProps {
  className?: string;
  healthPercentage?: number;
  currentTime?: string | Date | null;
  systemStatus?: "online" | "offline" | "maintenance";
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
    description: "Panoramica generale",
  },
  {
    href: "/realtime",
    label: "Real-time",
    icon: Activity,
    description: "Dati in tempo reale",
    badge: "LIVE",
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: Activity,
    description: "Analisi dati",
  },
  {
    href: "/settings",
    label: "Impostazioni",
    icon: Settings,
    description: "Configurazione sistema",
  },
  {
    href: "/docs",
    label: "Documentazione",
    icon: FileText,
    description: "Guide e istruzioni",
  },
  {
    href: "/about",
    label: "Credits",
    icon: Users,
    description: "Informazioni team",
  },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className,
  healthPercentage = 85,
  currentTime,
  systemStatus = "online",
}) => {
  const pathname = usePathname();

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadgeVariant = (
    percentage: number
  ): "default" | "secondary" | "destructive" => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    return "destructive";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "text-green-500";
      case "offline":
        return "text-red-500";
      case "maintenance":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTime = (time?: string | Date | null) => {
    if (!time) return new Date().toLocaleTimeString("it-IT");
    if (typeof time === "string") return time;
    return time.toLocaleTimeString("it-IT");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-64 bg-card border-r border-border",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header della sidebar */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Energy Monitor
              </h1>
              <p className="text-xs text-muted-foreground">
                Sistema Monitoraggio
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Menu Principale
            </h3>
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 animate-pulse"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Status section al fondo */}
        <div className="p-4 border-t border-border space-y-4">
          {/* System Health */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                System Health
              </span>
              <Badge
                variant={getHealthBadgeVariant(healthPercentage)}
                className="text-[10px] h-4"
              >
                {healthPercentage}%
              </Badge>
            </div>
            <Progress value={healthPercentage} className="h-1.5" />
          </div>

          <Separator />

          {/* System Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Circle
                  className={cn(
                    "h-2 w-2 fill-current",
                    getStatusColor(systemStatus)
                  )}
                />
                <span className="text-xs text-muted-foreground">Status</span>
              </div>
              <span
                className={cn(
                  "text-xs font-medium capitalize",
                  getStatusColor(systemStatus)
                )}
              >
                {systemStatus}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Server className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Server</span>
              </div>
              <span className="text-xs text-foreground">Online</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wifi className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Network</span>
              </div>
              <div className="flex items-center space-x-1">
                <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
                <span className="text-xs text-foreground">Connected</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Time</span>
              </div>
              <span className="text-xs text-foreground font-mono">
                {formatTime(currentTime)}
              </span>
            </div>
          </div>

          {/* Company info */}
          <div className="pt-2 border-t border-border">
            <p className="text-[10px] text-muted-foreground text-center">
              Energy Monitor v2.0
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
