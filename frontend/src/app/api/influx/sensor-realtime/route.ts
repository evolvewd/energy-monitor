// src/app/api/influx/sensor-realtime/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const modbusAddress = searchParams.get("modbus_address");
    const model = searchParams.get("model");

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

    // Query per ultimo valore realtime (tensione e potenza)
    // Prova sia con stringa che con numero per modbus_address
    const modbusAddressStr = String(modbusAddress);
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -5m)
        |> filter(fn: (r) => r["_measurement"] == "realtime")
        |> filter(fn: (r) => r["type"] == "realtime")
        |> filter(fn: (r) => r["device"] == "opta")
        |> filter(fn: (r) => exists r["modbus_address"] and (r["modbus_address"] == "${modbusAddress}" or r["modbus_address"] == "${modbusAddressStr}"))
        ${model ? `|> filter(fn: (r) => exists r["model"] and r["model"] == "${model}")` : ""}
        |> filter(fn: (r) => r["_field"] == "p_active" or r["_field"] == "v_rms")
        |> aggregateWindow(every: 1s, fn: last, createEmpty: false)
        |> group()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 1)
    `;
    
    console.log(`Sensor Realtime query for modbus_address=${modbusAddress}, model=${model}`);

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
    
    console.log("Sensor Realtime CSV response length:", csvData.length);
    if (csvData.length > 0 && csvData.length < 1000) {
      console.log("Sensor Realtime CSV content:", csvData);
    }

    if (!csvData || csvData.trim().length === 0) {
      console.log("Empty CSV response for sensor realtime");
      return NextResponse.json({
        data: { p_active: 0, v_rms: 0 },
        status: "success",
      });
    }

    // Parse CSV - gestione migliorata per CSV con virgolette
    const lines = csvData.trim().split("\n");
    if (lines.length < 2) {
      console.log("Not enough lines in CSV");
      return NextResponse.json({
        data: { p_active: 0, v_rms: 0 },
        status: "success",
      });
    }

    // Parse header considerando le virgolette
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    };

    const headers = parseCSVLine(lines[0]);
    console.log("Sensor Realtime CSV headers:", headers);
    
    let p_active = 0;
    let v_rms = 0;

    // Cerca la prima riga di dati (dopo gli header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#") || line.startsWith(",result") || line === "") continue;

      try {
        const values = parseCSVLine(line);
        if (values.length < headers.length) {
          console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`);
          continue;
        }

        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/"/g, "").trim();
          const value = values[index]?.replace(/"/g, "").trim() || "";

          if (cleanHeader === "p_active") {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && value !== "" && value !== "null") {
              p_active = numValue;
              console.log(`Found p_active: ${p_active}`);
            }
          } else if (cleanHeader === "v_rms") {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && value !== "" && value !== "null") {
              v_rms = numValue;
              console.log(`Found v_rms: ${v_rms}`);
            }
          }
        });

        // Se abbiamo trovato almeno un valore, usiamo questa riga
        if (p_active !== 0 || v_rms !== 0) {
          console.log(`Using row ${i} with p_active=${p_active}, v_rms=${v_rms}`);
          break;
        }
      } catch (parseError) {
        console.warn(`Error parsing line ${i}:`, parseError);
        continue;
      }
    }
    
    console.log(`Final values: p_active=${p_active}, v_rms=${v_rms}`);

    return NextResponse.json({
      data: {
        p_active: p_active,
        v_rms: v_rms,
      },
      status: "success",
    });
  } catch (error) {
    console.error("Sensor Realtime API Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        status: "error",
      },
      { status: 500 }
    );
  }
}

