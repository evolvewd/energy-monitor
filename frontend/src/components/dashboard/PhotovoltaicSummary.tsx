"use client";

import { useEffect, useState } from "react";
import { Sun, Zap, Battery, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PhotovoltaicData {
  currentPower?: number;
  dailyProduction?: number;
  totalProduction?: number;
  efficiency?: number;
  status?: string;
}

interface PhotovoltaicSummaryProps {
  className?: string;
}

export function PhotovoltaicSummary({ className }: PhotovoltaicSummaryProps) {
  const [data, setData] = useState<PhotovoltaicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // TODO: Implementare API per dati fotovoltaico
        // Per ora usiamo dati mock
        setData({
          currentPower: 8500, // W
          dailyProduction: 45.2, // kWh
          totalProduction: 12500, // kWh
          efficiency: 87, // %
          status: "Attivo",
        });
      } catch (error) {
        console.error("Error fetching photovoltaic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={`flex flex-col w-full sm:w-80 md:w-[28rem] space-y-2 sm:space-y-4 md:space-y-6 flex-shrink-0 h-full ${className}`}>
        <Card variant="tesla" className="p-4 sm:p-6">
          <div className="text-center py-8" style={{ color: "#818181" }}>
            Caricamento dati...
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`flex flex-col flex-shrink-0 h-full ${className}`} style={{ flex: '3 1 0', minWidth: 0 }}>
      <Card variant="tesla" className="p-4 sm:p-6 h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-3 sm:mb-4">
          <h3 className="text-xl sm:text-2xl font-semibold mb-1" style={{ color: "#fefefe" }}>
            Stato Fotovoltaico
          </h3>
          <p className="text-sm sm:text-base" style={{ color: "#818181" }}>
            Produzione in tempo reale
          </p>
        </div>

        {/* Potenza Attuale */}
        <div className="mb-4 sm:mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: "#fbbf24" }} />
            <div className="text-sm sm:text-base" style={{ color: "#818181" }}>Potenza Attuale</div>
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl font-bold" style={{ color: "#fefefe" }}>
            {data?.currentPower ? `${(data.currentPower / 1000).toFixed(1)}` : "--"} kW
          </div>
        </div>

        {/* Statistiche - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#fbbf24" }} />
              <div className="text-sm" style={{ color: "#818181" }}>Oggi</div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
              {data?.dailyProduction ? `${data.dailyProduction.toFixed(1)}` : "--"} kWh
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3be4b4" }} />
              <div className="text-sm" style={{ color: "#818181" }}>Totale</div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
              {data?.totalProduction ? `${data.totalProduction.toFixed(0)}` : "--"} kWh
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Battery className="h-4 w-4 sm:h-5 sm:w-5" style={{ color: "#3be4b4" }} />
              <div className="text-sm" style={{ color: "#818181" }}>Efficienza</div>
            </div>
            <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#fefefe" }}>
              {data?.efficiency ? `${data.efficiency}%` : "--"}
            </div>
          </div>
          <div>
            <div className="text-sm mb-1" style={{ color: "#818181" }}>Stato</div>
            <div className="text-xl sm:text-2xl font-semibold" style={{ color: "#3be4b4" }}>
              {data?.status || "--"}
            </div>
          </div>
        </div>

        {/* Barra di progresso produzione giornaliera (opzionale) */}
        <div className="flex-1 flex flex-col justify-end">
          <div className="text-sm mb-1" style={{ color: "#818181" }}>
            Progresso giornaliero
          </div>
          <div className="w-full h-2 bg-[#252525] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3be4b4] transition-all duration-500"
              style={{
                width: data?.dailyProduction ? `${Math.min(100, (data.dailyProduction / 50) * 100)}%` : "0%",
              }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

