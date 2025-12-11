import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/yaml-settings";

export async function GET() {
  try {
    const config = loadConfig();
    console.log("Config loaded:", config ? "yes" : "no");
    console.log("Plant config:", config?.plant ? "yes" : "no");
    
    if (!config || !config.plant) {
      console.log("Using default values - config or plant not found");
      return NextResponse.json({
        success: true,
        data: {
          name: "Energy Monitor System",
          location: "Impianto Fotovoltaico",
        },
      });
    }
    
    const plantInfo = {
      name: config.plant.name || "Energy Monitor System",
      location: config.plant.location || "Impianto Fotovoltaico",
    };

    console.log("Plant info:", plantInfo);
    return NextResponse.json({
      success: true,
      data: plantInfo,
    });
  } catch (error: any) {
    console.error("Error loading plant info:", error);
    console.error("Error details:", error.message);
    // Restituisci valori di default invece di errore
    return NextResponse.json({
      success: true,
      data: {
        name: "Energy Monitor System",
        location: "Impianto Fotovoltaico",
      },
    });
  }
}

