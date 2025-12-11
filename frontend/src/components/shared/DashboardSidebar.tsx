"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Sun,
  Battery,
  Building2,
  Bell,
  Circle,
  Wifi,
  Server,
  Clock,
  Database,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Menu,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

interface ConnectionStatus {
  influxdb: "online" | "offline" | "warning" | "testing";
  mqtt: "online" | "offline" | "warning" | "testing";
  nodered: "online" | "offline" | "warning" | "testing";
}

interface DashboardSidebarProps {
  className?: string;
  healthPercentage?: number;
  currentTime?: string | Date | null;
  systemStatus?: "online" | "offline" | "maintenance";
  connectionStatus?: ConnectionStatus;
  isTestingConnections?: boolean;
  onTestConnections?: () => void;
  onHoverChange?: (expanded: boolean) => void;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    description: "Dashboard principale",
  },
  {
    href: "/produzione",
    label: "Produzione",
    icon: Sun,
    description: "Impianto fotovoltaico",
  },
  {
    href: "/accumulo",
    label: "Accumulo",
    icon: Battery,
    description: "Sistema di accumulo",
  },
  {
    href: "/alloggi",
    label: "Alloggi",
    icon: Building2,
    description: "Monitoraggio alloggi",
  },
  {
    href: "/notifiche",
    label: "Notifiche",
    icon: Bell,
    description: "Avvisi e notifiche",
  },
];

const serviceConfig = {
  influxdb: {
    icon: Database,
    label: "InfluxDB",
    description: "Database time-series",
  },
  mqtt: { icon: Wifi, label: "MQTT", description: "Messaggi IoT" },
  nodered: {
    icon: Activity,
    label: "Node-RED",
    description: "Flow automation",
  },
};

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  className,
  healthPercentage = 85,
  currentTime,
  systemStatus = "online",
  connectionStatus,
  isTestingConnections = false,
  onTestConnections,
  onHoverChange,
  isExpanded: controlledExpanded,
  onToggle,
}) => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [internalExpanded, setInternalExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Usa controlled state se fornito, altrimenti internal state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      const newState = !internalExpanded;
      setInternalExpanded(newState);
      onHoverChange?.(newState);
    }
  };

  const getHealthBadgeVariant = (percentage: number) => {
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
      case "warning":
        return "text-yellow-500";
      case "testing":
        return "text-blue-500";
      case "maintenance":
        return "text-yellow-500";
      default:
        return "text-gray-500";
    }
  };

  const formatTime = (time?: string | Date | null) => {
    if (!mounted) return "--:--:--";

    if (time) {
      if (typeof time === "string") return time;
      return time.toLocaleTimeString("it-IT", { timeZone: "Europe/Rome" });
    }

    return new Date().toLocaleTimeString("it-IT", { timeZone: "Europe/Rome" });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out overflow-hidden",
        isExpanded ? "w-64" : "w-16",
        className
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header della sidebar con pulsante toggle */}
        <div className={cn("border-b border-border transition-all duration-300", isExpanded ? "p-6" : "p-4")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg flex-shrink-0">
                <Zap className="h-5 w-5" />
              </div>
              {isExpanded && (
                <div className="overflow-hidden animate-in fade-in duration-300 flex-1 min-w-0">
                  <h1 className="text-lg font-bold text-foreground whitespace-nowrap truncate">
                    Energy Monitor
                  </h1>
                  <p className="text-xs text-muted-foreground whitespace-nowrap truncate">
                    Sistema Monitoraggio
                  </p>
                </div>
              )}
            </div>
            {/* Pulsante Toggle */}
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0 flex-shrink-0",
                !isExpanded && "mx-auto"
              )}
              onClick={handleToggle}
              aria-label={isExpanded ? "Collassa sidebar" : "Espandi sidebar"}
            >
              {isExpanded ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-2">
          <div className="space-y-1">
            {isExpanded && (
              <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 animate-in fade-in duration-300">
                Menu Principale
              </h3>
            )}
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-md transition-all duration-200",
                    "hover:bg-accent hover:text-accent-foreground",
                    isActive
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "text-muted-foreground",
                    isExpanded ? "px-3 py-2" : "px-2 py-2 justify-center"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon
                      className={cn(
                        "h-4 w-4 transition-colors flex-shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-accent-foreground"
                      )}
                    />
                    {isExpanded && (
                      <span className="whitespace-nowrap animate-in fade-in duration-300">{item.label}</span>
                    )}
                  </div>
                  {isExpanded && item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] h-4 px-1.5 animate-pulse animate-in fade-in duration-300"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );

              if (!isExpanded) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {linkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </div>
        </nav>

        {/* Status section al fondo */}
        <div className={cn("border-t border-border space-y-4 transition-all duration-300", isExpanded ? "p-4" : "p-2")}>
          {/* System Health */}
          {isExpanded && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
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
          )}
          {!isExpanded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center space-y-2">
                  <Progress value={healthPercentage} className="h-1.5 w-full" />
                  <Badge
                    variant={getHealthBadgeVariant(healthPercentage)}
                    className="text-[10px] h-4"
                  >
                    {healthPercentage}%
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                <span>System Health: {healthPercentage}%</span>
              </TooltipContent>
            </Tooltip>
          )}

          {isExpanded && <Separator />}

          {/* Services Status */}
          {connectionStatus && (
            <>
              {isExpanded && (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      Services
                    </span>
                    {onTestConnections && (
                      <Button
                        onClick={onTestConnections}
                        disabled={isTestingConnections}
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                      >
                        <RefreshCw
                          className={cn(
                            "h-3 w-3",
                            isTestingConnections && "animate-spin"
                          )}
                        />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {Object.entries(connectionStatus).map(([service, status]) => {
                      const config =
                        serviceConfig[service as keyof typeof serviceConfig];
                      if (!config) return null;

                      const ServiceIcon = config.icon;
                      return (
                        <div
                          key={service}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <ServiceIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {config.label}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Circle
                              className={cn(
                                "h-1.5 w-1.5 fill-current flex-shrink-0",
                                getStatusColor(status),
                                status === "testing" && "animate-pulse"
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs capitalize whitespace-nowrap",
                                getStatusColor(status)
                              )}
                            >
                              {status === "testing" ? "..." : status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {!isExpanded && (
                <div className="space-y-2">
                  {Object.entries(connectionStatus).map(([service, status]) => {
                    const config =
                      serviceConfig[service as keyof typeof serviceConfig];
                    if (!config) return null;

                    const ServiceIcon = config.icon;
                    return (
                      <Tooltip key={service}>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            <ServiceIcon className={cn(
                              "h-4 w-4",
                              getStatusColor(status)
                            )} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="ml-2">
                          <div className="flex items-center gap-2">
                            <span>{config.label}</span>
                            <Circle
                              className={cn(
                                "h-1.5 w-1.5 fill-current",
                                getStatusColor(status)
                              )}
                            />
                            <span className="capitalize">{status}</span>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
              {isExpanded && <Separator />}
            </>
          )}

          {/* System Status */}
          {isExpanded ? (
            <div className="space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Circle
                    className={cn(
                      "h-2 w-2 fill-current flex-shrink-0",
                      getStatusColor(systemStatus)
                    )}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Status</span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium capitalize whitespace-nowrap",
                    getStatusColor(systemStatus)
                  )}
                >
                  {systemStatus}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Server</span>
                </div>
                <span className="text-xs text-foreground whitespace-nowrap">Online</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Wifi className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Network</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500 flex-shrink-0" />
                  <span className="text-xs text-foreground whitespace-nowrap">Connected</span>
                </div>
              </div>

              {/* Time Display */}
              {mounted && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Time</span>
                  </div>
                  <span className="text-xs text-foreground font-mono whitespace-nowrap">
                    {formatTime(currentTime)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 flex flex-col items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center justify-center">
                    <Circle
                      className={cn(
                        "h-2 w-2 fill-current",
                        getStatusColor(systemStatus)
                      )}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="ml-2">
                  <span>Status: {systemStatus}</span>
                </TooltipContent>
              </Tooltip>
              {mounted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-xs font-mono text-center">
                      {formatTime(currentTime).split(' ')[0]}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="ml-2">
                    <span>{formatTime(currentTime)}</span>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {/* Company info */}
          {isExpanded && (
            <div className="pt-2 border-t border-border animate-in fade-in duration-300">
              <p className="text-[10px] text-muted-foreground text-center whitespace-nowrap">
                Energy Monitor v2.0
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
