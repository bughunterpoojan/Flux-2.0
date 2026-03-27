import os
import requests
import razorpay
from decimal import Decimal
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models
from django.db.models import F, Sum
from .models import User, Product, Order, OrderItem, Negotiation, Payment, Review, NegotiationMessage
from .serializers import UserSerializer, ProfileUpdateSerializer, RegisterSerializer, ProductSerializer, OrderSerializer, OrderItemSerializer, NegotiationSerializer, PaymentSerializer, ReviewSerializer, NegotiationMessageSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import timedelta
import openai

# Razorpay Client
razorpay_client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = ProfileUpdateSerializer(request.user, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)

class AppyFlowGSTINView(APIView):
    permission_classes = (AllowAny,)
    def get(self, request):
        gstin = request.query_params.get('gstin')
        if not gstin:
            return Response({"error": "GSTIN is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        api_key = os.getenv("APPYFLOW_API_KEY")
        url = f"https://api.appyflow.in/v1/gst/{gstin}?key={api_key}"
        
        try:
            # Mocking or calling the real API
            # For now, a mock response since we don't have a real key yet
            # In production, use: response = requests.get(url)
            # data = response.json()
            mock_data = {
                "taxpayer_name": "Fresh Farms Pvt Ltd",
                "registered_address": "123, Green Valley, Nashik, MH",
                "status": "Active"
            }
            return Response(mock_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FarmerStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        # Total Revenue (Accepted/Shipped/Delivered orders)
        revenue_data = OrderItem.objects.filter(
            product__farmer=user,
            order__status__in=['accepted', 'shipped', 'delivered']
        ).aggregate(total_revenue=Sum(F('quantity') * F('price_at_order'), output_field=models.DecimalField()))
        
        total_revenue = revenue_data['total_revenue'] or 0
        
        # Active Listings
        active_listings = Product.objects.filter(farmer=user).count()
        
        # Pending Orders
        pending_orders = Order.objects.filter(
            items__product__farmer=user,
            status='pending'
        ).distinct().count()
        
        # 7-Day Chart Data
        chart_data = []
        for i in range(6, -1, -1):
            date = timezone.now().date() - timedelta(days=i)
            day_revenue = OrderItem.objects.filter(
                product__farmer=user,
                order__created_at__date=date,
                order__status__in=['accepted', 'shipped', 'delivered']
            ).aggregate(day_revenue=Sum(F('quantity') * F('price_at_order'), output_field=models.DecimalField()))['day_revenue'] or 0
            
            chart_data.append({
                "name": date.strftime('%a'),
                "revenue": float(day_revenue)
            })
            
        return Response({
            "total_revenue": float(total_revenue),
            "active_listings": active_listings,
            "pending_orders": pending_orders,
            "chart_data": chart_data
        })

class OpenAIPriceSuggestionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        product_name = request.data.get('product_name')
        category = request.data.get('category')
        unit = request.data.get('unit', 'kg')
        location = request.data.get('location') or request.user.address or "India"
        
        prompt = (
            f"First, check if the product '{product_name}' naturally and accurately belongs in the '{category}' category. "
            f"If it does NOT (e.g. Tomato is NOT dairy, Chicken is NOT fruit), return ONLY the string 'INVALID_CATEGORY'. "
            f"If it DOES match, provide the current realistic FAIR WHOLESALE price for 1 {unit} of {product_name} in {location}, India. "
            f"The quality is 'Premium Export Grade'. A box typically weighs 5-10kg. "
            f"Return ONLY the numeric digits of the price in INR. No text, no INR."
        )
        
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a specialized agricultural market validator and price analyst. You strictly return 'INVALID_CATEGORY' or a numeric price."},
                    {"role": "user", "content": prompt}
                ]
            )
            suggested_price = response.choices[0].message.content.strip()
            return Response({"suggested_price": suggested_price}, status=status.HTTP_200_OK)
        except Exception as e:
            # Fallback mock price
            return Response({"suggested_price": "50.00", "note": "Showing fallback price due to API error"}, status=status.HTTP_200_OK)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = Product.objects.all().order_by('-created_at')
        mine = self.request.query_params.get('mine')
        
        if mine == 'true' and self.request.user.is_authenticated:
            return queryset.filter(farmer=self.request.user)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(farmer=self.request.user)

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'farmer':
            return Order.objects.filter(items__product__farmer=user).distinct()
        return Order.objects.filter(buyer=user)
    
    def perform_create(self, serializer):
        total_amount = Decimal(self.request.data.get('total_amount', 0))
        order = serializer.save(buyer=self.request.user, total_amount=total_amount)
        # Create items
        items_data = self.request.data.get('items', [])
        for item in items_data:
            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                quantity=item['quantity'],
                price_at_order=item['price']
            )

class NegotiationViewSet(viewsets.ModelViewSet):
    serializer_class = NegotiationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'farmer':
            return Negotiation.objects.filter(product__farmer=user).order_by('-updated_at')
        return Negotiation.objects.filter(buyer=user).order_by('-updated_at')
    
    def perform_create(self, serializer):
        serializer.save(buyer=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        negotiation = self.get_object()
        if negotiation.status == 'rejected':
            return Response({'error': 'Rejected bids cannot be accepted'}, status=status.HTTP_400_BAD_REQUEST)
        negotiation.status = 'accepted'
        negotiation.save()
        return Response({'status': 'negotiation accepted'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        negotiation = self.get_object()
        negotiation.status = 'rejected'
        negotiation.save()
        return Response({'status': 'negotiation rejected'})

    @action(detail=True, methods=['post'])
    def counter(self, request, pk=None):
        negotiation = self.get_object()
        if negotiation.status == 'rejected':
            return Response({'error': 'Rejected bids cannot be countered'}, status=status.HTTP_400_BAD_REQUEST)
        counter_price = request.data.get('counter_price')
        counter_message = request.data.get('message')
        if not counter_price:
            return Response({'error': 'counter_price is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        negotiation.farmer_counter_price = counter_price
        if counter_message is not None:
            negotiation.message = counter_message
        negotiation.status = 'countered'
        negotiation.save()
        return Response({'status': 'counter offer sent'})

class NegotiationMessageViewSet(viewsets.ModelViewSet):
    serializer_class = NegotiationMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        negotiation_id = self.request.query_params.get('negotiation_id')
        if not negotiation_id:
            return NegotiationMessage.objects.none()
        
        # Ensure user is either the buyer or the farmer of the product
        negotiation = Negotiation.objects.get(id=negotiation_id)
        if negotiation.buyer != self.request.user and negotiation.product.farmer != self.request.user:
            return NegotiationMessage.objects.none()
            
        return NegotiationMessage.objects.filter(negotiation_id=negotiation_id)

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

def calculate_distance(lat1, lon1, lat2, lon2):
    import math
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2) * math.sin(dLat / 2) + \
        math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * \
        math.sin(dLon / 2) * math.sin(dLon / 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

class AILogisticsFeeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        items = request.data.get('items', [])
        buyer = request.user
        
        if not items:
            return Response({"error": "Cart is empty"}, status=400)
            
        max_dist = 0
        total_weight = 0
        subtotal = 0
        product_names = []
        
        for item in items:
            product = Product.objects.get(id=item['id'])
            dist = calculate_distance(
                product.location_lat or 0, product.location_lng or 0,
                buyer.location_lat or 0, buyer.location_lng or 0
            )
            max_dist = max(max_dist, dist)
            qty = float(item['quantity'])
            total_weight += qty
            subtotal += float(product.price) * qty
            product_names.append(product.name)
            
        # Determine optimal logistics type based on weight
        # < 5kg is a Parcel, > 5kg is a dedicated/shared vehicle
        is_parcel = total_weight <= 5
        vehicle_type = "Shared Parcel/Courier" if is_parcel else "Small Bike" if total_weight <= 20 else "Tata Ace (Small LCV)"
        
        prompt = (
            f"As a professional Indian logistics estimator, provide a FAIR transport fee. "
            f"Order Details: Subtotal: ₹{subtotal}, Total Weight: {total_weight} units, Distance: {max_dist:.1f} km, Items: {', '.join(product_names)}. "
            f"Logistics Type: {vehicle_type}. "
            f"{'IMPORTANT: This is a small parcel. Use standard Indian courier/speed post rates (e.g. ₹50-100 base + ₹2-5 per km).' if is_parcel else 'Use agricultural transport rates for a dedicated small vehicle (₹10-15 per km).'}"
            f"Respond ONLY with the final numeric value (digits). No text, no currency symbols."
        )
        
        try:
            client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional logistics cost estimator for Indian farm-to-market trade. You return only numeric values."},
                    {"role": "user", "content": prompt}
                ]
            )
            fee = float(response.choices[0].message.content.strip())
            
            # Sanity check: 
            # 1. Parcel cap (Small orders under 200km shouldn't cost more than ₹500-800)
            # 2. Relative cap: Logistics shouldn't exceed 40% of subtotal for standard distances (<200km)
            if max_dist < 200:
                if is_parcel:
                    fee = min(fee, max(250, max_dist * 5)) # Cap at ₹5/km for parcels
                
                # Global cap for small orders to prevent "shipping doubling the price"
                if subtotal < 5000:
                    fee = min(fee, subtotal * 0.4) # Max 40% of subtotal
            
            # Ensure a minimum fee of ₹150 for any distance
            fee = max(150, round(fee, 2))
                
            return Response({
                "suggested_fee": fee,
                "distance_km": round(max_dist, 1),
                "vehicle": vehicle_type,
                "is_parcel": is_parcel
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Fallback formula: ₹10 per km for parcels, ₹15 for vehicles
            rate = 6 if is_parcel else 12
            fallback_fee = round((max_dist * rate) + 150, 2)
            return Response({
                "suggested_fee": fallback_fee, 
                "distance_km": round(max_dist, 1),
                "vehicle": vehicle_type,
                "note": "AI unavailable, using standard transport rates"
            }, status=status.HTTP_200_OK)

class RazorpayPaymentView(APIView):
    def post(self, request):
        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id)
        
        amount = int(order.total_amount * 100) # amount in paise
        
        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"order_rcpt_{order.id}",
            "payment_capture": 1
        }
        
        try:
            razorpay_order = razorpay_client.order.create(data=data)
            Payment.objects.create(
                order=order,
                razorpay_order_id=razorpay_order['id'],
                status='created'
            )
            # Add key_id to the response for the frontend
            razorpay_order['key_id'] = os.getenv("RAZORPAY_KEY_ID")
            return Response(razorpay_order, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        # Verification
        razorpay_order_id = request.data.get('razorpay_order_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        try:
            razorpay_client.utility.verify_payment_signature(params_dict)
            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            return Response({"status": "Payment verified"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"status": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)
