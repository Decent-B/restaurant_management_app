#!/bin/bash

# Restaurant Management API Test Suite
# Dynamic bash script that adapts to existing data

BASE_URL="http://localhost:8000/api"
COOKIE_FILE="/tmp/api_test_cookies.txt"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

trap "rm -f $COOKIE_FILE" EXIT

test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -b "$COOKIE_FILE" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
                   -d "$data" "$BASE_URL$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name [$status_code]"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name [$status_code]"
        echo "  Response: $(echo "$body" | head -c 80)"
        ((FAILED++))
    fi
}

test_api_json() {
    local name="$1"
    local endpoint="$2"
    local json_data="$3"
    local expected_status="${4:-200}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST -b "$COOKIE_FILE" -c "$COOKIE_FILE" \
               -H "Content-Type: application/json" -d "$json_data" "$BASE_URL$endpoint")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $name [$status_code]"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $name [$status_code]"
        echo "  Response: $(echo "$body" | head -c 80)"
        ((FAILED++))
    fi
}

echo "============================================================"
echo "Restaurant Management API Test Suite"
echo "============================================================"

# === SETUP: Get existing data ===
# Login as manager to get system data
curl -s -X POST -c "$COOKIE_FILE" -d "username=Guy Fieri&password=123" \
    "$BASE_URL/accounts/staff/login/" > /dev/null

# Get an existing customer ID
CUSTOMER_ID=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/orders/all/" | \
    grep -o '"diner_id": [0-9]*' | head -1 | awk '{print $2}')
if [ -z "$CUSTOMER_ID" ]; then CUSTOMER_ID=1; fi

# Get customer name
CUSTOMER_INFO=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/accounts/diner/info/?diner_id=$CUSTOMER_ID" 2>/dev/null)
CUSTOMER_NAME=$(echo "$CUSTOMER_INFO" | grep -o '"name": *"[^"]*"' | head -1 | sed 's/"name": *"\(.*\)"/\1/')

# Get existing order ID
ORDER_ID=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/orders/all/" | \
    grep -o '"order_id": [0-9]*' | head -1 | awk '{print $2}')

# Get menu ID
MENU_ID=$(curl -s "$BASE_URL/menu/menus/" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -z "$MENU_ID" ]; then MENU_ID=1; fi

# Get menu item ID
ITEM_ID=$(curl -s "$BASE_URL/menu/menu-items/" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
if [ -z "$ITEM_ID" ]; then ITEM_ID=1; fi

# Logout after setup
curl -s -X POST -b "$COOKIE_FILE" "$BASE_URL/accounts/logout/" > /dev/null

# === ACCOUNTS APIs ===
echo ""
echo "[1. ACCOUNTS APIs]"

# 1.1 Manager Login
test_api "Manager Login" "POST" "/accounts/staff/login/" "username=Guy Fieri&password=123"

# 1.4 Get Customer Info
test_api "Get Customer Info (Manager)" "GET" "/accounts/diner/info/?diner_id=$CUSTOMER_ID" ""

# 1.6 Add User Account
TIMESTAMP=$(date +%s)
test_api "Add User Account" "POST" "/accounts/manager/add/" \
    "name=TestUser${TIMESTAMP}&role=Customer&email=test${TIMESTAMP}@test.com" "201"

# 1.5 Update User Info
test_api "Update User Info (Manager)" "POST" "/accounts/user/update/" \
    "user_id=${CUSTOMER_ID}&phone_num=1234567890"

# 1.8 Update User Role
test_api "Update User Role" "POST" "/accounts/manager/update_role/" \
    "user_id=${CUSTOMER_ID}&new_role=Customer"

# 1.3 Logout
test_api "Manager Logout" "POST" "/accounts/logout/" ""

# 1.2 Customer Login
if [ -n "$CUSTOMER_NAME" ]; then
    test_api "Customer Login" "POST" "/accounts/diner/login/" "username=${CUSTOMER_NAME}&password=123"
    
    # 1.4 Get Own Info
    test_api "Get Own Customer Info" "GET" "/accounts/diner/info/?diner_id=$CUSTOMER_ID" ""
    
    # 1.5 Update Own Info
    test_api "Update Own User Info" "POST" "/accounts/user/update/" \
        "user_id=${CUSTOMER_ID}&phone_num=9999999999"
    
    # 1.3 Customer Logout
    test_api "Customer Logout" "POST" "/accounts/logout/" ""
else
    echo -e "${RED}✗${NC} Customer Login [SKIPPED - No customer found]"
    echo -e "${RED}✗${NC} Get Own Customer Info [SKIPPED]"
    echo -e "${RED}✗${NC} Update Own User Info [SKIPPED]"
    echo -e "${RED}✗${NC} Customer Logout [SKIPPED]"
    ((FAILED+=4))
fi

# === MENU APIs ===
echo ""
echo "[2. MENU APIs]"

# 2.1 List All Menus
test_api "List All Menus" "GET" "/menu/menus/" ""

# 2.2 Get Menu Details
test_api "Get Menu Details" "GET" "/menu/menus/$MENU_ID/" ""

# 2.3 List All Menu Items
test_api "List All Menu Items" "GET" "/menu/menu-items/" ""

# 2.3 List Menu Items (filtered)
test_api "List Menu Items (Filtered)" "GET" "/menu/menu-items/?menu=$MENU_ID" ""

# === ORDERS APIs ===
echo ""
echo "[3. ORDERS APIs]"

# Login as manager
curl -s -X POST -c "$COOKIE_FILE" -d "username=Guy Fieri&password=123" \
    "$BASE_URL/accounts/staff/login/" > /dev/null

# 3.5 Get All Orders
test_api "Get All Orders (Manager)" "GET" "/orders/all/" ""

if [ -n "$ORDER_ID" ]; then
    # 3.1 Get Order by ID
    test_api "Get Order by ID" "GET" "/orders/get_order/?order_id=$ORDER_ID" ""
    
    # 3.2 Get Bill
    test_api "Get Bill" "GET" "/orders/get_bill/?order_id=$ORDER_ID" ""
    
    # 3.4 Update Order Status
    test_api "Update Order Status" "POST" "/orders/status/update/" \
        "order_id=$ORDER_ID&status=PENDING"
else
    echo -e "${RED}✗${NC} Get Order by ID [SKIPPED - No orders]"
    echo -e "${RED}✗${NC} Get Bill [SKIPPED - No orders]"
    echo -e "${RED}✗${NC} Update Order Status [SKIPPED - No orders]"
    ((FAILED+=3))
fi

# Logout and login as customer
curl -s -X POST -b "$COOKIE_FILE" "$BASE_URL/accounts/logout/" > /dev/null

if [ -n "$CUSTOMER_NAME" ]; then
    curl -s -X POST -c "$COOKIE_FILE" -d "username=${CUSTOMER_NAME}&password=123" \
        "$BASE_URL/accounts/diner/login/" > /dev/null
    
    # 3.3 Submit Order
    test_api_json "Submit Order" "/orders/submit/" \
        "{\"diner_id\":${CUSTOMER_ID},\"service_type\":\"Dine-in\",\"note\":\"Test order\",\"ordered_items\":[${ITEM_ID}],\"quantities\":[1]}"
    
    # Find customer's orders
    CUSTOMER_ORDER=$(curl -s -b "$COOKIE_FILE" "$BASE_URL/orders/all/" 2>/dev/null | \
        grep -B 2 "\"diner_id\": ${CUSTOMER_ID}" | grep -o '"order_id": [0-9]*' | head -1 | awk '{print $2}')
    
    if [ -z "$CUSTOMER_ORDER" ]; then CUSTOMER_ORDER=$ORDER_ID; fi
    
    # 3.1 Get Own Order
    test_api "Get Own Order" "GET" "/orders/get_order/?order_id=$CUSTOMER_ORDER" ""
    
    # 3.2 Get Own Bill
    test_api "Get Own Bill" "GET" "/orders/get_bill/?order_id=$CUSTOMER_ORDER" ""
fi

# === REVIEWS APIs ===
echo ""
echo "[4. REVIEWS APIs]"

# 4.1 List All Feedback
test_api "List All Feedback" "GET" "/reviews/feedbacks/" ""

# === ANALYTICS APIs ===
echo ""
echo "[5. ANALYTICS APIs]"

# Logout and login as manager for analytics
curl -s -X POST -b "$COOKIE_FILE" "$BASE_URL/accounts/logout/" > /dev/null
curl -s -X POST -c "$COOKIE_FILE" -d "username=Guy Fieri&password=123" \
    "$BASE_URL/accounts/staff/login/" > /dev/null

# 5.1 Get Rating Analytics
test_api "Get Rating Analytics" "GET" "/analytics/rating/?start=2024-01-01%2000:00:00&end=2025-12-31%2023:59:59" ""

# 5.3 Get Menu Items Order Count
test_api "Get Menu Items Order Count" "GET" "/analytics/order-count/?start=2024-01-01%2000:00:00&end=2025-12-31%2023:59:59" ""

# 5.2 Get Revenue Analytics
test_api "Get Revenue Analytics" "GET" "/analytics/revenue/?start=2024-01-01%2000:00:00&end=2025-12-31%2023:59:59" ""

# Final logout
test_api "Final Logout" "POST" "/accounts/logout/" ""

# === TEST SUMMARY ===
echo ""
echo "============================================================"
echo "Test Summary: $PASSED passed, $FAILED failed"
echo "============================================================"

[ $FAILED -eq 0 ] && exit 0 || exit 1
