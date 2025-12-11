# Energy Monitor - Contesto Progetto

**Data:** 2025-01-27  
**Ultima modifica:** Analisi sistema e pianificazione estensione condominiale

## Stato Attuale del Sistema

### Architettura Esistente

**Backend (Docker Compose):**
- **Mosquitto** (MQTT Broker) - porta 1883, WebSocket 9001
- **InfluxDB 2.7** - porta 8086
  - Bucket: `opta`
  - Org: `assistec`
  - Retention: 1 settimana
- **Node-RED** - porta 1880
  - Flussi MQTT → InfluxDB per 3 topic:
    - `opta/6m/realtime`
    - `opta/6m/power`
    - `opta/6m/extremes`

**Frontend (Next.js 15):**
- Dashboard con visualizzazione dati OPTA
- API routes per query InfluxDB
- Hook React per polling dati (1s, 5s, 30s)
- Pagine: `/`, `/analytics`, `/test-opta`

**Dati Attuali:**
- Un solo lettore: `6m_produzione`
- Measurement InfluxDB: `realtime`, `power`, `extremes`
- Tag: `device: "opta"`, `model: "6m_produzione"`

## Estensione Pianificata: Sistema Condominiale

### Requisiti

1. **Sistema Produzione**
   - Lettore dedicato per pannelli fotovoltaici (dopo inverter)
   - Monitoraggio produzione energia

2. **Sistema Alloggi**
   - Ogni alloggio ha **2 lettori**:
     - **Contatore**: energia dal distributore (contatore classico)
     - **Supporto**: energia dal condominio (batterie/produzione)
   - Quando un alloggio eccede nella richiesta e il sistema condominiale lo permette, può prelevare dal supporto
   - L'energia di supporto deve essere contabilizzata per la vendita

3. **Configurazione da Frontend**
   - Menu impostazioni per:
     - Abilitare/disabilitare sistema produzione e accumulo
     - Definire numero di alloggi
   - Da qui deriva il numero di card "alloggio" dinamiche

### Proposta Architettura

#### 1. Struttura Topic MQTT

```
opta/produzione/realtime
opta/produzione/power
opta/produzione/extremes

opta/alloggio_1/contatore/realtime
opta/alloggio_1/contatore/power
opta/alloggio_1/contatore/extremes

opta/alloggio_1/supporto/realtime
opta/alloggio_1/supporto/power
opta/alloggio_1/supporto/extremes

opta/alloggio_2/contatore/realtime
opta/alloggio_2/supporto/realtime
... (e così via per ogni alloggio)
```

#### 2. Identificazione Lettori (InfluxDB Tags)

Ogni punto dati avrà questi tag:
- `device: "opta"`
- `type: "produzione" | "contatore" | "supporto"`
- `alloggio_id: "1" | "2" | ... | null` (null solo per produzione)
- `model: "6m_produzione"` (o altro modello se cambia)

**Esempio measurement:**
```
measurement: "realtime"
tags: { device: "opta", type: "contatore", alloggio_id: "1", model: "6m_produzione" }
fields: { v_rms: 230, i_rms: 5, p_active: 1250, frequency: 50, ... }
```

#### 3. Contabilizzazione Energia Supporto

**Calcoli automatici:**
- Energia supporto per alloggio = somma `energy_total` dal lettore supporto
- Energia totale venduta = somma energia supporto di tutti gli alloggi
- Bilancio produzione = `produzione.energy_total` - `consumo_totale_alloggi`
- Disponibilità condominiale = produzione + accumulo (quando disponibile) - consumo totale

#### 4. Database InfluxDB

- Mantenere bucket `opta` esistente
- Usare i tag sopra per filtrare/aggregare
- Query Flux per calcoli aggregati

#### 5. Node-RED

**Flusso generico con pattern matching:**
- Un nodo MQTT in con wildcard: `opta/+/+/+` (cattura tutti i topic)
- Funzione JavaScript che:
  - Parsa il topic per estrarre: tipo (produzione/alloggio_X), lettore (contatore/supporto), misura (realtime/power/extremes)
  - Crea i tag appropriati
  - Invia a InfluxDB con measurement corretto

#### 6. Frontend - Impostazioni

**Pagina `/settings` con:**
- Switch: "Sistema produzione/accumulo presente"
- Input: "Numero alloggi" (1-50)
- Per ogni alloggio (se numero > 0):
  - Input: "Nome alloggio" (es. "Appartamento 1", "A1")
  - Input opzionale: "Topic personalizzato" (default: `alloggio_1`, `alloggio_2`, ecc.)
- Salvataggio: **da decidere** (localStorage o backend API?)

#### 7. Frontend - Dashboard

**Layout principale (`/`):**
- Sezione produzione (se abilitata):
  - Card con gauge principali (produzione istantanea, energia totale giornaliera)
- Sezione alloggi:
  - Grid di card dinamiche (una per alloggio)
  - Ogni card mostra:
    - Nome alloggio
    - Due metriche principali: potenza contatore + potenza supporto
    - Indicatore se sta usando supporto (se `p_active_supporto > 0`)
    - Click per aprire dettaglio

**Pagina dettaglio alloggio (`/alloggio/[id]`):**
- Due sezioni: contatore e supporto
- Grafici e metriche per entrambi i lettori
- Calcolo energia supporto utilizzata

#### 8. Struttura Dati Configurazione

```typescript
interface SystemConfig {
  produzioneEnabled: boolean;
  accumuloEnabled: boolean; // per futuro
  numAlloggi: number;
  alloggi: Array<{
    id: string; // "1", "2", ...
    name: string; // "Appartamento 1"
    topicPrefix?: string; // default: "alloggio_1"
  }>;
}
```

## Decisioni da Prendere

1. **Storage configurazione:**
   - [ ] localStorage (solo frontend)
   - [ ] Backend API (persistente, condivisibile)

2. **Nomi alloggi:**
   - [ ] Obbligatori
   - [ ] Opzionali (default "Alloggio 1", "Alloggio 2")

3. **Topic personalizzati:**
   - [ ] Necessari
   - [ ] Sempre `alloggio_1`, `alloggio_2` (default)

4. **Priorità implementazione:**
   - [ ] Prima: impostazioni + dashboard base
   - [ ] Poi: dettaglio alloggi
   - [ ] Infine: contabilizzazione avanzata

## Note Tecniche

- Tutti i lettori inviano gli stessi dati (realtime, power, extremes)
- Sistema accumulo: sì ma più avanti
- Priorità/regole visualizzazione: no
- Vista produzione separata: no (integrata nel dashboard principale)

## Prossimi Passi

1. Attendere conferma decisioni sopra
2. Implementare struttura configurazione
3. Modificare Node-RED per gestire topic dinamici
4. Creare pagina impostazioni
5. Aggiornare dashboard principale
6. Creare pagina dettaglio alloggio
7. Implementare calcoli contabilizzazione

---

**Per recuperare questo contesto:** Leggi questo file all'inizio della prossima sessione di lavoro.


