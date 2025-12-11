"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { Loader2 } from "lucide-react";

export default function OverviewPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simula caricamento iniziale
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout pageTitle="Overview">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="">
      <OverviewDashboard />
    </DashboardLayout>
  );
}

