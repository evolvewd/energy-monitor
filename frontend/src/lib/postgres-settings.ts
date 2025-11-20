// lib/postgres-settings.ts
// Gestione settings usando PostgreSQL (sostituisce influx-settings.ts)

import { query, transaction } from './db';

// ========== SYSTEM SETTINGS ==========

export async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );
    return result.rows.length > 0 ? result.rows[0].value : null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO system_settings (key, value) 
     VALUES ($1, $2) 
     ON CONFLICT (key) 
     DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP`,
    [key, value]
  );
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const result = await query('SELECT key, value FROM system_settings');
    const settings: Record<string, string> = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    return settings;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
}

// ========== ALLOGGI ==========

export interface Alloggio {
  alloggio_id: string;
  name: string;
  topic_prefix: string | null;
  modbus_address?: number;
  updated_at?: string;
}

export async function getAlloggi(): Promise<Alloggio[]> {
  try {
    const result = await query(
      'SELECT alloggio_id, name, topic_prefix, modbus_address, updated_at FROM alloggi ORDER BY alloggio_id'
    );
    return result.rows.map((row) => ({
      alloggio_id: row.alloggio_id,
      name: row.name,
      topic_prefix: row.topic_prefix,
      modbus_address: row.modbus_address || undefined,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Error getting alloggi:', error);
    return [];
  }
}

export async function getAlloggio(id: string): Promise<Alloggio | null> {
  try {
    const result = await query(
      'SELECT alloggio_id, name, topic_prefix, modbus_address, updated_at FROM alloggi WHERE alloggio_id = $1',
      [id]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      alloggio_id: row.alloggio_id,
      name: row.name,
      topic_prefix: row.topic_prefix,
      modbus_address: row.modbus_address || undefined,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error(`Error getting alloggio ${id}:`, error);
    return null;
  }
}

export async function createAlloggio(
  alloggio_id: string,
  name: string,
  topic_prefix?: string,
  modbus_address?: number
): Promise<Alloggio> {
  const topic = topic_prefix || `alloggio_${alloggio_id}`;
  
  await query(
    `INSERT INTO alloggi (alloggio_id, name, topic_prefix, modbus_address) 
     VALUES ($1, $2, $3, $4) 
     ON CONFLICT (alloggio_id) 
     DO UPDATE SET name = $2, topic_prefix = $3, modbus_address = $4, updated_at = CURRENT_TIMESTAMP`,
    [alloggio_id, name, topic, modbus_address || null]
  );

  return {
    alloggio_id,
    name,
    topic_prefix: topic,
    modbus_address,
  };
}

export async function updateAlloggio(
  alloggio_id: string,
  name: string,
  topic_prefix?: string,
  modbus_address?: number
): Promise<Alloggio | null> {
  const topic = topic_prefix || `alloggio_${alloggio_id}`;
  
  await query(
    `UPDATE alloggi 
     SET name = $1, topic_prefix = $2, modbus_address = $3, updated_at = CURRENT_TIMESTAMP 
     WHERE alloggio_id = $4`,
    [name, topic, modbus_address || null, alloggio_id]
  );

  return getAlloggio(alloggio_id);
}

export async function deleteAlloggio(alloggio_id: string): Promise<void> {
  await query('DELETE FROM alloggi WHERE alloggio_id = $1', [alloggio_id]);
}

export async function deleteAllAlloggi(): Promise<void> {
  await query('DELETE FROM alloggi');
}

// ========== MODBUS READERS ==========

export interface LettoreModbus {
  reader_id: string;
  type: 'parti_comuni' | 'produzione' | 'accumulo_ac' | 'accumulo_dc' | 'alloggio';
  name: string;
  modbus_address: number;
  alloggio_id?: string;
  updated_at?: string;
}

export async function getLettoriModbus(): Promise<LettoreModbus[]> {
  try {
    const result = await query(
      'SELECT reader_id, type, name, modbus_address, alloggio_id, updated_at FROM modbus_readers ORDER BY reader_id'
    );
    return result.rows.map((row) => ({
      reader_id: row.reader_id,
      type: row.type,
      name: row.name,
      modbus_address: row.modbus_address,
      alloggio_id: row.alloggio_id || undefined,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('Error getting lettori modbus:', error);
    return [];
  }
}

export async function getLettoreModbus(reader_id: string): Promise<LettoreModbus | null> {
  try {
    const result = await query(
      'SELECT reader_id, type, name, modbus_address, alloggio_id, updated_at FROM modbus_readers WHERE reader_id = $1',
      [reader_id]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      reader_id: row.reader_id,
      type: row.type,
      name: row.name,
      modbus_address: row.modbus_address,
      alloggio_id: row.alloggio_id || undefined,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error(`Error getting lettore modbus ${reader_id}:`, error);
    return null;
  }
}

export async function createLettoreModbus(
  reader_id: string,
  type: 'parti_comuni' | 'produzione' | 'accumulo_ac' | 'accumulo_dc' | 'alloggio',
  name: string,
  modbus_address: number,
  alloggio_id?: string
): Promise<LettoreModbus> {
  await query(
    `INSERT INTO modbus_readers (reader_id, type, name, modbus_address, alloggio_id) 
     VALUES ($1, $2, $3, $4, $5) 
     ON CONFLICT (reader_id) 
     DO UPDATE SET type = $2, name = $3, modbus_address = $4, alloggio_id = $5, updated_at = CURRENT_TIMESTAMP`,
    [reader_id, type, name, modbus_address, alloggio_id || null]
  );

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
  await query(
    `UPDATE modbus_readers 
     SET name = $1, modbus_address = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE reader_id = $3`,
    [name, modbus_address, reader_id]
  );

  return getLettoreModbus(reader_id);
}

export async function deleteLettoreModbus(reader_id: string): Promise<void> {
  await query('DELETE FROM modbus_readers WHERE reader_id = $1', [reader_id]);
}

export async function deleteAllLettoriModbus(): Promise<void> {
  await query('DELETE FROM modbus_readers');
}

// ========== DELETE ALL SETTINGS ==========

export async function deleteAllSettings(): Promise<void> {
  await transaction(async (client) => {
    await client.query('DELETE FROM modbus_readers');
    await client.query('DELETE FROM alloggi');
    await client.query('DELETE FROM system_settings');
  });
}

