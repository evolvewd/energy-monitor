# Fix SSH su Windows - Rimozione Chiave Host

## 🚨 Problema

Quando un server cambia la sua chiave SSH (ad esempio dopo reinstallazione), Windows blocca la connessione con questo errore:

```
WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!
Offending ED25519 key in C:\Users\vince\.ssh\known_hosts:30
```

## ✅ Soluzione Rapida

### Metodo 1: Comando ssh-keygen (Consigliato)

Apri PowerShell o CMD e esegui:

```powershell
ssh-keygen -R 192.168.2.143
```

Questo comando:
- Rimuove automaticamente la vecchia chiave per quell'IP
- Aggiorna il file `known_hosts`
- È il metodo più sicuro e veloce

### Metodo 2: Modifica Manuale

1. Apri Notepad come amministratore:
   ```powershell
   notepad C:\Users\vince\.ssh\known_hosts
   ```

2. Trova la riga 30 (o cerca `192.168.2.143`)
3. Elimina quella riga
4. Salva il file

### Metodo 3: Elimina tutto il file (se hai problemi)

⚠️ **Attenzione**: Questo rimuove TUTTE le chiavi salvate

```powershell
# Backup (opzionale)
copy C:\Users\vince\.ssh\known_hosts C:\Users\vince\.ssh\known_hosts.backup

# Elimina il file
del C:\Users\vince\.ssh\known_hosts
```

## 🔄 Dopo la Rimozione

Riprova la connessione:

```powershell
ssh 192.168.2.143
```

La prima volta ti chiederà di accettare la nuova chiave:
```
The authenticity of host '192.168.2.143' can't be established.
ED25519 key fingerprint is SHA256:Gtx+4i9g8lw1ejefwnYW3p1vufebN3l4x/vk3YfP2mg.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
```

Digita `yes` per accettare.

## 📝 Comandi Utili SSH su Windows

### Verifica se il file esiste
```powershell
Test-Path C:\Users\vince\.ssh\known_hosts
```

### Visualizza il contenuto
```powershell
Get-Content C:\Users\vince\.ssh\known_hosts
```

### Cerca una chiave specifica
```powershell
Select-String -Path C:\Users\vince\.ssh\known_hosts -Pattern "192.168.2.143"
```

### Rimuovi chiave per IP specifico
```powershell
ssh-keygen -R 192.168.2.143
```

### Rimuovi chiave per hostname
```powershell
ssh-keygen -R ark.local
```

## 🔐 Perché Succede?

Questo errore si verifica quando:
- Il server è stato reinstallato (nuova chiave SSH)
- Il server ha cambiato configurazione SSH
- È stato fatto un backup/restore del server
- Qualcuno ha modificato manualmente le chiavi SSH

**È una protezione di sicurezza**: SSH ti avvisa che la chiave è cambiata per prevenire attacchi man-in-the-middle.

## ✅ Verifica Connessione

Dopo aver rimosso la chiave, verifica:

```powershell
# Test connessione
ssh -o StrictHostKeyChecking=no 192.168.2.143 "echo 'Connessione OK'"

# Oppure connessione normale (ti chiederà di accettare la nuova chiave)
ssh 192.168.2.143
```

## 🎯 Per l'ARK

Una volta connesso all'ARK, puoi eseguire i comandi per correggere le porte:

```bash
# Cambia a porta 3000 (sviluppo)
sudo sed -i 's|http://192.168.2.252:[0-9]*|http://192.168.2.252:3000|g' /home/kiosk/.xinitrc
sudo sed -i 's/SERVER_PORT="[0-9]*"/SERVER_PORT="3000"/' /usr/local/bin/kiosk-monitor.sh
sudo sed -i 's/Environment="SERVER_PORT=[0-9]*"/Environment="SERVER_PORT=3000"/' /etc/systemd/system/kiosk-monitor.service
sudo systemctl daemon-reload
sudo systemctl restart kiosk-monitor.service
sudo pkill -u kiosk -f chromium
```

---

**Nota**: Se usi Windows 10/11 con OpenSSH integrato, i comandi funzionano direttamente in PowerShell. Se usi PuTTY o altri client SSH, il file potrebbe essere in una posizione diversa.

