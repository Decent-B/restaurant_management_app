from django.shortcuts import render
from rest_framework import viewsets
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
from orders.models import Order
from .models import Feedback
from .serializers import FeedbackSerializer

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

@csrf_exempt
def submit_feedback(request: HttpResponse) -> JsonResponse:
    """
    Submit the feedback
    """
    # Protect view
    if "diner_id" not in request.session:
        return JsonResponse({"status": "error", "message": "Not authorized"}, status=403)
        
    if request.method == "POST":
        order_id = request.POST.get("order_id") 
        rating = request.POST.get("rating")
        comment = request.POST.get("comment")
        
        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return JsonResponse({"status": "error", "message": "Order not found"}, status=400)
        
        # Create the new order (status defaults to 'PENDING')
        new_feedback = Feedback(
            order=order,
            rating=int(rating),
            comment=comment
        )
        
        new_feedback.save()
        
        return JsonResponse({
            "status": "success",
            "feedback_id": new_feedback.id,
            "order_id": order.id,
            "rating": new_feedback.rating,
            "comment": new_feedback.comment
        })
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)