# Nuova Architettura Energy Monitor

## Panoramica

Sistema semplificato per supervisione impianto fotovoltaico con accumulo e utenze.

## Architettura

```
Arduino Opta / Finder 6M
  ↓ (Modbus)
  ↓
MQTT (Mosquitto)
  Topic: energy/{device_type}/{device_id}/{field}
  ↓
Node-RED
  ├─ Flow: Simulazione Solarimetro
  ├─ Flow: MQTT → InfluxDB
  ├─ Flow: Calcolo PR
  └─ Flow: Rilevamento Anomalie
  ↓
InfluxDB
  Bucket: "energy"
  Measurements: production, pr, alerts
  ↓
Frontend Next.js
  API Routes → Query InfluxDB
```

## Configurazione

Tutta la configurazione è in `config/plant.yaml`:

- Parametri impianto (potenza, superficie, efficienza)
- Configurazione stringhe FV
- Configurazione inverter
- Frequenze letture
- Soglie anomalie
- Parametri simulazione solarimetro

## Flow Node-RED

### 1. Config Loader
- Carica `config/plant.yaml` all'avvio
- Rende configurazione disponibile in `global.get('plantConfig')`

### 2. Solarimetro Simulazione
- Genera irraggiamento realistico con profilo giornaliero
- Pubblica su MQTT: `energy/solarimeter/main/irradiance`
- Salva in InfluxDB: measurement `production`, tag `device_type=solarimeter`

### 3. MQTT to InfluxDB
- Riceve dati da MQTT (stringhe, inverter, solarimetro)
- Parse topic: `energy/{device_type}/{device_id}/{field}`
- Salva in InfluxDB: measurement `production`

### 4. Calcolo PR
- Esegue ogni 5 minuti
- Calcola: PR = Energia_prodotta / Energia_teorica
- Salva in InfluxDB: measurement `pr`

### 5. Rilevamento Anomalie
- Controlla tensioni stringhe ogni 60s
- Rileva deviazioni dalla media
- Genera alert in InfluxDB: measurement `alerts`

## Struttura Dati InfluxDB

### Measurement: `production`
**Tags:**
- `device_type`: `solarimeter` | `string` | `inverter`
- `device_id`: `main` | `string_1` | `string_2` | ...

**Fields:**
- Solarimetro: `irradiance` (W/m²), `temperature` (°C)
- Stringhe: `voltage` (V)
- Inverter: `power_active` (W), `voltage_ac` (V), `current_ac` (A), `energy_today` (kWh), `energy_total` (kWh)

### Measurement: `pr`
**Tags:**
- `calculation_type`: `realtime`

**Fields:**
- `pr` (%)
- `energy_produced` (kWh)
- `energy_theoretical` (kWh)
- `irradiance_avg` (W/m²)

### Measurement: `alerts`
**Tags:**
- `alert_type`: `string_anomaly` | `string_voltage_range` | `low_pr` | `inverter_fault`
- `severity`: `warning` | `error`
- `device_id`: ID dispositivo

**Fields:**
- `message` (string)
- `value` (number)
- `threshold` (number)

## Setup

### 1. Installare dipendenze Node-RED
```bash
cd nodered/data
npm install
```

### 2. Pulire InfluxDB
```bash
./scripts/clean_influxdb.sh
```

### 3. Riavviare Node-RED
```bash
docker-compose restart nodered
```

### 4. Verificare flow
- Aprire http://localhost:1880
- Verificare che tutti i flow siano attivi
- Controllare log per errori

## Topic MQTT

### Formato
`energy/{device_type}/{device_id}/{field}`

### Esempi
- `energy/solarimeter/main/irradiance` - Irraggiamento solare
- `energy/string/string_1/voltage` - Tensione stringa 1
- `energy/inverter/main/power_active` - Potenza attiva inverter
- `energy/inverter/main/energy_today` - Energia giornaliera

### Payload
```json
{
  "irradiance": 850.5,
  "temperature": 25.3,
  "timestamp": "2025-01-27T12:00:00Z"
}
```

Oppure valore singolo:
```json
445.2
```

## Prossimi Passi

1. ✅ Configurazione YAML
2. ✅ Flow Node-RED base
3. ✅ Pulizia InfluxDB
4. ⏳ Frontend - API routes con aggregazioni
5. ⏳ Frontend - Dashboard supervisione
6. ⏳ Integrazione Arduino Opta reale
7. ⏳ Query InfluxDB reali per calcolo PR

