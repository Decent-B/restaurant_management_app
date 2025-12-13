# from django.test import TestCase
import pytest
from accounts.models import User

@pytest.mark.django_db
def test_staff_password_hashing():
    staff = Staff(name="Alice", role="Manager", email="alice@example.com")
    staff.set_password("securepassword")
    staff.save()
    assert staff.check_password("securepassword") is True
    assert staff.check_password("wrongpassword") is False

@pytest.mark.django_db
def test_diner_password_hashing():
    diner = Diner(name="Bob", email="bob@example.com", phone_num="1234567890")
    diner.set_password("dinerpassword")
    diner.save()
    assert diner.check_password("dinerpassword") is True
    assert diner.check_password("incorrect") is False