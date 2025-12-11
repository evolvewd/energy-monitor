#!/bin/bash
# Script per pulire InfluxDB e creare nuovo bucket

INFLUX_URL="${INFLUX_URL:-http://localhost:8086}"
INFLUX_TOKEN="${INFLUX_TOKEN:-energy-monitor-super-secret-token-change-this}"
INFLUX_ORG="${INFLUX_ORG:-assistec}"
BUCKET_NAME="${BUCKET_NAME:-energy}"

echo "=== Pulizia InfluxDB ==="
echo "URL: $INFLUX_URL"
echo "Org: $INFLUX_ORG"
echo "Bucket: $BUCKET_NAME"
echo ""

# Lista bucket esistenti
echo "Bucket esistenti:"
curl -s --request GET \
  "$INFLUX_URL/api/v2/buckets?org=$INFLUX_ORG" \
  --header "Authorization: Token $INFLUX_TOKEN" \
  --header "Content-Type: application/json" | jq -r '.buckets[] | "\(.id) - \(.name)"' || echo "Errore lettura bucket"

echo ""
echo "Eliminazione bucket esistenti..."

# Elimina bucket "opta" se esiste
OPTA_BUCKET_ID=$(curl -s --request GET \
  "$INFLUX_URL/api/v2/buckets?org=$INFLUX_ORG&name=opta" \
  --header "Authorization: Token $INFLUX_TOKEN" \
  --header "Content-Type: application/json" | jq -r '.buckets[0].id // empty')

if [ ! -z "$OPTA_BUCKET_ID" ]; then
    echo "Eliminazione bucket 'opta' (ID: $OPTA_BUCKET_ID)..."
    curl -s --request DELETE \
      "$INFLUX_URL/api/v2/buckets/$OPTA_BUCKET_ID" \
      --header "Authorization: Token $INFLUX_TOKEN" \
      --header "Content-Type: application/json"
    echo "Bucket 'opta' eliminato"
fi

# Elimina bucket "energy" se esiste
ENERGY_BUCKET_ID=$(curl -s --request GET \
  "$INFLUX_URL/api/v2/buckets?org=$INFLUX_ORG&name=$BUCKET_NAME" \
  --header "Authorization: Token $INFLUX_TOKEN" \
  --header "Content-Type: application/json" | jq -r '.buckets[0].id // empty')

if [ ! -z "$ENERGY_BUCKET_ID" ]; then
    echo "Eliminazione bucket '$BUCKET_NAME' (ID: $ENERGY_BUCKET_ID)..."
    curl -s --request DELETE \
      "$INFLUX_URL/api/v2/buckets/$ENERGY_BUCKET_ID" \
      --header "Authorization: Token $INFLUX_TOKEN" \
      --header "Content-Type: application/json"
    echo "Bucket '$BUCKET_NAME' eliminato"
fi

echo ""
echo "Creazione nuovo bucket '$BUCKET_NAME'..."

# Ottieni orgID
ORG_RESPONSE=$(curl -s --request GET \
  "$INFLUX_URL/api/v2/orgs?org=$INFLUX_ORG" \
  --header "Authorization: Token $INFLUX_TOKEN" \
  --header "Content-Type: application/json")

ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.orgs[0].id // empty')

if [ -z "$ORG_ID" ]; then
    echo "✗ Errore: Impossibile ottenere orgID"
    echo "Risposta API:"
    echo "$ORG_RESPONSE" | jq '.' 2>/dev/null || echo "$ORG_RESPONSE"
    exit 1
fi

echo "OrgID trovato: $ORG_ID"

# Crea nuovo bucket "energy" con retention 90 giorni
RETENTION_SECONDS=$((90 * 24 * 60 * 60))

RESPONSE=$(curl -s --request POST \
  "$INFLUX_URL/api/v2/buckets" \
  --header "Authorization: Token $INFLUX_TOKEN" \
  --header "Content-Type: application/json" \
  --data "{
    \"orgID\": \"$ORG_ID\",
    \"name\": \"$BUCKET_NAME\",
    \"retentionRules\": [{\"everySeconds\": $RETENTION_SECONDS}],
    \"description\": \"Energy Monitor - Dati produzione FV e supervisione\"
  }")

if echo "$RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    BUCKET_ID=$(echo "$RESPONSE" | jq -r '.id')
    echo "✓ Bucket '$BUCKET_NAME' creato con successo (ID: $BUCKET_ID)"
    echo "  Retention: 90 giorni"
else
    echo "✗ Errore creazione bucket:"
    echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo ""
echo "=== Pulizia completata ==="

