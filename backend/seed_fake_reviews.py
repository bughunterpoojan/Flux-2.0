import os
import random
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Product, Order, OrderItem, Review


def ensure_seed_users_and_products():
    farmer, _ = User.objects.get_or_create(
        username='nashik_farmer',
        defaults={
            'email': 'farmer@nashik.com',
            'role': 'farmer',
            'business_name': 'Sahyadri Agri Farms',
            'address': 'Dindori Road, Nashik, Maharashtra 422004',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'is_verified': True,
        },
    )
    if not farmer.check_password('farmer123'):
        farmer.set_password('farmer123')
        farmer.save(update_fields=['password'])

    buyer, _ = User.objects.get_or_create(
        username='vashi_buyer',
        defaults={
            'email': 'buyer@vashi.com',
            'role': 'buyer',
            'business_name': 'Vashi Wholesale Exports',
            'address': 'APMC Market, Sector 19, Vashi, Navi Mumbai 400703',
            'location_lat': 19.0745,
            'location_lng': 72.9978,
            'is_verified': True,
        },
    )
    if not buyer.check_password('buyer123'):
        buyer.set_password('buyer123')
        buyer.save(update_fields=['password'])

    default_products = [
        {
            'name': 'Premium Alphonso Mangoes',
            'category': 'fruits',
            'price': Decimal('1200.00'),
            'stock': 50,
            'unit': 'dozen',
            'description': 'Hand-picked export quality Alphonso mangoes from Maharashtra.',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'address': 'Dindori Road, Nashik, Maharashtra',
        },
        {
            'name': 'Red Onions (Nashik Quality)',
            'category': 'vegetables',
            'price': Decimal('25.00'),
            'stock': 1000,
            'unit': 'kg',
            'description': 'Grade A red onions suitable for wholesale buyers.',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'address': 'Dindori Road, Nashik, Maharashtra',
        },
    ]

    products = []
    for data in default_products:
        product, _ = Product.objects.get_or_create(
            farmer=farmer,
            name=data['name'],
            defaults=data,
        )
        products.append(product)

    return farmer, buyer, products


def seed_delivered_orders_and_reviews():
    farmer, buyer, products = ensure_seed_users_and_products()

    review_texts = [
        'Fresh quality and timely coordination. Packaging was clean and secure.',
        'Good produce and cooperative farmer. Delivery communication was clear.',
        'Quality matched expectations and the farmer was very responsive.',
    ]

    created_orders = 0
    upserted_reviews = 0

    for idx, product in enumerate(products):
        quantity = Decimal(str(5 + idx * 3))
        price = Decimal(str(product.price))
        delivery_fee = Decimal('180.00')
        total = (quantity * price) + delivery_fee

        order = Order.objects.create(
            buyer=buyer,
            status='delivered',
            total_amount=total,
            delivery_fee=delivery_fee,
            initial_delivery_fee=delivery_fee,
            distance_km=165,
            logistics_plan='shared_cluster',
            delivery_slot='10:00-12:00',
            additional_shipping_fee=Decimal('0.00'),
            additional_shipping_paid=True,
        )
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=float(quantity),
            price_at_order=price,
        )
        created_orders += 1

        review, created = Review.objects.update_or_create(
            user=buyer,
            product=product,
            defaults={
                'rating': random.choice([4, 5]),
                'comment': review_texts[idx % len(review_texts)],
            },
        )
        upserted_reviews += 1

    print('Fake review demo data ready.')
    print(f'Farmer login: nashik_farmer / farmer123')
    print(f'Buyer login:  vashi_buyer / buyer123')
    print(f'Orders created: {created_orders}')
    print(f'Reviews upserted: {upserted_reviews}')


if __name__ == '__main__':
    seed_delivered_orders_and_reviews()
