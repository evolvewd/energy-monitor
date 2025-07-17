"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Home,
  Activity,
  Settings,
  FileText,
  Users,
  Menu,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  currentTime?: string | Date;
  healthPercentage?: number;
  variant?: "compact" | "full-header";
  className?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
    description: "Panoramica generale del sistema",
  },
  {
    href: "/realtime",
    label: "Real-time",
    icon: Activity,
    description: "Dati in tempo reale",
    badge: "LIVE",
  },
  {
    href: "/settings",
    label: "Impostazioni",
    icon: Settings,
    description: "Configurazione sistema",
  },
  {
    href: "/docs",
    label: "Istruzioni",
    icon: FileText,
    description: "Documentazione e guide",
  },
  {
    href: "/about",
    label: "Credits",
    icon: Users,
    description: "Chi ha realizzato il sistema",
  },
];

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  subtitle,
  currentTime,
  healthPercentage = 0,
  variant = "full-header",
  className = "",
}) => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthBadgeVariant = (percentage: number) => {
    if (percentage >= 90) return "default";
    if (percentage >= 70) return "secondary";
    return "destructive";
  };

  return (
    <header className={cn("bg-card border-b", className)}>
      <div className="container mx-auto px-6">
        {variant === "full-header" ? (
          <>
            {/* Top bar con navigazione */}
            <div className="flex items-center justify-between py-4">
              {/* Logo e brand */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 bg-primary text-primary-foreground rounded-lg">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
                    Energy Monitor
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Sistema di Monitoraggio Energetico
                  </p>
                </div>
              </div>

              {/* Navigation Desktop */}
              <div className="hidden md:flex">
                <NavigationMenu>
                  <NavigationMenuList>
                    {navigationItems.map((item) => (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink
                          href={item.href}
                          className={cn(
                            navigationMenuTriggerStyle(),
                            "flex items-center space-x-2",
                            pathname === item.href &&
                              "bg-accent text-accent-foreground"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs h-4">
                              {item.badge}
                            </Badge>
                          )}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              {/* Menu Mobile */}
              <div className="md:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {navigationItems.map((item, index) => (
                      <div key={item.href}>
                        <DropdownMenuItem asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center space-x-2 w-full",
                              pathname === item.href && "bg-accent"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span>{item.label}</span>
                                {item.badge && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs h-4"
                                  >
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        {index < navigationItems.length - 1 && (
                          <DropdownMenuSeparator />
                        )}
                      </div>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* System Health & Time */}
              <div className="hidden lg:flex items-center space-x-4">
                {currentTime && (
                  <div className="text-sm text-muted-foreground font-mono">
                    {typeof currentTime === "string"
                      ? currentTime
                      : new Date(currentTime).toLocaleTimeString()}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Stato:</span>
                  <Badge variant={getHealthBadgeVariant(healthPercentage)}>
                    {healthPercentage}%
                  </Badge>
                </div>
              </div>
            </div>

            {/* Title section */}
            <div className="pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {subtitle && (
                    <p className="text-muted-foreground mt-1">{subtitle}</p>
                  )}
                </div>

                {/* Mobile health indicator */}
                <div className="lg:hidden flex items-center space-x-2">
                  <Badge variant={getHealthBadgeVariant(healthPercentage)}>
                    Sistema {healthPercentage}%
                  </Badge>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Compact variant */
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {currentTime && (
                <span className="text-sm text-muted-foreground font-mono">
                  {typeof currentTime === "string"
                    ? currentTime
                    : new Date(currentTime).toLocaleTimeString()}
                </span>
              )}
              <Badge variant={getHealthBadgeVariant(healthPercentage)}>
                {healthPercentage}%
              </Badge>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
