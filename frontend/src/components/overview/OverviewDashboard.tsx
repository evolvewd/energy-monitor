"use client";

import { useEffect, useState } from "react";
import { Gauge, Zap, TrendingUp, MapPin, Route, Battery } from "lucide-react";
import { Card } from "@/components/ui/card";

interface OverviewData {
  // Performance
  maxPower: number;
  currentPower: number;
  
  // Energy
  savedEnergy: number; // kWh saved
  consumption: number; // kW current consumption
  
  // Range
  cityRange: number; // km
  highwayRange: number; // km
  
  // Current Trip
  tripDistance: number; // km
  averageSpeed: number; // km/h
  
  // Main Gauge
  mainValue: number; // Potenza attiva principale
  mainUnit: string;
}

export function OverviewDashboard() {
  const [data, setData] = useState<OverviewData>({
    maxPower: 0,
    currentPower: 0,
    savedEnergy: 0,
    consumption: 0,
    cityRange: 0,
    highwayRange: 0,
    tripDistance: 0,
    averageSpeed: 0,
    mainValue: 0,
    mainUnit: "kW",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/influx/opta-realtime");
        if (!response.ok) throw new Error("Failed to fetch");
        
        const result = await response.json();
        if (result.success && result.data) {
          // Prendi il primo alloggio disponibile o aggrega tutti
          const alloggi = result.data.alloggi || [];
          if (alloggi.length > 0) {
            const firstAlloggio = alloggi[0];
            const latest = firstAlloggio.latest || {};
            const timeSeries = firstAlloggio.timeSeries || {};
            
            // Calcola valori aggregati
            const currentPower = latest.p_active || 0;
            const maxPower = Math.max(...(timeSeries.p_active || [0]).filter(v => v != null)) || 0;
            
            // Calcola consumo totale (somma di tutti gli alloggi)
            const totalConsumption = alloggi.reduce((sum: number, a: any) => {
              return sum + (a.latest?.p_active || 0);
            }, 0);
            
            // Calcola energia risparmiata (stima basata su produzione FV)
            const savedEnergy = Math.max(0, totalConsumption * 0.3); // Stima 30% da FV
            
            // Range stimato (basato su consumo)
            const efficiency = 0.15; // kWh/km
            const batteryCapacity = 50; // kWh (esempio)
            const cityRange = batteryCapacity / (efficiency * 1.2) * 1000; // km
            const highwayRange = batteryCapacity / (efficiency * 0.8) * 1000; // km
            
            // Trip data (esempio)
            const tripDistance = 0; // Da implementare con storage
            const avgSpeed = 0; // Da implementare
            
            setData({
              maxPower: Math.round(maxPower),
              currentPower: Math.round(currentPower),
              savedEnergy: Math.round(savedEnergy * 10) / 10,
              consumption: Math.round(totalConsumption * 10) / 10,
              cityRange: Math.round(cityRange),
              highwayRange: Math.round(highwayRange),
              tripDistance: Math.round(tripDistance),
              averageSpeed: Math.round(avgSpeed),
              mainValue: Math.round(currentPower),
              mainUnit: "kW",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Aggiorna ogni 5 secondi
    
    return () => clearInterval(interval);
  }, []);

  // Calcola percentuale per il gauge (0-100%)
  const gaugePercentage = data.maxPower > 0 
    ? Math.min(100, (data.mainValue / data.maxPower) * 100)
    : 0;

  // Colore del gauge basato sulla percentuale
  const getGaugeColor = (percentage: number) => {
    if (percentage < 30) return "text-green-500";
    if (percentage < 70) return "text-blue-500";
    return "text-orange-500";
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 pb-20 sm:pb-24">
      {/* Main Gauge - Centrale */}
      <div className="relative mb-8 sm:mb-12">
        <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
          {/* Gauge Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            {/* Background Circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            {/* Progress Circle */}
            <circle
              cx="100"
              cy="100"
              r="85"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={getGaugeColor(gaugePercentage)}
              strokeDasharray={`${2 * Math.PI * 85}`}
              strokeDashoffset={`${2 * Math.PI * 85 * (1 - gaugePercentage / 100)}`}
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          
          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground">
              {data.mainValue}
            </div>
            <div className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1">
              {data.mainUnit}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-2">
              Potenza Attiva
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="w-full max-w-4xl grid grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel - Performance & Energy */}
        <div className="space-y-4 sm:space-y-6">
          {/* Performance */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Performance
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {data.maxPower}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Max</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {data.currentPower}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Current</div>
              </div>
            </div>
          </Card>

          {/* Energy */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Energy
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {data.savedEnergy}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Saved kWh</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {data.consumption}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Cons, kW</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Panel - Range & Trip */}
        <div className="space-y-4 sm:space-y-6">
          {/* Range */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Range, km
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {data.cityRange}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">City</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {data.highwayRange}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Highway</div>
              </div>
            </div>
          </Card>

          {/* Current Trip */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Route className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Current trip
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {data.tripDistance}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Distance, km</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-semibold text-foreground">
                  {data.averageSpeed}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Av.spd, km/h</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="w-full max-w-4xl mt-6 sm:mt-8 flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Battery className="h-4 w-4" />
          <span>Odo {data.tripDistance} km</span>
        </div>
        <div className="text-muted-foreground/70">
          Last update: {new Date().toLocaleTimeString("it-IT")}
        </div>
      </div>
    </div>
  );
}

