// lib/influx-settings.ts
// Gestione settings usando InfluxDB

const INFLUX_URL = process.env.NEXT_PUBLIC_INFLUX_URL || "http://localhost:8086";
const TOKEN = process.env.NEXT_PUBLIC_INFLUX_TOKEN || "energy-monitor-super-secret-token-change-this";
const ORG = process.env.NEXT_PUBLIC_INFLUX_ORG || "assistec";
const BUCKET = "opta"; // Bucket per i dati time-series
const SETTINGS_BUCKET = "settings"; // Bucket separato per le configurazioni

// Helper per scrivere in InfluxDB (Line Protocol)
// Usa SETTINGS_BUCKET per le configurazioni, BUCKET per i dati time-series
async function writeToInflux(measurement: string, tags: Record<string, string>, fields: Record<string, string | number | boolean>, useSettingsBucket: boolean = false) {
  const timestamp = Date.now() * 1000000; // Nanosecondi
  const bucket = useSettingsBucket ? SETTINGS_BUCKET : BUCKET;
  
  // Costruisci Line Protocol
  const tagStr = Object.entries(tags)
    .map(([k, v]) => `${k}=${String(v).replace(/\s/g, "\\ ")}`)
    .join(",");
  
  const fieldStr = Object.entries(fields)
    .map(([k, v]) => {
      if (typeof v === "string") {
        return `${k}="${v.replace(/"/g, '\\"')}"`;
      } else if (typeof v === "boolean") {
        return `${k}=${v}`;
      } else {
        return `${k}=${v}`;
      }
    })
    .join(",");
  
  const line = `${measurement}${tagStr ? "," + tagStr : ""} ${fieldStr} ${timestamp}`;
  
  const response = await fetch(`${INFLUX_URL}/api/v2/write?org=${ORG}&bucket=${bucket}&precision=ns`, {
    method: "POST",
    headers: {
      Authorization: `Token ${TOKEN}`,
      "Content-Type": "text/plain; charset=utf-8",
    },
    body: line,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`InfluxDB write failed: ${response.status} - ${errorText}`);
  }
}

// Helper per leggere da InfluxDB (Flux query)
// useSettingsBucket: se true, sostituisce automaticamente il bucket nella query
async function queryInflux(fluxQuery: string, useSettingsBucket: boolean = false): Promise<any[]> {
  // Se useSettingsBucket è true, sostituisci il bucket nella query
  let finalQuery = fluxQuery;
  if (useSettingsBucket) {
    finalQuery = fluxQuery.replace(/bucket:\s*"[^"]+"/g, `bucket: "${SETTINGS_BUCKET}"`);
  }
  
  const response = await fetch(`${INFLUX_URL}/api/v2/query?org=${ORG}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${TOKEN}`,
      "Content-Type": "application/vnd.flux",
      Accept: "application/csv",
    },
    body: finalQuery,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`InfluxDB query failed: ${response.status} - ${errorText}`);
  }

  const csvData = await response.text();
  if (!csvData || csvData.trim().length === 0) {
    return [];
  }

  const lines = csvData.trim().split("\n");
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",");
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || "";
    });
    data.push(row);
  }

  return data;
}

// ========== SYSTEM SETTINGS ==========

export async function getSetting(key: string): Promise<string | null> {
  try {
    const fluxQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "system_settings")
        |> filter(fn: (r) => r["key"] == "${key}")
        |> last()
    `;

    const data = await queryInflux(fluxQuery, true);
    if (data.length === 0) return null;
    
    const valueRow = data.find((r) => r._field === "value");
    return valueRow?._value || null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await writeToInflux(
    "system_settings",
    { key },
    { value },
    true // Usa il bucket settings
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const fluxQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "system_settings")
        |> last()
        |> group(columns: ["key"])
    `;

    const data = await queryInflux(fluxQuery, true);
    const settings: Record<string, string> = {};

    // Raggruppa per key e prendi l'ultimo valore
    const keyGroups: Record<string, any> = {};
    data.forEach((row) => {
      const key = row.key;
      if (!keyGroups[key] || new Date(row._time) > new Date(keyGroups[key]._time)) {
        keyGroups[key] = row;
      }
    });

    Object.values(keyGroups).forEach((row: any) => {
      if (row._field === "value") {
        settings[row.key] = row._value;
      }
    });

    return settings;
  } catch (error) {
    console.error("Error getting all settings:", error);
    return {};
  }
}

// ========== ALLOGGI ==========

export interface Alloggio {
  alloggio_id: string;
  name: string;
  topic_prefix: string | null;
  updated_at?: string;
}

export async function getAlloggi(): Promise<Alloggio[]> {
  try {
    // Query separate per ogni campo per evitare collisioni di schema
    // Query per i nomi (string) - escludi quelli deleted
    const nameQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "alloggi")
        |> filter(fn: (r) => r["_field"] == "name")
        |> filter(fn: (r) => not exists r.deleted or r.deleted != "true")
        |> last()
        |> group(columns: ["alloggio_id"])
    `;

    // Query per i topic prefix (string) - escludi quelli deleted
    const topicQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "alloggi")
        |> filter(fn: (r) => r["_field"] == "topic_prefix")
        |> filter(fn: (r) => not exists r.deleted or r.deleted != "true")
        |> last()
        |> group(columns: ["alloggio_id"])
    `;

    const [nameData, topicData] = await Promise.all([
      queryInflux(nameQuery, true),
      queryInflux(topicQuery, true),
    ]);

    const alloggiMap: Record<string, Alloggio> = {};

    // Processa i nomi
    nameData.forEach((row: any) => {
      if (!row.alloggio_id) return;
      if (!alloggiMap[row.alloggio_id]) {
        alloggiMap[row.alloggio_id] = {
          alloggio_id: row.alloggio_id,
          name: "",
          topic_prefix: null,
        };
      }
      alloggiMap[row.alloggio_id].name = String(row._value || "");
      alloggiMap[row.alloggio_id].updated_at = row._time;
    });

    // Processa i topic prefix
    topicData.forEach((row: any) => {
      if (!row.alloggio_id) return;
      if (!alloggiMap[row.alloggio_id]) {
        alloggiMap[row.alloggio_id] = {
          alloggio_id: row.alloggio_id,
          name: "",
          topic_prefix: null,
        };
      }
      alloggiMap[row.alloggio_id].topic_prefix = row._value ? String(row._value) : null;
      if (row._time && (!alloggiMap[row.alloggio_id].updated_at || new Date(row._time) > new Date(alloggiMap[row.alloggio_id].updated_at || ""))) {
        alloggiMap[row.alloggio_id].updated_at = row._time;
      }
    });

    return Object.values(alloggiMap).sort((a, b) => 
      parseInt(a.alloggio_id) - parseInt(b.alloggio_id)
    );
  } catch (error) {
    console.error("Error getting alloggi:", error);
    return [];
  }
}

export async function getAlloggio(id: string): Promise<Alloggio | null> {
  const alloggi = await getAlloggi();
  return alloggi.find((a) => a.alloggio_id === id) || null;
}

export async function createAlloggio(
  alloggio_id: string,
  name: string,
  topic_prefix?: string
): Promise<Alloggio> {
  const topic = topic_prefix || `alloggio_${alloggio_id}`;
  
  // Scrivi name e topic_prefix come campi separati
  await writeToInflux("alloggi", { alloggio_id }, { name }, true);
  await writeToInflux("alloggi", { alloggio_id }, { topic_prefix: topic }, true);

  return {
    alloggio_id,
    name,
    topic_prefix: topic,
  };
}

export async function updateAlloggio(
  alloggio_id: string,
  name: string,
  topic_prefix?: string
): Promise<Alloggio | null> {
  const topic = topic_prefix || `alloggio_${alloggio_id}`;
  
  await writeToInflux("alloggi", { alloggio_id }, { name }, true);
  await writeToInflux("alloggi", { alloggio_id }, { topic_prefix: topic }, true);

  return getAlloggio(alloggio_id);
}

// Helper per eliminare dati da InfluxDB usando l'API DELETE
export async function deleteFromInflux(measurement: string, predicate?: string, useSettingsBucket: boolean = false): Promise<void> {
  const start = "1970-01-01T00:00:00Z";
  const stop = new Date().toISOString();
  const bucket = useSettingsBucket ? SETTINGS_BUCKET : BUCKET;
  
  // Costruisci il predicato per filtrare i dati
  let deletePredicate = `_measurement="${measurement}"`;
  if (predicate) {
    deletePredicate += ` AND ${predicate}`;
  }

  const url = `${INFLUX_URL}/api/v2/delete?org=${ORG}&bucket=${bucket}&start=${start}&stop=${stop}&predicate=${encodeURIComponent(deletePredicate)}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${TOKEN}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`InfluxDB delete failed: ${response.status} - ${errorText}`);
    // Non lanciare errore, continua anche se la delete fallisce
  }
}

export async function deleteAlloggio(alloggio_id: string): Promise<void> {
  // Elimina completamente i dati dell'alloggio
  await deleteFromInflux("alloggi", `alloggio_id="${alloggio_id}"`, true);
}

export async function deleteAllAlloggi(): Promise<void> {
  // Elimina completamente tutti i dati degli alloggi
  await deleteFromInflux("alloggi", undefined, true);
}

// ========== MODBUS READERS CONFIG ==========

export interface LettoreModbus {
  reader_id: string;
  type: "parti_comuni" | "produzione" | "accumulo_ac" | "accumulo_dc" | "alloggio";
  name: string;
  modbus_address: number;
  alloggio_id?: string;
  updated_at?: string;
}

export async function getLettoriModbus(): Promise<LettoreModbus[]> {
  try {
    // Query separata per ogni campo per evitare collisioni di schema
    // Query per i nomi (string) - escludi quelli deleted
    const nameQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "modbus_readers")
        |> filter(fn: (r) => r["_field"] == "name")
        |> filter(fn: (r) => not exists r.deleted or r.deleted != "true")
        |> last()
        |> group(columns: ["reader_id"])
    `;

    // Query per gli indirizzi Modbus (number) - escludi quelli deleted
    const addressQuery = `
      from(bucket: "${SETTINGS_BUCKET}")
        |> range(start: -1y)
        |> filter(fn: (r) => r["_measurement"] == "modbus_readers")
        |> filter(fn: (r) => r["_field"] == "modbus_address")
        |> filter(fn: (r) => not exists r.deleted or r.deleted != "true")
        |> last()
        |> group(columns: ["reader_id"])
    `;

    const [nameData, addressData] = await Promise.all([
      queryInflux(nameQuery, true),
      queryInflux(addressQuery, true),
    ]);

    const lettoriMap: Record<string, LettoreModbus> = {};

    // Processa i nomi
    nameData.forEach((row: any) => {
      if (!row.reader_id) return;
      if (!lettoriMap[row.reader_id]) {
        lettoriMap[row.reader_id] = {
          reader_id: row.reader_id,
          type: (row.type as any) || "parti_comuni",
          name: "",
          modbus_address: 0,
        };
        if (row.alloggio_id) {
          lettoriMap[row.reader_id].alloggio_id = String(row.alloggio_id);
        }
      }
      lettoriMap[row.reader_id].name = String(row._value || "");
    });

    // Processa gli indirizzi
    addressData.forEach((row: any) => {
      if (!row.reader_id) return;
      if (!lettoriMap[row.reader_id]) {
        lettoriMap[row.reader_id] = {
          reader_id: row.reader_id,
          type: (row.type as any) || "parti_comuni",
          name: "",
          modbus_address: 0,
        };
        if (row.alloggio_id) {
          lettoriMap[row.reader_id].alloggio_id = String(row.alloggio_id);
        }
      }
      const numValue = typeof row._value === "number" 
        ? row._value 
        : parseFloat(String(row._value || "0")) || 0;
      lettoriMap[row.reader_id].modbus_address = numValue;
      
      // Aggiorna type e alloggio_id se presenti
      if (row.type && !lettoriMap[row.reader_id].type) {
        lettoriMap[row.reader_id].type = row.type as any;
      }
      if (row.alloggio_id && !lettoriMap[row.reader_id].alloggio_id) {
        lettoriMap[row.reader_id].alloggio_id = String(row.alloggio_id);
      }
    });

    // Ordina: parti_comuni, produzione, accumulo_ac, accumulo_dc, poi alloggi
    return Object.values(lettoriMap).sort((a, b) => {
      const order: Record<string, number> = {
        parti_comuni: 1,
        produzione: 2,
        accumulo_ac: 3,
        accumulo_dc: 4,
        alloggio: 5,
      };
      const aOrder = order[a.type] || 99;
      const bOrder = order[b.type] || 99;
      if (aOrder !== bOrder) return aOrder - bOrder;
      if (a.type === "alloggio" && b.type === "alloggio") {
        return parseInt(a.alloggio_id || "0") - parseInt(b.alloggio_id || "0");
      }
      return 0;
    });
  } catch (error) {
    console.error("Error getting modbus readers:", error);
    return [];
  }
}

export async function getLettoreModbus(reader_id: string): Promise<LettoreModbus | null> {
  const lettori = await getLettoriModbus();
  return lettori.find((l) => l.reader_id === reader_id) || null;
}

export async function createLettoreModbus(
  reader_id: string,
  type: "parti_comuni" | "produzione" | "accumulo_ac" | "accumulo_dc" | "alloggio",
  name: string,
  modbus_address: number,
  alloggio_id?: string
): Promise<LettoreModbus> {
  const tags: Record<string, string> = { reader_id, type };
  if (alloggio_id) {
    tags.alloggio_id = alloggio_id;
  }

  await writeToInflux("modbus_readers", tags, { name }, true);
  await writeToInflux("modbus_readers", tags, { modbus_address }, true);

  return {
    reader_id,
    type,
    name,
    modbus_address,
    alloggio_id,
  };
}

export async function updateLettoreModbus(
  reader_id: string,
  name: string,
  modbus_address: number
): Promise<LettoreModbus | null> {
  const existing = await getLettoreModbus(reader_id);
  if (!existing) return null;

  const tags: Record<string, string> = { reader_id, type: existing.type };
  if (existing.alloggio_id) {
    tags.alloggio_id = existing.alloggio_id;
  }

  await writeToInflux("modbus_readers", tags, { name }, true);
  await writeToInflux("modbus_readers", tags, { modbus_address }, true);

  return getLettoreModbus(reader_id);
}

export async function deleteLettoreModbus(reader_id: string): Promise<void> {
  // Elimina completamente i dati del lettore
  await deleteFromInflux("modbus_readers", `reader_id="${reader_id}"`, true);
}

export async function deleteAllLettoriModbus(): Promise<void> {
  // Elimina completamente tutti i dati dei lettori Modbus
  await deleteFromInflux("modbus_readers", undefined, true);
}

// Elimina tutte le settings del sistema
export async function deleteAllSettings(): Promise<void> {
  // Elimina completamente tutti i dati delle settings dal database
  await deleteFromInflux("system_settings", undefined, true);
}

