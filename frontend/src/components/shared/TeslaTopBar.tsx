"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeslaTopBarProps {
  notifications?: number;
  className?: string;
}

export const TeslaTopBar = ({ notifications = 0, className }: TeslaTopBarProps) => {
  const [currentTime, setCurrentTime] = useState<string>("--:--:--");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-20 right-0 z-30 flex items-center justify-between px-6 py-4 border-b",
        className
      )}
      style={{ backgroundColor: "#232323", borderColor: "#3a3a3a" }}
    >
      {/* Orologio e Data - Sinistra */}
      <div className="flex flex-col">
        <div 
          className="text-2xl font-semibold" 
          style={{ color: "#fefefe" }}
          suppressHydrationWarning
        >
          {mounted ? currentTime : "--:--:--"}
        </div>
        <div 
          className="text-sm" 
          style={{ color: "#818181" }}
          suppressHydrationWarning
        >
          {mounted ? currentDate : ""}
        </div>
      </div>

      {/* Notifiche - Destra */}
      <button
        className="relative p-2 rounded-lg hover:bg-[#323232] transition-colors"
        style={{ color: "#818181" }}
      >
        <Bell className="h-6 w-6" />
        {notifications > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 text-[10px] flex items-center justify-center p-0"
          >
            {notifications > 99 ? "99+" : notifications}
          </Badge>
        )}
      </button>
    </header>
  );
};

