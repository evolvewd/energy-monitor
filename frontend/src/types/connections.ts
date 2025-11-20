// ====================
// TYPES CONDIVISI
// ====================

// types/connections.ts
export type ConnectionStatus = "online" | "offline" | "warning" | "testing";

export interface ServiceStatus {
  influxdb: ConnectionStatus;
  mqtt: ConnectionStatus;
  nodered: ConnectionStatus;
}
