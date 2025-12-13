from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class User(models.Model):
    ROLE_CHOICES = [
        ('Customer', 'Customer'),
        ('Staff', 'Staff'),
        ('Manager', 'Manager'),
    ]
    
    name = models.CharField(max_length=100, blank=False, null=False)
    email = models.EmailField(max_length=200, blank=False, unique=False, default='someone@example.com')
    hashed_password = models.CharField(max_length=128, blank=False, default='some_hash')
    phone_num = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, blank=False, null=False)
    time_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.role})"

    def set_password(self, raw_password):
        self.hashed_password = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.hashed_password)


# Backward compatibility aliases
Staff = User
Diner = User