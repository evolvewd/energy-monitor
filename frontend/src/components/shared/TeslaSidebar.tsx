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
      className="fixed left-0 top-0 z-40 h-screen w-20 flex flex-col items-center py-6 gap-6"
      style={{ backgroundColor: "#252525" }}
    >
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "p-3 rounded-lg transition-all duration-200",
              isActive
                ? "bg-[#3be4b4]"
                : "hover:bg-[#323232]"
            )}
            style={{
              color: isActive ? "#232323" : "#818181",
            }}
          >
            <Icon className="h-6 w-6" />
          </Link>
        );
      })}
    </aside>
  );
};

