// types/settings.ts
export interface SystemSettings {
  produzione_fv: boolean;
  accumulo_enabled: boolean;
  num_alloggi: number;
  alloggi: AlloggioConfig[];
  lettori: LettoreModbusConfig[];
}

export interface AlloggioConfig {
  alloggio_id: string; // "1", "2", ...
  name: string; // "Appartamento 1"
  topic_prefix?: string; // default: "alloggio_1"
  modbus_address?: number; // Indirizzo Modbus del lettore
}

export interface LettoreModbusConfig {
  reader_id: string; // "parti_comuni", "produzione", "accumulo_ac", "accumulo_dc", "alloggio_1", ecc.
  type: "parti_comuni" | "produzione" | "accumulo_ac" | "accumulo_dc" | "alloggio";
  name: string; // Nome descrittivo
  modbus_address: number; // Indirizzo Modbus (numero decimale)
  model: "6m" | "7m"; // Modello del sensore (6m o 7m)
  alloggio_id?: string; // Solo per tipo "alloggio"
}

export interface SettingsApiResponse {
  success: boolean;
  data?: {
    isConfigured: boolean;
    settings: Record<string, string>;
    alloggi: Array<{
      alloggio_id: string;
      name: string;
      topic_prefix: string | null;
      updated_at?: string;
    }>;
  };
  error?: string;
}

