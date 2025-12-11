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
        "fixed top-2 sm:top-4 left-16 sm:left-28 md:left-32 right-2 sm:right-4 z-30 flex items-center justify-between px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 rounded-lg sm:rounded-xl",
        className
      )}
    >
      {/* Orologio e Data - Sinistra */}
      <div className="flex flex-col">
        <div
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold"
          style={{ color: "#fefefe" }}
          suppressHydrationWarning
        >
          {mounted ? currentTime : "--:--:--"}
        </div>
        <div
          className="text-xs sm:text-sm md:text-base"
          style={{ color: "#818181" }}
          suppressHydrationWarning
        >
          {mounted ? currentDate : ""}
        </div>
      </div>

      {/* Notifiche - Destra */}
      <button
        className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border hover:bg-[#3a3a3a] transition-colors"
        style={{ color: "#fefefe", borderColor: "#3a3a3a", backgroundColor: "#323232" }}
      >
        <Bell className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" fill="#fefefe" />
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

