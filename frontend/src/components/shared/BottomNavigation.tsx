"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Activity,
  Settings,
  Zap,
  Gauge,
  Car,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: Home,
  },
  {
    href: "/overview",
    label: "Overview",
    icon: Gauge,
  },
  {
    href: "/test",
    label: "Test",
    icon: Car,
  },
  {
    href: "/realtime",
    label: "Dati",
    icon: Activity,
    badge: "LIVE",
  },
  {
    href: "/setup",
    label: "Setup",
    icon: Settings,
  },
];

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-border/50 shadow-2xl safe-area-bottom">
      <div className="w-full">
        <div className="flex items-center justify-around h-16 sm:h-20 px-2 sm:px-4 gap-1 sm:gap-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 flex-1 h-full rounded-xl transition-all duration-300 touch-manipulation",
                  "active:scale-90",
                  isActive
                    ? "text-primary bg-primary/10 dark:bg-primary/20"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon className={cn(
                    "h-6 w-6 sm:h-7 sm:w-7 transition-all duration-300",
                    isActive 
                      ? "text-primary scale-110" 
                      : "text-muted-foreground"
                  )} />
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2 -right-2 h-5 px-1.5 text-[10px] font-semibold animate-pulse bg-primary/20 text-primary border-primary/30"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xs font-semibold transition-all duration-300",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

