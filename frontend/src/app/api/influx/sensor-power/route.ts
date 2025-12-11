// src/app/api/influx/sensor-power/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modbusAddress = searchParams.get("modbus_address");
    const model = searchParams.get("model");
    const timeRange = searchParams.get("time_range") || "today";

    if (!modbusAddress) {
      return NextResponse.json(
        { error: "modbus_address parameter is required", status: "error" },
        { status: 400 }
      );
    }

    const influxUrl =
      process.env.NEXT_PUBLIC_INFLUX_URL || "http://localhost:8086";
    const token =
      process.env.NEXT_PUBLIC_INFLUX_TOKEN ||
      "energy-monitor-super-secret-token-change-this";
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || "assistec";
    const bucket = "opta";

    // Configurazione in base al periodo selezionato
    let rangeStart: string;
    let rangeStop: string | null = null;
    let aggregateWindow: string;
    let limitPoints: number;
    let dateFormat: "hour" | "day" | "week";

    switch (timeRange) {
      case "today":
        rangeStart = "-24h";
        rangeStop = null;
        aggregateWindow = "1h";
        limitPoints = 24;
        dateFormat = "hour";
        break;
      case "yesterday":
        rangeStart = "-48h";
        rangeStop = "-24h";
        aggregateWindow = "1h";
        limitPoints = 24;
        dateFormat = "hour";
        break;
      case "last_week":
        // Questa settimana: ultimi 7 giorni (poi filtreremo solo lun-ven nel frontend)
        rangeStart = "-7d";
        rangeStop = null;
        aggregateWindow = "1d";
        limitPoints = 7; // 7 giorni (poi mostriamo solo 5)
        dateFormat = "day";
        break;
      case "last_month": {
        // Questo mese: tutti i giorni del mese corrente
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const daysSinceFirst = Math.floor((now.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
        // Range: dal primo del mese fino alla fine del mese (o oggi se siamo prima della fine)
        rangeStart = `-${daysSinceFirst + 1}d`; // +1 per includere oggi
        rangeStop = null; // Fino a oggi (o fine mese se siamo alla fine)
        aggregateWindow = "1d";
        limitPoints = 31; // Massimo giorni in un mese
        dateFormat = "day";
        break;
      }
      case "previous_month": {
        // Mese passato: tutto il mese scorso
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Ultimo giorno del mese scorso
        const daysInLastMonth = lastMonthEnd.getDate();
        const daysAgo = Math.floor((now.getTime() - lastMonthStart.getTime()) / (1000 * 60 * 60 * 24));
        rangeStart = `-${daysAgo + daysInLastMonth}d`;
        rangeStop = `-${daysAgo}d`;
        aggregateWindow = "1d";
        limitPoints = 31; // Massimo giorni in un mese
        dateFormat = "day";
        break;
      }
      default:
        rangeStart = "-24h";
        rangeStop = null;
        aggregateWindow = "1h";
        limitPoints = 24;
        dateFormat = "hour";
    }

    // Costruisci la query Flux
    const rangeFilter = rangeStop
      ? `|> range(start: ${rangeStart}, stop: ${rangeStop})`
      : `|> range(start: ${rangeStart})`;

    const fluxQuery = `
      from(bucket: "${bucket}")
        ${rangeFilter}
        |> filter(fn: (r) => r["_measurement"] == "realtime")
        |> filter(fn: (r) => r["type"] == "realtime")
        |> filter(fn: (r) => r["device"] == "opta")
        |> filter(fn: (r) => exists r["modbus_address"] and r["modbus_address"] == "${modbusAddress}")
        ${model ? `|> filter(fn: (r) => exists r["model"] and r["model"] == "${model}")` : ""}
        |> filter(fn: (r) => r["_field"] == "p_active")
        |> aggregateWindow(every: ${aggregateWindow}, fn: mean, createEmpty: false)
        |> sort(columns: ["_time"], desc: false)
        |> limit(n: ${limitPoints})
    `;

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
          error: `InfluxDB query failed: ${response.status}`,
          status: "error",
        },
        { status: response.status }
      );
    }

    const csvData = await response.text();

    if (!csvData || csvData.trim().length === 0) {
      return NextResponse.json({
        data: [],
        status: "success",
      });
    }

    // Parse CSV
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      return NextResponse.json({
        data: [],
        status: "success",
      });
    }

    const headers = lines[0]?.split(",") || [];
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#") || line.startsWith(",result")) continue;

      try {
        const values = line.split(",");
        if (values.length < headers.length) continue;

        const row: any = {};
        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/"/g, "").trim();
          const value = values[index]?.replace(/"/g, "").trim() || "";

          if (cleanHeader === "_time") {
            row._time = value;
          } else if (cleanHeader === "_value") {
            const numValue = parseFloat(value);
            row.p_active = !isNaN(numValue) && value !== "" ? numValue : 0;
          }
        });

        if (row._time && row.p_active !== undefined) {
          data.push({
            _time: row._time,
            p_active: row.p_active,
          });
        }
      } catch (parseError) {
        console.warn(`Error parsing line ${i}:`, parseError);
        continue;
      }
    }

    // Ordina per timestamp (più recente primo) e poi reverse per ordine cronologico
    const sortedData = data
      .sort((a, b) => {
        try {
          return new Date(b._time).getTime() - new Date(a._time).getTime();
        } catch {
          return 0;
        }
      })
      .reverse(); // Reverse per ordine cronologico (più vecchio primo)

    return NextResponse.json({
      data: sortedData,
      status: "success",
    });
  } catch (error) {
    console.error("Sensor Power API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}

