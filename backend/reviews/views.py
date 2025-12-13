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
    Submit feedback for an order.
    RBAC: Customer can submit feedback for their own orders only.
    """
    if request.method == "POST":
        current_user = get_current_user(request)
        if not is_customer(current_user):
            return JsonResponse({"status": "error", "message": "Unauthorized: Customer access required"}, status=403)
        
        order_id = request.POST.get("order_id") 
        rating = request.POST.get("rating")
        comment = request.POST.get("comment", "")
        
        if not order_id or not rating:
            return JsonResponse({"status": "error", "message": "Missing required fields: order_id, rating"}, status=400)
        
        try:
            rating_int = int(rating)
            if rating_int < 1 or rating_int > 5:
                return JsonResponse({"status": "error", "message": "Rating must be between 1 and 5"}, status=400)
        except ValueError:
            return JsonResponse({"status": "error", "message": "Invalid rating value"}, status=400)
        
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
            "order_id": order.id,
            "rating": new_feedback.rating,
            "comment": new_feedback.comment
        }, status=201)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
