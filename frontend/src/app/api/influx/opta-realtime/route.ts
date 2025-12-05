// src/app/api/influx/opta-realtime/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("=== OPTA Realtime API Called ===");
    const influxUrl =
      process.env.NEXT_PUBLIC_INFLUX_URL || "http://localhost:8086";
    const token =
      process.env.NEXT_PUBLIC_INFLUX_TOKEN ||
      "energy-monitor-super-secret-token-change-this";
    const org = process.env.NEXT_PUBLIC_INFLUX_ORG || "assistec";
    const bucket = "opta"; // Nuovo bucket per i dati OPTA

    // Query per dati realtime OPTA (aggiornamento ogni secondo)
    // Legge tutti i dati realtime dal bucket opta (nuovo formato con tag modbus_address, model, type)
    // Migliorata: rimuove filtro != 0.0 e usa fill() per interpolare buchi
    const fluxQuery = `
      from(bucket: "${bucket}")
        |> range(start: -2m)
        |> filter(fn: (r) => r["_measurement"] == "realtime")
        |> filter(fn: (r) => r["type"] == "realtime")
        |> filter(fn: (r) => r["device"] == "opta")
        |> filter(fn: (r) => r["_field"] == "status" or 
                             r["_field"] == "frequency" or 
                             r["_field"] == "i_peak" or 
                             r["_field"] == "i_rms" or 
                             r["_field"] == "p_active" or 
                             r["_field"] == "thd" or 
                             r["_field"] == "v_peak" or 
                             r["_field"] == "v_rms")
        |> aggregateWindow(every: 1s, fn: last, createEmpty: true)
        |> fill(usePrevious: true)
        |> group()
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
        |> sort(columns: ["_time"], desc: true)
        |> limit(n: 120)
    `;

    console.log("Executing OPTA realtime Flux query");
    console.log("Query:", fluxQuery.substring(0, 200) + "...");

    let response;
    try {
      response = await fetch(`${influxUrl}/api/v2/query?org=${org}`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/vnd.flux",
          Accept: "application/csv",
        },
        body: fluxQuery,
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          error: `Failed to connect to InfluxDB: ${fetchError instanceof Error ? fetchError.message : "Unknown error"}`,
          status: "error",
        },
        { status: 500 }
      );
    }

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

    let csvData: string;
    try {
      csvData = await response.text();
      console.log("Raw CSV response length:", csvData.length);
      if (csvData.length > 0) {
        console.log("Raw CSV first 500 chars:", csvData.substring(0, 500));
      }
    } catch (textError) {
      console.error("Error reading response text:", textError);
      return NextResponse.json(
        {
          error: `Failed to read InfluxDB response: ${textError instanceof Error ? textError.message : "Unknown error"}`,
          status: "error",
        },
        { status: 500 }
      );
    }

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
    if (lines.length < 2) {
      console.log("Not enough lines in CSV (headers + data)");
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
          measurement: "realtime",
          bucket: bucket,
          dataRange: null,
        },
        status: "success",
      });
    }
    
    const headers = lines[0]?.split(",") || [];
    if (headers.length === 0) {
      throw new Error("Invalid CSV: no headers found");
    }

    console.log("CSV Headers:", headers);
    console.log("CSV Lines count:", lines.length);

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

    // Parse each line - CSV di InfluxDB dopo pivot ha solo _time e i campi come colonne
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#") || line.startsWith(",result")) continue; // Salta righe vuote, commenti e header result

      try {
        // Parsing CSV semplice (dopo pivot non ci sono virgole nei valori)
        const values = line.split(",");

        if (values.length < headers.length) {
          console.warn(`Line ${i} has ${values.length} values, expected ${headers.length}`);
          continue;
        }

        const row: any = {};

        headers.forEach((header, index) => {
          const cleanHeader = header.replace(/"/g, "").trim();
          const value = values[index]?.replace(/"/g, "").trim() || "";

          if (cleanHeader === "_time") {
            row._time = value;
          } else if (cleanHeader === "result" || cleanHeader === "table") {
            // Ignora colonne interne di InfluxDB
            return;
          } else if (numericFields.includes(cleanHeader)) {
            const numValue = parseFloat(value);
            // Mantieni 0 come valore valido, solo NaN o stringa vuota diventano null
            row[cleanHeader] = !isNaN(numValue) && value !== "" ? numValue : null;
          } else {
            // Altri campi (se presenti)
            row[cleanHeader] = value || null;
          }
        });

        // Valida che il record abbia timestamp
        if (row._time) {
          // Aggiungi valori di default per i tag (non presenti dopo pivot)
          row._measurement = "realtime";
          row.modbus_address = null; // Non disponibile dopo pivot
          row.model = null;
          row.reader_id = null;
          row.reader_type = null;
          data.push(row);
        }
      } catch (parseError) {
        console.warn(`Error parsing line ${i}:`, parseError);
        continue;
      }
    }
    
    console.log(`Parsed ${data.length} data rows from CSV`);

    // Dopo pivot, ogni riga è già un record completo, non serve raggruppare
    // Ma dobbiamo recuperare i tag da una query separata o usarli come default
    const dataByTime: Record<string, any> = {};
    
    data.forEach((row) => {
      try {
        const timeKey = row._time;
        if (!timeKey) return;
        
        // Dopo pivot, ogni riga ha già tutti i campi
        dataByTime[timeKey] = {
          _time: row._time,
          _measurement: "realtime",
          modbus_address: null, // Non disponibile dopo pivot, ma possiamo fare query separata se necessario
          model: null,
          reader_id: null,
          reader_type: null,
          ...row, // Include tutti i campi numerici
        };
      } catch (rowError) {
        console.warn("Error processing row:", rowError, row);
      }
    });

    // Converti in array e ordina per timestamp (più recente primo)
    const sortedData = Object.values(dataByTime).sort(
      (a: any, b: any) => {
        try {
          return new Date(b._time).getTime() - new Date(a._time).getTime();
        } catch {
          return 0;
        }
      }
    );

    // Get latest values (primo record dopo ordinamento)
    const latest = (sortedData.length > 0 ? sortedData[0] : {}) as any;

    // Create time series per i grafici (ultimi 60 punti)
    const timeSeriesData = sortedData.slice(0, 60).reverse(); // Reverse per ordine cronologico

    const timeSeries = {
      timestamps: timeSeriesData.map((d: any) => (d?._time || "") as string),
      frequency: timeSeriesData.map((d: any) => (d?.frequency || 0) as number),
      i_rms: timeSeriesData.map((d: any) => (d?.i_rms || 0) as number),
      v_rms: timeSeriesData.map((d: any) => (d?.v_rms || 0) as number),
      p_active: timeSeriesData.map((d: any) => (d?.p_active || 0) as number),
      i_peak: timeSeriesData.map((d: any) => (d?.i_peak || 0) as number),
      v_peak: timeSeriesData.map((d: any) => (d?.v_peak || 0) as number),
      thd: timeSeriesData.map((d: any) => (d?.thd || 0) as number),
      status: timeSeriesData.map((d: any) => (d?.status || 0) as number),
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

    if (sortedData.length >= 2) {
      const current: any = sortedData[0];
      const previous: any = sortedData[1];

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

    console.log("Parsed OPTA realtime data points:", sortedData.length);
    console.log("Latest values:", JSON.stringify(latest).substring(0, 200));
    console.log("Calculated trends:", trends);

    const responseData = {
      data: sortedData.slice(0, 60), // Ultimi 60 secondi per i grafici
      latest,
      timeSeries,
      trends,
      meta: {
        totalPoints: sortedData.length,
        updateTime: new Date().toISOString(),
        queryExecutionTime: Date.now(),
        fields: numericFields,
        measurement: "realtime",
        bucket: bucket,
        dataRange:
          sortedData.length > 0
            ? {
                from: (sortedData[sortedData.length - 1] as any)?._time || "",
                to: (sortedData[0] as any)?._time || "",
              }
            : null,
      },
      status: "success",
    };
    
    console.log("=== Returning response ===");
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("OPTA Realtime InfluxDB API Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");

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
                message: error instanceof Error ? error.message : String(error),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
