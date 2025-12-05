"use client";

import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { TeslaStyleDashboard } from "@/components/test/TeslaStyleDashboard";

export default function TestPage() {
  return (
    <DashboardLayout pageTitle="">
      <TeslaStyleDashboard />
    </DashboardLayout>
  );
}

