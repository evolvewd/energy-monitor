// src/app/api/influx/opta-extremes/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const influxUrl =
      process.env.NEXT_PUBLIC_INFLUX_URL || "http://localhost:8086";
    const token =
      process.env.NEXT_PUBLIC_INFLUX_TOKEN ||
      "energy-monitor-super-secret-token-change-this";
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || "assistec";
    const bucket = "opta";

    // Query per dati extremes OPTA (aggiornamento ogni 30 secondi)
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -30m)
        |> filter(fn: (r) => r["_measurement"] == "extremes")
        |> filter(fn: (r) => r["model"] == "6m_produzione")
        |> filter(fn: (r) => r["_field"] == "cos_phi_max" or 
                             r["_field"] == "cos_phi_min" or 
                             r["_field"] == "freq_max" or 
                             r["_field"] == "freq_min" or 
                             r["_field"] == "i_max" or 
                             r["_field"] == "i_min" or 
                             r["_field"] == "p_max" or 
                             r["_field"] == "p_min" or 
                             r["_field"] == "q_react_max" or 
                             r["_field"] == "q_react_min" or 
                             r["_field"] == "s_app_max" or 
                             r["_field"] == "s_app_min" or 
                             r["_field"] == "thd_max" or 
                             r["_field"] == "thd_min" or 
                             r["_field"] == "v_max" or 
                             r["_field"] == "v_min")
        |> aggregateWindow(every: 30s, fn: last, createEmpty: false)
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 60)
    `;

    console.log("Executing OPTA extremes Flux query");

    const response = await fetch(`${influxUrl}/api/v2/query?org=${org}`, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/vnd.flux",
        Accept: "application/csv",
      },
      body: fluxQuery,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("InfluxDB Query Error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `InfluxDB query failed: ${response.status} - ${errorText}`,
          status: "error",
        },
        { status: response.status }
      );
    }

    const csvData = await response.text();
    console.log("Raw CSV response length:", csvData.length);

    if (!csvData || csvData.trim().length === 0) {
      console.log("Empty CSV response from InfluxDB");
      return NextResponse.json({
        data: [],
        latest: {},
        timeSeries: {
          timestamps: [],
          cos_phi_max: [],
          cos_phi_min: [],
          freq_max: [],
          freq_min: [],
          i_max: [],
          i_min: [],
          p_max: [],
          p_min: [],
          q_react_max: [],
          q_react_min: [],
          s_app_max: [],
          s_app_min: [],
          thd_max: [],
          thd_min: [],
          v_max: [],
          v_min: [],
        },
        extremes: {},
        meta: {
          totalPoints: 0,
          updateTime: new Date().toISOString(),
          queryExecutionTime: Date.now(),
          fields: [],
          dataRange: null,
        },
        status: "success",
      });
    }

    // Parse CSV data
    const lines = csvData.trim().split("\n");
    const headers = lines[0].split(",");

    console.log("CSV Headers:", headers);

    const data: any[] = [];
    const numericFields = [
      "cos_phi_max",
      "cos_phi_min",
      "freq_max",
      "freq_min",
      "i_max",
      "i_min",
      "p_max",
      "p_min",
      "q_react_max",
      "q_react_min",
      "s_app_max",
      "s_app_min",
      "thd_max",
      "thd_min",
      "v_max",
      "v_min",
    ];

    // Parse each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(",");
        if (values.length >= headers.length) {
          const row: any = {};

          headers.forEach((header, index) => {
            const cleanHeader = header.replace(/"/g, "").trim();
            const value = values[index]?.replace(/"/g, "").trim();

            if (cleanHeader === "_time") {
              row._time = value;
            } else if (cleanHeader === "_measurement") {
              row._measurement = value;
            } else if (numericFields.includes(cleanHeader)) {
              const numValue = parseFloat(value);
              row[cleanHeader] = !isNaN(numValue) ? numValue : null;
            } else {
              row[cleanHeader] = value;
            }
          });

          // Valida che il record abbia timestamp e measurement validi
          if (row._time && row._measurement) {
            data.push(row);
          }
        }
      } catch (parseError) {
        console.warn(`Error parsing line ${i}:`, parseError);
        continue;
      }
    }

    // Ordina i dati per timestamp (più recente primo)
    data.sort(
      (a, b) => new Date(b._time).getTime() - new Date(a._time).getTime()
    );

    // Get latest values (primo record dopo ordinamento)
    const latest = data[0] || {};

    // Create time series per i grafici (ultimi 30 punti - 15 minuti)
    const timeSeriesData = data.slice(0, 30).reverse();

    const timeSeries = {
      timestamps: timeSeriesData.map((d) => d._time || ""),
      cos_phi_max: timeSeriesData.map((d) => d.cos_phi_max || 0),
      cos_phi_min: timeSeriesData.map((d) => d.cos_phi_min || 0),
      freq_max: timeSeriesData.map((d) => d.freq_max || 0),
      freq_min: timeSeriesData.map((d) => d.freq_min || 0),
      i_max: timeSeriesData.map((d) => d.i_max || 0),
      i_min: timeSeriesData.map((d) => d.i_min || 0),
      p_max: timeSeriesData.map((d) => d.p_max || 0),
      p_min: timeSeriesData.map((d) => d.p_min || 0),
      q_react_max: timeSeriesData.map((d) => d.q_react_max || 0),
      q_react_min: timeSeriesData.map((d) => d.q_react_min || 0),
      s_app_max: timeSeriesData.map((d) => d.s_app_max || 0),
      s_app_min: timeSeriesData.map((d) => d.s_app_min || 0),
      thd_max: timeSeriesData.map((d) => d.thd_max || 0),
      thd_min: timeSeriesData.map((d) => d.thd_min || 0),
      v_max: timeSeriesData.map((d) => d.v_max || 0),
      v_min: timeSeriesData.map((d) => d.v_min || 0),
    };

    // Calcola valori estremi globali per il periodo
    const extremes: {
      [key: string]: { min: number; max: number; current: number };
    } = {};

    // Raggruppa i parametri per tipo
    const parameterGroups = {
      frequency: { max: "freq_max", min: "freq_min" },
      current: { max: "i_max", min: "i_min" },
      voltage: { max: "v_max", min: "v_min" },
      power: { max: "p_max", min: "p_min" },
      reactive_power: { max: "q_react_max", min: "q_react_min" },
      apparent_power: { max: "s_app_max", min: "s_app_min" },
      cos_phi: { max: "cos_phi_max", min: "cos_phi_min" },
      thd: { max: "thd_max", min: "thd_min" },
    };

    Object.entries(parameterGroups).forEach(([param, fields]) => {
      const maxValues = data
        .map((d) => d[fields.max])
        .filter((v) => v !== null && !isNaN(v));
      const minValues = data
        .map((d) => d[fields.min])
        .filter((v) => v !== null && !isNaN(v));

      extremes[param] = {
        max: maxValues.length > 0 ? Math.max(...maxValues) : 0,
        min: minValues.length > 0 ? Math.min(...minValues) : 0,
        current: latest[fields.max] || 0,
      };
    });

    console.log("Parsed OPTA extremes data points:", data.length);
    console.log("Latest values:", latest);
    console.log("Calculated extremes:", extremes);

    return NextResponse.json({
      data: data.slice(0, 30), // Ultimi 30 punti (15 minuti)
      latest,
      timeSeries,
      extremes,
      meta: {
        totalPoints: data.length,
        updateTime: new Date().toISOString(),
        queryExecutionTime: Date.now(),
        fields: numericFields,
        measurement: "extremes",
        bucket: bucket,
        updateInterval: "30s",
        dataRange:
          data.length > 0
            ? {
                from: data[data.length - 1]._time,
                to: data[0]._time,
              }
            : null,
      },
      status: "success",
    });
  } catch (error) {
    console.error("OPTA Extremes InfluxDB API Error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        timestamp: new Date().toISOString(),
        details:
          process.env.NODE_ENV === "development"
            ? {
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined,
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
