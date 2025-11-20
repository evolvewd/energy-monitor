// app/test-vanilla/page.tsx
"use client";

import { useEffect, useRef } from "react";

export default function TestVanillaPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let updateCount = 0;
    let intervalId: NodeJS.Timeout | null = null;
    let isRunning = true;

    const updateUI = (data: any) => {
      if (!containerRef.current) return;

      updateCount++;
      containerRef.current.innerHTML = `
        <div style="padding: 20px; font-family: monospace;">
          <h1>Test Vanilla JavaScript</h1>
          <p><strong>Update Count:</strong> ${updateCount}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Status:</strong> ${isRunning ? "Running" : "Stopped"}</p>
          <p><strong>Data Points:</strong> ${data?.data?.length || 0}</p>
          <hr>
          <button id="toggleBtn">${isRunning ? "Stop" : "Start"}</button>
          <button id="resetBtn">Reset</button>
          <hr>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; max-height: 200px; overflow: auto;">
${JSON.stringify(data?.latest || {}, null, 2)}
          </pre>
        </div>
      `;

      // Re-attach event listeners
      const toggleBtn = containerRef.current.querySelector("#toggleBtn");
      const resetBtn = containerRef.current.querySelector("#resetBtn");

      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          isRunning = !isRunning;
          if (isRunning) {
            startInterval();
          } else {
            stopInterval();
          }
        });
      }

      if (resetBtn) {
        resetBtn.addEventListener("click", () => {
          updateCount = 0;
          fetchData();
        });
      }
    };

    const fetchData = async () => {
      try {
        console.log("🔄 [VANILLA] Fetching data at:", new Date().toISOString());

        const response = await fetch("/api/influx/opta-realtime", {
          method: "GET",
          headers: { "Cache-Control": "no-cache" },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        console.log("✅ [VANILLA] Data received:", {
          updateCount,
          points: result.data?.length || 0,
          timestamp: new Date().toISOString(),
        });

        updateUI(result);
      } catch (err) {
        console.error("❌ [VANILLA] Error:", err);
        updateUI({
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    };

    const startInterval = () => {
      console.log("🚀 [VANILLA] Starting interval...");
      fetchData(); // Initial fetch
      intervalId = setInterval(() => {
        console.log("⏰ [VANILLA] Interval tick at:", new Date().toISOString());
        fetchData();
      }, 1000);
    };

    const stopInterval = () => {
      console.log("⏹️ [VANILLA] Stopping interval...");
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Start the process
    startInterval();

    // Cleanup function
    return () => {
      console.log("🧹 [VANILLA] Cleanup...");
      stopInterval();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        padding: "20px",
        fontFamily: "monospace",
      }}
    >
      Loading vanilla test...
    </div>
  );
}
