import pytest
from django.urls import reverse
from orders.models import Order, OrderItem, Payment
from menu.models import MenuItem, Menu
from accounts.models import User

@pytest.fixture
def menu(db):
    return Menu.objects.create(name="Lunch Menu")

@pytest.fixture
def menu_item(db, menu):
    return MenuItem.objects.create(name="Burger", price=10.00, description="Tasty burger", menu=menu)

@pytest.fixture
def diner(db):
    diner = Diner.objects.create(name="Bob", email="bob@example.com", phone_num="1234567890")
    diner.set_password("dinerpassword")
    diner.save()
    return diner

@pytest.fixture
def staff(db):
    staff = Staff.objects.create(name="Alice", email="alice@example.com", role="Manager")
    staff.set_password("securepassword")
    staff.save()
    return staff

@pytest.mark.django_db
def test_submit_order(client, diner, menu_item):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    response = client.post(reverse("submit_order"), {
        "diner_id": diner.id,
        "ordered_items": [menu_item.id],
        "quantities": [2],
        "service_type": "Takeout",
        "note": "Extra ketchup"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"

@pytest.mark.django_db
def test_add_order_item_and_remove(client, diner, menu_item):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("add_order_item"), {
        "order_id": order.id,
        "item_id": menu_item.id,
        "quantity": 1
    })
    assert response.status_code == 200

    response = client.post(reverse("remove_order_item"), {
        "order_id": order.id,
        "item_id": menu_item.id,
        "quantity": 1
    })
    assert response.status_code == 200

@pytest.mark.django_db
def test_add_note_to_order(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("add_note"), {"order_id": order.id, "note": "Test note"})
    assert response.status_code == 200

@pytest.mark.django_db
def test_choose_service(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("choose_service"), {"order_id": order.id, "service_type": "Takeout"})
    assert response.status_code == 200

@pytest.mark.django_db
def test_update_order(client, diner, menu_item):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("update_order"), {
        "order_id": order.id,
        "item_ids": [menu_item.id],
        "quantities": [1],
        "note": "Updated order"
    })
    assert response.status_code == 200

@pytest.mark.django_db
def test_get_order_status_diner(client, diner):
    # Create an order associated with the diner
    order = Order.objects.create(diner=diner, service_type="Dine-in")

    # Simulate diner login by setting session variable
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    
    # Access the view with the order_id as a path parameter
    response = client.get(reverse("get_order_status"), {'order_id': order.id})
    assert response.status_code == 200
    
def test_get_order_status_staff(client, staff, diner):
    # Create an order associated with the diner
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    # Simulate staff login by setting session variable
    session = client.session
    session['staff_id'] = staff.id
    session.save()
    
    # Access the view with the order_id as a path parameter
    response = client.get(reverse("get_order_status"), {'order_id': order.id})
    assert response.status_code == 200

@pytest.mark.django_db
def test_update_order_status_by_staff(client, staff, diner):
    session = client.session
    session['staff_id'] = staff.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("update_order_status_by_staff"), {
        "order_id": order.id,
        "status": "COMPLETED"
    })
    assert response.status_code == 200

@pytest.mark.django_db
def test_get_diner_orders(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.get(reverse("get_diner_orders"), {"diner_id":diner.id})
    assert response.status_code == 200

@pytest.mark.django_db
def test_get_all_orders_and_kitchen_orders(client, staff, diner, menu_item):
    session = client.session
    session['staff_id'] = staff.id
    session.save()
    Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.get(reverse("get_all_orders"))
    assert response.status_code == 200
    response = client.get(reverse("get_kitchen_orders"))
    assert response.status_code == 200

@pytest.mark.django_db
def test_process_payment(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in", status="PENDING", total_price=20.00)
    response = client.post(reverse("pay_for_order"), {
        "order_id": order.id,
        "payment_method": "CASH"
    })
    assert response.status_code == 200

# --- ERROR CASES ---

@pytest.mark.django_db
def test_unauthorized_submit_order(client):
    response = client.post(reverse("submit_order"), {})
    assert response.status_code == 403

@pytest.mark.django_db
def test_update_order_invalid_data(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in")
    response = client.post(reverse("update_order"), {
        "order_id": order.id,
        "item_ids": [1],
        "quantities": [],  # mismatch
    })
    assert response.status_code == 400

@pytest.mark.django_db
def test_process_payment_invalid_method(client, diner):
    session = client.session
    session['diner_id'] = diner.id
    session.save()
    order = Order.objects.create(diner=diner, service_type="Dine-in", status="PENDING", total_price=20.00)
    response = client.post(reverse("pay_for_order"), {
        "order_id": order.id,
        "payment_method": "INVALID"
    })
    assert response.status_code == 400
