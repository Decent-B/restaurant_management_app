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
    \"\"\"\n    Submit feedback for an order.\n    RBAC: Customer can submit feedback for their own orders only.\n    \"\"\"\n    if request.method == \"POST\":\n        current_user = get_current_user(request)\n        if not is_customer(current_user):\n            return JsonResponse({\"status\": \"error\", \"message\": \"Unauthorized: Customer access required\"}, status=403)\n        \n        order_id = request.POST.get(\"order_id\") \n        rating = request.POST.get(\"rating\")\n        comment = request.POST.get(\"comment\", \"\")\n        \n        if not order_id or not rating:\n            return JsonResponse({\"status\": \"error\", \"message\": \"Missing required fields: order_id, rating\"}, status=400)\n        \n        try:\n            rating_int = int(rating)\n            if rating_int < 1 or rating_int > 5:\n                return JsonResponse({\"status\": \"error\", \"message\": \"Rating must be between 1 and 5\"}, status=400)\n        except ValueError:\n            return JsonResponse({\"status\": \"error\", \"message\": \"Invalid rating value\"}, status=400)\n        \n        try:\n            order = Order.objects.get(id=order_id)\n        except Order.DoesNotExist:\n            return JsonResponse({\"status\": \"error\", \"message\": \"Order not found\"}, status=404)\n        \n        # RBAC: Customer can only submit feedback for their own orders\n        if order.diner.id != current_user.id:\n            return JsonResponse({\"status\": \"error\", \"message\": \"Unauthorized: Can only submit feedback for own orders\"}, status=403)\n        \n        # Check if feedback already exists for this order\n        if Feedback.objects.filter(order=order).exists():\n            return JsonResponse({\"status\": \"error\", \"message\": \"Feedback already submitted for this order\"}, status=400)\n        \n        new_feedback = Feedback(\n            order=order,\n            diner=current_user,\n            rating=rating_int,\n            comment=comment\n        )\n        new_feedback.save()\n        \n        return JsonResponse({\n            \"status\": \"success\",\n            \"feedback_id\": new_feedback.id,\n            \"order_id\": order.id,\n            \"rating\": new_feedback.rating,\n            \"comment\": new_feedback.comment\n        }, status=201)\n    return JsonResponse({\"status\": \"error\", \"message\": \"Invalid request method\"}, status=405)