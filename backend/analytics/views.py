from django.http import JsonResponse, HttpRequest
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime
from django.db.models import Sum
from reviews.models import Feedback  # Assumes the Feedback model is in the reviews app
from orders.models import Order, OrderItem
from collections import Counter
from django.db.models.functions import TruncMonth


@csrf_exempt
def get_rating_analytics(request: HttpRequest) -> JsonResponse:
    """
    Returns the mean rating for feedbacks within a given time range.
    Expects 'start' and 'end' query parameters in the format 'YYYY-MM-DD HH:MM:SS'.
    Supports both JWT and session authentication.
    """
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Invalid HTTP method"}, status=405)
    
    from accounts.views import get_current_user, is_staff
    current_user = get_current_user(request)
    
    if not current_user:
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=401)
    
    if not is_staff(current_user):
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)

    start = request.GET.get("start")
    end = request.GET.get("end")
    
    if not start or not end:
        return JsonResponse({"status": "error", "message": "start and end parameters are required"}, status=400)
    
    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid datetime format, use YYYY-MM-DD HH:MM:SS"
        }, status=400)
    
    feedbacks = Feedback.objects.filter(time_created__range=(start_dt, end_dt)).values_list('rating', flat=True)
    ratings = list(feedbacks)
    
    if not ratings:
        mean_rating = 0
    else:
        mean_rating = sum(ratings) / len(ratings)
    
    rating_counts = dict(Counter(ratings))


    return JsonResponse({"status": "success", "mean_rating": mean_rating, "rating_counts": rating_counts})


@csrf_exempt
def get_revenue_analytics(request: HttpRequest) -> JsonResponse:
    """
    Returns the total revenue (sum of order total prices) within a given time range.
    Expects 'start' and 'end' query parameters in the format 'YYYY-MM-DD HH:MM:SS'.
    Supports both JWT and session authentication.
    """
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Invalid HTTP method"}, status=405)
    
    from accounts.views import get_current_user, is_staff
    current_user = get_current_user(request)
    
    if not current_user:
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=401)
    
    if not is_staff(current_user):
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)

    start = request.GET.get("start")
    end = request.GET.get("end")
    
    if not start or not end:
        return JsonResponse({"status": "error", "message": "start and end parameters are required"}, status=400)
    
    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid datetime format, use YYYY-MM-DD HH:MM:SS"
        }, status=400)
    
    orders = Order.objects.filter(time_created__range=(start_dt, end_dt))
    # Group orders by month and sum total_price for each month

    monthly_revenue = (
        orders.annotate(month=TruncMonth('time_created'))
        .values('month')
        .annotate(total_revenue=Sum('total_price'))
        .order_by('month')
    )
    monthly_revenue_list = [
        {"month": m["month"].strftime("%Y-%m"), "total_revenue": m["total_revenue"] or 0}
        for m in monthly_revenue
    ]
    total_revenue = orders.aggregate(total_revenue=Sum('total_price'))["total_revenue"] or 0
    
    return JsonResponse({"status": "success", "total_revenue": total_revenue, "monthly_revenue": monthly_revenue_list})


@csrf_exempt
def get_menu_items_order_count(request: HttpRequest) -> JsonResponse:
    """
    Returns the count of ordered menu items within a given time range.
    Expects 'start' and 'end' query parameters in the format 'YYYY-MM-DD HH:MM:SS'.
    Returns a list of menu item names and their total order quantities.
    Supports both JWT and session authentication.
    """
    if request.method != "GET":
        return JsonResponse({"status": "error", "message": "Invalid HTTP method"}, status=405)
    
    from accounts.views import get_current_user, is_staff
    current_user = get_current_user(request)
    
    if not current_user:
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=401)
    
    if not is_staff(current_user):
        return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)

    start = request.GET.get("start")
    end = request.GET.get("end")
    
    if not start or not end:
        return JsonResponse({"status": "error", "message": "start and end parameters are required"}, status=400)
    
    try:
        start_dt = datetime.strptime(start, "%Y-%m-%d %H:%M:%S")
        end_dt = datetime.strptime(end, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return JsonResponse({
            "status": "error",
            "message": "Invalid datetime format, use YYYY-MM-DD HH:MM:SS"
        }, status=400)
    
    order_items = OrderItem.objects.filter(order__time_created__range=(start_dt, end_dt))
    counts = order_items.values("menu_item__id").annotate(order_count=Sum("quantity"))
    result = list(counts)
    
    return JsonResponse({"status": "success", "menu_items_order_count": result})

