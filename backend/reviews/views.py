from django.shortcuts import render
from rest_framework import viewsets
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from orders.models import Order
from accounts.models import User
from .models import Feedback
from .serializers import FeedbackSerializer

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

def is_customer(user):
    """Check if user is a Customer"""
    return user and user.role == 'Customer'

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

@csrf_exempt
def submit_feedback(request: HttpResponse) -> JsonResponse:
    """
    Submit feedback with optional order association.
    RBAC: Customer can submit feedback. If order_id provided, validates order ownership.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_customer(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Customer access required"}, status=403)
        
        # Try to get from JSON body first, then fallback to POST data
        try:
            import json
            data = json.loads(request.body)
            order_id = data.get("order_id") or data.get("order")
            rating = data.get("rating")
            comment = data.get("comment", "")
        except:
            order_id = request.POST.get("order_id") or request.POST.get("order")
            rating = request.POST.get("rating")
            comment = request.POST.get("comment", "")
        
        # Only rating is required, order_id is optional
        if not rating:
            return JsonResponse({"status": "error", "message": "Missing required field: rating"}, status=400)
        
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return JsonResponse({"status": "error", "message": "Rating must be between 1 and 5"}, status=400)
        except ValueError:
            return JsonResponse({"status": "error", "message": "Invalid rating value"}, status=400)
        
        order = None
        if order_id:
            try:
                order = Order.objects.get(id=order_id)
            except Order.DoesNotExist:
                return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
            
            # RBAC: Customer can only submit feedback for their own orders
            if order.diner.id != current_user.id:
                return JsonResponse({"status": "error", "message": "Unauthorized: Can only submit feedback for own orders"}, status=403)
            
            # Check if feedback already exists for this order
            if Feedback.objects.filter(order=order).exists():
                return JsonResponse({"status": "error", "message": "Feedback already submitted for this order"}, status=400)
        
        new_feedback = Feedback(
            order=order,
            diner=current_user,
            rating=rating_int,
            comment=comment
        )
        new_feedback.save()
        
        return JsonResponse({
            "status": "success",
            "feedback_id": new_feedback.id,
            "order_id": order.id if order else None,
            "rating": new_feedback.rating,
            "comment": new_feedback.comment
        }, status=201)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_all_feedbacks(request: HttpResponse) -> JsonResponse:
    """
    Get all feedbacks.
    RBAC: Manager can view all feedbacks.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not is_manager(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Manager access required"}, status=403)
        
        feedbacks = Feedback.objects.all().order_by('-time_created')
        
        feedback_list = []
        for feedback in feedbacks:
            feedback_list.append({
                "id": feedback.id,
                "order_id": feedback.order.id if feedback.order else None,
                "diner_id": feedback.diner.id if feedback.diner else None,
                "diner_name": feedback.diner.name if feedback.diner else "Anonymous",
                "diner_email": feedback.diner.email if feedback.diner else "",
                "rating": feedback.rating,
                "comment": feedback.comment,
                "time_created": feedback.time_created.isoformat(),
            })
        
        return JsonResponse({
            "status": "success",
            "feedbacks": feedback_list,
            "count": len(feedback_list)
        }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def get_order_feedback(request: HttpResponse) -> JsonResponse:
    """
    Get feedback for a specific order.
    RBAC: Customer can view feedback for their own orders.
    """
    if request.method == "GET":
        current_user = get_current_user(request)
        if not current_user:
            return JsonResponse({"status": "error", "message": "Unauthorized: Login required"}, status=403)
        
        order_id = request.GET.get("order_id")
        if not order_id:
            return JsonResponse({"status": "error", "message": "Missing required field: order_id"}, status=400)
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=404)
        
        # RBAC: Customer can only view feedback for their own orders, managers/staff can view all
        if current_user.role == 'Customer' and order.diner.id != current_user.id:
            return JsonResponse({"status": "error", "message": "Unauthorized: Can only view feedback for own orders"}, status=403)
        
        try:
            feedback = Feedback.objects.get(order=order)
            return JsonResponse({
                "status": "success",
                "feedback": {
                    "id": feedback.id,
                    "order_id": feedback.order.id,
                    "rating": feedback.rating,
                    "comment": feedback.comment,
                    "time_created": feedback.time_created.isoformat(),
                }
            }, status=200)
        except Feedback.DoesNotExist:
            return JsonResponse({
                "status": "success",
                "feedback": None,
                "message": "No feedback found for this order"
            }, status=200)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
