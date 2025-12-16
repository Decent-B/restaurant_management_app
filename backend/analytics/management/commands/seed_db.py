# filepath: /home/baku/Coding/restaurant_management_app/backend/orders/management/commands/seed_db.py
from tokenize import group
from tracemalloc import start
from django.core.management.base import BaseCommand
from accounts.models import User
from menu.models import Menu, MenuItem
from orders.models import Order, OrderItem, Payment
from reviews.models import Feedback
from django.utils.timezone import make_aware
from datetime import datetime, timedelta
import random

random.seed(10)

import os



class Command(BaseCommand):
    help = 'Seeds the database with initial data if it is empty'

    def handle(self, *args, **kwargs):
        database_seeding = os.getenv('DATABASE_SEEDING', 'False').lower() in ['true', '1', 't']
        
        if database_seeding:
            self.stdout.write(self.style.WARNING('DATABASE_SEEDING is set to True. Deleting all current data...'))
            User.objects.all().delete()
            Menu.objects.all().delete()
            MenuItem.objects.all().delete()
            Order.objects.all().delete()
            OrderItem.objects.all().delete()
            Payment.objects.all().delete()
            Feedback.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Seeding database...'))
            
            # Add your seeding logic here
            # Example seeding for Staff
            staff_fieri = User.objects.create(name="Guy Fieri", role="Manager", email="fieri@example.com")
            staff_ray = User.objects.create(name="Rachael Ray", role="Staff", email="ray@example.com")
            staff_caines = User.objects.create(name="Michael Caines", role="Staff", email="caines@example.com")
            staff_oliver = User.objects.create(name="Jamie Oliver", role="Staff", email="oliver@example.com")
            staff_ramsay = User.objects.create(name="Gordon Ramsay", role="Staff", email="ramsay@example.com")
            staff_fieri.set_password("123")
            staff_ray.set_password("123")
            staff_caines.set_password("123")
            staff_oliver.set_password("123")
            staff_ramsay.set_password("123")
            staff_fieri.save()
            staff_ray.save()
            staff_caines.save()
            staff_oliver.save()
            staff_ramsay.save()
            
            # Example seeding for Diner
            diner_giap = User.objects.create(name="nhugiap", role="Customer", email="giap.nn225441@sis.hust.edu.vn", phone_num="1234567890")
            diner_binh = User.objects.create(name="ducbinh", role="Customer", email="binh.nd225475@sis.hust.edu.vn", phone_num="0987654321")
            diner_khanh = User.objects.create(name="ankhanh", role="Customer", email="khanh.ta225447@sis.hust.edu.vn")
            diner_bao = User.objects.create(name="vietbao", role="Customer", email="bao.mv225474@sis.hust.edu.vn", phone_num="0123456789")
            diner_tu = User.objects.create(name="anhtu", role="Customer", email="tu.pa225463@sis.hust.edu.vn", phone_num="0123457789")
            diner_mbappe = User.objects.create(name="Kylian Mbappe", role="Customer", phone_num="9876543210", email="mbappe@example.com")
            diner_messi = User.objects.create(name="Lionel Messi", role="Customer", email="messi@example.com")
            diner_giap.set_password("123")
            diner_binh.set_password("123")
            diner_khanh.set_password("123")
            diner_bao.set_password("123")
            diner_tu.set_password("123")
            diner_mbappe.set_password("123")
            diner_messi.set_password("123")
            diner_giap.save()
            diner_binh.save()
            diner_khanh.save()
            diner_bao.save()
            diner_tu.save()
            diner_mbappe.save()
            diner_messi.save()
            
            # Example seeding for Menu and MenuItem
            menu_drink = Menu.objects.create(name="Drink Menu", description="Quench your thirst with our Drink Menu, featuring a selection of refreshing beverages. Choose from fruity, herbal-infused teas or zesty citrus drinks that are perfect complements to your meal. Served in elegant glasses, these drinks are both a visual and flavorful treat.", image="menu_images/menu-drink.png")
            menu_kimbap = Menu.objects.create(name="Kimbap Menu", description="Delight in the fresh and flavorful rolls of our Kimbap Menu, crafted with premium ingredients. Each roll is packed with a perfect combination of seasoned vegetables, fresh seafood, and tender meat, all wrapped in seaweed and rice. Served with our special dipping sauces, these rolls are as beautiful as they are delicious.", image="menu_images/menu-kimbap.png")
            menu_korean_food = Menu.objects.create(name="Korean Food Menu", description="Savor the rich and complex flavors of our Korean Food Menu, featuring a variety of traditional dishes. From spicy kimchi to savory bulgogi, each dish is a celebration of Korean culinary heritage. Served with a side of steamed rice, these dishes are sure to satisfy your cravings.", image="menu_images/menu-korean-food.png")
            menu_set = Menu.objects.create(name="Set Menu", description="Indulge in our Set Menu, a curated selection of our most popular dishes. Each set is thoughtfully designed to offer a balanced and satisfying meal, with a main course, side dish, and drink. Perfect for a quick and delicious meal, these sets are sure to leave you feeling full and happy.", image="menu_images/menu-set.png")
            
            # Example seeding for MenuItem
            menu_item_box_7_3 = MenuItem.objects.create(name="Set box 7.3", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-7_3.png")
            menu_item_box_ga_3_vi = MenuItem.objects.create(name="Set box Gà 3 vị", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-ga-3-vi.png")
            menu_item_box_han_1_5 = MenuItem.objects.create(name="Set box Hàn 1.5", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-han-1_5.png")
            menu_item_box_han_1 = MenuItem.objects.create(name="Set box Hàn 1", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-han-1.png")
            menu_item_box_han_2 = MenuItem.objects.create(name="Set box Hàn 2", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-han-2.png")
            menu_item_box_han_3 = MenuItem.objects.create(name="Set box Hàn 3", description="Delicious Korean set meal", price=150000, menu=menu_set, image="menu_item_images/box-han-3.png")
            menu_item_box_mandu = MenuItem.objects.create(name="Box Mandu", description="Tasty dumplings", price=120000, menu=menu_set, image="menu_item_images/box-mandu.png")
            
            menu_item_carbonara_tteokbokki = MenuItem.objects.create(name="Carbonara Tteokbokki", description="Cheesy rice cakes", price=170000, menu=menu_korean_food, image="menu_item_images/carbonara-tteokbokki.png")
            menu_item_com_ca_ri_thit_cot_let_chien_xu = MenuItem.objects.create(name="Cơm cà ri thịt cốt lết chiên xù", description="Crispy fried pork cutlet with curry", price=180000, menu=menu_korean_food, image="menu_item_images/com-ca-ri-thit-cot-let-chien-xu.png")
            menu_item_com_tron_bibimbap = MenuItem.objects.create(name="Cơm trộn Bibimbap", description="Mixed rice with vegetables and beef", price=160000, menu=menu_korean_food, image="menu_item_images/com-tron-bibimbap.png")
            menu_item_mien_tron = MenuItem.objects.create(name="Miến trộn", description="Stir-fried vermicelli", price=120000, menu=menu_korean_food, image="menu_item_images/mien-tron.png")
            menu_item_ram_don = MenuItem.objects.create(name="Ram Don", description="Spicy instant noodles", price=120000, menu=menu_korean_food, image="menu_item_images/ram-don.png")
            menu_item_tteokbokki_cha_ca = MenuItem.objects.create(name="Tteokbokki chả cá", description="Fish cake Tteokbokki", price=140000, menu=menu_korean_food, image="menu_item_images/tteokbokki-cha-ca.png")
            
            menu_item_kimbap_bo_bulgogi = MenuItem.objects.create(name="Kimbap bò Bulgogi", description="Kimbap with Bulgogi beef", price=130000, menu=menu_kimbap, image="menu_item_images/kimbap-bo-bulgogi.png")
            menu_item_kimbap_bo_pho_mai_chay = MenuItem.objects.create(name="Kimbap bò phô mai cháy", description="Burnt cheese and beef kimbap", price=140000, menu=menu_kimbap, image="menu_item_images/kimbap-bo-pho-mai-chay.png")
            menu_item_kimbap_ca_ngu_cai_vang = MenuItem.objects.create(name="Kimbap cá ngừ cải vàng", description="Tuna and pickled mustard leaf kimbap", price=130000, menu=menu_kimbap, image="menu_item_images/kimbap-ca-ngu-cai-vang.png")
            menu_item_kimbap_chien = MenuItem.objects.create(name="Kimbap chiên", description="Crispy fried kimbap", price=150000, menu=menu_kimbap, image="menu_item_images/kimbap-chien.png")
            menu_item_kimbap_ga_gion_cajun = MenuItem.objects.create(name="Kimbap gà giòn Cajun", description="Cajun crispy chicken kimbap", price=150000, menu=menu_kimbap, image="menu_item_images/kimbap-ga-gion-cajun.png")
            menu_item_kimbap_heo_nuong_galbi = MenuItem.objects.create(name="Kimbap heo nướng Galbi", description="Kimbap with grilled pork Galbi", price=150000, menu=menu_kimbap, image="menu_item_images/kimbap-heo-nuong-galbi.png")
            menu_item_kimbap_pho_mai = MenuItem.objects.create(name="Kimbap phô mai", description="Cheesy kimbap", price=140000, menu=menu_kimbap, image="menu_item_images/kimbap-pho-mai.png")
            menu_item_kimbap_suon_bo_bbq = MenuItem.objects.create(name="Kimbap sườn bò BBQ", description="BBQ beef rib kimbap", price=160000, menu=menu_kimbap, image="menu_item_images/kimbap-suon-bo-bbq.png")
            menu_item_kimbap_tom_sot_guyumi = MenuItem.objects.create(name="Kimbap tôm sốt Guyumi", description="Shrimp kimbap with Guyumi sauce", price=150000, menu=menu_kimbap, image="menu_item_images/kimbap-tom-sot-guyumi.png")
            menu_item_kimbap_xa_xiu = MenuItem.objects.create(name="Kimbap xá xíu", description="Char siu pork kimbap", price=150000, menu=menu_kimbap, image="menu_item_images/kimbap-xa-xiu.png")
            menu_item_kimbibi = MenuItem.objects.create(name="Kimbibi", description="Special Bibimbap-style kimbap", price=150000, menu=menu_kimbap, image="menu_item_images/kimbibi.png")
            
            menu_item_tra_cam_buoi_nhiet_doi = MenuItem.objects.create(name="Trà cam bưởi nhiệt đới", description="Tropical orange and grapefruit tea", price=50000, menu=menu_drink, image="menu_item_images/tra-cam-buoi-nhiet-doi.png")
            menu_item_tra_chanh_leo = MenuItem.objects.create(name="Trà chanh leo", description="Passionfruit tea", price=45000, menu=menu_drink, image="menu_item_images/tra-chanh-leo.png")
            menu_item_tra_dao_cam_xa = MenuItem.objects.create(name="Trà đào cam sả", description="Peach, orange, and lemongrass tea", price=45000, menu=menu_drink, image="menu_item_images/tra-dao-cam-xa.png")
            menu_item_tra_hoa_qua_dac_biet = MenuItem.objects.create(name="Trà hoa quả đặc biệt", description="Special fruit tea", price=50000, menu=menu_drink, image="menu_item_images/tra-hoa-qua-dac-biet.png")
            menu_item_tra_kiwi_hoa_com_chay = MenuItem.objects.create(name="Trà kiwi hoa cơm cháy", description="Kiwi tea", price=50000, menu=menu_drink, image="menu_item_images/tra-kiwi-hoa-com-chay.png")
            menu_item_tra_sua_gao_nho = MenuItem.objects.create(name="Trà sữa gạo nho", description="Milk tea with grape and rice", price=55000, menu=menu_drink, image="menu_item_images/tra-sua-gao-nho.png")
            menu_item_tra_sua_tran_chau = MenuItem.objects.create(name="Trà sữa trân châu", description="Milk tea with pearls", price=55000, menu=menu_drink, image="menu_item_images/tra-sua-tran-chau.png")
            menu_item_tra_vai = MenuItem.objects.create(name="Trà vải", description="Lychee tea", price=45000, menu=menu_drink, image="menu_item_images/tra-vai.png")
           

            
            # Example seeding for Order and OrderItem
            order_k = Order.objects.create(service_type="Dine-In", diner=diner_khanh, status='PENDING', note='Cho em ít hành với ạ', total_price=390000)
            order_item_k_carbonara = OrderItem.objects.create(order=order_k, menu_item=menu_item_carbonara_tteokbokki, quantity=2)
            order_item_k_special = OrderItem.objects.create(order=order_k, menu_item=menu_item_tra_hoa_qua_dac_biet, quantity=1)
            
            order_b = Order.objects.create(service_type="Dine-In", diner=diner_binh, status='PENDING', note='', total_price=280000)
            order_item_b_com_tron = OrderItem.objects.create(order=order_b, menu_item=menu_item_com_tron_bibimbap, quantity=1)
            order_item_b_mien_tron = OrderItem.objects.create(order=order_b, menu_item=menu_item_mien_tron, quantity=1)
            
            order_messi = Order.objects.create(service_type="Dine-In", diner=diner_messi, status='COMPLETED', note='I would like less ice in my drinks', total_price=710000)
            order_item_messi_ram_don = OrderItem.objects.create(order=order_messi, menu_item=menu_item_ram_don, quantity=3)
            order_item_messi_kimbap = OrderItem.objects.create(order=order_messi, menu_item=menu_item_kimbap_xa_xiu, quantity=2)
            order_item_messi_tra = OrderItem.objects.create(order=order_messi, menu_item=menu_item_tra_kiwi_hoa_com_chay, quantity=1)
            
            order_mbappe = Order.objects.create(service_type="Takeout", diner=diner_mbappe, status='COMPLETED', note='Extra spicy, please!', total_price=380000)
            order_item_mbappe_tteokbokki = OrderItem.objects.create(order=order_mbappe, menu_item=menu_item_tteokbokki_cha_ca, quantity=1)
            order_item_mbappe_kimbap = OrderItem.objects.create(order=order_mbappe, menu_item=menu_item_kimbap_bo_bulgogi, quantity=1)
            order_item_mbappe_tra = OrderItem.objects.create(order=order_mbappe, menu_item=menu_item_tra_sua_gao_nho, quantity=2)
            
            # Seeding more example orders
            end_date = datetime(2026, 1, 31, 23, 59, 59)
            start_date = end_date - timedelta(days=365)
            def get_random_datetime():
                while True:
                    dt = start_date + timedelta(seconds=random.randint(0, int((end_date - start_date).total_seconds())))
                    weekday = dt.weekday()
                    if random.random() < ([0.8 if weekday >= 5 else 0.2][0]):  # higher chance on Sat/Sun
                        return make_aware(dt)
            service_types = ['Dine-In'] * 6 + ['Takeout'] * 3 + ['Delivery']
            # Collecting all menu items for random selection
            all_menu_items = [
                menu_item_box_7_3,
                menu_item_box_ga_3_vi,
                menu_item_box_han_1_5,
                menu_item_box_han_1,
                menu_item_box_han_2,
                menu_item_box_han_3,
                menu_item_box_mandu,

                menu_item_carbonara_tteokbokki,
                menu_item_com_ca_ri_thit_cot_let_chien_xu,
                menu_item_com_tron_bibimbap,
                menu_item_mien_tron,
                menu_item_ram_don,
                menu_item_tteokbokki_cha_ca,

                menu_item_kimbap_bo_bulgogi,
                menu_item_kimbap_bo_pho_mai_chay,
                menu_item_kimbap_ca_ngu_cai_vang,
                menu_item_kimbap_chien,
                menu_item_kimbap_ga_gion_cajun,
                menu_item_kimbap_heo_nuong_galbi,
                menu_item_kimbap_pho_mai,
                menu_item_kimbap_suon_bo_bbq,
                menu_item_kimbap_tom_sot_guyumi,
                menu_item_kimbap_xa_xiu,
                menu_item_kimbibi,

                menu_item_tra_cam_buoi_nhiet_doi,
                menu_item_tra_chanh_leo,
                menu_item_tra_dao_cam_xa,
                menu_item_tra_hoa_qua_dac_biet,
                menu_item_tra_kiwi_hoa_com_chay,
                menu_item_tra_sua_gao_nho,
                menu_item_tra_sua_tran_chau,
                menu_item_tra_vai
            ]
            
            list_generated_orders = []
            list_generated_orderitems = []
            list_generated_payments = []
            for _ in range(10_000):
                diner = random.choice([diner_giap, diner_binh, diner_khanh, diner_bao, diner_tu, diner_mbappe, diner_messi])
                service_type = random.choice(service_types)
                status = 'COMPLETED'
                group_size = random.choices([1, 2, 3, 4, 5, 6, 7, 8], weights=[20, 25, 15, 10, 10, 8, 7, 5])[0]
                # Select 1 to 2 items per person in the group
                num_items = random.randint(group_size, group_size * 2)
                selected_items = random.choices(                all_menu_items, k=num_items)
                # Count the quantity of each selected item and calculate total price
                item_counts = {}
                total_price = 0
                for item in selected_items:
                    if item.id in item_counts:
                        item_counts[item.id]['quantity'] += 1
                    else:
                        item_counts[item.id] = {'menu_item': item, 'quantity': 1}
                    total_price += item.price
                    
                # Create the order
                order = Order(
                    service_type=service_type,
                    diner=diner,
                    status=status,
                    total_price=total_price,
                    time_created=get_random_datetime(),
                )
                list_generated_orders.append(order)
                
                # Create the OrderItem objects
                for item_id, item_data in item_counts.items():
                    item = OrderItem(
                        order=order,
                        menu_item=item_data['menu_item'],
                        quantity=item_data['quantity']
                    )
                    list_generated_orderitems.append(item)
                    
                payment = Payment(
                    order=order,
                    method=random.choice(['CASH', 'ONLINE_BANKING']),
                    status='paid'
                )
                list_generated_payments.append(payment)
                
            # Bulk create all generated orders, order items, and payments
            Order.objects.bulk_create(list_generated_orders)
            OrderItem.objects.bulk_create(list_generated_orderitems)
            Payment.objects.bulk_create(list_generated_payments)
                
                
            # Example seeding for Payment
            payment_k = Payment.objects.create(order=order_k, method='CASH', status='unpaid')
            payment_b = Payment.objects.create(order=order_b, method='CASH', status='unpaid')
            payment_messi = Payment.objects.create(order=order_messi, method='ONLINE_BANKING', status='paid')
            payment_mbappe = Payment.objects.create(order=order_mbappe, method='CASH', status='paid')
            
            # Example seeding for Feedback
            feedback_mbappe = Feedback.objects.create(order=order_mbappe, diner=diner_mbappe, rating=5, comment="Great service!")
            feedback_messi = Feedback.objects.create(order=order_messi, diner=diner_messi, rating=4, comment="The food was delicious, but the drinks were too sweet.")
            list_generated_feedbacks = []
            all_diners = [diner_giap, diner_binh, diner_khanh, diner_bao, diner_tu, diner_mbappe, diner_messi]
            for _ in range(1412):
                # Randomly select one of the orders created above (no comment, and the distribution will be [0.1, 0.05, 0.14, 0.31, 0.4]). The time created will be random within the last 365 days. They won't be associated with any order.
                list_generated_feedbacks.append(
                    Feedback(
                        diner=random.choice(all_diners),
                        rating=random.choices([1, 2, 3, 4, 5], weights=[10, 5, 14, 31, 40])[0],
                        comment="",
                        time_created=get_random_datetime()
                    )
                )
            Feedback.objects.bulk_create(list_generated_feedbacks)
            
            self.stdout.write(self.style.SUCCESS('Database seeded successfully.'))
        else:
            self.stdout.write(self.style.SUCCESS('DATABASE_SEEDING is set to False or not given. Skipping seeding...'))