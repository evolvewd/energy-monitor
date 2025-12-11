# Setup Node-RED - Credenziali InfluxDB

## Problema
I flow Node-RED sono configurati ma le credenziali InfluxDB devono essere impostate tramite l'editor web.

## Soluzione

1. **Apri Node-RED Editor**: http://localhost:1880

2. **Configura il nodo InfluxDB**:
   - Clicca sul nodo "InfluxDB Energy" (config node, non i nodi out)
   - Oppure vai su Menu → Configuration nodes → InfluxDB Energy
   
3. **Inserisci le credenziali**:
   - **Token**: `energy-monitor-super-secret-token-change-this`
   - **Org**: `assistec`
   - **Bucket**: `energy`
   - **URL**: `http://influxdb:8086` (già configurato)
   
4. **Salva e Deploy**:
   - Clicca "Done"
   - Clicca "Deploy" (in alto a destra)

## Verifica

Dopo la configurazione, controlla i log:
```bash
docker compose logs nodered | tail -20
```

Non dovrebbero più esserci errori "unauthorized access".

## Flow Attivi

- ✅ **Config Loader**: Carica plant.yaml all'avvio
- ✅ **Solarimetro Simulazione**: Genera irraggiamento ogni 5s
- ✅ **MQTT to InfluxDB**: Riceve dati MQTT e salva
- ⏳ **Calcolo PR**: Calcola ogni 5 minuti (usa dati simulati per ora)
- ⏳ **Rilevamento Anomalie**: Controlla ogni 60s (usa dati simulati per ora)

## Credenziali InfluxDB

- **URL**: http://influxdb:8086
- **Org**: assistec
- **Bucket**: energy
- **Token**: energy-monitor-super-secret-token-change-this

