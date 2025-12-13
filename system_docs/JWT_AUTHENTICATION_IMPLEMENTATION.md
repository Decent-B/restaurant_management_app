# JWT Authentication Implementation Summary

## Overview
Implemented JWT (JSON Web Token) Bearer authentication to fix Staff and Manager login persistence issues. The system now uses token-based authentication with session-based fallback for backward compatibility.

## Problem Statement
- **Staff auto-logout**: Staff users were automatically logged out and redirected to login page
- **Manager session doesn't persist**: Manager logged-in status wasn't persisting across requests
- **Root cause**: Session-based authentication was unreliable for Staff/Manager roles

## Solution Implemented
Migrated from session-only authentication to JWT token-based authentication using `djangorestframework-simplejwt`.

---

## Backend Changes

### 1. Dependencies Added
**File**: `backend/requirements.txt`

Added new packages:
```
pyjwt==2.10.1
djangorestframework-simplejwt==5.3.1
```

### 2. Django Settings Configuration
**File**: `backend/config/settings.py`

#### Added to INSTALLED_APPS:
```python
INSTALLED_APPS = [
    # ... existing apps ...
    'rest_framework_simplejwt',  # NEW
]
```

#### Added REST Framework Configuration:
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

#### Added JWT Configuration:
```python
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),      # Access token expires in 24 hours
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),       # Refresh token expires in 7 days
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'UPDATE_LAST_LOGIN': False,
    
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    
    'AUTH_HEADER_TYPES': ('Bearer',),                  # Use "Bearer <token>" format
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
}
```

### 3. Authentication Views Update
**File**: `backend/accounts/views.py`

Completely rewritten to support JWT authentication. Key changes:

#### New Helper Functions:
```python
def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

def get_user_from_token(request):
    """Extract and validate JWT token from Authorization header"""
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user_id = validated_token.get('user_id')
        user = User.objects.get(id=user_id)
        return user
    except (InvalidToken, TokenError, User.DoesNotExist):
        return None
```

#### Updated get_current_user():
```python
def get_current_user(request):
    """Get currently logged-in user from token or session (fallback)"""
    # First try to get user from JWT token
    user = get_user_from_token(request)
    if user:
        return user
    
    # Fallback to session-based auth for backward compatibility
    if 'staff_id' in request.session:
        try:
            return User.objects.get(id=request.session['staff_id'], role__in=['Staff', 'Manager'])
        except User.DoesNotExist:
            return None
    elif 'diner_id' in request.session:
        try:
            return User.objects.get(id=request.session['diner_id'], role='Customer')
        except User.DoesNotExist:
            return None
    return None
```

#### Updated Login Endpoints:
Both `staff_login()` and `diner_login()` now return:
```json
{
  "success": true,
  "access": "<access_token>",
  "refresh": "<refresh_token>",
  "user": {
    "id": 1,
    "name": "User Name",
    "email": "user@example.com",
    "role": "Manager"
  }
}
```

#### New Endpoint - Refresh Token:
```python
@csrf_exempt
def refresh_token(request: HttpRequest) -> JsonResponse:
    """Refresh JWT access token using refresh token."""
    if request.method == 'POST':
        refresh_token_str = request.POST.get('refresh')
        if not refresh_token_str:
            return JsonResponse({'error': 'Refresh token required'}, status=400)
        
        try:
            refresh = RefreshToken(refresh_token_str)
            return JsonResponse({
                'access': str(refresh.access_token),
            }, status=200)
        except (InvalidToken, TokenError) as e:
            return JsonResponse({'error': 'Invalid or expired refresh token'}, status=401)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)
```

### 4. URL Routing Update
**File**: `backend/config/urls.py`

Added new refresh token endpoint:
```python
path('api/accounts/token/refresh/', account_views.refresh_token, name='token_refresh'),
```

---

## Frontend Changes

### 1. Token Management
**File**: `frontend/src/api/endpoints.ts`

#### Added Token Manager:
```typescript
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenManager = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clearTokens: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
```

#### Added Authorization Header Helper:
```typescript
function getAuthHeaders(): HeadersInit {
  const token = tokenManager.getAccessToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
    };
  }
  return {};
}
```

#### Added Token Refresh Logic:
```typescript
async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  try {
    const formData = createFormData({ refresh: refreshToken });
    const response = await fetch(`${API_BASE_URL}/accounts/token/refresh/`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem(TOKEN_KEY, data.access);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  tokenManager.clearTokens();
  return false;
}
```

#### Updated Response Handler:
```typescript
async function handleResponse<T>(response: Response, retryFn?: () => Promise<Response>): Promise<T> {
  if (response.status === 401 && retryFn) {
    // Try to refresh token and retry the request
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const newResponse = await retryFn();
      return handleResponse(newResponse);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}
```

### 2. Updated All API Functions
All API functions in `endpoints.ts` were updated to:
1. Include `Authorization: Bearer <token>` header using `getAuthHeaders()`
2. Support automatic token refresh on 401 errors
3. Store tokens after login
4. Clear tokens after logout

#### Login Functions:
```typescript
staffLogin: async (username: string, password: string) => {
  const formData = createFormData({ username, password });
  const response = await fetch(`${API_BASE_URL}/accounts/staff/login/`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await handleResponse<any>(response);
  
  // Store JWT tokens
  if (data.success && data.access && data.refresh) {
    tokenManager.setTokens(data.access, data.refresh);
  }
  
  return data;
},
```

#### Protected API Calls Pattern:
```typescript
getUserInfo: async () => {
  const makeRequest = () => fetch(`${API_BASE_URL}/accounts/protected/`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders(),
  });
  
  const response = await makeRequest();
  return handleResponse(response, makeRequest);
},
```

---

## Documentation Updates

### File: `system_docs/api_documentation.md`

#### Updated Authentication Section:
- Changed from "Session-based authentication" to "JWT Bearer authentication with session fallback"
- Added JWT authentication flow documentation
- Added token structure details
- Added Authorization header format examples

#### Added New Endpoint Documentation:
**POST /api/accounts/token/refresh/**
- Request: `refresh` token in body
- Response: New `access` token
- Used to refresh expired access tokens

#### Updated All Login Endpoints:
- Documented new response format with `access`, `refresh`, and `user` fields
- Added usage instructions for storing and using tokens
- Added examples with Bearer authorization headers

#### Updated All Protected Endpoints:
- Added `Authorization: Bearer <access_token>` header requirement
- Updated curl examples to include Authorization header
- Added authentication note at the top of Accounts APIs section

---

## Authentication Flow

### 1. Login Flow
```
1. User submits username/password
2. Backend validates credentials
3. Backend generates JWT tokens (access + refresh)
4. Backend returns tokens + user data
5. Frontend stores tokens in localStorage
6. Frontend includes access token in all subsequent requests
```

### 2. API Request Flow
```
1. Frontend includes: Authorization: Bearer <access_token>
2. Backend validates JWT token (checks signature, expiration)
3. Backend identifies user from token payload
4. Backend processes request with user context
5. Backend returns response
```

### 3. Token Refresh Flow
```
1. API request fails with 401 Unauthorized
2. Frontend automatically calls /accounts/token/refresh/
3. Backend validates refresh token
4. Backend generates new access token
5. Frontend stores new access token
6. Frontend retries original request with new token
```

### 4. Logout Flow
```
1. User clicks logout
2. Frontend calls /accounts/logout/ (clears backend session)
3. Frontend removes tokens from localStorage
4. User redirected to login page
```

---

## Token Details

### Access Token
- **Lifetime**: 24 hours
- **Purpose**: Authenticate API requests
- **Storage**: localStorage (key: `access_token`)
- **Usage**: Include in `Authorization: Bearer <token>` header
- **Payload**: Contains `user_id`, `token_type`, `exp`, `iat`

### Refresh Token
- **Lifetime**: 7 days
- **Purpose**: Obtain new access tokens without re-authentication
- **Storage**: localStorage (key: `refresh_token`)
- **Usage**: POST to `/api/accounts/token/refresh/`
- **Security**: Longer lifetime, used only for token refresh endpoint

---

## Security Considerations

### What Was Implemented:
- ✅ JWT tokens signed with SECRET_KEY (HS256 algorithm)
- ✅ Tokens have expiration times (24h access, 7d refresh)
- ✅ Authorization header validated on every request
- ✅ Session fallback for backward compatibility
- ✅ Automatic token refresh on 401 errors
- ✅ Token removal on logout

### Future Enhancements (Not Yet Implemented):
- ⏳ Token blacklisting for immediate invalidation
- ⏳ Refresh token rotation on use
- ⏳ httpOnly cookies for token storage (more secure than localStorage)
- ⏳ Rate limiting on token refresh endpoint
- ⏳ HTTPS enforcement in production

---

## Testing the Implementation

### Test Staff/Manager Login:
```bash
curl -X POST http://localhost:8000/api/accounts/staff/login/ \
  -d "username=Guy Fieri&password=123"
```

Expected response:
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

### Test Protected Endpoint:
```bash
curl http://localhost:8000/api/accounts/protected/ \
  -H "Authorization: Bearer <access_token>"
```

### Test Token Refresh:
```bash
curl -X POST http://localhost:8000/api/accounts/token/refresh/ \
  -d "refresh=<refresh_token>"
```

---

## Troubleshooting

### Issue: 401 Unauthorized errors
- **Check**: Is the `Authorization: Bearer <token>` header included?
- **Check**: Has the access token expired (24 hours)?
- **Solution**: Use refresh token to get new access token

### Issue: "Invalid or expired refresh token"
- **Cause**: Refresh token expired (7 days) or invalid
- **Solution**: User must log in again

### Issue: Session still being used instead of tokens
- **Check**: Are tokens stored in localStorage?
- **Check**: Is `getAuthHeaders()` being called in API functions?
- **Debug**: Check browser DevTools → Network → Headers

---

## Files Modified

### Backend:
- `backend/requirements.txt` - Added JWT dependencies
- `backend/config/settings.py` - Added JWT configuration
- `backend/accounts/views.py` - Completely rewritten with JWT support
- `backend/config/urls.py` - Added refresh token endpoint
- `backend/reviews/views.py` - Fixed syntax error (unrelated bug)

### Frontend:
- `frontend/src/api/endpoints.ts` - Added token management and auth headers

### Documentation:
- `system_docs/api_documentation.md` - Updated authentication documentation
- `system_docs/JWT_AUTHENTICATION_IMPLEMENTATION.md` - This file (new)

---

## Summary

The JWT authentication implementation successfully addresses the Staff and Manager login persistence issues by:

1. **Replacing unreliable sessions** with stateless JWT tokens
2. **Providing 24-hour access tokens** that persist across browser sessions
3. **Implementing automatic token refresh** to maintain user sessions
4. **Maintaining backward compatibility** with session-based auth as fallback
5. **Securing all API endpoints** with Bearer token authentication
6. **Documenting the new authentication flow** comprehensively

The system now reliably maintains Staff and Manager authentication state, preventing auto-logout issues and ensuring session persistence.
