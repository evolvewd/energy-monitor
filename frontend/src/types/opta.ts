// types/opta.ts
// Tipi per i dati OPTA

// Dati realtime (aggiornamento 1 secondo)
export interface OptaRealtimeData {
  _time: string;
  status: number;
  frequency: number;
  i_peak: number;
  i_rms: number;
  p_active: number;
  thd: number;
  v_peak: number;
  v_rms: number;
}

// Dati power (aggiornamento 5 secondi)
export interface OptaPowerData {
  _time: string;
  energy_negative: number;
  energy_positive: number;
  energy_total: number;
  p_active: number;
  q_reactive: number;
  s_apparent: number;
  cos_phi: number;
}

// Dati extremes (aggiornamento 30 secondi)
export interface OptaExtremesData {
  _time: string;
  cos_phi_max: number;
  cos_phi_min: number;
  freq_max: number;
  freq_min: number;
  i_max: number;
  i_min: number;
  p_max: number;
  p_min: number;
  q_react_max: number;
  q_react_min: number;
  s_app_max: number;
  s_app_min: number;
  thd_max: number;
  thd_min: number;
  v_max: number;
  v_min: number;
}

// Time series per grafici realtime
export interface OptaRealtimeTimeSeries {
  timestamps: string[];
  frequency: number[];
  i_rms: number[];
  v_rms: number[];
  p_active: number[];
  i_peak: number[];
  v_peak: number[];
  thd: number[];
  status: number[];
}

// Time series per grafici power
export interface OptaPowerTimeSeries {
  timestamps: string[];
  energy_negative: number[];
  energy_positive: number[];
  energy_total: number[];
  p_active: number[];
  q_reactive: number[];
  s_apparent: number[];
  cos_phi: number[];
}

// Time series per grafici extremes
export interface OptaExtremesTimeSeries {
  timestamps: string[];
  cos_phi_max: number[];
  cos_phi_min: number[];
  freq_max: number[];
  freq_min: number[];
  i_max: number[];
  i_min: number[];
  p_max: number[];
  p_min: number[];
  q_react_max: number[];
  q_react_min: number[];
  s_app_max: number[];
  s_app_min: number[];
  thd_max: number[];
  thd_min: number[];
  v_max: number[];
  v_min: number[];
}

// Estremi calcolati
export interface OptaExtremes {
  [parameter: string]: {
    min: number;
    max: number;
    current: number;
  };
}

// Response API generica
export interface OptaApiResponse<T, U> {
  data?: T[];
  latest?: T;
  timeSeries?: U;
  trends?: { [key: string]: number };
  extremes?: OptaExtremes; // Solo per API extremes
  meta?: {
    totalPoints: number;
    updateTime: string;
    queryExecutionTime: number;
    fields: string[];
    measurement: string;
    bucket: string;
    updateInterval?: string;
    dataRange?: {
      from: string;
      to: string;
    };
  };
  status: string;
  error?: string;
  message?: string;
  timestamp?: string;
}

// Response specifiche per ogni tipo di API
export type OptaRealtimeApiResponse = OptaApiResponse<
  OptaRealtimeData,
  OptaRealtimeTimeSeries
>;
export type OptaPowerApiResponse = OptaApiResponse<
  OptaPowerData,
  OptaPowerTimeSeries
>;
export type OptaExtremesApiResponse = OptaApiResponse<
  OptaExtremesData,
  OptaExtremesTimeSeries
>;

// Dati combinati per dashboard completo
export interface OptaCombinedData {
  realtime: {
    data: OptaRealtimeData[];
    latest: OptaRealtimeData | null;
    timeSeries: OptaRealtimeTimeSeries | null;
    trends: { [key: string]: number };
    isLoading: boolean;
    error: string | null;
  };
  power: {
    data: OptaPowerData[];
    latest: OptaPowerData | null;
    timeSeries: OptaPowerTimeSeries | null;
    trends: { [key: string]: number };
    isLoading: boolean;
    error: string | null;
  };
  extremes: {
    data: OptaExtremesData[];
    latest: OptaExtremesData | null;
    timeSeries: OptaExtremesTimeSeries | null;
    extremes: OptaExtremes;
    isLoading: boolean;
    error: string | null;
  };
  meta: {
    lastUpdate: Date | null;
    updateCount: number;
    isRunning: boolean;
  };
}
