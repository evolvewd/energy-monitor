"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Sun,
  Battery,
  Building2,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigationItems: NavItem[] = [
  {
    href: "/",
    label: "Home",
    icon: Home,
  },
  {
    href: "/produzione",
    label: "Produzione",
    icon: Sun,
  },
  {
    href: "/accumulo",
    label: "Accumulo",
    icon: Battery,
  },
  {
    href: "/alloggi",
    label: "Alloggi",
    icon: Building2,
  },
  {
    href: "/notifiche",
    label: "Notifiche",
    icon: Bell,
  },
];

export const TeslaSidebar = () => {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-2 sm:left-4 top-2 sm:top-4 bottom-2 sm:bottom-4 z-40 w-16 sm:w-20 md:w-24 flex flex-col items-center py-3 sm:py-4 md:py-6 gap-3 sm:gap-4 md:gap-6 rounded-xl sm:rounded-2xl border"
      style={{ backgroundColor: "#323232", borderColor: "#3a3a3a" }}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "p-2 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl transition-all duration-200",
              isActive
                ? "bg-[#3be4b4]"
                : "hover:bg-[#252525]"
            )}
            style={{
              color: isActive ? "#232323" : "#818181",
            }}
          >
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7" />
          </Link>
        );
      })}
    </aside>
  );
};

