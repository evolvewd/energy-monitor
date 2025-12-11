// app/api/settings/route.ts
import { NextResponse } from "next/server";
import {
  getSetting,
  setSetting,
  getAllSettings,
  getAlloggi,
  getLettoriModbus,
} from "@/lib/yaml-settings";

// GET - Legge tutte le settings
export async function GET() {
  try {
    const settings = await getAllSettings();
    const alloggi = await getAlloggi();
    const lettori = await getLettoriModbus();
    const isConfigured = (await getSetting("is_configured")) === "true";

    return NextResponse.json({
      success: true,
      data: {
        isConfigured,
        settings,
        alloggi,
        lettori,
      },
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Aggiorna solo le settings di sistema (API key, location, etc.)
// NOTA: La configurazione di lettori Modbus, stringhe, inverter è gestita direttamente nel YAML
// e viene letta da Node-RED. Il frontend legge solo per visualizzazione.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Salva solo settings di sistema modificabili dal frontend
    if (body.produzione_fv !== undefined) {
      await setSetting("produzione_fv", body.produzione_fv ? "true" : "false");
    }
    
    if (body.accumulo_enabled !== undefined) {
      await setSetting("accumulo_enabled", body.accumulo_enabled ? "true" : "false");
    }
    
    // Salva location se presente
    if (body.location) {
      if (body.location.city) {
        await setSetting("location_city", body.location.city);
      }
      if (body.location.address) {
        await setSetting("location_address", body.location.address);
      }
    }
    
    // Salva API key meteo se presente
    if (body.weather_api_key !== undefined) {
      await setSetting("weather_api_key", body.weather_api_key);
    }
    
    // Marca come configurato se almeno una setting è stata salvata
    await setSetting("is_configured", "true");

    return NextResponse.json({
      success: true,
      data: {
        message: "Settings salvate con successo",
        note: "La configurazione di lettori Modbus, stringhe e inverter è gestita nel file plant.yaml e viene letta da Node-RED",
      },
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Resetta solo le settings di sistema (non la configurazione impianto)
// NOTA: La configurazione dell'impianto (stringhe, inverter, etc.) è nel YAML
// e non viene modificata da qui. Solo le settings di sistema vengono resettate.
export async function DELETE() {
  try {
    // Resetta solo le settings di sistema modificabili dal frontend
    await setSetting("produzione_fv", "false");
    await setSetting("accumulo_enabled", "false");
    await setSetting("is_configured", "false");
    await setSetting("weather_api_key", "");

    return NextResponse.json({
      success: true,
      data: { 
        message: "Settings di sistema resettate",
        note: "La configurazione dell'impianto (stringhe, inverter, etc.) nel file plant.yaml non è stata modificata"
      },
    });
  } catch (error) {
    console.error("Error deleting settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna una singola setting
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    if (!body.key || body.value === undefined) {
      return NextResponse.json(
        { success: false, error: "key e value sono richiesti" },
        { status: 400 }
      );
    }

    await setSetting(body.key, String(body.value));

    return NextResponse.json({
      success: true,
      data: { message: "Setting aggiornata con successo" },
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

