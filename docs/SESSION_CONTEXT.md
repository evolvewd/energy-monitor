# Contesto Sessione Lavoro - Energy Monitor

**Data:** 2025-11-17  
**Ultima modifica:** 16:45 UTC

## Stato Sistema

### Docker
- **Stato:** Attivo e funzionante
- **Servizio:** `docker.service` attivo

### Container Attivi

#### ✅ Node-RED
- **Container:** `energy_nodered`
- **Immagine:** `nodered/node-red:3.1`
- **Porta:** 1880
- **Stato:** Attivo e healthy
- **Problema risolto:** Permessi corretti su `/home/energymonitor/apps/energy-monitor/nodered/data/`
- **Volume:** `./nodered/data:/data`

#### ✅ InfluxDB
- **Container:** `energy_influxdb`
- **Immagine:** `influxdb:2.7`
- **Porta:** 8086
- **Stato:** Attivo
- **Credenziali:**
  - Username: `admin`
  - Password: `energy_monitor_2024`
  - Org: `assistec`
  - Bucket: `energy_data`
  - Token: `energy-monitor-super-secret-token-change-this`

#### ✅ Mosquitto (MQTT)
- **Container:** `energy_mosquitto`
- **Immagine:** `eclipse-mosquitto:2.0`
- **Porte:** 1883 (MQTT), 9001 (WebSocket)
- **Stato:** Attivo

#### ❌ Grafana (Commentato)
- **Container:** `energy_grafana`
- **Stato:** Commentato nel docker-compose
- **Motivo:** Non utilizzato al momento, problemi DNS riscontrati

#### ❌ Nginx (Commentato)
- **Container:** `energy_nginx`
- **Stato:** Commentato nel docker-compose
- **Motivo:** Non utilizzato al momento, dipendeva da Grafana

#### ⏸️ Frontend Next.js (Commentato)
- **Container:** `energy_frontend`
- **Stato:** Commentato nel docker-compose
- **Motivo:** Build manuale in corso
- **Porta prevista:** 4000

## Modifiche Effettuate

### 1. Docker Compose
- **File:** `/home/energymonitor/apps/energy-monitor/docker-compose.yml`
- **Backup:** `/home/energymonitor/apps/energy-monitor/docker-compose.yml.backup`
- **Modifiche:**
  - Grafana: sezione commentata
  - Nginx: sezione commentata
  - Frontend: sezione commentata (da decommentare quando pronto)

### 2. Permessi Node-RED
- **Problema:** Errori di permessi su `/data/.flows.json.backup`
- **Soluzione:** Impostati permessi corretti (1000:1000) su `/home/energymonitor/apps/energy-monitor/nodered/data/`
- **Comando eseguito:**
  ```bash
  sudo chown -R 1000:1000 /home/energymonitor/apps/energy-monitor/nodered/data/
  ```

### 3. Permessi Grafana (per futuro)
- **Comando eseguito:**
  ```bash
  sudo chown -R 472:472 /home/energymonitor/apps/energy-monitor/grafana/data/
  ```

## Configurazione Docker Compose Attuale

### Servizi Attivi
```yaml
services:
  mosquitto:     # MQTT Broker
  influxdb:      # Database time-series
  nodered:       # Elaborazione flussi
```

### Servizi Commentati
```yaml
# grafana:       # Dashboard (non utilizzato)
# nginx:         # Reverse proxy (non utilizzato)
# frontend:      # Next.js (build manuale in corso)
```

## Prossimi Passi

### Frontend Next.js
1. **Completare il build manualmente:**
   ```bash
   cd /home/energymonitor/apps/energy-monitor/frontend
   npm install
   npm run build
   ```

2. **Avviare il frontend:**
   ```bash
   npm start
   # oppure
   npm run dev
   ```

3. **Quando pronto, decommentare nel docker-compose:**
   - File: `/home/energymonitor/apps/energy-monitor/docker-compose.yml`
   - Sezione: `frontend` (righe 95-118)

### Se necessario riattivare Grafana
1. Decommentare la sezione `grafana` nel docker-compose
2. Risolvere problemi DNS (configurare DNS server nel container)
3. Riavviare: `docker compose up -d grafana`

### Se necessario riattivare Nginx
1. Decommentare la sezione `nginx` nel docker-compose
2. Assicurarsi che Grafana sia attivo (se necessario)
3. Riavviare: `docker compose up -d nginx`

## Comandi Utili

### Gestione Container
```bash
# Vedi stato container
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep energy

# Logs Node-RED
docker logs energy_nodered --tail 50

# Logs InfluxDB
docker logs energy_influxdb --tail 50

# Riavvia un container
docker restart energy_nodered
```

### Docker Compose
```bash
cd /home/energymonitor/apps/energy-monitor

# Vedi stato
docker compose ps

# Riavvia tutti i servizi
docker compose restart

# Ferma tutti i servizi
docker compose down

# Avvia tutti i servizi
docker compose up -d
```

### Verifica Servizi
```bash
# Node-RED
curl http://localhost:1880

# InfluxDB
curl http://localhost:8086/health

# Mosquitto (verifica porta)
netstat -tlnp | grep 1883
```

## Note Importanti

1. **Permessi:** I permessi delle cartelle dati sono stati corretti per Node-RED
2. **Grafana:** Attualmente non utilizzato, commentato nel docker-compose
3. **Nginx:** Attualmente non utilizzato, commentato nel docker-compose
4. **Frontend:** In build manuale, da decommentare quando pronto
5. **Backup:** Sempre presente in `docker-compose.yml.backup`

## Problemi Conosciuti

1. **Grafana DNS:** Se riattivato, potrebbe avere problemi di risoluzione DNS per scaricare plugin
2. **Frontend Build:** Il build Docker era molto lento (800MB+ di context), quindi si è optato per build manuale

## Accesso Servizi

- **Node-RED:** http://192.168.2.252:1880
- **InfluxDB:** http://192.168.2.252:8086
- **Mosquitto MQTT:** 192.168.2.252:1883
- **Mosquitto WebSocket:** ws://192.168.2.252:9001
- **Frontend (quando pronto):** http://192.168.2.252:4000

---

**Per recuperare questo contesto:** Leggi questo file all'inizio della prossima sessione di lavoro.

