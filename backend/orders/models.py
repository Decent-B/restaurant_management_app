from django.db import models
from accounts.models import User
from menu.models import MenuItem
from django.utils import timezone

# Create your models here.

class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    service_type = models.CharField(max_length=50)  # e.g. "Dine-In", "Takeout", etc.
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    note = models.CharField(max_length=200, blank=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    diner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'Customer'})
    time_created = models.DateTimeField(default=timezone.now)
    last_modified = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Order #{self.pk} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='order_items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1) # pyright: ignore[reportArgumentType]

    def __str__(self):
        return f"{self.quantity} x {self.menu_item.name} for Order #{self.order.pk}"

class Payment(models.Model):
    METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('ONLINE_BANKING', 'Online_Banking'),
    ]
    order = models.OneToOneField(Order, on_delete=models.CASCADE)
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    time_created = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=15, default='unpaid')

    def __str__(self):
        return f"Payment for Order #{self.order.pk} ({self.method})"