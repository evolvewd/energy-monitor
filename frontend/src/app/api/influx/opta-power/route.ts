// src/app/api/influx/opta-power/route.ts
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

    // Query per dati power OPTA (aggiornamento ogni 5 secondi)
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "power")
        |> filter(fn: (r) => r["type"] == "power")
        |> filter(fn: (r) => r["device"] == "opta")
        |> filter(fn: (r) => r["_field"] == "energy_negative" or 
                             r["_field"] == "energy_positive" or 
                             r["_field"] == "energy_total" or 
                             r["_field"] == "p_active" or 
                             r["_field"] == "q_reactive" or 
                             r["_field"] == "s_apparent" or
                             r["_field"] == "cos_phi")
        |> filter(fn: (r) => r["_value"] != 0.0)
        |> aggregateWindow(every: 5s, fn: last, createEmpty: false)
        |> group()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 60)
    `;

    console.log("Executing OPTA power Flux query");

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
          energy_negative: [],
          energy_positive: [],
          energy_total: [],
          p_active: [],
          q_reactive: [],
          s_apparent: [],
          cos_phi: [],
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
      "energy_negative",
      "energy_positive",
      "energy_total",
      "p_active",
      "q_reactive",
      "s_apparent",
      "cos_phi",
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

    // Create time series per i grafici (ultimi 30 punti - 2.5 minuti)
    const timeSeriesData = data.slice(0, 30).reverse();

    const timeSeries = {
      timestamps: timeSeriesData.map((d) => d._time || ""),
      energy_negative: timeSeriesData.map((d) => d.energy_negative || 0),
      energy_positive: timeSeriesData.map((d) => d.energy_positive || 0),
      energy_total: timeSeriesData.map((d) => d.energy_total || 0),
      p_active: timeSeriesData.map((d) => d.p_active || 0),
      q_reactive: timeSeriesData.map((d) => d.q_reactive || 0),
      s_apparent: timeSeriesData.map((d) => d.s_apparent || 0),
      cos_phi: timeSeriesData.map((d) => d.cos_phi || 0),
    };

    // Calcola trends (confronto tra ultimo e penultimo valore)
    const trends: { [key: string]: number } = {};
    const trendFields = [
      "energy_negative",
      "energy_positive",
      "energy_total",
      "p_active",
      "q_reactive",
      "s_apparent",
      "cos_phi",
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
      trendFields.forEach((field) => {
        trends[field] = 0;
      });
    }

    console.log("Parsed OPTA power data points:", data.length);
    console.log("Latest values:", latest);
    console.log("Calculated trends:", trends);

    return NextResponse.json({
      data: data.slice(0, 30), // Ultimi 30 punti (2.5 minuti)
      latest,
      timeSeries,
      trends,
      meta: {
        totalPoints: data.length,
        updateTime: new Date().toISOString(),
        queryExecutionTime: Date.now(),
        fields: numericFields,
        measurement: "power",
        bucket: bucket,
        updateInterval: "5s",
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
    console.error("OPTA Power InfluxDB API Error:", error);

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
