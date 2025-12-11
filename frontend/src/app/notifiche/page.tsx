"use client";

import { TeslaSidebar } from "@/components/shared/TeslaSidebar";
import { TeslaTopBar } from "@/components/shared/TeslaTopBar";

export default function NotifichePage() {
  return (
    <div className="h-screen w-full overflow-hidden" style={{ backgroundColor: "#252525" }}>
      <TeslaSidebar />
      <TeslaTopBar notifications={0} />
      
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-x-auto overflow-y-hidden" style={{ marginTop: "96px", marginLeft: "128px", height: "calc(100vh - 96px)", maxHeight: "calc(100vh - 96px)", touchAction: "pan-x" }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h1 className="text-2xl font-semibold mb-2" style={{ color: "#fefefe" }}>
              Notifiche e Avvisi
            </h1>
            <p className="text-sm" style={{ color: "#818181" }}>
              Pagina in sviluppo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

