// ====================
// COMPONENTE ERROR DISPLAY
// ====================

// components/realtime/ErrorDisplay.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  error: string;
}

export const ErrorDisplay = ({ error }: ErrorDisplayProps) => {
  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardContent className="pt-6">
        <div className="flex items-center text-red-500 text-sm">
          <AlertTriangle className="w-4 h-4 mr-2" />
          Errore connessione: {error}
        </div>
      </CardContent>
    </Card>
  );
};
