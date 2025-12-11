#!/bin/bash

# Script di setup automatico per ARK-2232L - Kiosk Mode (Remote)
# Questo script configura l'ARK per connettersi al server remoto

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configurazione
SERVER_IP="${SERVER_IP:-192.168.2.252}"
SERVER_PORT="${SERVER_PORT:-3000}"
KIOSK_USER="kiosk"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}ARK-2232L Kiosk Setup (Remote Mode)${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Server remoto: http://${SERVER_IP}:${SERVER_PORT}"
echo ""

# Verifica che siamo root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Per favore esegui come root (sudo bash $0)${NC}"
    exit 1
fi

# Step 1: Update sistema
echo -e "${YELLOW}[1/9] Aggiornamento sistema...${NC}"
apt update && apt full-upgrade -y

# Step 2: Installazione pacchetti
echo -e "${YELLOW}[2/9] Installazione pacchetti...${NC}"
apt install -y \
    xorg \
    openbox \
    chromium-browser \
    unclutter \
    xdotool \
    xinput \
    xinput-calibrator \
    git \
    curl \
    network-manager \
    fonts-liberation \
    fonts-noto-color-emoji

# Step 3: Creazione utente kiosk
echo -e "${YELLOW}[3/9] Creazione utente kiosk...${NC}"
if id "$KIOSK_USER" &>/dev/null; then
    echo "Utente $KIOSK_USER già esistente, skip..."
else
    adduser --disabled-password --gecos "" "$KIOSK_USER"
    usermod -aG audio,video "$KIOSK_USER"
fi

# Step 4: Configurazione auto-login
echo -e "${YELLOW}[4/9] Configurazione auto-login...${NC}"
mkdir -p /etc/systemd/system/getty@tty1.service.d/

cat > /etc/systemd/system/getty@tty1.service.d/override.conf << EOF
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin $KIOSK_USER --noclear %I \$TERM
Type=idle
EOF

systemctl daemon-reload

# Step 5: Configurazione Xorg
echo -e "${YELLOW}[5/9] Configurazione Xorg...${NC}"

# .profile per auto-start X
cat > /home/$KIOSK_USER/.profile << 'PROFILE_EOF'
if [ -z "$DISPLAY" ] && [ "$(tty)" = "/dev/tty1" ]; then
  startx
fi
PROFILE_EOF

# .xinitrc per kiosk mode
cat > /home/$KIOSK_USER/.xinitrc << XINITRC_EOF
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
while true; do
  chromium-browser \\
    --kiosk \\
    --noerrdialogs \\
    --disable-infobars \\
    --no-first-run \\
    --disable-translate \\
    --disable-features=TranslateUI \\
    --disable-background-timer-throttling \\
    --disable-backgrounding-occluded-windows \\
    --disable-renderer-backgrounding \\
    --disable-restore-session-state \\
    --disable-session-crashed-bubble \\
    --disable-features=InfiniteSessionRestore \\
    --incognito \\
    --disable-web-security \\
    --user-data-dir=/tmp/chromium-kiosk \\
    --disable-dev-shm-usage \\
    --no-sandbox \\
    http://${SERVER_IP}:${SERVER_PORT}
    # Porta 3000 = sviluppo (next dev)
    # Porta 4000 = produzione (next start)
    # NOTA: La porta 5000 è già utilizzata da altro processo Next.js (utente mv)

  # Se Chromium crasha, aspetta 5 secondi e riavvia
  sleep 5
done
XINITRC_EOF

chmod +x /home/$KIOSK_USER/.xinitrc
chown -R $KIOSK_USER:$KIOSK_USER /home/$KIOSK_USER

# Step 6: Configurazione touch screen
echo -e "${YELLOW}[6/9] Configurazione touch screen...${NC}"
mkdir -p /etc/X11/xorg.conf.d/

cat > /etc/X11/xorg.conf.d/99-touchscreen.conf << 'EOF'
Section "InputClass"
    Identifier "touchscreen"
    MatchIsTouchscreen "on"
    Driver "libinput"
    Option "Tapping" "on"
    Option "TappingDrag" "on"
    Option "DisableWhileTyping" "on"
EndSection
EOF

# Step 7: Configurazione monitor 1024x768
echo -e "${YELLOW}[7/9] Configurazione monitor 1024x768...${NC}"
mkdir -p /etc/X11/xorg.conf.d/

cat > /etc/X11/xorg.conf.d/10-monitor.conf << 'EOF'
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

# Step 8: Script monitoraggio connessione
echo -e "${YELLOW}[8/9] Configurazione monitoraggio connessione...${NC}"

cat > /usr/local/bin/kiosk-monitor.sh << MONITOR_EOF
#!/bin/bash

SERVER_IP="${SERVER_IP}"
SERVER_PORT="${SERVER_PORT}"
CHECK_INTERVAL=60

while true; do
    if ! curl -s --max-time 5 "http://\${SERVER_IP}:\${SERVER_PORT}" > /dev/null; then
        logger "Kiosk: Server non raggiungibile, riavvio Chromium..."
        pkill chromium || true
    fi
    sleep \$CHECK_INTERVAL
done
MONITOR_EOF

chmod +x /usr/local/bin/kiosk-monitor.sh

# Servizio systemd per monitoraggio
cat > /etc/systemd/system/kiosk-monitor.service << SERVICE_EOF
[Unit]
Description=Kiosk Connection Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/kiosk-monitor.sh
Restart=always
RestartSec=10
Environment="SERVER_IP=${SERVER_IP}"
Environment="SERVER_PORT=${SERVER_PORT}"

[Install]
WantedBy=multi-user.target
SERVICE_EOF

systemctl daemon-reload
systemctl enable kiosk-monitor.service
systemctl start kiosk-monitor.service

# Step 9: Disabilita aggiornamenti automatici
echo -e "${YELLOW}[9/9] Disabilitazione aggiornamenti automatici...${NC}"
systemctl disable unattended-upgrades || true

# Verifica connessione al server
echo ""
echo -e "${YELLOW}Verifica connessione al server remoto...${NC}"
if curl -s --max-time 5 "http://${SERVER_IP}:${SERVER_PORT}" > /dev/null; then
    echo -e "${GREEN}✓ Server raggiungibile${NC}"
else
    echo -e "${RED}✗ Server non raggiungibile. Verifica:${NC}"
    echo "  - IP server: $SERVER_IP"
    echo "  - Porta: $SERVER_PORT"
    echo "  - Connessione di rete"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup completato!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Prossimi passi:"
echo "1. Riavvia il sistema: sudo reboot"
echo "2. Dopo il reboot, il kiosk si avvierà automaticamente"
echo "3. Se il touch non funziona, calibra con: xinput_calibrator"
echo ""
echo "Per modificare l'IP/porta del server:"
echo "  sudo nano /home/$KIOSK_USER/.xinitrc"
echo "  sudo nano /usr/local/bin/kiosk-monitor.sh"
echo "  sudo systemctl restart kiosk-monitor.service"
echo ""

