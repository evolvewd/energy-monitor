# Shortcut Chrome 1920x1080

Questi script permettono di aprire l'applicazione Energy Monitor in Chrome con una finestra di dimensioni fisse 1920x1080, utile quando si lavora su monitor 4K o risoluzioni più grandi.

## File disponibili

- **open-chrome-1920x1080.sh** - Script bash per Linux/Mac
- **open-chrome-1920x1080.desktop** - File desktop per Linux (crea una shortcut nel menu)
- **open-chrome-1920x1080.bat** - Script batch per Windows

## Utilizzo

### Linux/Mac

#### Metodo 1: Eseguire lo script direttamente
```bash
cd /home/energymonitor/apps/energy-monitor
./open-chrome-1920x1080.sh
```

#### Metodo 2: Usare npm script (dalla cartella frontend)
```bash
cd frontend
npm run open:1920
```

#### Metodo 3: Creare una shortcut nel menu (Linux)
1. Copia il file `.desktop` nella cartella delle applicazioni:
```bash
cp open-chrome-1920x1080.desktop ~/.local/share/applications/
```
2. Cerca "Energy Monitor (1920x1080)" nel menu delle applicazioni
3. Aggiungi ai preferiti se necessario

### Windows

1. Doppio click su `open-chrome-1920x1080.bat`
2. Oppure crea una shortcut sul desktop puntando al file `.bat`

## Personalizzazione

### Modificare l'URL

Apri lo script e modifica la variabile `APP_URL`:
- Linux/Mac: `APP_URL="http://localhost:3000"`
- Windows: `set APP_URL=http://localhost:3000`

### Modificare le dimensioni

Modifica il parametro `--window-size`:
- Attuale: `--window-size=1920,1080`
- Esempio per 1280x720: `--window-size=1280,720`

### Aprire come app (senza barra degli indirizzi)

Nello script bash, decommenta la "Opzione 2" e commenta la "Opzione 1".

## Note

- Assicurati che il server di sviluppo sia avviato (`npm run dev`)
- Lo script rileva automaticamente se hai installato `google-chrome`, `chromium-browser` o `chromium`
- Su Windows, verifica che il percorso di Chrome sia corretto nello script `.bat`

