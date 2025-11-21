# Specifiche Implementazione Arduino - Energy Monitor

## Topic MQTT per Pubblicazione Dati

### Formato Topic (Risposte)
```
opta/response/id{indirizzo_modbus}/{modello}/{tipo}
```

**Dove:**
- `response`: Indica che è una risposta ai dati richiesti
- `{indirizzo_modbus}`: Indirizzo Modbus del dispositivo (1-247), **senza prefisso "id" nel topic** (il prefisso "id" va aggiunto nel topic stesso)
- `{modello}`: Modello del sensore (`6m` o `7m`)
- `{tipo}`: Tipo di misurazione (`realtime`, `power`, `extremes`)

### Esempi Topic Risposte
```
opta/response/id1/6m/realtime
opta/response/id2/7m/power
opta/response/id1/6m/extremes
```

**Nota:** Il prefisso "id" deve essere incluso nel topic prima del numero dell'indirizzo Modbus.

### Topic Richieste (da Node-RED)
Le richieste vengono pubblicate da Node-RED su:
```
opta/request/id{indirizzo_modbus}/{modello}/{tipo}
```

**Esempi:**
```
opta/request/id1/6m/realtime
opta/request/id2/7m/power
opta/request/id1/6m/extremes
```

**Nota:** L'Arduino deve sottoscriversi a questi topic per ricevere le richieste di lettura.

---

## Formato Payload JSON

### Payload Richiesto (con indirizzo Modbus)

Il payload deve includere l'**indirizzo Modbus del dispositivo** oltre ai dati del sensore.

#### Esempio per `realtime`:
```json
{
  "modbus_address": 1,
  "realtime": {
    "v_rms": 231.29,
    "i_rms": 3.82979,
    "p_active": 620.28,
    "frequency": 49.92,
    "thd": 0.89,
    "status": 96,
    "v_peak": 0.33676,
    "i_peak": 15.92829
  }
}
```

#### Esempio per `power`:
```json
{
  "modbus_address": 1,
  "power": {
    "p_active": 620.28,
    "p_reactive": 45.2,
    "p_apparent": 622.5,
    "energy_total": 12345.67,
    "energy_today": 12.34
  }
}
```

#### Esempio per `extremes`:
```json
{
  "modbus_address": 1,
  "extremes": {
    "v_min": 220.5,
    "v_max": 235.8,
    "i_min": 0.5,
    "i_max": 15.2,
    "p_min": 0.0,
    "p_max": 1200.0
  }
}
```

---

## Campi Obbligatori

### Campo Principale
- **`modbus_address`** (integer, 1-247): Indirizzo Modbus del dispositivo che sta inviando i dati

### Campi per `realtime`:
- `v_rms` (float): Tensione RMS in Volt
- `i_rms` (float): Corrente RMS in Ampere
- `p_active` (float): Potenza attiva in Watt
- `frequency` (float): Frequenza in Hz
- `thd` (float): Total Harmonic Distortion in %
- `status` (integer): Stato del dispositivo
- `v_peak` (float): Tensione di picco in Volt
- `i_peak` (float): Corrente di picco in Ampere

### Campi per `power`:
- `p_active` (float): Potenza attiva in Watt
- `p_reactive` (float): Potenza reattiva in VAR
- `p_apparent` (float): Potenza apparente in VA
- `energy_total` (float): Energia totale accumulata in Wh
- `energy_today` (float): Energia consumata oggi in Wh

### Campi per `extremes`:
- `v_min` (float): Tensione minima rilevata
- `v_max` (float): Tensione massima rilevata
- `i_min` (float): Corrente minima rilevata
- `i_max` (float): Corrente massima rilevata
- `p_min` (float): Potenza minima rilevata
- `p_max` (float): Potenza massima rilevata

---

## Esempio Completo di Implementazione

### Configurazione Dispositivo
- **Indirizzo Modbus:** 1
- **Modello Sensore:** 6m
- **Tipo Lettura:** realtime

### Topic da Pubblicare (Risposta)
```
opta/response/id1/6m/realtime
```

### Topic da Ascoltare (Richiesta)
L'Arduino deve sottoscriversi a:
```
opta/request/id1/6m/realtime
```
(oppure usare wildcard: `opta/request/id+/+/+` per ascoltare tutte le richieste)

### Payload da Inviare
```json
{
  "modbus_address": 1,
  "realtime": {
    "v_rms": 231.29,
    "i_rms": 3.82979,
    "p_active": 620.28,
    "frequency": 49.92,
    "thd": 0.89,
    "status": 96,
    "v_peak": 0.33676,
    "i_peak": 15.92829
  }
}
```

---

## Note Importanti

1. **Indirizzo Modbus nel Payload:** L'indirizzo Modbus deve essere incluso nel payload JSON come campo `modbus_address` a livello root.

2. **Coerenza Topic/Payload:** L'indirizzo Modbus nel topic (`id1`, `id2`, ecc.) deve corrispondere al valore di `modbus_address` nel payload.

3. **QoS:** Si consiglia di usare QoS 2 per garantire la consegna dei messaggi.

4. **Frequenza Pubblicazione:**
   - `realtime`: ogni 1 secondo
   - `power`: ogni 5 secondi
   - `extremes`: ogni 30 secondi

5. **Formato Timestamp:** Il timestamp viene aggiunto automaticamente da Node-RED, non è necessario includerlo nel payload.

---

## Esempio Codice Arduino (Pseudocodice)

```cpp
// Configurazione
const int MODBUS_ADDRESS = 1;
const String MODEL = "6m";
const String MQTT_BROKER = "192.168.1.100"; // IP del broker MQTT
const int MQTT_PORT = 1883;

// Funzione per pubblicare dati realtime (risposta)
void publishRealtime() {
  String topic = "opta/response/id" + String(MODBUS_ADDRESS) + "/" + MODEL + "/realtime";
  
  String payload = "{";
  payload += "\"modbus_address\":" + String(MODBUS_ADDRESS) + ",";
  payload += "\"realtime\":{";
  payload += "\"v_rms\":" + String(v_rms) + ",";
  payload += "\"i_rms\":" + String(i_rms) + ",";
  payload += "\"p_active\":" + String(p_active) + ",";
  payload += "\"frequency\":" + String(frequency) + ",";
  payload += "\"thd\":" + String(thd) + ",";
  payload += "\"status\":" + String(status) + ",";
  payload += "\"v_peak\":" + String(v_peak) + ",";
  payload += "\"i_peak\":" + String(i_peak);
  payload += "}";
  payload += "}";
  
  mqttClient.publish(topic.c_str(), payload.c_str());
}
```

---

## Verifica

Per verificare che i dati vengano pubblicati correttamente:

1. Connettersi al broker MQTT con un client (es. MQTT Explorer)
2. Sottoscriversi al topic: `opta/response/+/+/+`
3. Verificare che i messaggi arrivino con:
   - Topic nel formato: `opta/response/id{indirizzo}/{modello}/{tipo}`
   - Payload contenente `modbus_address` a livello root
   - Dati del sensore nella sezione corrispondente (`realtime`, `power`, o `extremes`)

## Flusso Completo

1. **Node-RED pubblica richiesta** su: `opta/request/id{indirizzo}/{modello}/{tipo}`
2. **Arduino riceve la richiesta** (sottoscritto a `opta/request/id+/+/+`)
3. **Arduino legge i dati** dal sensore Modbus
4. **Arduino pubblica risposta** su: `opta/response/id{indirizzo}/{modello}/{tipo}`
5. **Node-RED riceve la risposta** e salva in InfluxDB

