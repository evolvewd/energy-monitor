# Setup ARK-2232L - Kiosk Mode (Fase 1: Remote)

Questo documento descrive la configurazione dell'ARK-2232L per funzionare come kiosk che si connette al server di sviluppo remoto.

## 📋 Prerequisiti

- Ubuntu Server 22.04 LTS installato sull'ARK-2232L
- Monitor touch 1024x768 collegato e funzionante
- Connessione di rete al server di sviluppo (192.168.2.252)
- Accesso SSH all'ARK

## 🎯 Obiettivo

Configurare l'ARK come kiosk che:
- Si avvia automaticamente al boot
- Mostra Chromium in fullscreen
- Punta al server remoto: `http://192.168.2.252:3000` (sviluppo) o `http://192.168.2.252:4000` (produzione)
- **NOTA**: La porta 5000 è già utilizzata da altro processo Next.js (utente mv)
- Supporta touch screen
- Si riavvia automaticamente in caso di crash

## 📦 Step 1: Installazione pacchetti base

```bash
# Update sistema
sudo apt update && sudo apt full-upgrade -y

# Installa desktop environment minimale
sudo apt install -y \
  xorg \
  openbox \
  chromium-browser \
  unclutter \
  xdotool \
  xinput \
  xinput-calibrator \
  git \
  curl \
  network-manager

# Installa font per migliorare rendering
sudo apt install -y fonts-liberation fonts-noto-color-emoji
```

## 👤 Step 2: Creazione utente kiosk

```bash
# Crea utente kiosk (senza password, solo per kiosk)
sudo adduser --disabled-password --gecos "" kiosk

# Aggiungi a gruppi necessari
sudo usermod -aG audio,video kiosk
```

## 🔄 Step 3: Configurazione auto-login

```bash
# Crea override per getty su tty1
sudo mkdir -p /etc/systemd/system/getty@tty1.service.d/

sudo tee /etc/systemd/system/getty@tty1.service.d/override.conf << 'EOF'
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin kiosk --noclear %I $TERM
Type=idle
EOF

# Ricarica systemd
sudo systemctl daemon-reload
```

## 🖥️ Step 4: Configurazione Xorg e avvio automatico

```bash
# Script di avvio X (se non c'è display, avvia X)
sudo -u kiosk tee /home/kiosk/.profile << 'EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx
fi
EOF

# Configurazione Xinitrc per kiosk mode
sudo -u kiosk tee /home/kiosk/.xinitrc << 'EOF'
#!/bin/bash

# Disabilita screensaver e power management
xset s off
xset -dpms
xset s noblank

# Nascondi cursore quando inattivo
unclutter -idle 1 -root &

# Avvia window manager
openbox &

# Attendi che X sia completamente inizializzato
sleep 3

# Avvia Chromium in kiosk mode
# IMPORTANTE: Modifica l'IP e la porta secondo il tuo server
# Porta 3000 = sviluppo (next dev)
# Porta 4000 = produzione (next start)
# NOTA: La porta 5000 è già utilizzata da altro processo Next.js (utente mv)
while true; do
  chromium-browser \
    --kiosk \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --disable-translate \
    --disable-features=TranslateUI \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-restore-session-state \
    --disable-session-crashed-bubble \
    --disable-features=InfiniteSessionRestore \
    --incognito \
    --disable-web-security \
    --user-data-dir=/tmp/chromium-kiosk \
    --disable-dev-shm-usage \
    --no-sandbox \
    http://192.168.2.252:3000

  # Se Chromium crasha, aspetta 5 secondi e riavvia
  sleep 5
done
EOF

# Rendi eseguibile
sudo chmod +x /home/kiosk/.xinitrc
```

## 🖱️ Step 5: Configurazione touch screen

```bash
# Test touch screen (dopo aver avviato X)
# Esegui come utente kiosk dopo il primo avvio:
# xinput list
# xinput_calibrator

# Se necessario, crea configurazione custom
sudo mkdir -p /etc/X11/xorg.conf.d/

# Configurazione base touch (modifica secondo il tuo hardware)
sudo tee /etc/X11/xorg.conf.d/99-touchscreen.conf << 'EOF'
Section "InputClass"
    Identifier "touchscreen"
    MatchIsTouchscreen "on"
    Driver "libinput"
    Option "Tapping" "on"
    Option "TappingDrag" "on"
    Option "DisableWhileTyping" "on"
EndSection
EOF
```

## 🌐 Step 6: Configurazione rete (se necessario)

```bash
# Verifica connessione al server remoto
ping -c 3 192.168.2.252

# Se necessario, configura IP statico
sudo nano /etc/netplan/00-installer-config.yaml

# Esempio configurazione statica:
# network:
#   version: 2
#   renderer: networkd
#   ethernets:
#     eth0:
#       addresses:
#         - 192.168.2.XXX/24
#       gateway4: 192.168.2.1
#       nameservers:
#         addresses: [8.8.8.8, 8.8.4.4]

# Applica configurazione
# sudo netplan apply
```

## 🔧 Step 7: Ottimizzazione per monitor 1024x768

```bash
# Configura risoluzione Xorg
sudo tee /etc/X11/xorg.conf.d/10-monitor.conf << 'EOF'
Section "Monitor"
    Identifier "Monitor0"
    Modeline "1024x768_60.00" 63.50 1024 1072 1176 1328 768 771 775 798 -hsync +vsync
    Option "PreferredMode" "1024x768_60.00"
EndSection

Section "Screen"
    Identifier "Screen0"
    Monitor "Monitor0"
    DefaultDepth 24
    SubSection "Display"
        Depth 24
        Modes "1024x768_60.00"
    EndSubSection
EndSection
EOF
```

## 🚀 Step 8: Script di riavvio automatico (opzionale)

```bash
# Crea script per monitorare connessione e riavviare se necessario
sudo tee /usr/local/bin/kiosk-monitor.sh << 'EOF'
#!/bin/bash

SERVER_IP="192.168.2.252"
SERVER_PORT="5000"
CHECK_INTERVAL=60

while true; do
    if ! curl -s --max-time 5 "http://${SERVER_IP}:${SERVER_PORT}" > /dev/null; then
        logger "Kiosk: Server non raggiungibile, riavvio Chromium..."
        pkill chromium
    fi
    sleep $CHECK_INTERVAL
done
EOF

sudo chmod +x /usr/local/bin/kiosk-monitor.sh

# Avvia come servizio systemd
sudo tee /etc/systemd/system/kiosk-monitor.service << 'EOF'
[Unit]
Description=Kiosk Connection Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/kiosk-monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable kiosk-monitor.service
sudo systemctl start kiosk-monitor.service
```

## ✅ Step 9: Test e verifica

```bash
# Riavvia il sistema
sudo reboot

# Dopo il reboot, dovresti vedere:
# 1. Boot Ubuntu
# 2. Auto-login utente kiosk
# 3. X si avvia automaticamente
# 4. Chromium in fullscreen
# 5. Dashboard del server remoto visibile

# Per verificare manualmente (da SSH):
# - Verifica che X sia attivo: ps aux | grep X
# - Verifica Chromium: ps aux | grep chromium
# - Verifica connessione: curl http://192.168.2.252:5000
```

## 🐛 Troubleshooting

### Touch screen non funziona
```bash
# Identifica dispositivo
sudo evtest

# Calibra (da sessione X)
DISPLAY=:0 xinput_calibrator

# Salva output in /etc/X11/xorg.conf.d/99-calibration.conf
```

### Chromium non si avvia
```bash
# Verifica log X
cat /var/log/Xorg.0.log

# Verifica permessi
ls -la /home/kiosk/.xinitrc

# Test manuale
sudo -u kiosk startx
```

### Non si connette al server
```bash
# Verifica rete
ping 192.168.2.252

# Verifica porta
telnet 192.168.2.252 5000

# Verifica firewall sul server remoto
```

### Risoluzione sbagliata
```bash
# Forza risoluzione
xrandr --output VGA-1 --mode 1024x768

# Aggiungi a .xinitrc prima di openbox
```

## 📝 Note importanti

1. **Porta server**: Modifica `192.168.2.252:5000` in `.xinitrc` se la porta cambia
2. **IP server**: Se l'IP del server cambia, aggiorna tutti i riferimenti
3. **Touch calibration**: Potrebbe essere necessario calibrare dopo il primo avvio
4. **Aggiornamenti**: Disabilita aggiornamenti automatici per evitare interruzioni:
   ```bash
   sudo systemctl disable unattended-upgrades
   ```

## 🔄 Fase 2: Migrazione completa (futuro)

Quando il progetto sarà completo, eseguiremo la migrazione completa:
- Installazione Docker sull'ARK
- Clonazione repository
- Configurazione docker-compose
- Cambio URL kiosk da remoto a localhost

---

**Data creazione**: $(date)
**Versione**: 1.0
**Stato**: Fase 1 - Kiosk remoto

