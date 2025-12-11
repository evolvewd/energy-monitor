# Pattern Risposte Multiple - Inverter

## Come Funziona

Quando Node-RED invia una richiesta:
```
energy/request/inverter/main
```

Arduino Opta può rispondere in **due modi**:

## Opzione 1: Topic Separati (Consigliata)

Opta pubblica **un topic per ogni campo**:

```
energy/response/inverter/main/power_active    → payload: 8500
energy/response/inverter/main/voltage_ac      → payload: 230.5
energy/response/inverter/main/current_ac     → payload: 36.8
energy/response/inverter/main/energy_today    → payload: 45.2
energy/response/inverter/main/energy_total   → payload: 12345.67
energy/response/inverter/main/status         → payload: 0
```

**Vantaggi:**
- ✅ Ogni campo è un messaggio MQTT separato
- ✅ Node-RED può processare ogni campo indipendentemente
- ✅ Se un campo fallisce, gli altri arrivano comunque
- ✅ Più flessibile per filtrare/processare singoli campi

**Esempio codice Opta:**
```cpp
// Dopo aver letto i dati Modbus dall'inverter
float powerActive = readModbusRegister(0x1000);
float voltageAC = readModbusRegister(0x1001);
float currentAC = readModbusRegister(0x1002);
float energyToday = readModbusRegister(0x1003);
float energyTotal = readModbusRegister(0x1004);
int status = readModbusRegister(0x1005);

// Pubblica ogni campo su topic separato
mqtt.publish("energy/response/inverter/main/power_active", String(powerActive));
mqtt.publish("energy/response/inverter/main/voltage_ac", String(voltageAC));
mqtt.publish("energy/response/inverter/main/current_ac", String(currentAC));
mqtt.publish("energy/response/inverter/main/energy_today", String(energyToday));
mqtt.publish("energy/response/inverter/main/energy_total", String(energyTotal));
mqtt.publish("energy/response/inverter/main/status", String(status));
```

## Opzione 2: Topic Unico con Payload JSON

Opta pubblica **un unico topic** con payload JSON contenente tutti i campi:

```
energy/response/inverter/main
```

**Payload:**
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

**Vantaggi:**
- ✅ Un solo messaggio MQTT
- ✅ Tutti i dati arrivano insieme (atomicità)
- ✅ Meno overhead MQTT

**Svantaggi:**
- ❌ Se il JSON è corrotto, si perdono tutti i dati
- ❌ Node-RED deve parsare il JSON e estrarre i campi

**Esempio codice Opta:**
```cpp
// Dopo aver letto i dati Modbus
DynamicJsonDocument doc(1024);
doc["power_active"] = readModbusRegister(0x1000);
doc["voltage_ac"] = readModbusRegister(0x1001);
doc["current_ac"] = readModbusRegister(0x1002);
doc["energy_today"] = readModbusRegister(0x1003);
doc["energy_total"] = readModbusRegister(0x1004);
doc["status"] = readModbusRegister(0x1005);
doc["timestamp"] = getCurrentTimestamp();

String jsonPayload;
serializeJson(doc, jsonPayload);
mqtt.publish("energy/response/inverter/main", jsonPayload);
```

## Come Node-RED Gestisce le Risposte

### Pattern Topic Separati (Opzione 1)

Node-RED ascolta su:
```
energy/response/+/+/+
```

Il parser estrae:
- `device_type`: `inverter`
- `device_id`: `main`
- `field`: `power_active`, `voltage_ac`, etc.

E salva in InfluxDB come:
```javascript
{
  measurement: "production",
  fields: { power_active: 8500 },
  tags: { device_type: "inverter", device_id: "main" }
}
```

Ogni campo viene salvato come punto dati separato in InfluxDB.

### Pattern Topic Unico (Opzione 2)

Node-RED ascolta su:
```
energy/response/+/+
```

Il parser rileva che non c'è il campo nel topic, quindi:
- Legge il payload JSON
- Estrae tutti i campi
- Crea un unico punto dati InfluxDB con tutti i campi

```javascript
{
  measurement: "production",
  fields: {
    power_active: 8500,
    voltage_ac: 230.5,
    current_ac: 36.8,
    energy_today: 45.2,
    energy_total: 12345.67,
    status: 0
  },
  tags: { device_type: "inverter", device_id: "main" }
}
```

## Raccomandazione

**Usa l'Opzione 1 (Topic Separati)** perché:
1. Più robusta (se un campo fallisce, gli altri arrivano)
2. Più flessibile per filtrare/processare
3. Più semplice da debuggare (vedi ogni campo nel broker)
4. Il parser Node-RED è già configurato per questo pattern

## Esempio Completo Flow

**Node-RED pubblica:**
```
Topic: energy/request/inverter/main
Payload: { "modbus_address": 7, "timestamp": "..." }
```

**Opta riceve, legge Modbus, pubblica:**
```
energy/response/inverter/main/power_active → 8500
energy/response/inverter/main/voltage_ac → 230.5
energy/response/inverter/main/current_ac → 36.8
energy/response/inverter/main/energy_today → 45.2
energy/response/inverter/main/energy_total → 12345.67
energy/response/inverter/main/status → 0
```

**Node-RED riceve e salva in InfluxDB:**
- 6 punti dati separati, tutti con tag `device_type=inverter, device_id=main`
- Timestamp sincronizzati (stesso momento)

