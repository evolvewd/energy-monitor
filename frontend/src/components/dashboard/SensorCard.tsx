"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";

interface SensorData {
  time: string;
  timestamp: number;
  power: number;
}

type TimeRange = "today" | "yesterday" | "last_week" | "last_month" | "previous_month";

interface SensorCardProps {
  sensorName: string;
  modbusAddress: number;
  model: string;
  alloggioId: string;
  color?: string; // Colore personalizzabile (es: "#3b82f6" per consumo, "#10b981" per produzione)
  timeRange?: TimeRange; // Periodo di visualizzazione
}

export const SensorCard: React.FC<SensorCardProps> = ({
  sensorName,
  modbusAddress,
  model,
  alloggioId,
  color = "#3b82f6", // Default blu per consumo
  timeRange = "today",
}) => {
  const [data, setData] = useState<SensorData[]>([]);
  const [currentPower, setCurrentPower] = useState<number>(0);
  const [currentVoltage, setCurrentVoltage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch dati aggregati per il grafico
        const response = await fetch(
          `/api/influx/sensor-power?modbus_address=${modbusAddress}&model=${model}&time_range=${timeRange}`
        );
        
        if (response.ok) {
          const result = await response.json();
          if (result.status === "success" && result.data) {
            // Estrai i dati di potenza aggregati
            // Formato tempo in base al periodo (ora o giorno)
            const isDaily = timeRange === "last_week" || timeRange === "last_month" || timeRange === "previous_month";
            const isHourly = timeRange === "today" || timeRange === "yesterday";

            let powerData: SensorData[] = [];

            if (isHourly) {
              // Per "oggi" e "ieri": crea array completo di 24 ore (00:00 - 23:00)
              const now = new Date();
              const targetDay = new Date(now);
              if (timeRange === "yesterday") {
                targetDay.setDate(targetDay.getDate() - 1);
              }
              targetDay.setHours(0, 0, 0, 0);

              // Crea mappa dei dati ricevuti usando data+ora come chiave
              const dataMap = new Map<string, number>();
              result.data.forEach((item: any) => {
                const date = new Date(item._time);
                // Chiave: YYYY-MM-DD-HH
                const dateKey = date.toISOString().split('T')[0];
                const hourKey = date.getHours().toString().padStart(2, "0");
                const key = `${dateKey}-${hourKey}`;
                dataMap.set(key, item.p_active || 0);
              });

              // Crea array di 24 ore
              for (let hour = 0; hour < 24; hour++) {
                const hourDate = new Date(targetDay);
                hourDate.setHours(hour, 0, 0, 0);
                const dateKey = hourDate.toISOString().split('T')[0];
                const hourKey = hour.toString().padStart(2, "0");
                const key = `${dateKey}-${hourKey}`;
                const power = dataMap.get(key) || 0;

                powerData.push({
                  time: `${hourKey}:00`,
                  timestamp: hourDate.getTime(),
                  power: power,
                });
              }
            } else if (isDaily) {
              // Per settimana/mesi: crea array completo di giorni anche se mancano dati
              const now = new Date();
              let startDate: Date;
              let numDays: number;

              if (timeRange === "last_week") {
                // Questa settimana: tutti i 7 giorni (da lunedì a domenica)
                const currentDay = now.getDay(); // 0 = domenica, 1 = lunedì, ..., 6 = sabato
                // Calcola il lunedì della settimana corrente
                const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Se domenica, torna a lunedì scorso
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - daysFromMonday); // Vai al lunedì
                startDate.setHours(0, 0, 0, 0);
                numDays = 7; // Tutti i 7 giorni
              } else if (timeRange === "last_month") {
                // Questo mese: tutti i giorni del mese corrente
                startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primo giorno del mese
                startDate.setHours(0, 0, 0, 0);
                // Calcola quanti giorni ha il mese corrente
                const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                numDays = lastDayOfMonth.getDate(); // Tutti i giorni del mese (28-31)
              } else if (timeRange === "previous_month") {
                // Mese passato: tutti i giorni del mese scorso
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                startDate = new Date(lastMonth);
                startDate.setHours(0, 0, 0, 0);
                // Calcola quanti giorni ha il mese scorso
                const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                numDays = lastDayOfLastMonth.getDate(); // Giorni del mese scorso (28-31)
              } else {
                // Fallback
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 6);
                startDate.setHours(0, 0, 0, 0);
                numDays = 7;
              }

              // Crea mappa dei dati ricevuti usando data come chiave (YYYY-MM-DD)
              const dataMap = new Map<string, number>();
              result.data.forEach((item: any) => {
                const date = new Date(item._time);
                const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
                dataMap.set(dateKey, item.p_active || 0);
              });

              // Crea array completo di giorni
              for (let day = 0; day < numDays; day++) {
                const dayDate = new Date(startDate);
                dayDate.setDate(startDate.getDate() + day);

                const dateKey = dayDate.toISOString().split('T')[0];
                const power = dataMap.get(dateKey) || 0;

                // Formato giorno: "DD/MM"
                const timeStr = dayDate.toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                });

                powerData.push({
                  time: timeStr,
                  timestamp: dayDate.getTime(),
                  power: power,
                });
              }
            } else {
              // Fallback per altri casi
              powerData = result.data
                .map((item: any) => {
                  const date = new Date(item._time);
                  const timeStr = date.toLocaleTimeString("it-IT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return {
                    time: timeStr,
                    timestamp: date.getTime(),
                    power: item.p_active || 0,
                  };
                })
                .sort((a, b) => a.timestamp - b.timestamp);
            }

            setData(powerData);
            
            // Fallback: usa ultimo valore aggregato se realtime non disponibile o è 0
            if (powerData.length > 0 && currentPower === 0) {
              setCurrentPower(powerData[powerData.length - 1].power);
            }

            setIsLoading(false);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching sensor data:", error);
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Polling separato per valori istantanei (tensione e potenza) - più frequente
    const fetchRealtimeValues = async () => {
      try {
        const realtimeResponse = await fetch(
          `/api/influx/sensor-realtime?modbus_address=${modbusAddress}&model=${model}`
        );
        if (realtimeResponse.ok) {
          const realtimeResult = await realtimeResponse.json();
          if (realtimeResult.status === "success" && realtimeResult.data) {
            if (realtimeResult.data.p_active !== undefined && realtimeResult.data.p_active !== 0) {
              setCurrentPower(realtimeResult.data.p_active);
            }
            if (realtimeResult.data.v_rms !== undefined && realtimeResult.data.v_rms !== 0) {
              setCurrentVoltage(realtimeResult.data.v_rms);
            }
          }
        }
      } catch (error) {
        console.warn("Error fetching realtime values:", error);
      }
    };
    
    // Polling per valori istantanei ogni 10 secondi
    fetchRealtimeValues();
    const realtimeInterval = setInterval(fetchRealtimeValues, 10 * 1000);
    
    // Aggiorna dati aggregati in base al periodo: più frequente per "oggi", meno per periodi storici
    const getPollingInterval = () => {
      switch (timeRange) {
        case "today":
          return 5 * 60 * 1000; // 5 minuti per oggi
        case "yesterday":
          return 10 * 60 * 1000; // 10 minuti per ieri
        case "last_week":
          return 15 * 60 * 1000; // 15 minuti per ultima settimana
        case "last_month":
        case "previous_month":
          return 30 * 60 * 1000; // 30 minuti per mesi
        default:
          return 5 * 60 * 1000;
      }
    };
    const interval = setInterval(fetchData, getPollingInterval());

    return () => {
      clearInterval(interval);
      clearInterval(realtimeInterval);
    };
  }, [modbusAddress, model, timeRange]);

  // Prepara i dati per Recharts
  // Normalizza i dati per evitare sfarfallio: usa timestamp come chiave stabile
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // I dati arrivano già formattati correttamente dal fetchData
    // (ora per "today"/"yesterday"/"last_week", giorno per "last_month"/"previous_month")
    return data.map((d) => ({
      time: d.time, // Già formattato correttamente
      power: d.power || 0,
      timestamp: d.timestamp,
    }));
  }, [data]);

  // Configurazione chart per shadcn/ui
  const chartConfig = useMemo<ChartConfig>(
    () => ({
      power: {
        label: "Potenza",
        color: color,
      },
    }),
    [color]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold">{sensorName}</CardTitle>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground">Tensione:</span>
              <span className="font-semibold">
                {isLoading ? "--" : currentVoltage.toFixed(1)}
              </span>
              <span className="text-muted-foreground ml-0.5">V</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-muted-foreground">Potenza:</span>
              <span className="font-semibold">
                {isLoading ? "--" : currentPower.toFixed(0)}
              </span>
              <span className="text-muted-foreground ml-0.5">W</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-2 flex flex-col h-full">

        {/* Grafico Bar Chart - riempie lo spazio rimanente */}
        <div className="flex-1 min-h-0">
          {!isLoading && chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <BarChart
                data={chartData}
                margin={{
                  left: 0,
                  right: 0,
                  top: 8,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={30}
                  interval={
                    timeRange === "last_month" || timeRange === "previous_month"
                      ? 4 // Per mesi: mostra ogni 5 giorni (indice 0, 5, 10, 15, 20, 25, 30)
                      : timeRange === "last_week"
                        ? 0 // Per settimana: mostra tutti i 7 giorni
                        : timeRange === "today" || timeRange === "yesterday"
                          ? 2 // Per ore: mostra ogni 3 ore (00, 03, 06, 09, 12, 15, 18, 21)
                          : Math.floor(chartData.length / 6) // Default
                  }
                  tickLine={false}
                  axisLine={true}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                  width={35}
                  tickFormatter={(value) => value.toFixed(0)}
                  tickLine={false}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => [
                        `${Number(value).toFixed(1).replace(/\.0$/, "")} W`,
                        "Potenza",
                      ]}
                    />
                  }
                />
                <Bar
                  dataKey="power"
                  fill={color}
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              {isLoading ? "Caricamento..." : "Nessun dato"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

