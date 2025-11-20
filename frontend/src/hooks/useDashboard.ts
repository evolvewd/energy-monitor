// ====================
// HOOK CONDIVISO
// ====================

// hooks/useDashboard.ts
"use client";

import { useState, useEffect } from "react";
import { testAllConnections, type ServiceStatus } from "@/lib/connections";

export const useDashboard = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ServiceStatus>({
    influxdb: "testing",
    mqtt: "testing",
    nodered: "testing",
  });
  const [isTestingConnections, setIsTestingConnections] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Timer per aggiornare l'ora
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Test connessioni all'avvio
  useEffect(() => {
    testConnections();
    // Simula loading iniziale
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  // Funzione per testare tutte le connessioni
  const testConnections = async () => {
    setIsTestingConnections(true);

    try {
      const results = await testAllConnections();
      setConnectionStatus(results);
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus({
        influxdb: "offline",
        mqtt: "offline",
        nodered: "offline",
      });
    } finally {
      setIsTestingConnections(false);
    }
  };

  // Calcola stato generale del sistema
  const systemHealth = Object.values(connectionStatus).filter(
    (status) => status === "online"
  ).length;
  const totalServices = Object.keys(connectionStatus).length;
  const healthPercentage = (systemHealth / totalServices) * 100;

  return {
    currentTime,
    connectionStatus,
    isTestingConnections,
    isLoading,
    systemHealth,
    totalServices,
    healthPercentage,
    testConnections,
  };
};
