from django.shortcuts import render, redirect
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import User

# Authorization helper functions
def get_current_user(request):
    """Get currently logged-in user from session"""
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
    Example staff login view that sets a session cookie on success.
    """
    # print(request.session.keys())
    # print(request.session.items())
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        print(username)
        print(password)

        try:
            staff = User.objects.get(name=username, role__in=['Staff', 'Manager'])
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)

        if staff.check_password(password):
            # Store staff ID in session
            request.session['staff_id'] = staff.id
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)

    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def diner_login(request: HttpRequest) -> JsonResponse:
    
    # print(request.session.keys())
    # print(request.session.items())
    """
    Example diner login view that sets a session cookie on success.
    """

    # Access a specific cookie
    session_id = request.COOKIES.get('sessionid')
    print("Session ID:", session_id)
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        try:
            diner = User.objects.get(name=username, role='Customer')
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)
        if diner.check_password(password):
            # Store diner ID in session
            request.session['diner_id'] = diner.id
            print(request.session.items())
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'error': 'Invalid credentials'}, status=400)
    return JsonResponse({'error': 'Only POST allowed'}, status=405)

@csrf_exempt
def logout_view(request: HttpRequest) -> JsonResponse:
    """
    Logs out either a staff or diner by clearing the session.
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
    Example view that requires a staff or diner to be logged in.
    """
    print(request.session)
    if 'staff_id' in request.session:
        staff = User.objects.get(id=request.session['staff_id'], role__in=['Staff', 'Manager'])
        # Check if staff has manager role by querying the database
        return JsonResponse({'success': True, 'message': 'Hello Staff Bro', 'staff_id': request.session['staff_id'], 'role': staff.role})
    elif 'diner_id' in request.session:
        return JsonResponse({'success': True, 'message': 'Hello Diner Bro', 'diner_id': request.session['diner_id'], 'role': 'Customer'})
    return JsonResponse({'success': False, 'error': 'Not logged in'}, status=403)

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
def update_user_info(request: HttpRequest) -> JsonResponse:
    """
    Update user information.
    RBAC: Customer can update own info, Manager can update any user.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        user_id = request.POST.get("user_id")
        if not user_id:
            return JsonResponse({"status": "error", "message": "Missing required field: user_id"}, status=400)
        
        # RBAC: Customer can only update own info, Manager can update any
        if is_customer(current_user):
            if str(current_user.id) != str(user_id):
                return JsonResponse({"status": "error", "message": "Unauthorized: Can only update own information"}, status=403)
        elif not is_manager(current_user):
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