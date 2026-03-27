import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, Product

def create_users():
    # Create Farmer
    farmer, created = User.objects.get_or_create(
        username='nashik_farmer',
        defaults={
            'email': 'farmer@nashik.com',
            'role': 'farmer',
            'business_name': 'Sahyadri Agri Farms',
            'address': 'Dindori Road, Nashik, Maharashtra 422004',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'is_verified': True
        }
    )
    if created:
        farmer.set_password('farmer123')
        farmer.save()
        print("Farmer 'nashik_farmer' created.")
    else:
        print("Farmer 'nashik_farmer' already exists.")

    # Create Buyer
    buyer, created = User.objects.get_or_create(
        username='vashi_buyer',
        defaults={
            'email': 'buyer@vashi.com',
            'role': 'buyer',
            'business_name': 'Vashi Wholesale Exports',
            'address': 'APMC Market, Sector 19, Vashi, Navi Mumbai 400703',
            'location_lat': 19.0745,
            'location_lng': 72.9978,
            'is_verified': True
        }
    )
    if created:
        buyer.set_password('buyer123')
        buyer.save()
        print("Buyer 'vashi_buyer' created.")
    else:
        print("Buyer 'vashi_buyer' already exists.")

    # Add some products for the farmer
    Product.objects.get_or_create(
        name='Premium Alphonso Mangoes',
        farmer=farmer,
        defaults={
            'category': 'fruits',
            'price': 1200,
            'stock': 50,
            'unit': 'dozen',
            'description': 'Hand-picked export quality Alphonso mangoes from the heart of Maharashtra.',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'address': 'Dindori Road, Nashik, Maharashtra'
        }
    )
    
    Product.objects.get_or_create(
        name='Red Onions (Nashik Quality)',
        farmer=farmer,
        defaults={
            'category': 'vegetables',
            'price': 25,
            'stock': 1000,
            'unit': 'kg',
            'description': 'Grade A Red Onions directly from Nashik farms. Ideal for wholesale.',
            'location_lat': 19.9975,
            'location_lng': 73.7898,
            'address': 'Dindori Road, Nashik, Maharashtra'
        }
    )
    print("Test products added for Nashik Farmer.")

if __name__ == "__main__":
    create_users()
