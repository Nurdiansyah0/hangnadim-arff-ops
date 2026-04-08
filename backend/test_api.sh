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
    curl -s -X GET "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" | python3 -m json.tool || echo "Error or non-JSON response"
}

test_post() {
    local name=$1
    local path=$2
    local body=$3
    echo -e "\n${BLUE}[POST] $name ($path)${NC}"
    curl -s -X POST "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$body" | python3 -m json.tool || echo "Error or non-JSON response"
}

test_put() {
    local name=$1
    local path=$2
    local body=$3
    echo -e "\n${BLUE}[PUT] $name ($path)${NC}"
    curl -s -X PUT "$BASE_URL$path" \
         -H "Authorization: Bearer $TOKEN" \
         -H "Content-Type: application/json" \
         -d "$body" | python3 -m json.tool || echo "Error or non-JSON response"
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

# 4. Get Vehicle List & Update first one (UPDATE)
echo -e "\n${BLUE}--- Testing PUT (Update Vehicle) ---${NC}"
VEHICLE_LIST=$(curl -s -X GET "$BASE_URL/vehicles" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json")

echo "$VEHICLE_LIST" | python3 -m json.tool || echo "Error or non-JSON response"
V_ID=$(echo $VEHICLE_LIST | grep -oP '(?<="id":")[^"]*' | head -n 1)

if [ ! -z "$V_ID" ]; then
    echo -e "Updating Vehicle ID: $V_ID"
    UPDATE_BODY='{"status": "MAINTENANCE", "name": "FT-1 Updated via Script"}'
    test_put "Update Vehicle" "/vehicles/$V_ID" "$UPDATE_BODY"
else
    echo -e "${RED}Skipping Update: No vehicles found to update.${NC}"
fi

# 5. Summary Check
echo -e "\n${BLUE}--- Verification: List all logs again ---${NC}"
test_get "All Logs" "/watchroom"

echo -e "\n${GREEN}=== Full Test Completed ===${NC}"
