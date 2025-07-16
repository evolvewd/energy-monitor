// ====================
// COMPONENTE STATUS INDICATOR
// ====================

// components/shared/StatusIndicator.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { ConnectionStatus } from "@/types/connections";

interface StatusIndicatorProps {
  label: string;
  status: ConnectionStatus;
  description?: string;
}

export const StatusIndicator = ({
  label,
  status,
  description,
}: StatusIndicatorProps) => {
  const statusConfig = {
    online: {
      badge: "bg-green-500/10 text-green-500 border-green-500/20",
      dot: "bg-green-500",
      text: "Online",
    },
    offline: {
      badge: "bg-red-500/10 text-red-500 border-red-500/20",
      dot: "bg-red-500",
      text: "Offline",
    },
    warning: {
      badge: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      dot: "bg-yellow-500",
      text: "Warning",
    },
    testing: {
      badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      dot: "bg-blue-500 animate-pulse",
      text: "Testing...",
    },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      <Badge variant="secondary" className={config.badge}>
        {config.text}
      </Badge>
    </div>
  );
};
