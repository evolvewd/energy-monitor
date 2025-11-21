// app/api/settings/route.ts
import { NextResponse } from "next/server";
import {
  getSetting,
  setSetting,
  getAllSettings,
  getAlloggi,
  createAlloggio,
  updateAlloggio,
  deleteAlloggio,
  deleteAllAlloggi,
  getLettoriModbus,
  createLettoreModbus,
  deleteAllLettoriModbus,
  deleteAllSettings,
  type Alloggio,
} from "@/lib/postgres-settings";

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

// POST - Crea/aggiorna settings
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Valida input
    if (typeof body.produzione_fv !== "boolean") {
      return NextResponse.json(
        { success: false, error: "produzione_fv deve essere un boolean" },
        { status: 400 }
      );
    }

    if (typeof body.num_alloggi !== "number" || body.num_alloggi < 0) {
      return NextResponse.json(
        { success: false, error: "num_alloggi deve essere un numero >= 0" },
        { status: 400 }
      );
    }

    // Valida lettori Modbus
    if (body.lettori && Array.isArray(body.lettori)) {
      for (const lettore of body.lettori) {
        if (!lettore.reader_id || !lettore.name || typeof lettore.modbus_address !== "number") {
          return NextResponse.json(
            { success: false, error: "Ogni lettore deve avere reader_id, name e modbus_address" },
            { status: 400 }
          );
        }
        if (lettore.modbus_address < 1 || lettore.modbus_address > 247) {
          return NextResponse.json(
            { success: false, error: "Indirizzo Modbus deve essere tra 1 e 247" },
            { status: 400 }
          );
        }
        if (lettore.model && lettore.model !== "6m" && lettore.model !== "7m") {
          return NextResponse.json(
            { success: false, error: "Il modello deve essere '6m' o '7m'" },
            { status: 400 }
          );
        }
      }
    }

    // Salva settings principali
    await setSetting("produzione_fv", body.produzione_fv ? "true" : "false");
    await setSetting("accumulo_enabled", body.accumulo_enabled ? "true" : "false");
    await setSetting("num_alloggi", body.num_alloggi.toString());
    await setSetting("is_configured", "true");

    // Elimina e ricrea alloggi
    await deleteAllAlloggi();
    const createdAlloggi: Alloggio[] = [];
    if (body.alloggi && Array.isArray(body.alloggi)) {
      for (const alloggio of body.alloggi) {
        if (alloggio.alloggio_id && alloggio.name) {
          const created = await createAlloggio(
            alloggio.alloggio_id,
            alloggio.name,
            alloggio.topic_prefix,
            alloggio.modbus_address
          );
          createdAlloggi.push(created);
        }
      }
    }

    // Elimina e ricrea lettori Modbus
    await deleteAllLettoriModbus();
    const createdLettori = [];
    if (body.lettori && Array.isArray(body.lettori)) {
      for (const lettore of body.lettori) {
        const created = await createLettoreModbus(
          lettore.reader_id,
          lettore.type,
          lettore.name,
          lettore.modbus_address,
          lettore.model || "6m",
          lettore.alloggio_id
        );
        createdLettori.push(created);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Settings salvate con successo",
        alloggi: createdAlloggi,
        lettori: createdLettori,
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

// DELETE - Elimina completamente la configurazione dell'impianto
export async function DELETE() {
  try {
    // Elimina completamente tutti i dati dal database PostgreSQL
    await deleteAllSettings();

    // Resetta le settings principali
    await setSetting("produzione_fv", "false");
    await setSetting("accumulo_enabled", "false");
    await setSetting("num_alloggi", "0");
    await setSetting("is_configured", "false");

    return NextResponse.json({
      success: true,
      data: { message: "Configurazione impianto eliminata completamente" },
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

