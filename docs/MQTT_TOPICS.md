# Struttura Topic MQTT - Energy Monitor

## Pattern Request/Response

Il sistema usa un pattern **request/response** per tutti i dispositivi reali (stringhe, inverter, solarimetro reale, batteria).

### Flusso

1. **Node-RED pubblica richiesta**: `energy/request/{device_type}/{device_id}`
2. **Arduino Opta riceve richiesta** e legge dati Modbus
3. **Arduino Opta pubblica risposta**: `energy/response/{device_type}/{device_id}/{field}`

### Vantaggi

- ✅ Controllo frequenza letture da Node-RED
- ✅ Evita spam se Opta non è configurato
- ✅ Gestione timeout migliore
- ✅ Possibilità di letture on-demand

## Topic per Dispositivo

### Stringhe FV

**Request:**
```
energy/request/string/{string_id}
```
Esempio: `energy/request/string/string_1`

**Response:**
```
energy/response/string/{string_id}/voltage
```
Esempio: `energy/response/string/string_1/voltage`

**Payload Response:**
```json
{
  "voltage": 445.2,
  "timestamp": "2025-12-10T16:00:00Z"
}
```

### Inverter

**Request:**
```
energy/request/inverter/main
```

**Response (multiple):**
```
energy/response/inverter/main/power_active    # Potenza attiva (W)
energy/response/inverter/main/voltage_ac      # Tensione AC (V)
energy/response/inverter/main/current_ac      # Corrente AC (A)
energy/response/inverter/main/energy_today    # Energia giornaliera (kWh)
energy/response/inverter/main/energy_total    # Energia totale (kWh)
energy/response/inverter/main/status          # Stato inverter (codice)
```

**Payload Response (esempio):**
```json
{
  "power_active": 8500,
  "voltage_ac": 230.5,
  "current_ac": 36.8,
  "energy_today": 45.2,
  "energy_total": 12345.67,
  "status": 0,
  "timestamp": "2025-12-10T16:00:00Z"
}
```

### Solarimetro (Reale)

**Request:**
```
energy/request/solarimeter/main
```

**Response:**
```
energy/response/solarimeter/main/irradiance   # Irraggiamento (W/m²)
energy/response/solarimeter/main/temperature # Temperatura (°C)
```

**Payload Response:**
```json
{
  "irradiance": 850.5,
  "temperature": 25.3,
  "timestamp": "2025-12-10T16:00:00Z"
}
```

### Solarimetro (Simulato)

**Publish Continuo** (da Node-RED, non da Opta):
```
energy/solarimeter/main/irradiance
```

**Payload:**
```json
{
  "irradiance": 587.39,
  "temperature": 51.0,
  "timestamp": "2025-12-10T16:00:00Z"
}
```

### Batteria (Futuro)

**Request:**
```
energy/request/battery/main
```

**Response:**
```
energy/response/battery/main/soc       # State of Charge (%)
energy/response/battery/main/power     # Potenza carica/scarica (W, positivo=scarica)
energy/response/battery/main/voltage   # Tensione (V)
energy/response/battery/main/current   # Corrente (A)
```

## Payload Request

Il payload della richiesta può essere vuoto o contenere parametri opzionali:

```json
{
  "modbus_address": 1,
  "timestamp": "2025-12-10T16:00:00Z"
}
```

Se vuoto, Opta usa la configurazione dal topic (es. `string_1` → modbus_address dal config).

## Frequenze Letture

Configurate in `plant.yaml` → `pv_system.reading_intervals`:

- **Stringhe**: ogni 10s
- **Inverter**: ogni 5s
- **Solarimetro**: ogni 5s
- **Batteria**: ogni 10s (futuro)

## Node-RED Flow

Node-RED pubblica le richieste secondo gli intervalli configurati e ascolta le risposte su:
```
energy/response/+/+/+
```

Poi salva i dati in InfluxDB.

