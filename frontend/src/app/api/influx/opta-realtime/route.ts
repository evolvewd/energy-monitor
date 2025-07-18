// src/app/api/influx/opta-realtime/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const influxUrl =
      process.env.NEXT_PUBLIC_INFLUX_URL || "http://localhost:8086";
    const token =
      process.env.NEXT_PUBLIC_INFLUX_TOKEN ||
      "energy-monitor-super-secret-token-change-this";
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || "assistec";
    const bucket = "opta"; // Nuovo bucket per i dati OPTA

    // Query per dati realtime OPTA (aggiornamento ogni secondo)
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -2m)
        |> filter(fn: (r) => r["_measurement"] == "realtime")
        |> filter(fn: (r) => r["model"] == "6m_produzione")
        |> filter(fn: (r) => r["_field"] == "status" or 
                             r["_field"] == "frequency" or 
                             r["_field"] == "i_peak" or 
                             r["_field"] == "i_rms" or 
                             r["_field"] == "p_active" or 
                             r["_field"] == "thd" or 
                             r["_field"] == "v_peak" or 
                             r["_field"] == "v_rms")
        |> aggregateWindow(every: 1s, fn: last, createEmpty: false)
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 120)
    `;

    console.log("Executing OPTA realtime Flux query");

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
          frequency: [],
          i_rms: [],
          v_rms: [],
          p_active: [],
          i_peak: [],
          v_peak: [],
          thd: [],
          status: [],
        },
        trends: {},
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
      "frequency",
      "i_rms",
      "v_rms",
      "p_active",
      "i_peak",
      "v_peak",
      "thd",
      "status",
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

    // Create time series per i grafici (ultimi 60 punti)
    const timeSeriesData = data.slice(0, 60).reverse(); // Reverse per ordine cronologico

    const timeSeries = {
      timestamps: timeSeriesData.map((d) => d._time || ""),
      frequency: timeSeriesData.map((d) => d.frequency || 0),
      i_rms: timeSeriesData.map((d) => d.i_rms || 0),
      v_rms: timeSeriesData.map((d) => d.v_rms || 0),
      p_active: timeSeriesData.map((d) => d.p_active || 0),
      i_peak: timeSeriesData.map((d) => d.i_peak || 0),
      v_peak: timeSeriesData.map((d) => d.v_peak || 0),
      thd: timeSeriesData.map((d) => d.thd || 0),
      status: timeSeriesData.map((d) => d.status || 0),
    };

    // Calcola trends (confronto tra ultimo e penultimo valore)
    const trends: { [key: string]: number } = {};
    const trendFields = [
      "frequency",
      "i_rms",
      "v_rms",
      "p_active",
      "i_peak",
      "v_peak",
      "thd",
    ];

    if (data.length >= 2) {
      const current = data[0];
      const previous = data[1];

      trendFields.forEach((field) => {
        const currentValue = current[field];
        const previousValue = previous[field];

        if (
          currentValue !== null &&
          previousValue !== null &&
          previousValue !== 0
        ) {
          const change =
            ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
          trends[field] = isFinite(change) ? parseFloat(change.toFixed(2)) : 0;
        } else {
          trends[field] = 0;
        }
      });
    } else {
      // Imposta trends a zero se non ci sono abbastanza dati
      trendFields.forEach((field) => {
        trends[field] = 0;
      });
    }

    console.log("Parsed OPTA realtime data points:", data.length);
    console.log("Latest values:", latest);
    console.log("Calculated trends:", trends);

    return NextResponse.json({
      data: data.slice(0, 60), // Ultimi 60 secondi per i grafici
      latest,
      timeSeries,
      trends,
      meta: {
        totalPoints: data.length,
        updateTime: new Date().toISOString(),
        queryExecutionTime: Date.now(),
        fields: numericFields,
        measurement: "realtime",
        bucket: bucket,
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
    console.error("OPTA Realtime InfluxDB API Error:", error);

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
