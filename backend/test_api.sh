#!/bin/bash

# Configuration
BASE_URL="http://localhost:8000/api"
ADMIN_IDENT="admin123"
ADMIN_PASS="admin123"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== ARFF OPS FULL API TEST SCRIPT ===${NC}"

# 1. Login
echo -e "\n[1] Logging in as $ADMIN_IDENT..."
LOGIN_RES=$(curl -s -X POST "$BASE_URL/auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"ident\": \"$ADMIN_IDENT\", \"password\": \"$ADMIN_PASS\"}")

TOKEN=$(echo $LOGIN_RES | grep -oP '(?<="access_token":")[^"]*')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}FAILED: Could not get access token${NC}"
    echo "Response: $LOGIN_RES"
    exit 1
fi
echo -e "${GREEN}SUCCESS: Token retrieved.${NC}"

# --- Helper Functions ---

test_get() {
    local name=$1
    local path=$2
    echo -e "\n${BLUE}[GET] $name ($path)${NC}"
    local response=$(curl -s -X GET "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo -e "${RED}Non-JSON response:${NC}\n$response"
}

test_post() {
    local name=$1
    local path=$2
    local body=$3
    echo -e "\n${BLUE}[POST] $name ($path)${NC}"
    local response=$(curl -s -X POST "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$body")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo -e "${RED}Non-JSON response:${NC}\n$response"
}

test_put() {
    local name=$1
    local path=$2
    local body=$3
    echo -e "\n${BLUE}[PUT] $name ($path)${NC}"
    local response=$(curl -s -X PUT "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$body")
    echo "$response" | python3 -m json.tool 2>/dev/null || echo -e "${RED}Non-JSON response:${NC}\n$response"
}

# --- Execution ---

# 2. Get Profile (READ)
test_get "My Profile" "/auth/profile/me"

# 3. Create Watchroom Log (CREATE)
echo -e "\n${BLUE}--- Testing POST (Create Log) ---${NC}"
LOG_BODY='{
    "entry_type": "RADIO_CHECK",
    "description": "Terminal test log entry",
    "payload": {"device": "BATT-01", "status": "OK"}
}'
test_post "Create Log" "/watchroom" "$LOG_BODY"

# 4. Fire Extinguisher GIS (CREATE & READ)
echo -e "\n${BLUE}--- Testing GIS (Fire Extinguishers) ---${NC}"
TIMESTAMP=$(date +%s)
APAR_BODY='{
    "serial_number": "APAR-'$TIMESTAMP'",
    "agent_type": "CO2",
    "capacity_kg": 5.0,
    "location_description": "Test Hangar B",
    "latitude": -6.1265,
    "longitude": 106.6534,
    "floor": "1",
    "building": "Hangar B",
    "expiry_date": "2027-01-01",
    "status": "READY"
}'
test_post "Create Fire Extinguisher" "/fire-extinguishers" "$APAR_BODY"

# 5. Nearby & GeoJSON
test_get "Nearby Extinguishers (500m)" "/fire-extinguishers/nearby?lat=-6.1265&lng=106.6534&radius=500"
test_get "GeoJSON Export" "/fire-extinguishers/geojson"

# 6. Create Inspection for APAR (Barcode Scan Simulation)
echo -e "\n${BLUE}--- Testing APAR Inspection Flow ---${NC}"
APAR_LIST=$(curl -s -X GET "$BASE_URL/fire-extinguishers" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json")

APAR_ID=$(echo $APAR_LIST | grep -oP '(?<="id":")[^"]*' | head -n 1)

# Fetch a valid template item ID (dynamically)
ITEM_ID=$(psql "postgres://arff_user:arff_pass@localhost:5432/arff_db" -t -c "SELECT id FROM template_items LIMIT 1;" | xargs)

if [ ! -z "$APAR_ID" ] && [ ! -z "$ITEM_ID" ]; then
    echo -e "Creating Inspection for APAR ID: $APAR_ID using Template Item ID: $ITEM_ID"
    INSP_BODY='{
        "fire_extinguisher_id": "'$APAR_ID'",
        "tanggal": "'$(date +%Y-%m-%d)'",
        "status": "APPROVED",
        "latitude": -6.1266,
        "longitude": 106.6535,
        "results": [
            {"template_item_id": '$ITEM_ID', "result": "PASS", "notes": "QR Scan verified"}
        ]
    }'
    test_post "Create APAR Inspection" "/inspections" "$INSP_BODY"
else
    echo -e "${RED}Skipping Inspection: No fire extinguishers or template items found.${NC}"
fi

# 7. Vehicle Maintenance (CREATE & SYNC)
echo -e "\n${BLUE}--- Testing Vehicle Maintenance Flow ---${NC}"
VEHICLE_LIST=$(curl -s -X GET "$BASE_URL/vehicles" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json")

V_ID=$(echo $VEHICLE_LIST | grep -oP '(?<="id":")[^"]*' | head -n 1)

if [ ! -z "$V_ID" ]; then
    PERS_ID=$(psql "postgres://arff_user:arff_pass@localhost:5432/arff_db" -t -c "SELECT id FROM personnels WHERE nip_nik = '12345678';" | xargs)
    MAINT_DATE=$(date +%Y-%m-%d)
    NEXT_DUE=$(date -d "+6 months" +%Y-%m-%d)
    
    MAINT_BODY='{
        "vehicle_id": "'$V_ID'",
        "maintenance_type": "REPAIR",
        "description": "Brake pad replacement and hydraulic check",
        "performed_by": "'$PERS_ID'",
        "performed_at": "'$MAINT_DATE'",
        "cost": 1500000.00,
        "next_due": "'$NEXT_DUE'"
    }'
    
    test_post "Create Maintenance Record" "/maintenance" "$MAINT_BODY"
    
    echo -e "\nVerifying Vehicle Sync Status..."
    VEHICLE_CHECK=$(curl -s -X GET "$BASE_URL/vehicles" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" | grep -A 10 "$V_ID")
    
    echo "$VEHICLE_CHECK" | grep -E "status|last_service_date|next_service_due"
else
    echo -e "${RED}Skipping Maintenance: No vehicles found.${NC}"
fi

# 8. Summary Check
echo -e "\n${BLUE}--- Verification: List all logs again ---${NC}"
test_get "All Logs" "/watchroom"
test_get "Recent Inspections" "/inspections"

echo -e "\n${GREEN}=== Full Test Completed ===${NC}"
