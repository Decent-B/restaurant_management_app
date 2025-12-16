from django.shortcuts import render, redirect
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
from django.conf import settings

# Helper function to generate tokens for a user
def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Helper function to get user from JWT token
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

# Authorization helper functions (updated to support both session and token)
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

def is_manager(user):
    """Check if user is a Manager"""
    return user and user.role == 'Manager'

def is_staff(user):
    """Check if user is Staff or Manager"""
    return user and user.role in ['Staff', 'Manager']

def is_customer(user):
    """Check if user is a Customer"""
    return user and user.role == 'Customer'

@csrf_exempt  # For testing; handle CSRF properly in production
def staff_login(request: HttpRequest) -> JsonResponse:
    """
    Staff/Manager login view that returns JWT tokens.
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        # Debug logging
        print(f"[staff_login] username: {username}, password: {'***' if password else None}")
        print(f"[staff_login] request.POST: {dict(request.POST)}")
        print(f"[staff_login] Content-Type: {request.content_type}")

        if not username or not password:
            return JsonResponse({'success': False, 'error': 'Username and password required'}, status=400)

        try:
            staff = User.objects.get(name=username, role__in=['Staff', 'Manager'])
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)

        if staff.check_password(password):
            # Generate JWT tokens
            tokens = get_tokens_for_user(staff)
            
            # Also set session for backward compatibility
            request.session['staff_id'] = staff.id
            
            return JsonResponse({
                'success': True,
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user': {
                    'id': staff.id,
                    'name': staff.name,
                    'email': staff.email,
                    'role': staff.role,
                }
            })
        else:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)

    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def diner_login(request: HttpRequest) -> JsonResponse:
    """
    Customer login view that returns JWT tokens.
    """
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        try:
            diner = User.objects.get(name=username, role='Customer')
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)
        
        if diner.check_password(password):
            # Generate JWT tokens
            tokens = get_tokens_for_user(diner)
            
            # Also set session for backward compatibility
            request.session['diner_id'] = diner.id
            
            return JsonResponse({
                'success': True,
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'user': {
                    'id': diner.id,
                    'name': diner.name,
                    'email': diner.email,
                    'role': diner.role,
                    'diner_id': diner.id,
                }
            })
        else:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def logout_view(request: HttpRequest) -> JsonResponse:
    """
    Logs out by clearing session. For JWT, client should discard tokens.
    """
    if request.method == 'POST':
        try:
            request.session.flush()  # Clears all session data
            return JsonResponse({'success': True}, status = 200)
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def protected_view(request: HttpRequest) -> JsonResponse:
    """
    Protected endpoint that requires JWT authentication.
    Returns user information if authenticated.
    """
    user = get_current_user(request)
    
    if not user:
        return JsonResponse({'error': 'Not authenticated'}, status=401)
    
    # Return user information in same format as login response
    response_data = {
        'role': user.role,
        'id': user.id,
        'name': user.name,
        'email': user.email,
    }
    
    # Add role-specific fields
    if user.role == 'Customer':
        response_data['diner_id'] = user.id
    elif user.role in ['Staff', 'Manager']:
        response_data['staff_id'] = user.id
    
    return JsonResponse(response_data)

@csrf_exempt
def refresh_token(request: HttpRequest) -> JsonResponse:
    """
    Refresh JWT access token using refresh token.
    """
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

@csrf_exempt
def get_diner_info(request: HttpRequest) -> JsonResponse:
    """
    Returns customer information. 
    RBAC: Customer can view own info, Manager can view any customer info.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        diner_id = request.GET.get('diner_id')
        if not diner_id:
            return JsonResponse({"status": "error", "message": "diner_id parameter required"}, status=400)
        
        # RBAC: Customer can only view own info, Manager can view any
        if is_customer(current_user):
            if str(current_user.id) != str(diner_id):
                return JsonResponse({"status": "error", "message": "Unauthorized: Can only view own information"}, status=403)
        elif not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
        
        try:
            diner = User.objects.get(id=diner_id, role='Customer')
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Customer not found"}, status=404)
        
        return JsonResponse({
            "status": "success",
            "diner_info": {
                "id": diner.id,
                "name": diner.name,
                "email": diner.email,
                "phone_number": diner.phone_num,
            }
        }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)


@csrf_exempt
def add_accounts(request: HttpRequest) -> JsonResponse:
    """
    Add account for new staff.
    RBAC: Only Manager can create staff accounts.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Manager access required"}, status=403)
        
        name = request.POST.get("name")
        role = request.POST.get("role")
        email = request.POST.get("email")
        password = request.POST.get("password", "")
        
        if not name or not role or not email:
            return JsonResponse({"status": "error", "message": "Missing required fields: name, role, email"}, status=400)
        if role not in ['Manager', 'Staff', 'Customer']:
            return JsonResponse({"status": "error", "message": "Invalid role. Must be: Manager, Staff, or Customer"}, status=400)
        
        # Check if user with same name or email already exists
        if User.objects.filter(name=name).exists():
            return JsonResponse({"status": "error", "message": "User with this name already exists"}, status=400)
        if User.objects.filter(email=email).exists():
            return JsonResponse({"status": "error", "message": "User with this email already exists"}, status=400)
        
        new_user = User(name=name, role=role, email=email)
        if password:
            new_user.set_password(password)
        new_user.save()
        
        return JsonResponse({
            "status": "success",
            "message": f"{role} account created successfully",
            "user_id": new_user.id
        }, status=201)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)


@csrf_exempt
def delete_accounts(request: HttpRequest) -> JsonResponse:
    """
    Delete user accounts.
    RBAC: Only Manager can delete accounts.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Manager access required"}, status=403)
        
        user_id = request.POST.get("user_id") or request.POST.get("staff_id")
        if not user_id:
            return JsonResponse({"status": "error", "message": "Missing required field: user_id"}, status=400)
        
        # Prevent self-deletion
        if str(current_user.id) == str(user_id):
            return JsonResponse({"status": "error", "message": "Cannot delete own account"}, status=400)
        
        try:
            user_to_delete = User.objects.get(id=user_id)
            user_name = user_to_delete.name
            user_to_delete.delete()
            return JsonResponse({"status": "success", "message": f"User '{user_name}' deleted successfully"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def update_roles(request: HttpRequest) -> JsonResponse:
    """
    Update user roles.
    RBAC: Only Manager can update roles.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Manager access required"}, status=403)
        
        user_id = request.POST.get("user_id") or request.POST.get("staff_id")
        new_role = request.POST.get("new_role")
        
        if not user_id or not new_role:
            return JsonResponse({"status": "error", "message": "Missing required fields: user_id, new_role"}, status=400)
        if new_role not in ['Manager', 'Staff', 'Customer']:
            return JsonResponse({"status": "error", "message": "Invalid role. Must be: Manager, Staff, or Customer"}, status=400)
        
        try:
            user_to_update = User.objects.get(id=user_id)
            old_role = user_to_update.role
            user_to_update.role = new_role
            user_to_update.save()
            return JsonResponse({
                "status": "success",
                "message": f"Role updated from {old_role} to {new_role}",
                "user_id": user_to_update.id
            }, status=200)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def list_users_by_role(request: HttpRequest) -> JsonResponse:
    """
    List all users filtered by role.
    RBAC: Only Manager can access this endpoint.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Manager access required"}, status=403)
        
        role = request.GET.get("role")  # Staff, Customer, Manager
        
        if role:
            if role not in ['Manager', 'Staff', 'Customer']:
                return JsonResponse({"status": "error", "message": "Invalid role. Must be: Manager, Staff, or Customer"}, status=400)
            users = User.objects.filter(role=role)
        else:
            users = User.objects.all()
        
        users_data = []
        for user in users:
            users_data.append({
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone_num": user.phone_num if hasattr(user, 'phone_num') else "",
                "role": user.role,
            })
        
        return JsonResponse({"status": "success", "users": users_data}, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def update_user_info(request: HttpRequest) -> JsonResponse:
    """
    Update user information.
    RBAC: Customer and Staff can update own info, Manager can update any user.
    """
    print(f"[update_user_info] VIEW CALLED! Method: {request.method}")
    print(f"[update_user_info] Headers: {dict(request.headers)}")
    print(f"[update_user_info] POST data: {request.POST}")
    
    if request.method == "POST":
        current_user = get_current_user(request)
        print(f"[update_user_info] current_user from get_current_user: {current_user}")
        
        if not current_user:
            print(f"[update_user_info] No current_user - returning 401")
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        print(f"[update_user_info] current_user: {current_user.name}, role: {current_user.role}, id: {current_user.id}")
        
        user_id = request.POST.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error", "message": "Missing required field: user_id"}, status=400)
        
        print(f"[update_user_info] user_id to update: {user_id}")
        print(f"[update_user_info] is_customer: {is_customer(current_user)}, is_staff: {is_staff(current_user)}, is_manager: {is_manager(current_user)}")
        
        # RBAC: Customer and Staff can update own info, Manager can update any user
        if is_customer(current_user) or is_staff(current_user):
            if str(current_user.id) != str(user_id):
                print(f"[update_user_info] Unauthorized: current_user.id ({current_user.id}) != user_id ({user_id})")
                return JsonResponse({"status": "error", "message": "Unauthorized: Can only update own information"}, status=403)
        elif not is_manager(current_user):
            print(f"[update_user_info] Unauthorized: not a manager")
            return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)
        
        # Update allowed fields
        name = request.POST.get("name")
        email = request.POST.get("email")
        phone_num = request.POST.get("phone_num")
        password = request.POST.get("password")
        
        if name:
            # Check if name is taken by another user
            if User.objects.filter(name=name).exclude(id=user_id).exists():
                return JsonResponse({"status": "error", "message": "Name already taken"}, status=400)
            user.name = name
        if email:
            # Check if email is taken by another user
            if User.objects.filter(email=email).exclude(id=user_id).exists():
                return JsonResponse({"status": "error", "message": "Email already taken"}, status=400)
            user.email = email
        if phone_num:
            user.phone_num = phone_num
        if password:
            user.set_password(password)
        
        user.save()
        return JsonResponse({
            "status": "success",
            "message": "User information updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone_num": user.phone_num
            }
        }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
