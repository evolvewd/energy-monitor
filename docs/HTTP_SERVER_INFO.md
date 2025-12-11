# Server HTTP Python - Come Funziona

## 🚀 Comando utilizzato

```bash
cd /home/energymonitor/apps/energy-monitor
python3 -m http.server 8000
```

## 📖 Spiegazione

`python3 -m http.server` è un **server HTTP semplice** incluso in Python che:

1. **Serve file statici** dalla directory corrente
2. **Ascolta su una porta** specificata (8000 in questo caso)
3. **Genera automaticamente** una pagina di directory listing per le cartelle
4. **Non richiede configurazione** - funziona out-of-the-box

## 📁 Struttura File

```
/home/energymonitor/apps/energy-monitor/    ← Directory root del server
├── scripts/
│   └── ark-kiosk-setup.sh                  ← Accessibile via HTTP
├── ARK_SETUP.md                            ← Accessibile via HTTP
├── docker-compose.yml
├── frontend/
├── nodered/
└── ... (tutti i file sono accessibili)
```

## 🌐 URL Accessibili

Dal server stesso:
- `http://localhost:8000/` → Directory listing
- `http://localhost:8000/scripts/` → Lista file in scripts/
- `http://localhost:8000/scripts/ark-kiosk-setup.sh` → Download script
- `http://localhost:8000/ARK_SETUP.md` → Download documentazione

Dalla rete (es. ARK):
- `http://192.168.2.252:8000/scripts/ark-kiosk-setup.sh`
- `http://192.168.2.252:8000/ARK_SETUP.md`

## ⚙️ Caratteristiche

### ✅ Vantaggi
- **Semplice**: Un solo comando
- **Nessuna configurazione**: Funziona subito
- **Leggero**: Consuma poche risorse
- **Sicuro per LAN**: Solo file statici, niente esecuzione codice

### ⚠️ Limitazioni
- **Solo file statici**: Non esegue PHP, Python, etc.
- **Nessuna autenticazione**: Chiunque sulla rete può accedere
- **Nessun HTTPS**: Solo HTTP (ok per LAN privata)
- **Directory listing**: Mostra tutti i file (può essere un problema di sicurezza)

## 🔒 Sicurezza

⚠️ **IMPORTANTE**: Questo server è pensato per **uso interno/LAN privata**.

**Non esporre su Internet** senza:
- Firewall appropriato
- Autenticazione
- HTTPS
- Limitazione IP

## 🛠️ Alternative

### 1. Server HTTP con autenticazione
```bash
# Usa un server più avanzato come nginx o apache
sudo apt install nginx
sudo systemctl start nginx
```

### 2. SCP (più sicuro)
```bash
# Dall'ARK, copia direttamente via SSH
scp energymonitor@192.168.2.252:/home/energymonitor/apps/energy-monitor/scripts/ark-kiosk-setup.sh .
```

### 3. Git repository
```bash
# Clona il repository
git clone http://192.168.2.252:8000/.git
```

## 📝 Gestione Server

### Avviare
```bash
cd /home/energymonitor/apps/energy-monitor
python3 -m http.server 8000 &
```

### Fermare
```bash
# Trova il processo
ps aux | grep "http.server"

# Termina
kill <PID>
# oppure
pkill -f "http.server"
```

### Verificare
```bash
# Controlla se è in ascolto
netstat -tlnp | grep 8000
# oppure
curl http://localhost:8000/
```

### Avviare come servizio systemd (persistente)
```bash
# Crea servizio
sudo tee /etc/systemd/system/http-server.service << EOF
[Unit]
Description=Simple HTTP Server for file sharing
After=network.target

[Service]
Type=simple
User=energymonitor
WorkingDirectory=/home/energymonitor/apps/energy-monitor
ExecStart=/usr/bin/python3 -m http.server 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Abilita e avvia
sudo systemctl enable http-server.service
sudo systemctl start http-server.service
```

## 🎯 Uso Pratico

### Dall'ARK, scarica lo script:
```bash
wget http://192.168.2.252:8000/scripts/ark-kiosk-setup.sh
chmod +x ark-kiosk-setup.sh
sudo bash ark-kiosk-setup.sh
```

### Oppure esegui direttamente:
```bash
wget -O - http://192.168.2.252:8000/scripts/ark-kiosk-setup.sh | sudo bash
```

## 📚 Documentazione Python

Per maggiori informazioni:
```bash
python3 -m http.server --help
```

---

**Nota**: Questo server è perfetto per sviluppo e uso interno. Per produzione, considera soluzioni più robuste come nginx o apache.

