// lib/yaml-settings.ts
// Gestione settings usando YAML (sostituisce postgres-settings.ts)

import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';

// Path del file YAML - supporta variabile d'ambiente o path assoluto
const YAML_CONFIG_PATH = process.env.YAML_CONFIG_PATH || 
  '/home/energymonitor/apps/energy-monitor/config/plant.yaml';

// Cache per evitare letture multiple del file
let configCache: any = null;
let configCacheTime = 0;
const CACHE_TTL = 5000; // 5 secondi

// ========== UTILITY FUNCTIONS ==========

export function loadConfig(): any {
  const now = Date.now();
  
  // Usa cache se valida
  if (configCache && (now - configCacheTime) < CACHE_TTL) {
    return configCache;
  }
  
  try {
    const fileContents = fs.readFileSync(YAML_CONFIG_PATH, 'utf8');
    const config = yaml.load(fileContents) as any;
    configCache = config;
    configCacheTime = now;
    return config;
  } catch (error) {
    console.error('Error loading YAML config:', error);
    throw error;
  }
}

function saveConfig(config: any): void {
  try {
    const yamlStr = yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });
    fs.writeFileSync(YAML_CONFIG_PATH, yamlStr, 'utf8');
    
    // Invalida cache
    configCache = null;
    configCacheTime = 0;
  } catch (error) {
    console.error('Error saving YAML config:', error);
    throw error;
  }
}

// ========== SYSTEM SETTINGS ==========

export async function getSetting(key: string): Promise<string | null> {
  try {
    const config = loadConfig();
    const settings = config?.plant?.settings;
    
    if (!settings) return null;
    
    // Mappa chiavi legacy a nuove posizioni
    const keyMap: Record<string, string> = {
      'location_city': 'plant.location',
      'location_address': 'plant.name',
      'is_configured': 'plant.settings.is_configured',
      'produzione_fv': 'plant.settings.produzione_fv',
      'accumulo_enabled': 'plant.settings.accumulo_enabled',
      'num_alloggi': 'plant.utilities.num_alloggi',
      'weather_api_key': 'plant.settings.weather.api_key',
    };
    
    // Se è una chiave mappata, usa il path completo
    if (keyMap[key]) {
      const pathParts = keyMap[key].split('.');
      let value: any = config;
      for (const part of pathParts) {
        value = value?.[part];
        if (value === undefined) return null;
      }
      return String(value);
    }
    
    // Altrimenti cerca direttamente in settings
    if (key in settings) {
      const value = settings[key];
      return value !== null && value !== undefined ? String(value) : null;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const config = loadConfig();
    
    if (!config.plant) {
      config.plant = {};
    }
    if (!config.plant.settings) {
      config.plant.settings = {};
    }
    
    // Mappa chiavi legacy a nuove posizioni
    const keyMap: Record<string, string[]> = {
      'location_city': ['plant', 'location'],
      'location_address': ['plant', 'name'],
      'is_configured': ['plant', 'settings', 'is_configured'],
      'produzione_fv': ['plant', 'settings', 'produzione_fv'],
      'accumulo_enabled': ['plant', 'settings', 'accumulo_enabled'],
      'num_alloggi': ['plant', 'utilities', 'num_alloggi'],
      'weather_api_key': ['plant', 'settings', 'weather', 'api_key'],
    };
    
    if (keyMap[key]) {
      const pathParts = keyMap[key];
      let obj: any = config;
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!obj[part]) {
          obj[part] = {};
        }
        obj = obj[part];
      }
      const lastKey = pathParts[pathParts.length - 1];
      
      // Converti valore se necessario
      if (key === 'is_configured' || key === 'produzione_fv' || key === 'accumulo_enabled') {
        obj[lastKey] = value === 'true';
      } else if (key === 'num_alloggi') {
        obj[lastKey] = parseInt(value, 10) || 0;
      } else {
        obj[lastKey] = value;
      }
    } else {
      // Salva direttamente in settings
      config.plant.settings[key] = value;
    }
    
    saveConfig(config);
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const config = loadConfig();
    const settings: Record<string, string> = {};
    
    // Estrai tutte le settings rilevanti
    if (config.plant?.settings) {
      const s = config.plant.settings;
      settings.is_configured = String(s.is_configured || false);
      settings.produzione_fv = String(s.produzione_fv || false);
      settings.accumulo_enabled = String(s.accumulo_enabled || false);
      
      if (s.weather?.api_key) {
        settings.weather_api_key = s.weather.api_key;
      }
    }
    
    if (config.plant?.location) {
      settings.location_city = config.plant.location;
    }
    
    if (config.plant?.name) {
      settings.location_address = config.plant.name;
    }
    
    if (config.plant?.utilities?.num_alloggi !== undefined) {
      settings.num_alloggi = String(config.plant.utilities.num_alloggi);
    }
    
    return settings;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
}

// ========== ALLOGGI ==========
// NOTA: Gli alloggi sono configurati nel file plant.yaml (sezione utilities.alloggi).
// Questa funzione legge solo per visualizzazione. Le modifiche devono essere fatte nel YAML.

export interface Alloggio {
  alloggio_id: string;
  name: string;
  topic_prefix: string | null;
  modbus_address?: number;
  updated_at?: string;
}

export async function getAlloggi(): Promise<Alloggio[]> {
  try {
    const config = loadConfig();
    const alloggi = config?.plant?.utilities?.alloggi || [];
    
    return alloggi.map((a: any) => ({
      alloggio_id: a.alloggio_id || a.id,
      name: a.name,
      topic_prefix: a.topic_prefix || `alloggio_${a.alloggio_id || a.id}`,
      modbus_address: a.modbus_address,
      updated_at: a.updated_at,
    }));
  } catch (error) {
    console.error('Error getting alloggi:', error);
    return [];
  }
}

export async function getAlloggio(id: string): Promise<Alloggio | null> {
  try {
    const alloggi = await getAlloggi();
    return alloggi.find(a => a.alloggio_id === id) || null;
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
  try {
    const config = loadConfig();
    
    if (!config.plant) config.plant = {};
    if (!config.plant.utilities) config.plant.utilities = {};
    if (!config.plant.utilities.alloggi) config.plant.utilities.alloggi = [];
    
    const topic = topic_prefix || `alloggio_${alloggio_id}`;
    const alloggio = {
      alloggio_id,
      name,
      topic_prefix: topic,
      modbus_address: modbus_address || null,
    };
    
    // Rimuovi se esiste già
    config.plant.utilities.alloggi = config.plant.utilities.alloggi.filter(
      (a: any) => (a.alloggio_id || a.id) !== alloggio_id
    );
    
    // Aggiungi nuovo
    config.plant.utilities.alloggi.push(alloggio);
    config.plant.utilities.num_alloggi = config.plant.utilities.alloggi.length;
    
    saveConfig(config);
    
    return {
      alloggio_id,
      name,
      topic_prefix: topic,
      modbus_address,
    };
  } catch (error) {
    console.error('Error creating alloggio:', error);
    throw error;
  }
}

export async function updateAlloggio(
  alloggio_id: string,
  name: string,
  topic_prefix?: string,
  modbus_address?: number
): Promise<Alloggio | null> {
  return createAlloggio(alloggio_id, name, topic_prefix, modbus_address);
}

export async function deleteAlloggio(alloggio_id: string): Promise<void> {
  try {
    const config = loadConfig();
    
    if (config.plant?.utilities?.alloggi) {
      config.plant.utilities.alloggi = config.plant.utilities.alloggi.filter(
        (a: any) => (a.alloggio_id || a.id) !== alloggio_id
      );
      config.plant.utilities.num_alloggi = config.plant.utilities.alloggi.length;
      saveConfig(config);
    }
  } catch (error) {
    console.error('Error deleting alloggio:', error);
    throw error;
  }
}

export async function deleteAllAlloggi(): Promise<void> {
  try {
    const config = loadConfig();
    
    if (config.plant?.utilities) {
      config.plant.utilities.alloggi = [];
      config.plant.utilities.num_alloggi = 0;
      saveConfig(config);
    }
  } catch (error) {
    console.error('Error deleting all alloggi:', error);
    throw error;
  }
}

// ========== MODBUS READERS ==========
// NOTA: I lettori Modbus sono configurati nel file plant.yaml e gestiti da Node-RED.
// Questa funzione estrae i lettori dal YAML per visualizzazione nel frontend.
// Le modifiche ai lettori devono essere fatte direttamente nel file YAML.

export interface LettoreModbus {
  reader_id: string;
  type: 'parti_comuni' | 'produzione' | 'accumulo_ac' | 'accumulo_dc' | 'alloggio';
  name: string;
  modbus_address: number;
  model: '6m' | '7m';
  alloggio_id?: string;
  updated_at?: string;
}

export async function getLettoriModbus(): Promise<LettoreModbus[]> {
  // Estrae automaticamente tutti i lettori Modbus configurati nel YAML
  try {
    const config = loadConfig();
    const lettori: LettoreModbus[] = [];
    
    // Estrai stringhe
    if (config.plant?.pv_system?.strings) {
      config.plant.pv_system.strings.forEach((str: any) => {
        lettori.push({
          reader_id: str.id,
          type: 'produzione',
          name: str.name,
          modbus_address: str.finder_modbus_address,
          model: str.finder_model || '6m',
        });
      });
    }
    
    // Estrai inverter
    if (config.plant?.pv_system?.inverter?.finder_modbus_address) {
      lettori.push({
        reader_id: 'inverter',
        type: 'produzione',
        name: config.plant.pv_system.inverter.model || 'Inverter',
        modbus_address: config.plant.pv_system.inverter.finder_modbus_address,
        model: config.plant.pv_system.inverter.finder_model || '6m',
      });
    }
    
    // Estrai solarimetro
    if (config.plant?.solarimeter?.modbus_address && !config.plant.solarimeter.simulation) {
      lettori.push({
        reader_id: 'solarimeter',
        type: 'produzione',
        name: 'Solarimetro',
        modbus_address: config.plant.solarimeter.modbus_address,
        model: config.plant.solarimeter.finder_model || '6m',
      });
    }
    
    // Estrai batteria
    if (config.plant?.battery?.enabled && config.plant.battery.finder_modbus_address) {
      lettori.push({
        reader_id: 'battery',
        type: 'accumulo_dc',
        name: 'Batteria',
        modbus_address: config.plant.battery.finder_modbus_address,
        model: config.plant.battery.finder_model || '6m',
      });
    }
    
    return lettori;
  } catch (error) {
    console.error('Error getting lettori modbus:', error);
    return [];
  }
}

export async function getLettoreModbus(reader_id: string): Promise<LettoreModbus | null> {
  try {
    const lettori = await getLettoriModbus();
    return lettori.find(l => l.reader_id === reader_id) || null;
  } catch (error) {
    console.error(`Error getting lettore modbus ${reader_id}:`, error);
    return null;
  }
}

// Funzioni create/update/delete per lettori Modbus non sono necessarie
// perché i lettori sono definiti direttamente nel YAML (stringhe, inverter, etc.)
// Se necessario in futuro, possiamo aggiungerle

// Funzioni di modifica lettori Modbus NON supportate
// I lettori Modbus (stringhe, inverter, solarimetro, batteria) sono configurati
// direttamente nel file plant.yaml e gestiti da Node-RED.
// Il frontend può solo leggerli per visualizzazione.

export async function createLettoreModbus(
  reader_id: string,
  type: 'parti_comuni' | 'produzione' | 'accumulo_ac' | 'accumulo_dc' | 'alloggio',
  name: string,
  modbus_address: number,
  model: '6m' | '7m' = '6m',
  alloggio_id?: string
): Promise<LettoreModbus> {
  throw new Error('I lettori Modbus devono essere configurati nel file plant.yaml. Modifica il file YAML e riavvia Node-RED.');
}

export async function updateLettoreModbus(
  reader_id: string,
  name: string,
  modbus_address: number,
  model: '6m' | '7m' = '6m'
): Promise<LettoreModbus | null> {
  throw new Error('I lettori Modbus devono essere configurati nel file plant.yaml. Modifica il file YAML e riavvia Node-RED.');
}

export async function deleteLettoreModbus(reader_id: string): Promise<void> {
  throw new Error('I lettori Modbus devono essere configurati nel file plant.yaml. Modifica il file YAML e riavvia Node-RED.');
}

export async function deleteAllLettoriModbus(): Promise<void> {
  throw new Error('I lettori Modbus devono essere configurati nel file plant.yaml. Modifica il file YAML e riavvia Node-RED.');
}

// ========== DELETE ALL SETTINGS ==========
// NOTA: Questa funzione resetta solo le settings di sistema, non la configurazione dell'impianto
// La configurazione dell'impianto (stringhe, inverter, etc.) rimane nel YAML

export async function deleteAllSettings(): Promise<void> {
  try {
    const config = loadConfig();
    
    // Reset solo settings di sistema
    if (config.plant?.settings) {
      config.plant.settings.is_configured = false;
      config.plant.settings.produzione_fv = false;
      config.plant.settings.accumulo_enabled = false;
      if (config.plant.settings.weather) {
        config.plant.settings.weather.api_key = "";
      }
    }
    
    // NOTA: Non resettiamo utilities.alloggi perché potrebbero essere configurati nel YAML
    // e gestiti da Node-RED
    
    saveConfig(config);
  } catch (error) {
    console.error('Error deleting all settings:', error);
    throw error;
  }
}

