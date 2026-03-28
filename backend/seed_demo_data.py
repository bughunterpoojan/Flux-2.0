import os
from decimal import Decimal

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from api.models import (
    Negotiation,
    NegotiationMessage,
    Order,
    OrderItem,
    Product,
    Review,
    User,
)


def upsert_user(username, password, **defaults):
    user, created = User.objects.get_or_create(username=username, defaults=defaults)
    changed = False

    for key, value in defaults.items():
        if getattr(user, key) != value:
            setattr(user, key, value)
            changed = True

    if created or not user.check_password(password):
        user.set_password(password)
        changed = True

    if changed:
        user.save()

    return user


def upsert_product(farmer, name, **defaults):
    product, created = Product.objects.get_or_create(farmer=farmer, name=name, defaults=defaults)
    if created:
        return product

    changed = False
    for key, value in defaults.items():
        if getattr(product, key) != value:
            setattr(product, key, value)
            changed = True

    if changed:
        product.save()
    return product


def create_order(buyer, items, status='pending', delivery_fee=Decimal('180.00'), distance_km=0.0,
                 logistics_plan=None, delivery_slot=None, additional_shipping_fee=Decimal('0.00'),
                 additional_shipping_paid=False, pod_code=None, pod_verified=False):
    subtotal = Decimal('0.00')
    normalized_items = []

    for item in items:
        product = item['product']
        qty = Decimal(str(item['quantity']))
        price = Decimal(str(item.get('price_at_order', product.price)))
        subtotal += qty * price
        normalized_items.append((product, float(qty), price))

    total_amount = subtotal + Decimal(str(delivery_fee)) + Decimal(str(additional_shipping_fee))

    order = Order.objects.create(
        buyer=buyer,
        status=status,
        total_amount=total_amount,
        delivery_fee=Decimal(str(delivery_fee)) + Decimal(str(additional_shipping_fee)),
        initial_delivery_fee=Decimal(str(delivery_fee)),
        additional_shipping_fee=Decimal(str(additional_shipping_fee)),
        additional_shipping_paid=additional_shipping_paid,
        logistics_plan=logistics_plan,
        delivery_slot=delivery_slot,
        distance_km=distance_km,
        pod_code_hash=make_password(pod_code) if pod_code else None,
        pod_verified_at=timezone.now() if pod_verified else None,
    )

    for product, qty, price in normalized_items:
        OrderItem.objects.create(order=order, product=product, quantity=qty, price_at_order=price)

    return order


def seed_demo_data():
    # Users
    nashik_farmer = upsert_user(
        'nashik_farmer',
        'farmer123',
        email='farmer@nashik.com',
        role='farmer',
        business_name='Sahyadri Agri Farms',
        address='Dindori Road, Nashik, Maharashtra 422004',
        location_lat=19.9975,
        location_lng=73.7898,
        is_verified=True,
    )

    pune_farmer = upsert_user(
        'pune_farmer',
        'farmer123',
        email='farmer@pune.com',
        role='farmer',
        business_name='Deccan Fresh Collective',
        address='Market Yard, Gultekdi, Pune, Maharashtra 411037',
        location_lat=18.4966,
        location_lng=73.9237,
        is_verified=True,
    )

    surat_farmer = upsert_user(
        'surat_farmer',
        'farmer123',
        email='farmer@surat.com',
        role='farmer',
        business_name='Tapti Agro Growers',
        address='Surat APMC, Sardar Market, Surat, Gujarat 395002',
        location_lat=21.1702,
        location_lng=72.8311,
        is_verified=True,
    )

    vashi_buyer = upsert_user(
        'vashi_buyer',
        'buyer123',
        email='buyer@vashi.com',
        role='buyer',
        business_name='Vashi Wholesale Exports',
        address='APMC Market, Sector 19, Vashi, Navi Mumbai 400703',
        location_lat=19.0745,
        location_lng=72.9978,
        is_verified=True,
    )

    mumbai_buyer = upsert_user(
        'mumbai_retail',
        'buyer123',
        email='retail@mumbai.com',
        role='buyer',
        business_name='Mumbai Retail Foods',
        address='Dadar Market, Mumbai, Maharashtra 400014',
        location_lat=19.0176,
        location_lng=72.8562,
        is_verified=True,
    )

    bangalore_buyer = upsert_user(
        'blr_wholesale',
        'buyer123',
        email='buyer@blr.com',
        role='buyer',
        business_name='Bangalore Fresh Chain',
        address='Yeshwanthpur APMC Yard, Bengaluru, Karnataka 560022',
        location_lat=13.0285,
        location_lng=77.5547,
        is_verified=True,
    )

    # Products
    products = {}
    product_specs = [
        (nashik_farmer, 'Premium Alphonso Mangoes', dict(category='fruits', price=Decimal('1200.00'), stock=45, unit='dozen', description='Export-grade Alphonso mangoes, hand-picked and naturally ripened.', address='Nashik, Maharashtra', location_lat=19.9975, location_lng=73.7898)),
        (nashik_farmer, 'Red Onions (Nashik Quality)', dict(category='vegetables', price=Decimal('29.00'), stock=1400, unit='kg', description='High-shelf-life red onions ideal for bulk trade.', address='Nashik, Maharashtra', location_lat=19.9975, location_lng=73.7898)),
        (nashik_farmer, 'Green Grapes (Seedless)', dict(category='fruits', price=Decimal('82.00'), stock=600, unit='kg', description='Fresh seedless grapes with premium sweetness.', address='Niphad, Nashik', location_lat=20.0833, location_lng=73.8000)),
        (nashik_farmer, 'Organic Tomatoes', dict(category='organic', price=Decimal('52.00'), stock=520, unit='kg', description='Naturally grown tomatoes with no synthetic pesticides.', address='Nashik Rural', location_lat=19.9200, location_lng=73.7800)),
        (pune_farmer, 'Basmati Rice (Premium)', dict(category='grains', price=Decimal('95.00'), stock=2000, unit='kg', description='Long-grain aromatic basmati for hotels and bulk kitchens.', address='Pune Market Yard', location_lat=18.4966, location_lng=73.9237)),
        (pune_farmer, 'Fresh Cauliflower', dict(category='vegetables', price=Decimal('34.00'), stock=760, unit='kg', description='Uniform florets, farm-fresh cauliflower for wholesale.', address='Pune Peri-Urban', location_lat=18.5600, location_lng=73.9200)),
        (pune_farmer, 'Cow Milk (A2)', dict(category='dairy', price=Decimal('68.00'), stock=300, unit='kg', description='Daily sourced A2 milk in chilled distribution chain.', address='Pune Dairy Belt', location_lat=18.6200, location_lng=73.8500)),
        (pune_farmer, 'Sweet Corn', dict(category='vegetables', price=Decimal('44.00'), stock=880, unit='kg', description='Tender sweet corn with high kernel quality.', address='Pune District', location_lat=18.5100, location_lng=73.8700)),
        (surat_farmer, 'Banana (Robusta)', dict(category='fruits', price=Decimal('38.00'), stock=1200, unit='kg', description='Robusta bananas with consistent ripening and shelf life.', address='Surat Belt, Gujarat', location_lat=21.1702, location_lng=72.8311)),
        (surat_farmer, 'Groundnut (Shelled)', dict(category='grains', price=Decimal('92.00'), stock=1600, unit='kg', description='Clean, shelled groundnut for food processing and snack units.', address='Surat Rural, Gujarat', location_lat=21.2500, location_lng=72.9000)),
        (surat_farmer, 'Spinach Bunch', dict(category='vegetables', price=Decimal('22.00'), stock=900, unit='bunch', description='Fresh green spinach bunches harvested early morning.', address='Olpad, Surat', location_lat=21.3350, location_lng=72.7515)),
        (pune_farmer, 'Organic Turmeric', dict(category='organic', price=Decimal('110.00'), stock=540, unit='kg', description='High-curcumin organically cultivated turmeric fingers.', address='Baramati, Pune', location_lat=18.1510, location_lng=74.5770)),
    ]

    for farmer, name, data in product_specs:
        products[name] = upsert_product(farmer, name, **data)

    # Orders covering all key workflow states
    order_a = create_order(
        buyer=vashi_buyer,
        items=[
            {'product': products['Red Onions (Nashik Quality)'], 'quantity': 120},
            {'product': products['Organic Tomatoes'], 'quantity': 80},
        ],
        status='pending',
        delivery_fee=Decimal('240.00'),
        distance_km=164.0,
    )

    order_b = create_order(
        buyer=mumbai_buyer,
        items=[
            {'product': products['Basmati Rice (Premium)'], 'quantity': 90},
        ],
        status='accepted',
        delivery_fee=Decimal('190.00'),
        distance_km=154.0,
        logistics_plan='shared_cluster',
        delivery_slot='10:00-12:00',
    )

    order_c = create_order(
        buyer=vashi_buyer,
        items=[
            {'product': products['Premium Alphonso Mangoes'], 'quantity': 18},
        ],
        status='shipped',
        delivery_fee=Decimal('260.00'),
        distance_km=172.0,
        logistics_plan='express_direct',
        delivery_slot='08:00-10:00',
        additional_shipping_fee=Decimal('60.00'),
        additional_shipping_paid=True,
        pod_code='1234',
    )

    order_d = create_order(
        buyer=mumbai_buyer,
        items=[
            {'product': products['Green Grapes (Seedless)'], 'quantity': 70},
            {'product': products['Fresh Cauliflower'], 'quantity': 60},
        ],
        status='delivered',
        delivery_fee=Decimal('220.00'),
        distance_km=158.0,
        logistics_plan='shared_cluster',
        delivery_slot='14:00-16:00',
        pod_verified=True,
    )

    create_order(
        buyer=bangalore_buyer,
        items=[
            {'product': products['Banana (Robusta)'], 'quantity': 200},
            {'product': products['Groundnut (Shelled)'], 'quantity': 110},
        ],
        status='pending',
        delivery_fee=Decimal('320.00'),
        distance_km=980.0,
    )

    create_order(
        buyer=vashi_buyer,
        items=[
            {'product': products['Organic Turmeric'], 'quantity': 65},
            {'product': products['Sweet Corn'], 'quantity': 95},
        ],
        status='accepted',
        delivery_fee=Decimal('210.00'),
        distance_km=142.0,
        logistics_plan='shared_cluster',
        delivery_slot='16:00-18:00',
    )

    create_order(
        buyer=mumbai_buyer,
        items=[
            {'product': products['Cow Milk (A2)'], 'quantity': 85},
        ],
        status='shipped',
        delivery_fee=Decimal('200.00'),
        distance_km=130.0,
        logistics_plan='express_direct',
        delivery_slot='10:00-12:00',
        additional_shipping_fee=Decimal('45.00'),
        additional_shipping_paid=False,
        pod_code='4321',
    )

    create_order(
        buyer=vashi_buyer,
        items=[
            {'product': products['Fresh Cauliflower'], 'quantity': 110},
            {'product': products['Spinach Bunch'], 'quantity': 150},
        ],
        status='delivered',
        delivery_fee=Decimal('240.00'),
        distance_km=226.0,
        logistics_plan='shared_cluster',
        delivery_slot='08:00-10:00',
        pod_verified=True,
    )

    create_order(
        buyer=bangalore_buyer,
        items=[
            {'product': products['Basmati Rice (Premium)'], 'quantity': 180},
        ],
        status='delivered',
        delivery_fee=Decimal('420.00'),
        distance_km=842.0,
        logistics_plan='express_direct',
        delivery_slot='14:00-16:00',
        additional_shipping_fee=Decimal('78.00'),
        additional_shipping_paid=True,
        pod_verified=True,
    )

    create_order(
        buyer=bangalore_buyer,
        items=[
            {'product': products['Green Grapes (Seedless)'], 'quantity': 95},
        ],
        status='cancelled',
        delivery_fee=Decimal('0.00'),
        distance_km=0.0,
    )

    # Negotiations to demo accept/counter/reject flows
    n1 = Negotiation.objects.create(
        buyer=vashi_buyer,
        product=products['Premium Alphonso Mangoes'],
        offered_price=Decimal('1080.00'),
        status='pending',
        message='Looking for a weekly contract. Can you support consistent quality?',
    )

    n2 = Negotiation.objects.create(
        buyer=mumbai_buyer,
        product=products['Red Onions (Nashik Quality)'],
        offered_price=Decimal('24.00'),
        farmer_counter_price=Decimal('27.00'),
        status='countered',
        message='Can close today if transport is included.',
    )

    n3 = Negotiation.objects.create(
        buyer=vashi_buyer,
        product=products['Basmati Rice (Premium)'],
        offered_price=Decimal('89.00'),
        status='accepted',
        message='Need 2-ton monthly cadence.',
    )

    n4 = Negotiation.objects.create(
        buyer=mumbai_buyer,
        product=products['Cow Milk (A2)'],
        offered_price=Decimal('56.00'),
        status='rejected',
        message='Price too high for our margin this week.',
    )

    n5 = Negotiation.objects.create(
        buyer=bangalore_buyer,
        product=products['Organic Turmeric'],
        offered_price=Decimal('101.00'),
        status='pending',
        message='Need 500kg trial lot with standard packing.',
    )

    n6 = Negotiation.objects.create(
        buyer=vashi_buyer,
        product=products['Banana (Robusta)'],
        offered_price=Decimal('34.00'),
        farmer_counter_price=Decimal('36.50'),
        status='countered',
        message='Can confirm 2-day pickup window if quality grade is A.',
    )

    n7 = Negotiation.objects.create(
        buyer=mumbai_buyer,
        product=products['Groundnut (Shelled)'],
        offered_price=Decimal('87.00'),
        status='accepted',
        message='Agreed for monthly schedule and standard moisture level.',
    )

    n8 = Negotiation.objects.create(
        buyer=bangalore_buyer,
        product=products['Spinach Bunch'],
        offered_price=Decimal('18.00'),
        status='rejected',
        message='Offer not feasible for farm harvest and transport cost.',
    )

    NegotiationMessage.objects.create(negotiation=n1, sender=vashi_buyer, text='Can you do 1,000 dozen/month?')
    NegotiationMessage.objects.create(negotiation=n1, sender=nashik_farmer, text='Yes, with 48-hour dispatch and consistent grade.')
    NegotiationMessage.objects.create(negotiation=n2, sender=mumbai_buyer, text='If you include loading, we can proceed.')
    NegotiationMessage.objects.create(negotiation=n2, sender=nashik_farmer, text='Countered at 27 with loading included.')
    NegotiationMessage.objects.create(negotiation=n5, sender=bangalore_buyer, text='Can you maintain moisture certificate per lot?')
    NegotiationMessage.objects.create(negotiation=n5, sender=pune_farmer, text='Yes, lab slip and batch code can be shared before dispatch.')
    NegotiationMessage.objects.create(negotiation=n6, sender=vashi_buyer, text='Need banana lots with controlled ripening profile.')
    NegotiationMessage.objects.create(negotiation=n6, sender=surat_farmer, text='Countered with A-grade sorting and pre-cooling included.')

    # Reviews for delivered experience
    Review.objects.update_or_create(
        user=mumbai_buyer,
        product=products['Green Grapes (Seedless)'],
        defaults={'rating': 5, 'comment': 'Excellent sweetness and packing. Arrived fresh.'},
    )
    Review.objects.update_or_create(
        user=mumbai_buyer,
        product=products['Fresh Cauliflower'],
        defaults={'rating': 4, 'comment': 'Good quality, size was consistent. Will reorder.'},
    )
    Review.objects.update_or_create(
        user=vashi_buyer,
        product=products['Premium Alphonso Mangoes'],
        defaults={'rating': 5, 'comment': 'Top grade mangoes. Strong demand at our outlet.'},
    )
    Review.objects.update_or_create(
        user=vashi_buyer,
        product=products['Fresh Cauliflower'],
        defaults={'rating': 4, 'comment': 'Reliable weekly supply and good shelf life.'},
    )
    Review.objects.update_or_create(
        user=bangalore_buyer,
        product=products['Basmati Rice (Premium)'],
        defaults={'rating': 5, 'comment': 'Excellent grain quality and moisture consistency.'},
    )
    Review.objects.update_or_create(
        user=bangalore_buyer,
        product=products['Banana (Robusta)'],
        defaults={'rating': 4, 'comment': 'Good ripening profile and proper packaging.'},
    )
    Review.objects.update_or_create(
        user=mumbai_buyer,
        product=products['Organic Turmeric'],
        defaults={'rating': 5, 'comment': 'Strong color, aroma, and very clean lot.'},
    )

    print('Demo data created successfully for Agro Sync.')
    print('Login credentials:')
    print('  Farmer 1: nashik_farmer / farmer123')
    print('  Farmer 2: pune_farmer / farmer123')
    print('  Farmer 3: surat_farmer / farmer123')
    print('  Buyer 1 : vashi_buyer / buyer123')
    print('  Buyer 2 : mumbai_retail / buyer123')
    print('  Buyer 3 : blr_wholesale / buyer123')
    print('Created samples:')
    print('  Products   :', Product.objects.count())
    print('  Orders     :', Order.objects.count())
    print('  Bids       :', Negotiation.objects.count())
    print('  Bid Chats  :', NegotiationMessage.objects.count())
    print('  Reviews    :', Review.objects.count())


if __name__ == '__main__':
    seed_demo_data()
