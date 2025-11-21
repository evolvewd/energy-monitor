# Architettura Letture Modbus - Energy Monitor

## Panoramica

Sistema di lettura Modbus basato su polling fisso da Node-RED. Configurazione dinamica da PostgreSQL basata su indirizzi Modbus.

## Struttura Topic MQTT (Semplificata)

### 1. Richieste di Lettura (Request)

**Pattern:** `opta/read/{modbus_address}/{type}`

- `{modbus_address}`: Indirizzo Modbus (1, 2, 3, ...)
- `{type}`: Tipo di lettura (`realtime`, `power`, `extremes`)

**Esempi:**
```
opta/read/1/realtime
opta/read/2/realtime
opta/read/2/power
opta/read/2/extremes
opta/read/3/realtime
```

**Payload richiesta (opzionale, può essere vuoto):**
```json
{
  "modbus_address": 2,
  "type": "realtime",
  "timestamp": "2025-11-21T16:30:00Z"
}
```

### 2. Risposte Dati (Response)

**Pattern:** `opta/{modbus_address}/{type}`

- `{modbus_address}`: Indirizzo Modbus (1, 2, 3, ...)
- `{type}`: Tipo di dato (`realtime`, `power`, `extremes`)

**Esempi:**
```
opta/1/realtime
opta/2/realtime
opta/2/power
opta/2/extremes
opta/3/realtime
```

**Payload risposta:**
```json
{
  "realtime": {
    "v_rms": 230.5,
    "i_rms": 3.2,
    "p_active": 736.0,
    "frequency": 50.0,
    "timestamp": "2025-11-21T16:30:01Z"
  }
}
```

## Flusso di Lettura (Polling Fisso)

### Polling Automatico da Node-RED

1. **Node-RED Timer** (ogni 1s per realtime, 5s per power, 30s per extremes):
   - Legge tutti i lettori Modbus configurati dal DB PostgreSQL
   - Per ogni lettore, pubblica richiesta lettura su `opta/read/{modbus_address}/{type}`
   - Gestisce la sequenza per evitare collisioni Modbus (delay tra richieste)

2. **Dispositivo OPTA**:
   - Riceve richiesta su `opta/read/{modbus_address}/{type}`
   - Esegue lettura Modbus all'indirizzo specificato
   - Pubblica dati su `opta/{modbus_address}/{type}`

3. **Node-RED** (ricezione e salvataggio):
   - Riceve i dati dal topic `opta/{modbus_address}/{type}`
   - Legge dal DB la configurazione del lettore (alloggio_id, tipo, nome)
   - Aggiunge tag InfluxDB per correlazione (alloggio_id, tipo lettore)
   - Salva in InfluxDB con measurement appropriato

## Configurazione Database

### Tabella `alloggi`
- `alloggio_id`: ID univoco
- `name`: Nome descrittivo
- `topic_prefix`: Prefisso topic (es. "alloggio_1")
- `modbus_address`: Indirizzo Modbus principale

### Tabella `modbus_readers`
- `reader_id`: ID lettore (es. "alloggio_1")
- `type`: Tipo (`alloggio`, `produzione`, `accumulo`)
- `name`: Nome lettore
- `modbus_address`: Indirizzo Modbus specifico
- `alloggio_id`: Riferimento all'alloggio

## Node-RED: Flusso Proposto

### Flusso 1: Gestione Richieste Lettura

```
[MQTT In: opta/request/read/+/+] 
  → [Function: Leggi Config DB]
  → [Function: Prepara Richiesta Modbus]
  → [MQTT Out: opta/command/read/{alloggio_id}]
```

### Flusso 2: Ricezione Dati e Salvataggio

```
[MQTT In: opta/+/+/+] 
  → [Function: Parse Topic e Payload]
  → [Function: Aggiungi Tag InfluxDB]
  → [InfluxDB Out]
```

### Flusso 3: Polling Automatico (Opzionale)

```
[Inject: Timer 1s] 
  → [Function: Leggi Tutti Alloggi da DB]
  → [Split] 
  → [Function: Pubblica Richiesta Lettura]
  → [MQTT Out: opta/request/read/...]
```

## Vantaggi di questa Architettura

1. **Flessibilità**: Supporta letture on-demand e periodiche
2. **Scalabilità**: Facile aggiungere nuovi alloggi
3. **Configurazione Dinamica**: Indirizzi Modbus nel DB, non hardcoded
4. **Tracciabilità**: Ogni richiesta/risposta è tracciabile via MQTT
5. **Disaccoppiamento**: Frontend, Node-RED e dispositivo OPTA sono indipendenti

## Alternative Considerate

### Opzione A: Solo Letture Periodiche
- **Pro**: Semplice, dati sempre aggiornati
- **Contro**: Spreco risorse se non serve, latenza fissa

### Opzione B: Solo Request/Response
- **Pro**: Efficienza, dati solo quando servono
- **Contro**: Frontend deve gestire polling, più complesso

### Opzione C: Ibrida (Raccomandata) ⭐
- **Pro**: Best of both worlds
- **Contro**: Leggermente più complessa da implementare

## Implementazione Consigliata

1. **Fase 1**: Implementare Request/Response per test
2. **Fase 2**: Aggiungere polling automatico per dati realtime
3. **Fase 3**: Ottimizzare sequenza letture per performance

