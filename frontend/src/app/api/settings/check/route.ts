// app/api/settings/check/route.ts
import { NextResponse } from "next/server";
import { getSetting } from "@/lib/postgres-settings";

// GET - Verifica se il sistema è configurato
export async function GET() {
  try {
    const isConfigured = (await getSetting("is_configured")) === "true";

    return NextResponse.json({
      success: true,
      isConfigured,
    });
  } catch (error) {
    console.error("Error checking configuration:", error);
    return NextResponse.json(
      {
        success: false,
        isConfigured: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

