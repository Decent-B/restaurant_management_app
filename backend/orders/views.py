from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from .models import Order, OrderItem, Payment
from menu.models import MenuItem
from accounts.models import User
import json

# Import JWT authentication helper from accounts
from accounts.views import get_current_user as get_user_from_jwt

# Authorization helper functions
def get_current_user(request):
    """Get currently logged-in user, checking JWT first then session"""
    # Try JWT first
    user = get_user_from_jwt(request)
    if user:
        return user
    
    # Fallback to session
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

@csrf_exempt
def get_order_by_id(request: HttpResponse) -> JsonResponse:
    """
    Get specific order by ID.
    RBAC: Customer can view own orders, Staff/Manager can view all orders.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        order_id = request.GET.get("order_id")
        if not order_id:
            return JsonResponse({"status": "error", "message": "order_id parameter required"}, status=400)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
        
        # RBAC: Customer can only view own orders
        if is_customer(current_user) and order.diner.id != current_user.id:
            return JsonResponse({"status": "error", "message": "Unauthorized: Can only view own orders"}, status=403)

        return JsonResponse({"status": "success",
                             "order_id": order.id,
                             "diner_id": order.diner.id,
                             "service_type": order.service_type,
                             "status": order.status,
                             "total_price": str(order.total_price),
                             "note": order.note,
                             "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
                             "last_modified": order.last_modified.strftime('%Y-%m-%d %H:%M:%S')}, 
                             status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_bill(request: HttpResponse) -> JsonResponse:
    """
    Get the bill for a specific order.
    RBAC: Customer can view own bills, Staff/Manager can view all bills.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        order_id = request.GET.get("order_id")
        if not order_id:
            return JsonResponse({"status": "error", "message": "order_id parameter required"}, status=400)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
        
        # RBAC: Customer can only view own bills
        if is_customer(current_user) and order.diner.id != current_user.id:
            return JsonResponse({"status": "error", "message": "Unauthorized: Can only view own bills"}, status=403)

        order_items = list(
            OrderItem.objects.filter(order_id=order_id)
            .values('menu_item__id', 'menu_item__name', 'menu_item__price', 'menu_item__image', 'quantity')
        )
        items_data = []
        for item in order_items:
            items_data.append({
                "name": item["menu_item__name"],
                "menu_item_id": item["menu_item__id"],
                "image": item.get("menu_item__image", None),
                "quantity": item["quantity"],
                "price": str(item["menu_item__price"])
            })
            
        return JsonResponse({
            "status": "success",
            "order_id": order.id,
            "diner_id": order.diner.id,
            "service_type": order.service_type,
            "order_status": order.status,
            "total_price": str(order.total_price),
            "note": order.note,
            "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
            "last_modified": order.last_modified.strftime('%Y-%m-%d %H:%M:%S'),
            "items": items_data
        }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
        

@csrf_exempt
def add_order_item(request: HttpResponse) -> JsonResponse:
    """
    Add an item to a customer's order
    """
    # Protect view: only logged in diners allowed
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)

    if request.method == "POST":
        # Get the order ID and item details from the request
        order_id = request.POST.get("order_id")
        item_id = request.POST.get("item_id")
        item_quantity = request.POST.get("quantity")
        
        try:
            order = Order.objects.get(id=order_id)
            try:
                menu_item = MenuItem.objects.get(id=item_id)
            except MenuItem.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Menu item not found"}, status=404)
            # Create a new OrderItem instance
            order_item = OrderItem(
                order=order,
                menu_item=menu_item,
                quantity=item_quantity,
            )
            order_item.save()
            order.total_price += menu_item.price * int(item_quantity)
            order.last_modified = timezone.now()
            order.save()
            return JsonResponse({"status": "success", "item": order_item.id, "order": order.id})
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"})
    return JsonResponse({"status": "error", "message": "Invalid request method"})

@csrf_exempt
def remove_order_item(request: HttpResponse) -> JsonResponse:
    """
    Remove an item from a customer's order
    """
    # Protect view
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        order_id = request.POST.get("order_id")
        item_id = request.POST.get("item_id")  # Changed from item_name to item_id
        quantity = request.POST.get("quantity")
        
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return JsonResponse({"status": "error", "message": "Invalid quantity"})

        try: 
            order = Order.objects.get(id=order_id)
            try:
                order_item = OrderItem.objects.get(menu_item__id=item_id, order=order)
                if order_item.quantity <= quantity:
                    order.total_price -= order_item.menu_item.price * order_item.quantity
                    order_item.delete()
                else:
                    order_item.quantity -= quantity
                    order.total_price -= order_item.menu_item.price * quantity
                    order_item.save()
                order.last_modified = timezone.now()
                order.save()
                return JsonResponse({"status": "success"})
            except OrderItem.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Item not found"})
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"})
    return JsonResponse({"status": "error", "message": "Invalid request method"})

@csrf_exempt
def add_note(request: HttpResponse) -> JsonResponse:
    """
    Add a note to a customer's order
    """
    # Protect view
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        order_id = request.POST.get("order_id")
        note = request.POST.get("note", "")
        try:
            order = Order.objects.get(id=order_id)
            order.note = note  # Using field 'note' on Order as defined in the model
            order.save()
            return JsonResponse({"status": "success"})
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"})
    return JsonResponse({"status": "error", "message": "Invalid request method"})

@csrf_exempt
def choose_service(request: HttpResponse) -> JsonResponse:
    """
    Select service options for the order
    """
    # Protect view
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        order_id = request.POST.get("order_id")
        service_options = request.POST.get("service_type", "Dine-in")  # default to Dine-in
        try:
            order = Order.objects.get(id=order_id)
            order.service_type = service_options
            order.save()
            return JsonResponse({"status": "success"})
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"})
    return JsonResponse({"status": "error", "message": "Invalid request method"})

@csrf_exempt
def submit_order(request: HttpResponse) -> JsonResponse:
    """
    Submit the order for processing
    """
    # Protect view
    # print(request.session)
    # if "diner_id" not in request.session:
    #     return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        request_body = json.loads(request.body)
        diner_id = request_body.get("diner_id")
        service_type = request_body.get("service_type", "Dine-in")  # default to Dine-in
        note = request_body.get("note", "")
        # address = request.POST.get("address", "")  # Optional, for delivery orders
        ordered_items = request_body.get("ordered_items")  # expecting list of item IDs
        quantities = request_body.get("quantities")         # matching list of quantities
        assert len(ordered_items) == len(quantities) and len(ordered_items) > 0, "Items and quantities mismatch or empty"
        
        try:
            diner = User.objects.get(id=diner_id, role='Customer')
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Diner not found"})
        
        # Create the new order (status defaults to 'PENDING')
        new_order = Order.objects.create(
            diner=diner,
            service_type=service_type,
            note=note
        )
        
        total_price = 0
        for item_id, qty in zip(ordered_items, quantities):
            try:
                menu_item = MenuItem.objects.get(id=item_id)
            except MenuItem.DoesNotExist:
                continue # Or handle error: return JsonResponse({"status": "error", "message": f"Menu item with id {item_id} not found"}, status=400)
            OrderItem.objects.create(
                order=new_order,
                menu_item=menu_item,
                quantity=int(qty)
            )
            total_price += menu_item.price * int(qty)
        
        new_order.total_price = total_price
        new_order.save()
        
        return JsonResponse({
            "status": "success",
            "order_id": new_order.id,
            "order_status": new_order.status
        })
    return JsonResponse({"status": "error", "message": "Invalid request method"})

@csrf_exempt
def update_order(request: HttpResponse) -> JsonResponse:
    """
    Update the order details (e.g. items, quantities, note) by a diner before it's processed.
    Assumes the order status allows modification (e.g., 'PENDING').
    """
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        order_id = request.POST.get("order_id")
        updated_items_ids = request.POST.getlist("item_ids")  # Expecting list of menu_item_ids
        updated_quantities = request.POST.getlist("quantities") # Matching list of quantities
        updated_note = request.POST.get("note", None) # Optional

        if not order_id:
            return JsonResponse({"status": "error", "message": "Order ID is required"}, status=400)
        if len(updated_items_ids) != len(updated_quantities):
            return JsonResponse({"status": "error", "message": "Items and quantities mismatch"}, status=400)

        try:
            order = Order.objects.get(id=order_id, diner_id=request.session["diner_id"])
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found or not yours"}, status=404)

        # Basic check if order can be updated (e.g., only if PENDING)
        if order.status != 'PENDING':
            return JsonResponse({"status": "error", "message": f"Order cannot be updated in '{order.status}' status"}, status=400)
        
        # Clear existing items for simplicity, or implement more complex diff logic
        order.order_items.all().delete()
        
        new_total_price = 0
        for item_id, qty_str in zip(updated_items_ids, updated_quantities):
            try:
                quantity = int(qty_str)
                if quantity <= 0:
                    continue # Skip items with zero or negative quantity
                menu_item = MenuItem.objects.get(id=item_id)
                OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    quantity=quantity
                )
                new_total_price += menu_item.price * quantity
            except MenuItem.DoesNotExist:
                # Rollback or decide handling: for now, skip unknown items
                # For a transactional approach, consider `django.db.transaction.atomic`
                return JsonResponse({"status": "error", "message": f"Menu item with id {item_id} not found, update failed."}, status=400)
            except ValueError:
                return JsonResponse({"status": "error", "message": f"Invalid quantity for item id {item_id}"}, status=400)
        
        order.total_price = new_total_price
        if updated_note is not None:
            order.note = updated_note
        order.last_modified = timezone.now()
        order.save()
        
        return JsonResponse({
            "status": "success", 
            "message": "Order updated successfully",
            "order_id": order.id,
            "total_price": order.total_price
        })
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_order_status(request: HttpResponse) -> JsonResponse:
    """
    Get the status and details of a specific order.
    Diners can only see their own orders. Staff might see any.
    """
    if "diner_id" in request.session:
        try:
            order_id = request.GET.get("order_id")
            if not order_id:
                return JsonResponse({"status": "error", "message": "Order ID is required"}, status=400)
            order = Order.objects.get(id=order_id, diner_id=request.session["diner_id"])
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found or not authorized"}, status=404)
    elif "staff_id" in request.session: # Assuming staff can view any order
        try:
            order_id = request.GET.get("order_id")
            if not order_id:
                return JsonResponse({"status": "error", "message": "Order ID is required"}, status=400)
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
    else:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)

    if request.method == "GET":
        order_items = list(order.order_items.values('menu_item__name', 'quantity', 'menu_item__price'))
        return JsonResponse({
            "status": "success",
            "order_id": order.id,
            "order_status": order.status,
            "service_type": order.service_type,
            "note": order.note,
            "total_price": order.total_price,
            "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
            "last_modified": order.last_modified.strftime('%Y-%m-%d %H:%M:%S'),
            "items": order_items
        })
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def update_order_status_by_staff(request: HttpResponse) -> JsonResponse:
    """
    Update the status of an order.
    RBAC: Only Staff and Manager can update order status.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_staff(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Staff access required"}, status=403)

        order_id = request.POST.get("order_id")
        new_status = request.POST.get("status")
        
        if not order_id or not new_status:
            return JsonResponse({"status": "error", "message": "Missing required fields: order_id, status"}, status=400)
        
        valid_statuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED']
        if new_status not in valid_statuses:
            return JsonResponse({"status": "error", "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"}, status=400)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
        
        old_status = order.status
        order.status = new_status
        order.last_modified = timezone.now()
        order.save()
        
        return JsonResponse({
            "status": "success",
            "message": f"Order status updated from {old_status} to {new_status}",
            "order_id": order.id,
            "new_status": new_status
        }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_diner_orders(request: HttpResponse) -> JsonResponse:
    """
    Get all orders for a specific diner.
    Ensures the logged-in diner can only access their own orders, or staff can access.
    """
    # Security check: Logged-in diner must match diner_id or be staff
    diner_id = request.GET.get("diner_id")
    print(diner_id)
    try:
        diner_id = int(diner_id) if diner_id else None
    except ValueError:
        return JsonResponse({"status": "error", "message": "Invalid diner ID"}, status=400)
    if not diner_id:
        return JsonResponse({"status": "error", "message": "Diner ID is required"}, status=400)
    print("Request Item:", request.session.items())
    if "diner_id" in request.session and request.session["diner_id"] == diner_id:
        pass # Diner is accessing their own orders
    elif "staff_id" in request.session:
        pass # Staff can access any diner's orders
    else:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)

    if request.method == "GET":
        try:
            diner = User.objects.get(id=diner_id, role='Customer')
            orders = Order.objects.filter(diner=diner).order_by('-time_created')
            orders_data = []
            for order in orders:
                items = list(order.order_items.values('menu_item__name', 'quantity', 'menu_item__price'))
                orders_data.append({
                    "order_id": order.id,
                    "status": order.status,
                    "total_price": order.total_price,
                    "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
                    "items_count": sum(item['quantity'] for item in items) # Example: total items
                })
            return JsonResponse({"status": "success", "diner_id": diner_id, "orders": orders_data})
        except User.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Diner not found"}, status=404)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
@csrf_exempt
def get_all_orders(request: HttpResponse) -> JsonResponse:
    """
    Get all orders. Restricted to staff members.
    Supports both JWT and session authentication.
    """
    user = get_current_user(request)
    
    if not user or not is_staff(user):
        return JsonResponse({"status": "error", "message": "Not authorized. Staff access required."}, status=403)

    if request.method == "GET":
        orders = Order.objects.all().order_by('-time_created')
        orders_data = []
        for order in orders:
            items = list(order.order_items.values('menu_item__name', 'quantity'))
            orders_data.append({
                "order_id": order.id,
                "diner_id": order.diner.id,
                "status": order.status,
                "service_type": order.service_type,
                "total_price": order.total_price,
                "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
                "items_count": sum(item['quantity'] for item in items)
            })
        return JsonResponse({"status": "success", "orders": orders_data})
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_kitchen_orders(request: HttpResponse) -> JsonResponse:
    """
    Get orders relevant to the kitchen (e.g., PENDING, PREPARING).
    Restricted to staff members.
    Supports both JWT and session authentication.
    Returns up to 100 orders by default.
    """
    user = get_current_user(request)
    
    if not user or not is_staff(user):
        return JsonResponse({"status": "error", "message": "Not authorized. Staff access required."}, status=403)

    if request.method == "GET":
        # Get limit parameter (default 100)
        try:
            limit = int(request.GET.get('limit', 100))
            limit = min(limit, 100)  # Cap at 100 for performance
        except ValueError:
            limit = 100
        
        # Define kitchen-relevant statuses
        kitchen_statuses = ['PENDING', 'PREPARING', 'READY'] 
        orders = Order.objects.filter(status__in=kitchen_statuses).order_by('time_created')[:limit]
        
        orders_data = []
        for order in orders:
            items_details = list(order.order_items.values('menu_item__name', 'quantity', 'menu_item__description'))
            orders_data.append({
                "order_id": order.id,
                "diner_id": order.diner.id,
                "diner_name": order.diner.name,
                "service_type": order.service_type,
                "status": order.status,
                "note": order.note,
                "total_price": str(order.total_price),
                "time_created": order.time_created.strftime('%Y-%m-%d %H:%M:%S'),
                "items": items_details
            })
        return JsonResponse({"status": "success", "orders": orders_data})
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

# Payment processing views
@csrf_exempt
def process_payment(request: HttpResponse) -> JsonResponse:
    """
    Process payment for an order.
    RBAC: Customer can pay their own orders, Staff can process any order payment.
    
    If payment_method is ONLINE_BANKING, returns QR code data.
    If payment_method is CASH, marks order as paid immediately.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Authentication required"}, status=401)
        
        order_id = request.POST.get("order_id")
        payment_method = request.POST.get("payment_method")  # 'CASH' or 'ONLINE_BANKING'

        if not order_id or not payment_method:
            return JsonResponse({"status": "error", "message": "Order ID and payment method are required"}, status=400)
        
        valid_methods = [choice[0] for choice in Payment.METHOD_CHOICES]
        if payment_method not in valid_methods:
            return JsonResponse({"status": "error", "message": f"Invalid payment method. Must be one of {valid_methods}"}, status=400)

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
        
        # RBAC: Customer can only pay their own orders, Staff can process any
        if is_customer(current_user) and order.diner.id != current_user.id:
            return JsonResponse({"status": "error", "message": "Unauthorized: Can only pay for own orders"}, status=403)
        
        # Validate order status
        if order.status == 'COMPLETED':
            return JsonResponse({"status": "error", "message": "Order already completed and paid"}, status=400)
        if order.status == 'CANCELLED':
            return JsonResponse({"status": "error", "message": "Cannot pay for a cancelled order"}, status=400)

        # Check if payment already exists
        if hasattr(order, 'payment') and order.payment.status == 'paid':
            return JsonResponse({"status": "success", "message": "Order already paid"})

        # Create or update payment record
        payment, created = Payment.objects.update_or_create(
            order=order,
            defaults={'method': payment_method, 'status': 'pending' if payment_method == 'ONLINE_BANKING' else 'paid'}
        )
        
        response_data = {
            "status": "success",
            "payment_id": payment.id,
            "order_id": order.id,
            "amount": str(order.total_price),
            "payment_method": payment_method
        }
        
        # If CASH, mark as paid immediately and update order status
        if payment_method == 'CASH':
            payment.status = 'paid'
            payment.save()
            order.status = 'COMPLETED'
            order.save()
            response_data["message"] = "Cash payment confirmed"
            response_data["order_status"] = "COMPLETED"
        
        # If ONLINE_BANKING, return QR code image
        elif payment_method == 'ONLINE_BANKING':
            # Return QR code image URL
            # In production, this would integrate with actual payment gateway
            qr_data = f"PAYMENT|ORDER:{order.id}|AMOUNT:{order.total_price}|ID:{payment.id}"
            response_data["message"] = "Scan QR code to complete payment"
            response_data["qr_code_data"] = qr_data
            response_data["qr_code_image"] = "/media/demo_qr_code.webp"
            response_data["order_status"] = order.status
        
        return JsonResponse(response_data)
    
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def confirm_payment(request: HttpResponse) -> JsonResponse:
    """
    Confirm a pending payment (for online banking).
    RBAC: Staff only.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_staff(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Staff access required"}, status=403)
        
        payment_id = request.POST.get("payment_id")
        if not payment_id:
            return JsonResponse({"status": "error", "message": "Payment ID required"}, status=400)
        
        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Payment not found"}, status=404)
        
        if payment.status == 'paid':
            return JsonResponse({"status": "success", "message": "Payment already confirmed"})
        
        # Mark payment as paid
        payment.status = 'paid'
        payment.save()
        
        # Update order status
        order = payment.order
        order.status = 'COMPLETED'
        order.save()
        
        return JsonResponse({
            "status": "success",
            "message": "Payment confirmed",
            "payment_id": payment.id,
            "order_id": order.id,
            "order_status": "COMPLETED"
        })
    
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)