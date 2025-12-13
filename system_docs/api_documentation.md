# Restaurant Management System - API Documentation

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Authorization & RBAC](#authorization--rbac)
- [1. Accounts APIs](#1-accounts-apis)
- [2. Menu APIs](#2-menu-apis)
- [3. Orders APIs](#3-orders-apis)
- [4. Reviews APIs](#4-reviews-apis)
- [5. Analytics APIs](#5-analytics-apis)
- [Error Handling](#error-handling)
- [Data Models](#data-models)

---

## Base URL
```
http://localhost:8000/api
```

## Authentication

The API uses **JWT (JSON Web Token) Bearer authentication** with session-based fallback for backward compatibility.

### JWT Authentication Flow

1. **Login**: User authenticates with username/password
2. **Receive Tokens**: Server returns:
   - `access` token (expires in 24 hours)
   - `refresh` token (expires in 7 days)
   - User information
3. **Store Tokens**: Client stores tokens in localStorage
4. **Include Token**: All subsequent requests include: `Authorization: Bearer <access_token>`
5. **Token Refresh**: When access token expires, use refresh token to get new access token
6. **Logout**: Client discards tokens

### Token Structure

**Access Token:**
- Lifetime: 24 hours
- Algorithm: HS256
- Payload contains: `user_id`, `token_type`, `exp`, `iat`
- Used in Authorization header for all protected endpoints

**Refresh Token:**
- Lifetime: 7 days
- Used only at `/accounts/token/refresh/` endpoint
- Generates new access token without re-authentication

### Authorization Header Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Session-Based Fallback
For backward compatibility, session cookies are still set on login:
- `staff_id`: Set when staff/manager logs in
- `diner_id`: Set when customer logs in

**Note:** JWT authentication takes precedence. If both JWT and session are present, JWT is validated first.

---

## Authorization & RBAC

The system implements **Role-Based Access Control (RBAC)** with three roles:

| Role | Permissions |
|------|------------|
| **Customer** | - View/update own profile<br>- Create/view/update own orders<br>- Submit feedback for own orders<br>- View menu items |
| **Staff** | - View/update all orders<br>- Update order status<br>- View analytics<br>- Manage payments |
| **Manager** | - Full access to all resources<br>- User management (create/delete/update roles)<br>- Menu management<br>- Analytics access |

---

## 1. Accounts APIs

**Authentication Note:** All protected endpoints require the `Authorization: Bearer <access_token>` header unless specified otherwise. Login endpoints are public and return JWT tokens.

### 1.1 Staff/Manager Login
Authenticates staff or manager users and returns JWT tokens.

**Endpoint:** [`POST /accounts/staff/login/`](http://localhost:8000/api/accounts/staff/login/)

**Authorization:** None (public endpoint)

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Staff/Manager username |
| password | string | Yes | User password |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/accounts/staff/login/ \
  -d "username=Guy Fieri&password=123"
```

**Success Response (200):**
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Guy Fieri",
    "email": "guy@example.com",
    "role": "Manager"
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates successful authentication |
| access | string | JWT access token (24hr expiry) |
| refresh | string | JWT refresh token (7 day expiry) |
| user | object | Authenticated user information |
| user.id | number | User ID |
| user.name | string | User name |
| user.email | string | User email |
| user.role | string | User role ("Staff" or "Manager") |

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Invalid credentials | `{"success": false, "error": "Invalid credentials"}` |
| 405 | Invalid HTTP method | `{"error": "Only POST allowed"}` |

**Usage:**
1. Store `access` and `refresh` tokens in localStorage
2. Include access token in all subsequent requests: `Authorization: Bearer <access_token>`
3. Use refresh token to get new access token when expired

**Related Endpoints:**
- [Customer Login](#12-customer-login)
- [Token Refresh](#14-refresh-access-token)
- [Logout](#13-logout)

---

### 1.2 Customer Login
Authenticates customer users and returns JWT tokens.

**Endpoint:** [`POST /accounts/diner/login/`](http://localhost:8000/api/accounts/diner/login/)

**Authorization:** None (public endpoint)

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| username | string | Yes | Customer username |
| password | string | Yes | User password |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/accounts/diner/login/ \
  -d "username=John Doe&password=123"
```

**Success Response (200):**
```json
{
  "success": true,
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Customer",
    "diner_id": 5
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Indicates successful authentication |
| access | string | JWT access token (24hr expiry) |
| refresh | string | JWT refresh token (7 day expiry) |
| user | object | Authenticated user information |
| user.id | number | User ID |
| user.name | string | User name |
| user.email | string | User email |
| user.role | string | User role ("Customer") |
| user.diner_id | number | Same as user.id (for backward compatibility) |

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Invalid credentials | `{"success": false, "error": "Invalid credentials"}` |
| 405 | Invalid HTTP method | `{"error": "Only POST allowed"}` |

**Usage:**
1. Store `access` and `refresh` tokens in localStorage
2. Include access token in all subsequent requests: `Authorization: Bearer <access_token>`
3. Use refresh token to get new access token when expired

**Related Endpoints:**
- [Staff/Manager Login](#11-staffmanager-login)
- [Token Refresh](#14-refresh-access-token)
- [Logout](#13-logout)

---

### 1.3 Logout
Clears the current session and invalidates JWT tokens (client-side).

**Endpoint:** [`POST /accounts/logout/`](http://localhost:8000/api/accounts/logout/)

**Authorization:** Required (any logged-in user)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/accounts/logout/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 405 | Invalid HTTP method | `{"error": "Only POST allowed"}` |
| 500 | Server error | `{"success": false, "error": "error message"}` |

**Note:** Client must discard stored JWT tokens after logout.

---

### 1.4 Refresh Access Token
Generates a new access token using a valid refresh token.

**Endpoint:** [`POST /accounts/token/refresh/`](http://localhost:8000/api/accounts/token/refresh/)

**Authorization:** None (refresh token required in body)

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| refresh | string | Yes | JWT refresh token |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/accounts/token/refresh/ \
  -d "refresh=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| access | string | New JWT access token (24hr expiry) |

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing refresh token | `{"error": "Refresh token required"}` |
| 401 | Invalid/expired token | `{"error": "Invalid or expired refresh token"}` |
| 405 | Invalid HTTP method | `{"error": "Only POST allowed"}` |

**Usage:**
- Call this endpoint when access token expires (401 responses)
- Update stored access token with the new one
- If refresh fails, redirect user to login

**Related Endpoints:**
- [Staff/Manager Login](#11-staffmanager-login)
- [Customer Login](#12-customer-login)

---

### 1.5 Get Customer Info
Retrieves customer information with RBAC enforcement.

**Endpoint:** [`GET /accounts/diner/info/`](http://localhost:8000/api/accounts/diner/info/)

**Authorization:** Customer (own info), Manager (any customer)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| diner_id | integer | Yes | Customer ID to retrieve |

**Example Request:**
```bash
# Customer viewing own info
curl "http://localhost:8000/api/accounts/diner/info/?diner_id=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Manager viewing any customer
curl "http://localhost:8000/api/accounts/diner/info/?diner_id=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "status": "success",
  "diner_info": {
    "id": 5,
    "name": "John Doe",
    "email": "john@example.com",
    "phone_number": "1234567890"
  }
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing parameter | `{"status": "error", "message": "diner_id parameter required"}` |
| 401 | Not authenticated | `{"status": "error", "message": "Authentication required"}` |
| 403 | Unauthorized access | `{"status": "error", "message": "Unauthorized: Can only view own information"}` |
| 404 | Customer not found | `{"status": "error", "message": "Customer not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Customer**: Can only retrieve their own information
- **Manager**: Can retrieve any customer's information
- **Staff**: No access

**Related Endpoints:**
- [Update User Info](#15-update-user-info)

---

### 1.6 Update User Info
Updates user information with RBAC enforcement.

**Endpoint:** [`POST /accounts/user/update/`](http://localhost:8000/api/accounts/user/update/)

**Authorization:** Customer (own info), Manager (any user)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | integer | Yes | User ID to update |
| name | string | No | New name |
| email | string | No | New email address |
| phone_num | string | No | New phone number |
| password | string | No | New password |

**Example Request:**
```bash
# Customer updating own profile
curl -X POST http://localhost:8000/api/accounts/user/update/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d "user_id=5&email=newemail@example.com&phone_num=9876543210"

# Manager updating any user
curl -X POST http://localhost:8000/api/accounts/user/update/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d "user_id=10&name=Jane Smith&email=jane@example.com"
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "User information updated successfully",
  "user": {
    "id": 5,
    "name": "John Doe",
    "email": "newemail@example.com",
    "phone_num": "9876543210"
  }
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing user_id | `{"status": "error", "message": "Missing required field: user_id"}` |
| 400 | Name already taken | `{"status": "error", "message": "Name already taken"}` |
| 400 | Email already taken | `{"status": "error", "message": "Email already taken"}` |
| 401 | Not authenticated | `{"status": "error", "message": "Authentication required"}` |
| 403 | Unauthorized | `{"status": "error", "message": "Unauthorized: Can only update own information"}` |
| 404 | User not found | `{"status": "error", "message": "User not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Customer**: Can only update their own profile
- **Manager**: Can update any user's profile
- **Staff**: No access

**Related Endpoints:**
- [Get Customer Info](#15-get-customer-info)

---

### 1.7 Add User Account
Creates a new user account (Manager only).

**Endpoint:** [`POST /accounts/manager/add/`](http://localhost:8000/api/accounts/manager/add/)

**Authorization:** Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | User's full name |
| role | string | Yes | One of: Customer, Staff, Manager |
| email | string | Yes | User's email address |
| password | string | No | Initial password (optional) |

**Example Request:**
```bash
# Create a new staff member
curl -X POST http://localhost:8000/api/accounts/manager/add/ \
  -d "name=Jane Smith&role=Staff&email=jane@example.com&password=temppass" \
  -b cookies.txt

# Create a new customer
curl -X POST http://localhost:8000/api/accounts/manager/add/ \
  -d "name=Bob Johnson&role=Customer&email=bob@example.com" \
  -b cookies.txt
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Staff account created successfully",
  "user_id": 15
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing fields | `{"status": "error", "message": "Missing required fields: name, role, email"}` |
| 400 | Invalid role | `{"status": "error", "message": "Invalid role. Must be: Manager, Staff, or Customer"}` |
| 400 | Duplicate name | `{"status": "error", "message": "User with this name already exists"}` |
| 400 | Duplicate email | `{"status": "error", "message": "User with this email already exists"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized: Manager access required"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can create users with any role (Customer, Staff, Manager)
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Delete User Account](#17-delete-user-account)
- [Update User Role](#18-update-user-role)

---

### 1.7 Delete User Account
Deletes a user account (Manager only).

**Endpoint:** [`POST /accounts/manager/remove/`](http://localhost:8000/api/accounts/manager/remove/)

**Authorization:** Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | integer | Yes | ID of user to delete |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/accounts/manager/remove/ \
  -d "user_id=15" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "User 'Jane Smith' deleted successfully"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing user_id | `{"status": "error", "message": "Missing required field: user_id"}` |
| 400 | Self-deletion | `{"status": "error", "message": "Cannot delete own account"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized: Manager access required"}` |
| 404 | User not found | `{"status": "error", "message": "User not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can delete any user except themselves
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Add User Account](#16-add-user-account)
- [Update User Role](#18-update-user-role)

---

### 1.8 Update User Role
Updates a user's role (Manager only).

**Endpoint:** [`POST /accounts/manager/update_role/`](http://localhost:8000/api/accounts/manager/update_role/)

**Authorization:** Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| user_id | integer | Yes | ID of user to update |
| new_role | string | Yes | One of: Customer, Staff, Manager |

**Example Request:**
```bash
# Promote staff to manager
curl -X POST http://localhost:8000/api/accounts/manager/update_role/ \
  -d "user_id=15&new_role=Manager" \
  -b cookies.txt

# Demote staff to customer
curl -X POST http://localhost:8000/api/accounts/manager/update_role/ \
  -d "user_id=20&new_role=Customer" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Role updated from Staff to Manager",
  "user_id": 15
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing fields | `{"status": "error", "message": "Missing required fields: user_id, new_role"}` |
| 400 | Invalid role | `{"status": "error", "message": "Invalid role. Must be: Manager, Staff, or Customer"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized: Manager access required"}` |
| 404 | User not found | `{"status": "error", "message": "User not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can change any user's role
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Add User Account](#16-add-user-account)
- [Delete User Account](#17-delete-user-account)

---

## 2. Menu APIs

**Note:** All menu viewing endpoints (GET) are **publicly accessible** - no authentication required. Anyone can view menus and menu items without logging in.

### 2.1 List All Menus
Retrieves all menu categories.

**Endpoint:** [`GET /menu/menus/`](http://localhost:8000/api/menu/menus/)

**Authorization:** ✅ **Public** - No authentication required

**Example Request:**
```bash
curl "http://localhost:8000/api/menu/menus/"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Breakfast Menu",
    "description": "Morning delights",
    "availability_start": "06:00:00",
    "availability_end": "11:00:00"
  },
  {
    "id": 2,
    "name": "Lunch Menu",
    "description": "Midday specials",
    "availability_start": "11:00:00",
    "availability_end": "15:00:00"
  }
]
```

**Related Endpoints:**
- [Get Menu Details](#22-get-menu-details)
- [List All Menu Items](#23-list-all-menu-items)

---

### 2.2 Get Menu Details
Retrieves details of a specific menu.

**Endpoint:** [`GET /menu/menus/{id}/`](http://localhost:8000/api/menu/menus/1/)

**Authorization:** ✅ **Public** - No authentication required

**Example Request:**
```bash
curl "http://localhost:8000/api/menu/menus/1/"
```

**Success Response (200):**
```json
{
  "id": 1,
  "name": "Breakfast Menu",
  "description": "Morning delights",
  "availability_start": "06:00:00",
  "availability_end": "11:00:00"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 404 | Menu not found | `{"detail": "Not found."}` |

**Related Endpoints:**
- [List All Menus](#21-list-all-menus)
- [List All Menu Items](#23-list-all-menu-items)

---

### 2.3 List All Menu Items
Retrieves all menu items, optionally filtered by menu.

**Endpoint:** [`GET /menu/menu-items/`](http://localhost:8000/api/menu/menu-items/)

**Authorization:** ✅ **Public** - No authentication required

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| menu | integer | No | Filter by menu ID |

**Example Request:**
```bash
# Get all menu items
curl "http://localhost:8000/api/menu/menu-items/"

# Get items from a specific menu
curl "http://localhost:8000/api/menu/menu-items/?menu=1"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "name": "Pancakes",
    "description": "Fluffy buttermilk pancakes",
    "price": "8.99",
    "menu": 1,
    "image": "/media/menu_item_images/pancakes.jpg"
  },
  {
    "id": 2,
    "name": "Scrambled Eggs",
    "description": "Farm-fresh eggs with herbs",
    "price": "6.50",
    "menu": 1,
    "image": "/media/menu_item_images/eggs.jpg"
  }
]
```

**Related Endpoints:**
- [List All Menus](#21-list-all-menus)
- [Add Menu Item](#24-add-menu-item)

---

### 2.4 Add Menu Item
Adds a new menu item (Manager only).

**Endpoint:** [`POST /menu/items/add/`](http://localhost:8000/api/menu/items/add/)

**Authorization:** Manager only

**Request Parameters (multipart/form-data):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | string | Yes | Item name |
| description | string | Yes | Item description |
| price | float | Yes | Item price |
| menu_id | integer | Yes | Menu category ID |
| image | file | Yes | Item image file |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/menu/items/add/ \
  -F "name=French Toast" \
  -F "description=Delicious French toast with berries" \
  -F "price=9.99" \
  -F "menu_id=1" \
  -F "image=@/path/to/french_toast.jpg" \
  -b cookies.txt
```

**Success Response (201):**
```json
{
  "status": "success",
  "message": "Menu item added successfully"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing fields | `{"status": "error", "message": "Missing required fields"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized access"}` |
| 404 | Menu not found | `{"status": "error", "message": "Menu not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can add menu items
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Remove Menu Item](#25-remove-menu-item)
- [Update Menu Item](#26-update-menu-item)

---

### 2.5 Remove Menu Item
Removes a menu item (Manager only).

**Endpoint:** [`POST /menu/items/remove`](http://localhost:8000/api/menu/items/remove)

**Authorization:** Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| item_id | integer | Yes | Menu item ID to remove |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/menu/items/remove \
  -d "item_id=5" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Menu item removed successfully"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing item_id | `{"status": "error", "message": "Missing required fields"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized access"}` |
| 404 | Item not found | `{"status": "error", "message": "Menu item not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can remove menu items
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Add Menu Item](#24-add-menu-item)
- [List All Menu Items](#23-list-all-menu-items)

---

### 2.6 Update Menu Item
Updates menu item information (Manager only).

**Endpoint:** [`POST /menu/items/update`](http://localhost:8000/api/menu/items/update)

**Authorization:** Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| item_id | integer | Yes | Menu item ID to update |
| name | string | No | New item name |
| description | string | No | New description |
| price | float | No | New price |
| image | file | No | New item image |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/menu/items/update \
  -F "item_id=5" \
  -F "name=Deluxe French Toast" \
  -F "price=12.99" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Menu item updated successfully"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing item_id | `{"status": "error", "message": "Missing required field: item_id"}` |
| 403 | Not a manager | `{"status": "error", "message": "Unauthorized access"}` |
| 404 | Item not found | `{"status": "error", "message": "Menu item not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Manager**: Can update menu items
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Add Menu Item](#24-add-menu-item)
- [Remove Menu Item](#25-remove-menu-item)

---

## 3. Orders APIs

### 3.1 Get Order by ID
Retrieves order details with RBAC enforcement.

**Endpoint:** [`GET /orders/get_order/`](http://localhost:8000/api/orders/get_order/)

**Authorization:** Customer (own orders), Staff/Manager (all orders)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| order_id | integer | Yes | Order ID to retrieve |

**Example Request:**
```bash
# Customer viewing own order
curl "http://localhost:8000/api/orders/get_order/?order_id=123" \
  -b cookies.txt

# Staff viewing any order
curl "http://localhost:8000/api/orders/get_order/?order_id=456" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "order_id": 123,
  "diner_id": 5,
  "service_type": "Dine-in",
  "status": "PENDING",
  "total_price": "25.50",
  "note": "Extra sauce please",
  "time_created": "2024-01-15 12:30:00",
  "last_modified": "2024-01-15 12:30:00"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing order_id | `{"status": "error", "message": "order_id parameter required"}` |
| 401 | Not authenticated | `{"status": "error", "message": "Authentication required"}` |
| 403 | Unauthorized | `{"status": "error", "message": "Unauthorized: Can only view own orders"}` |
| 404 | Order not found | `{"status": "error", "message": "Order not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Customer**: Can only view their own orders
- **Staff**: Can view all orders
- **Manager**: Can view all orders

**Related Endpoints:**
- [Get Bill](#32-get-bill)
- [Submit Order](#33-submit-order)

---

### 3.2 Get Bill
Retrieves detailed bill for an order with RBAC enforcement.

**Endpoint:** [`GET /orders/get_bill/`](http://localhost:8000/api/orders/get_bill/)

**Authorization:** Customer (own bills), Staff/Manager (all bills)

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| order_id | integer | Yes | Order ID to get bill for |

**Example Request:**
```bash
curl "http://localhost:8000/api/orders/get_bill/?order_id=123" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "order_id": 123,
  "diner_id": 5,
  "service_type": "Dine-in",
  "order_status": "COMPLETED",
  "total_price": "25.50",
  "note": "Extra sauce please",
  "time_created": "2024-01-15 12:30:00",
  "last_modified": "2024-01-15 12:45:00",
  "items": [
    {
      "name": "Burger",
      "menu_item_id": 10,
      "image": "/media/menu_item_images/burger.jpg",
      "quantity": 2,
      "price": "10.99"
    },
    {
      "name": "Fries",
      "menu_item_id": 15,
      "image": "/media/menu_item_images/fries.jpg",
      "quantity": 1,
      "price": "3.52"
    }
  ]
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing order_id | `{"status": "error", "message": "order_id parameter required"}` |
| 401 | Not authenticated | `{"status": "error", "message": "Authentication required"}` |
| 403 | Unauthorized | `{"status": "error", "message": "Unauthorized: Can only view own bills"}` |
| 404 | Order not found | `{"status": "error", "message": "Order not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Customer**: Can only view bills for their own orders
- **Staff**: Can view all bills
- **Manager**: Can view all bills

**Related Endpoints:**
- [Get Order by ID](#31-get-order-by-id)
- [Submit Order](#33-submit-order)

---

### 3.3 Submit Order
Creates a new order (Customer only).

**Endpoint:** [`POST /orders/submit/`](http://localhost:8000/api/orders/submit/)

**Authorization:** Customer only

**Request Body (JSON):**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| diner_id | integer | Yes | Customer ID |
| service_type | string | No | "Dine-in" (default), "Takeout", or "Delivery" |
| note | string | No | Special instructions |
| ordered_items | array[integer] | Yes | Array of menu item IDs |
| quantities | array[integer] | Yes | Array of quantities (matching ordered_items) |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/orders/submit/ \
  -H "Content-Type: application/json" \
  -d '{
    "diner_id": 5,
    "service_type": "Dine-in",
    "note": "Extra napkins please",
    "ordered_items": [1, 5, 7],
    "quantities": [2, 1, 3]
  }' \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "order_id": 125,
  "order_status": "PENDING"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Customer not found | `{"status": "error", "message": "Diner not found"}` |
| 400 | Items/quantities mismatch | `AssertionError: Items and quantities must match in length` |

**RBAC Rules:**
- **Customer**: Can create orders for themselves
- **Staff**: No access
- **Manager**: No access

**Related Endpoints:**
- [Get Order by ID](#31-get-order-by-id)
- [Get Bill](#32-get-bill)

---

### 3.4 Update Order Status
Updates order status (Staff/Manager only).

**Endpoint:** [`POST /orders/status/update/`](http://localhost:8000/api/orders/status/update/)

**Authorization:** Staff and Manager only

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| order_id | integer | Yes | Order ID to update |
| status | string | Yes | One of: PENDING, PREPARING, READY, COMPLETED, CANCELLED |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/orders/status/update/ \
  -d "order_id=123&status=PREPARING" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "Order status updated from PENDING to PREPARING",
  "order_id": 123,
  "new_status": "PREPARING"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing fields | `{"status": "error", "message": "Missing required fields: order_id, status"}` |
| 400 | Invalid status | `{"status": "error", "message": "Invalid status. Must be one of: PENDING, PREPARING, READY, COMPLETED, CANCELLED"}` |
| 403 | Not staff | `{"status": "error", "message": "Unauthorized: Staff access required"}` |
| 404 | Order not found | `{"status": "error", "message": "Order not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**Valid Status Transitions:**
```
PENDING → PREPARING → READY → COMPLETED
         ↓
      CANCELLED (can be set at any point)
```

**RBAC Rules:**
- **Staff**: Can update order status
- **Manager**: Can update order status
- **Customer**: No access

**Related Endpoints:**
- [Get Order by ID](#31-get-order-by-id)
- [Get All Orders](#35-get-all-orders)

---

### 3.5 Get All Orders
Retrieves all orders (Staff/Manager only).

**Endpoint:** [`GET /orders/all/`](http://localhost:8000/api/orders/all/)

**Authorization:** Staff and Manager only

**Example Request:**
```bash
curl "http://localhost:8000/api/orders/all/" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "orders": [
    {
      "order_id": 1,
      "diner_id": 5,
      "status": "PENDING",
      "service_type": "Dine-in",
      "total_price": "25.50",
      "time_created": "2024-01-15 12:30:00",
      "items_count": 5
    },
    {
      "order_id": 2,
      "diner_id": 8,
      "status": "PREPARING",
      "service_type": "Takeout",
      "total_price": "18.75",
      "time_created": "2024-01-15 12:35:00",
      "items_count": 3
    }
  ]
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 403 | Not staff | `{"status": "error", "message": "Not authorized. Staff access required."}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Staff**: Can view all orders
- **Manager**: Can view all orders
- **Customer**: No access

**Related Endpoints:**
- [Get Order by ID](#31-get-order-by-id)
- [Update Order Status](#34-update-order-status)

---

## 4. Reviews APIs

### 4.1 List All Feedback
Retrieves all customer feedback.

**Endpoint:** [`GET /reviews/feedbacks/`](http://localhost:8000/api/reviews/feedbacks/)

**Authorization:** None (public endpoint)

**Example Request:**
```bash
curl "http://localhost:8000/api/reviews/feedbacks/"
```

**Success Response (200):**
```json
[
  {
    "id": 1,
    "order": 5,
    "diner": 1,
    "rating": 5,
    "comment": "Excellent food and service!",
    "time_created": "2024-01-15T12:30:00Z"
  },
  {
    "id": 2,
    "order": 8,
    "diner": 3,
    "rating": 4,
    "comment": "Very good, will come again",
    "time_created": "2024-01-15T14:20:00Z"
  }
]
```

**Related Endpoints:**
- [Submit Feedback](#42-submit-feedback)

---

### 4.2 Submit Feedback
Submits customer feedback for an order with RBAC enforcement.

**Endpoint:** [`POST /submit_feedback/`](http://localhost:8000/api/submit_feedback/)

**Authorization:** Customer only (for own orders)

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| order_id | integer | Yes | Order ID to review |
| rating | integer | Yes | Rating from 1 to 5 |
| comment | string | No | Feedback comment |

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/submit_feedback/ \
  -d "order_id=5&rating=5&comment=Great service and delicious food!" \
  -b cookies.txt
```

**Success Response (201):**
```json
{
  "status": "success",
  "feedback_id": 10,
  "order_id": 5,
  "rating": 5,
  "comment": "Great service and delicious food!"
}
```

**Error Responses:**

| Code | Description | Response |
|------|-------------|----------|
| 400 | Missing fields | `{"status": "error", "message": "Missing required fields: order_id, rating"}` |
| 400 | Invalid rating | `{"status": "error", "message": "Rating must be between 1 and 5"}` |
| 400 | Duplicate feedback | `{"status": "error", "message": "Feedback already submitted for this order"}` |
| 403 | Not customer | `{"status": "error", "message": "Unauthorized: Customer access required"}` |
| 403 | Not own order | `{"status": "error", "message": "Unauthorized: Can only submit feedback for own orders"}` |
| 404 | Order not found | `{"status": "error", "message": "Order not found"}` |
| 405 | Invalid HTTP method | `{"status": "error", "message": "Invalid request method"}` |

**RBAC Rules:**
- **Customer**: Can submit feedback only for their own orders
- **Staff**: No access
- **Manager**: No access

**Validation Rules:**
- Rating must be between 1 and 5 (inclusive)
- Customer can only submit one feedback per order
- Customer must own the order being reviewed

**Related Endpoints:**
- [List All Feedback](#41-list-all-feedback)
- [Get Order by ID](#31-get-order-by-id)

---

## 5. Analytics APIs

### 5.1 Get Rating Analytics
Retrieves rating statistics.

**Endpoint:** [`GET /analytics/rating/`](http://localhost:8000/api/analytics/rating/)

**Authorization:** Staff and Manager only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string (YYYY-MM-DD) | No | Filter from date |
| end_date | string (YYYY-MM-DD) | No | Filter to date |

**Example Request:**
```bash
# Get all-time rating analytics
curl "http://localhost:8000/api/analytics/rating/" \
  -b cookies.txt

# Get rating analytics for specific period
curl "http://localhost:8000/api/analytics/rating/?start_date=2024-01-01&end_date=2024-01-31" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "analytics": {
    "average_rating": 4.5,
    "total_reviews": 150,
    "rating_distribution": {
      "5": 80,
      "4": 45,
      "3": 15,
      "2": 7,
      "1": 3
    }
  }
}
```

**RBAC Rules:**
- **Staff**: Can view rating analytics
- **Manager**: Can view rating analytics
- **Customer**: No access

**Related Endpoints:**
- [List All Feedback](#41-list-all-feedback)
- [Get Revenue Analytics](#52-get-revenue-analytics)

---

### 5.2 Get Revenue Analytics
Retrieves revenue statistics (Manager only).

**Endpoint:** [`GET /analytics/revenue/`](http://localhost:8000/api/analytics/revenue/)

**Authorization:** Manager only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string (YYYY-MM-DD) | No | Filter from date |
| end_date | string (YYYY-MM-DD) | No | Filter to date |
| group_by | string | No | "day", "week", or "month" |

**Example Request:**
```bash
# Get monthly revenue summary
curl "http://localhost:8000/api/analytics/revenue/?start_date=2024-01-01&end_date=2024-01-31&group_by=day" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "analytics": {
    "total_revenue": 12500.50,
    "period_data": [
      {
        "date": "2024-01-15",
        "revenue": 850.25,
        "order_count": 45
      },
      {
        "date": "2024-01-16",
        "revenue": 920.75,
        "order_count": 52
      }
    ]
  }
}
```

**RBAC Rules:**
- **Manager**: Can view revenue analytics
- **Staff**: No access
- **Customer**: No access

**Related Endpoints:**
- [Get Menu Items Order Count](#53-get-menu-items-order-count)
- [Get All Orders](#35-get-all-orders)

---

### 5.3 Get Menu Items Order Count
Retrieves order count statistics for menu items.

**Endpoint:** [`GET /analytics/order-count/`](http://localhost:8000/api/analytics/order-count/)

**Authorization:** Staff and Manager only

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| start_date | string (YYYY-MM-DD) | No | Filter from date |
| end_date | string (YYYY-MM-DD) | No | Filter to date |
| limit | integer | No | Number of top items to return |

**Example Request:**
```bash
# Get top 10 most ordered items
curl "http://localhost:8000/api/analytics/order-count/?limit=10" \
  -b cookies.txt

# Get order counts for specific period
curl "http://localhost:8000/api/analytics/order-count/?start_date=2024-01-01&end_date=2024-01-31" \
  -b cookies.txt
```

**Success Response (200):**
```json
{
  "status": "success",
  "analytics": [
    {
      "menu_item": "Burger",
      "menu_item_id": 1,
      "total_orders": 250,
      "total_quantity": 485
    },
    {
      "menu_item": "Fries",
      "menu_item_id": 2,
      "total_orders": 220,
      "total_quantity": 380
    }
  ]
}
```

**RBAC Rules:**
- **Staff**: Can view order count analytics
- **Manager**: Can view order count analytics
- **Customer**: No access

**Related Endpoints:**
- [List All Menu Items](#23-list-all-menu-items)
- [Get All Orders](#35-get-all-orders)

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | When it occurs |
|------|---------|----------------|
| 200 | OK | Successful request |
| 201 | Created | Resource successfully created |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions (RBAC violation) |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | Wrong HTTP method |
| 500 | Internal Server Error | Server error |

### Standard Error Response Format
```json
{
  "status": "error",
  "message": "Detailed error message describing what went wrong"
}
```

### Common Error Scenarios

1. **Authentication Required (401)**
   ```json
   {"status": "error", "message": "Authentication required"}
   ```
   - Solution: Log in using appropriate login endpoint first

2. **Unauthorized Access (403)**
   ```json
   {"status": "error", "message": "Unauthorized: Can only view own information"}
   ```
   - Solution: Ensure you have proper role permissions

3. **Resource Not Found (404)**
   ```json
   {"status": "error", "message": "Order not found"}
   ```
   - Solution: Verify the resource ID exists

4. **Invalid Parameters (400)**
   ```json
   {"status": "error", "message": "Missing required fields: order_id, status"}
   ```
   - Solution: Include all required parameters

---

## Data Models

### User Roles & Permissions

**Customer:**
- Create and view own orders
- Update own profile information
- Submit feedback for own orders
- View menu items (public)

**Staff:**
- View and manage all orders
- Update order status
- Process payments
- View analytics

**Manager:**
- All Staff permissions
- User management (create, delete, update roles)
- Menu management (add, edit, delete items)
- Full analytics access

### Order Status Flow
```
PENDING → PREPARING → READY → COMPLETED
         ↓
      CANCELLED
```

**Status Descriptions:**
- **PENDING**: Order received, waiting to be prepared
- **PREPARING**: Kitchen is preparing the order
- **READY**: Order is ready for pickup/delivery/serving
- **COMPLETED**: Order has been fulfilled
- **CANCELLED**: Order has been cancelled

### Service Types
- **Dine-in**: Customer eats at restaurant
- **Takeout**: Customer picks up order
- **Delivery**: Order delivered to customer

### Payment Methods
- **CASH**: Cash payment
- **CARD**: Credit/Debit card
- **MOBILE_PAYMENT**: Digital wallet or mobile payment app

### Rating Scale
- **1**: Poor
- **2**: Below Average
- **3**: Average
- **4**: Good
- **5**: Excellent

---

## Important Notes

1. **CSRF Protection**: In production, CSRF tokens should be properly implemented. Current development setup uses `@csrf_exempt` for testing.

2. **Session Management**: 
   - Sessions are cookie-based and persist across requests
   - Use the logout endpoint to properly clear sessions
   - Cookie must be included in all authenticated requests (`-b cookies.txt` or `-H "Cookie: sessionid=xxx"`)

3. **Media Files**: 
   - Images are served from `/media/` directory
   - Full URL: `http://localhost:8000/media/{image_path}`
   - Ensure proper file permissions for image uploads

4. **Timestamps**: 
   - All timestamps use UTC timezone
   - Format: `YYYY-MM-DD HH:MM:SS` or ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)

5. **Decimal Precision**: 
   - Prices are stored with 2 decimal places
   - Always returned as strings in JSON to preserve precision
   - Example: `"25.50"` not `25.5`

6. **RBAC Enforcement**:
   - All endpoints validate user roles before allowing access
   - Attempting to access unauthorized resources returns **403 Forbidden**
   - Customers can only access their own data unless otherwise specified
   - Staff can access order and payment data
   - Managers have unrestricted access

7. **Request Format**:
   - Most endpoints use **form-encoded data** (`application/x-www-form-urlencoded`)
   - Exception: Order submission uses **JSON** (`application/json`)
   - Menu item creation uses **multipart/form-data** for file uploads

8. **Rate Limiting**: 
   - Not currently implemented
   - Consider adding rate limiting in production

9. **Pagination**:
   - Not currently implemented for list endpoints
   - May be needed for large datasets in production

10. **Data Validation**:
    - Email validation is performed
    - Phone number format is not strictly validated
    - Password strength requirements should be implemented in production

---

## Quick Start Examples

### Complete Customer Flow
```bash
# 1. Login as customer
curl -X POST http://localhost:8000/api/accounts/diner/login/ \
  -d "username=John Doe&password=mypassword" \
  -c cookies.txt

# 2. View menu items
curl "http://localhost:8000/api/menu/menu-items/" \
  -b cookies.txt

# 3. Submit an order
curl -X POST http://localhost:8000/api/orders/submit/ \
  -H "Content-Type: application/json" \
  -d '{"diner_id": 5, "service_type": "Dine-in", "ordered_items": [1, 5], "quantities": [2, 1]}' \
  -b cookies.txt

# 4. View order details
curl "http://localhost:8000/api/orders/get_order/?order_id=125" \
  -b cookies.txt

# 5. Submit feedback
curl -X POST http://localhost:8000/api/submit_feedback/ \
  -d "order_id=125&rating=5&comment=Great food!" \
  -b cookies.txt

# 6. Logout
curl -X POST http://localhost:8000/api/accounts/logout/ \
  -b cookies.txt
```

### Complete Staff Flow
```bash
# 1. Login as staff
curl -X POST http://localhost:8000/api/accounts/staff/login/ \
  -d "username=Staff Member&password=staffpass" \
  -c cookies.txt

# 2. View all orders
curl "http://localhost:8000/api/orders/all/" \
  -b cookies.txt

# 3. Update order status
curl -X POST http://localhost:8000/api/orders/status/update/ \
  -d "order_id=123&status=PREPARING" \
  -b cookies.txt

# 4. View analytics
curl "http://localhost:8000/api/analytics/rating/" \
  -b cookies.txt

# 5. Logout
curl -X POST http://localhost:8000/api/accounts/logout/ \
  -b cookies.txt
```

### Complete Manager Flow
```bash
# 1. Login as manager
curl -X POST http://localhost:8000/api/accounts/staff/login/ \
  -d "username=Manager Name&password=managerpass" \
  -c cookies.txt

# 2. Add a new staff member
curl -X POST http://localhost:8000/api/accounts/manager/add/ \
  -d "name=Jane Smith&role=Staff&email=jane@example.com&password=temp123" \
  -b cookies.txt

# 3. Add a new menu item
curl -X POST http://localhost:8000/api/menu/items/add/ \
  -F "name=New Dish" \
  -F "description=Delicious new item" \
  -F "price=15.99" \
  -F "menu_id=1" \
  -F "image=@/path/to/image.jpg" \
  -b cookies.txt

# 4. View revenue analytics
curl "http://localhost:8000/api/analytics/revenue/?start_date=2024-01-01&end_date=2024-01-31&group_by=day" \
  -b cookies.txt

# 5. Update user role
curl -X POST http://localhost:8000/api/accounts/manager/update_role/ \
  -d "user_id=15&new_role=Manager" \
  -b cookies.txt

# 6. Logout
curl -X POST http://localhost:8000/api/accounts/logout/ \
  -b cookies.txt
```

---

*Last Updated: December 2024*
*API Version: 1.0*
