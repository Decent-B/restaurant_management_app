import pytest
from django.urls import reverse
from accounts.models import User

@pytest.mark.django_db
def test_staff_login_success(client):
    staff = Staff.objects.create(name="Alice", role="Manager", email="alice@example.com")
    staff.set_password("securepassword")
    staff.save()

    response = client.post(reverse('staff_login'), {'username': 'Alice', 'password': 'securepassword'})
    assert response.status_code == 200
    assert response.json()['success'] is True
    assert client.session.get('staff_id') == staff.id

@pytest.mark.django_db
def test_staff_login_failure(client):
    response = client.post(reverse('staff_login'), {'username': 'NonExistent', 'password': 'nopassword'})
    assert response.status_code == 400
    assert response.json()['success'] is False

@pytest.mark.django_db
def test_diner_login_success(client):
    diner = Diner.objects.create(name="Bob", email="bob@example.com", phone_num="1234567890")
    diner.set_password("dinerpassword")
    diner.save()

    response = client.post(reverse('diner_login'), {'username': 'Bob', 'password': 'dinerpassword'})
    assert response.status_code == 200
    assert response.json()['success'] is True
    assert client.session.get('diner_id') == diner.id

@pytest.mark.django_db
def test_diner_login_failure(client):
    response = client.post(reverse('diner_login'), {'username': 'Unknown', 'password': 'wrong'})
    assert response.status_code == 400
    assert response.json()['success'] is False

@pytest.mark.django_db
def test_logout_view(client):
    # Simulate a logged-in staff
    staff = Staff.objects.create(name="Alice", role="Manager", email="alice@example.com")
    staff.set_password("securepassword")
    staff.save()
    client.session['staff_id'] = staff.id
    client.session.save()

    response = client.post(reverse('logout'))
    assert response.status_code == 200
    assert response.json()['success'] is True
    assert 'staff_id' not in client.session

@pytest.mark.django_db
def test_protected_view_staff(client):
    staff = Staff.objects.create(name="Alice", role="Manager", email="alice@example.com")
    staff.set_password("securepassword")
    staff.save()
    client.post(reverse('staff_login'), {'username': 'Alice', 'password': 'securepassword'})

    response = client.get(reverse('protected'))
    assert response.status_code == 200
    assert response.json()['message'] == 'Hello Staff Bro'

@pytest.mark.django_db
def test_protected_view_diner(client):
    diner = Diner.objects.create(name="Bob", email="bob@example.com", phone_num="1234567890")
    diner.set_password("dinerpassword")
    diner.save()
    client.post(reverse('diner_login'), {'username': 'Bob', 'password': 'dinerpassword'})

    response = client.get(reverse('protected'))
    assert response.status_code == 200
    assert response.json()['message'] == 'Hello Diner Bro'

@pytest.mark.django_db
def test_protected_view_unauthenticated(client):
    response = client.get(reverse('protected'))
    assert response.status_code == 403
    assert response.json()['error'] == 'Not logged in'