from django.db import models
from django.utils import timezone
from orders.models import Order
from accounts.models import User

# Create your models here.
class Feedback(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, null=True, blank=True)
    diner = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'Customer'}, null=True, blank=True)
    rating = models.IntegerField()  # e.g. 1-5
    comment = models.TextField(blank=True)
    time_created = models.DateTimeField(default=timezone.now)

    def __str__(self):
        diner_name = self.diner.name if self.diner else 'Anonymous'
        return f"Feedback from {diner_name} (Order #{self.order.pk if self.order else 'None'}): {self.rating}"
