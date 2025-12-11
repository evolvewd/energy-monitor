# Fix Font su ARK - Chromium Kiosk

## 🎨 Problema

Chromium sull'ARK usa i font di sistema Linux invece dei font web standard, risultando in un rendering poco professionale.

## ✅ Soluzione

### Step 1: Installa Font Web Standard

```bash
# Connettiti all'ARK via SSH
ssh 192.168.2.143

# Installa font web comuni
sudo apt update
sudo apt install -y \
    fonts-liberation \
    fonts-liberation2 \
    fonts-dejavu \
    fonts-dejavu-core \
    fonts-dejavu-extra \
    fonts-noto \
    fonts-noto-core \
    fonts-noto-ui-core \
    fonts-noto-color-emoji \
    fonts-roboto \
    fonts-roboto-unhinted \
    fontconfig \
    fontconfig-config
```

### Step 2: Aggiorna Cache Font

```bash
# Aggiorna cache font
sudo fc-cache -f -v

# Verifica font installati
fc-list | grep -i "liberation\|dejavu\|noto\|roboto" | head -10
```

### Step 3: Configura Fontconfig (Opzionale ma Consigliato)

```bash
# Crea configurazione font per utente kiosk
sudo mkdir -p /home/kiosk/.config/fontconfig

sudo tee /home/kiosk/.config/fontconfig/fonts.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- Preferenza font sans-serif -->
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Liberation Sans</family>
      <family>DejaVu Sans</family>
      <family>Noto Sans</family>
      <family>Roboto</family>
    </prefer>
  </alias>
  
  <!-- Preferenza font serif -->
  <alias>
    <family>serif</family>
    <prefer>
      <family>Liberation Serif</family>
      <family>DejaVu Serif</family>
      <family>Noto Serif</family>
    </prefer>
  </alias>
  
  <!-- Preferenza font monospace -->
  <alias>
    <family>monospace</family>
    <prefer>
      <family>Liberation Mono</family>
      <family>DejaVu Sans Mono</family>
      <family>Noto Sans Mono</family>
    </prefer>
  </alias>
  
  <!-- Anti-aliasing e hinting -->
  <match target="font">
    <edit name="antialias" mode="assign">
      <bool>true</bool>
    </edit>
    <edit name="hinting" mode="assign">
      <bool>true</bool>
    </edit>
    <edit name="hintstyle" mode="assign">
      <const>hintslight</const>
    </edit>
    <edit name="rgba" mode="assign">
      <const>rgb</const>
    </edit>
  </match>
</fontconfig>
EOF

# Imposta permessi
sudo chown -R kiosk:kiosk /home/kiosk/.config
```

### Step 4: Riavvia Chromium

```bash
# Riavvia Chromium per applicare i nuovi font
sudo pkill -u kiosk -f chromium

# Oppure riavvia tutto il sistema
sudo reboot
```

## 🔧 Comandi Rapidi (Tutto in Uno)

```bash
# Installa font
sudo apt update && sudo apt install -y fonts-liberation fonts-liberation2 fonts-dejavu fonts-dejavu-core fonts-dejavu-extra fonts-noto fonts-noto-core fonts-noto-ui-core fonts-noto-color-emoji fonts-roboto fonts-roboto-unhinted fontconfig fontconfig-config

# Aggiorna cache
sudo fc-cache -f -v

# Crea configurazione font
sudo mkdir -p /home/kiosk/.config/fontconfig
sudo tee /home/kiosk/.config/fontconfig/fonts.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Liberation Sans</family>
      <family>DejaVu Sans</family>
      <family>Noto Sans</family>
      <family>Roboto</family>
    </prefer>
  </alias>
  <match target="font">
    <edit name="antialias" mode="assign"><bool>true</bool></edit>
    <edit name="hinting" mode="assign"><bool>true</bool></edit>
    <edit name="hintstyle" mode="assign"><const>hintslight</const></edit>
  </match>
</fontconfig>
EOF

# Permessi
sudo chown -R kiosk:kiosk /home/kiosk/.config

# Riavvia Chromium
sudo pkill -u kiosk -f chromium
```

## 🎯 Font Installati

Dopo l'installazione avrai:

- **Liberation Sans/Serif/Mono**: Font Microsoft-compatibili (Arial/Times/Courier)
- **DejaVu Sans/Serif/Mono**: Font open-source di alta qualità
- **Noto Sans/Serif/Mono**: Font Google per supporto multilingua
- **Roboto**: Font Google Material Design
- **Noto Color Emoji**: Emoji colorati

## 🔍 Verifica

```bash
# Lista font installati
fc-list | grep -E "Liberation|DejaVu|Noto|Roboto" | head -20

# Test rendering font
fc-match sans-serif
fc-match serif
fc-match monospace
```

## 📝 Note

1. **Font Liberation**: Compatibili con Arial, Times New Roman, Courier New (usati da molti siti web)
2. **Fontconfig**: Sistema di gestione font Linux - Chromium lo usa automaticamente
3. **Cache**: Dopo l'installazione, aggiorna sempre la cache con `fc-cache -f -v`
4. **Riavvio**: Chromium deve essere riavviato per caricare i nuovi font

## 🚀 Font Personalizzati (Opzionale)

Se vuoi usare font specifici (es. Inter, Poppins, etc.):

```bash
# Crea directory font personalizzati
sudo mkdir -p /usr/local/share/fonts/custom

# Copia i tuoi font .ttf o .otf
# sudo cp /path/to/fonts/*.ttf /usr/local/share/fonts/custom/

# Aggiorna cache
sudo fc-cache -f -v
```

## ⚠️ Troubleshooting

### Font ancora non corretti

```bash
# Verifica che fontconfig funzioni
fc-list | wc -l  # Dovrebbe essere > 100

# Verifica configurazione
cat /home/kiosk/.config/fontconfig/fonts.conf

# Test manuale
DISPLAY=:0 fc-match sans-serif
```

### Chromium non carica i font

```bash
# Pulisci cache Chromium
sudo rm -rf /tmp/chromium-kiosk

# Riavvia Chromium
sudo pkill -u kiosk -f chromium
```

---

**Dopo questi passaggi, i font dovrebbero essere molto più professionali e simili a quelli che vedi su browser desktop standard!**

