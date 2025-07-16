// ====================
// TYPES E INTERFACES
// ====================

// types/realtime.ts
export interface RealtimeData {
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

export interface TimeSeries {
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

export interface ApiResponse {
  data?: RealtimeData[];
  latest?: RealtimeData;
  timeSeries?: TimeSeries;
  trends?: { [key: string]: number };
  meta?: {
    totalPoints: number;
    updateTime: string;
    queryExecutionTime: number;
    fields: string[];
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
