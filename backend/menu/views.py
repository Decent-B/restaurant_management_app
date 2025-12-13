from accounts.models import User
from .models import Menu, MenuItem
from .serializers import MenuSerializer, MenuItemSerializer
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets
from rest_framework.permissions import AllowAny

# Create your views here.
class MenuViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing menu instances.
    Public read access, authenticated write access.
    """
    queryset = Menu.objects.all()
    serializer_class = MenuSerializer
    permission_classes = [AllowAny]  # Allow public access to menu

class MenuItemViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing menu item instances.
    Public read access, authenticated write access.
    """
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]  # Allow public access to menu items

@csrf_exempt
def add_menu_items(request: HttpResponse) -> JsonResponse:
    """
    Add Menu Items
    """
    if request.method == "POST":
        if 'staff_id' in request.session:
            staff = User.objects.get(id=request.session['staff_id'], role__in=['Staff', 'Manager'])
            if staff.role == 'Manager':
                name = request.POST.get("name")
                description = request.POST.get("description")
                price = request.POST.get("price")
                menu_id = request.POST.get("menu_id")
                image = request.FILES.get("image")

                if not name or not description or not price or not menu_id or not image:
                    return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

                # Inspect image
                # print(image.name, image.size, image.content_type)

                try:
                    menu = Menu.objects.get(id=menu_id)
                except Menu.DoesNotExist:
                    return JsonResponse({"status": "error", "message": "Menu not found"}, status=404)

                new_item = MenuItem(
                    name=name,
                    description=description,
                    price=round(float(price), 2),
                    menu=menu,
                    image=image
                )
                new_item.save()
                return JsonResponse({"status": "success", "message": "Menu item added successfully"}, status=201)
            else:
                return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
        else:
            return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)


@csrf_exempt
def remove_menu_items(request: HttpResponse) -> JsonResponse:
    """
    Remove Menu Items
    """
    if request.method == "POST":
        if 'staff_id' in request.session:
            staff = User.objects.get(id=request.session['staff_id'], role__in=['Staff', 'Manager'])
            if staff.role == 'Manager':
                item_id = request.POST.get("item_id")
                if not item_id:
                    return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

                try:
                    item = MenuItem.objects.get(id=item_id)
                    item.delete()
                    return JsonResponse({"status": "success", "message": "Menu item removed successfully"}, status=200)
                except MenuItem.DoesNotExist:
                    return JsonResponse({"status": "error", "message": "Menu item not found"}, status=404)
            else:
                return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
        else:
            return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

@csrf_exempt
def change_item_info(request: HttpResponse) -> JsonResponse:
    """
    Change Menu Item Info based on description, price
    """
    if request.method == "POST":
        if 'staff_id' in request.session:
            staff = User.objects.get(id=request.session['staff_id'], role__in=['Staff', 'Manager'])
            if staff.role == 'Manager':
                item_id = request.POST.get("item_id")
                if not item_id:
                    return JsonResponse({"status": "error", "message": "Missing required fields"}, status=400)

                try:
                    item = MenuItem.objects.get(id=item_id)
                    description = request.POST.get("description")
                    price = request.POST.get("price")

                    if description:
                        item.description = description
                    if price:
                        item.price = round(float(price), 2)
                    
                except MenuItem.DoesNotExist:
                    return JsonResponse({"status": "error", "message": "Menu item not found"}, status=404)
            else:
                return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
        else:
            return JsonResponse({"status": "error", "message": "Unauthorized access"}, status=403)
    return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)
