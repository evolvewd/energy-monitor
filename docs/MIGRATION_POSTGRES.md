# Migrazione a PostgreSQL per Settings

## ✅ Completata

La migrazione da InfluxDB a PostgreSQL per le configurazioni è stata completata.

## Cosa è stato fatto

1. **PostgreSQL aggiunto a docker-compose.yml**
   - Container: `energy_postgres`
   - Porta: `5432`
   - Database: `energy_monitor`
   - User: `energy_user`
   - Password: `energy_monitor_2024`

2. **Schema database creato**
   - `system_settings`: Impostazioni di sistema (key-value)
   - `alloggi`: Configurazione alloggi
   - `modbus_readers`: Configurazione lettori Modbus
   - Indici e foreign keys per performance e integrità

3. **Nuovo file `lib/postgres-settings.ts`**
   - Sostituisce `lib/influx-settings.ts` per le settings
   - Stesse interfacce, implementazione SQL
   - Query semplici e dirette

4. **API routes aggiornate**
   - `/api/settings` ora usa PostgreSQL
   - `/api/settings/check` ora usa PostgreSQL

## Separazione dei database

- **PostgreSQL**: Configurazioni e settings (dati relazionali)
- **InfluxDB**: Dati time-series dei sensori (dati temporali)

## Variabili d'ambiente

Aggiunte a `.env.local`:
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=energy_monitor
POSTGRES_USER=energy_user
POSTGRES_PASSWORD=energy_monitor_2024
```

## Avvio

```bash
docker compose up -d postgres
```

Lo schema viene creato automaticamente al primo avvio tramite `/postgres/init/01-init-schema.sql`.

## Vantaggi

✅ Query SQL semplici invece di Flux complesse
✅ Nessun problema con aggregazioni su booleani
✅ Integrità referenziale con foreign keys
✅ Transazioni ACID per operazioni complesse
✅ Indici per performance
✅ Trigger automatici per `updated_at`

## File da non usare più

- `lib/influx-settings.ts` - Ora usare `lib/postgres-settings.ts`
- Il bucket `settings` in InfluxDB non è più necessario

## Test

Per verificare che tutto funzioni:

1. Avvia PostgreSQL: `docker compose up -d postgres`
2. Verifica connessione: controlla i log del container
3. Prova a salvare una configurazione dalla pagina `/setup`
4. Verifica i dati: `docker exec -it energy_postgres psql -U energy_user -d energy_monitor -c "SELECT * FROM system_settings;"`

