# Correzione Porte ARK - Dopo Setup Iniziale

Se hai già eseguito lo script `ark-kiosk-setup.sh` e vuoi modificare solo IP/porta senza rieseguire tutto.

## 📝 File da Modificare

### 1. File principale: `/home/kiosk/.xinitrc`

Questo file contiene l'URL che Chromium apre al boot.

```bash
# Modifica come utente root o con sudo
sudo nano /home/kiosk/.xinitrc

# Cerca la riga con chromium-browser e modifica l'URL:
# DA: http://192.168.2.252:5000
# A:  http://192.168.2.252:3000  (sviluppo)
# O:  http://192.168.2.252:4000  (produzione)
```

**Esempio completo della sezione da modificare:**
```bash
# Trova questa riga (circa riga 122):
    http://192.168.2.252:5000

# Modifica in:
    http://192.168.2.252:3000  # per sviluppo
# oppure
    http://192.168.2.252:4000  # per produzione
```

### 2. Script monitoraggio: `/usr/local/bin/kiosk-monitor.sh`

Questo script verifica la connessione al server.

```bash
# Modifica come root
sudo nano /usr/local/bin/kiosk-monitor.sh

# Modifica queste righe:
SERVER_IP="192.168.2.252"
SERVER_PORT="5000"  # Cambia in 3000 o 4000
```

### 3. Servizio systemd: `/etc/systemd/system/kiosk-monitor.service`

Se vuoi cambiare anche le variabili d'ambiente del servizio:

```bash
sudo nano /etc/systemd/system/kiosk-monitor.service

# Modifica le righe Environment:
Environment="SERVER_IP=192.168.2.252"
Environment="SERVER_PORT=3000"  # Cambia qui

# Poi ricarica e riavvia:
sudo systemctl daemon-reload
sudo systemctl restart kiosk-monitor.service
```

## 🚀 Comandi Rapidi

### Cambia a porta 3000 (sviluppo)

```bash
# 1. Modifica .xinitrc
sudo sed -i 's|http://192.168.2.252:[0-9]*|http://192.168.2.252:3000|g' /home/kiosk/.xinitrc

# 2. Modifica script monitoraggio
sudo sed -i 's/SERVER_PORT="[0-9]*"/SERVER_PORT="3000"/' /usr/local/bin/kiosk-monitor.sh

# 3. Modifica servizio systemd
sudo sed -i 's/Environment="SERVER_PORT=[0-9]*"/Environment="SERVER_PORT=3000"/' /etc/systemd/system/kiosk-monitor.service

# 4. Ricarica e riavvia
sudo systemctl daemon-reload
sudo systemctl restart kiosk-monitor.service

# 5. Riavvia X (se già attivo) o riavvia il sistema
sudo pkill -u kiosk -f chromium
# Oppure riavvia tutto:
sudo reboot
```

### Cambia a porta 4000 (produzione)

```bash
# 1. Modifica .xinitrc
sudo sed -i 's|http://192.168.2.252:[0-9]*|http://192.168.2.252:4000|g' /home/kiosk/.xinitrc

# 2. Modifica script monitoraggio
sudo sed -i 's/SERVER_PORT="[0-9]*"/SERVER_PORT="4000"/' /usr/local/bin/kiosk-monitor.sh

# 3. Modifica servizio systemd
sudo sed -i 's/Environment="SERVER_PORT=[0-9]*"/Environment="SERVER_PORT=4000"/' /etc/systemd/system/kiosk-monitor.service

# 4. Ricarica e riavvia
sudo systemctl daemon-reload
sudo systemctl restart kiosk-monitor.service

# 5. Riavvia X
sudo pkill -u kiosk -f chromium
# Oppure riavvia tutto:
sudo reboot
```

## ✅ Verifica Modifiche

```bash
# Verifica .xinitrc
grep "http://" /home/kiosk/.xinitrc

# Verifica script monitoraggio
grep "SERVER_PORT" /usr/local/bin/kiosk-monitor.sh

# Verifica servizio
grep "SERVER_PORT" /etc/systemd/system/kiosk-monitor.service

# Test connessione
curl http://192.168.2.252:3000  # o 4000
```

## 🔄 Applica Modifiche

Dopo aver modificato i file, hai due opzioni:

### Opzione 1: Riavvia solo Chromium (più veloce)
```bash
# Termina Chromium (si riavvierà automaticamente dal loop in .xinitrc)
sudo pkill -u kiosk -f chromium
```

### Opzione 2: Riavvia tutto il sistema (più sicuro)
```bash
sudo reboot
```

## 📋 Riepilogo Porte

- **Porta 3000**: Sviluppo (`next dev` - utente energymonitor)
- **Porta 4000**: Produzione (`next start` - da configurare)
- **Porta 5000**: Già utilizzata da altro processo Next.js (utente mv) - NON usare

---

**Nota**: Se modifichi solo `.xinitrc`, Chromium si aggiornerà al prossimo riavvio di X o al reboot. Se modifichi anche lo script di monitoraggio, riavvia il servizio systemd.

