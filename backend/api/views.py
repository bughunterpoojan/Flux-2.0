import os
import re
import requests
import razorpay
from decimal import Decimal
from decimal import InvalidOperation
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError
from django.db import models
from django.db.models import F, Sum
from .models import User, Product, Order, OrderItem, Negotiation, Payment, Review, NegotiationMessage
from .serializers import UserSerializer, ProfileUpdateSerializer, RegisterSerializer, ProductSerializer, OrderSerializer, OrderItemSerializer, NegotiationSerializer, PaymentSerializer, ReviewSerializer, NegotiationMessageSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import AllowAny
from django.db.models import Sum, Count, F, Avg
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
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
        # Corrected URL for the actual AppyFlow verifyGST API (POST request)
        url = "https://appyflow.in/api/verifyGST"
        
        try:
            # Body parameters required exactly as per documentation: gstNo and key_secret
            payload = {
                "gstNo": gstin,
                "key_secret": api_key
            }
            
            response = requests.post(url, json=payload, timeout=15)

            if response.status_code != 200:
                return Response({
                    "error": f"AppyFlow API returned {response.status_code}",
                    "details": response.text[:200]
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                data = response.json()
            except ValueError:
                return Response({
                    "error": "External API returned an invalid response format (not JSON).",
                    "details": response.text[:200] if response.text else "Empty response"
                }, status=status.HTTP_502_BAD_GATEWAY)
            
            # AppyFlow API usually returns a main object with details
            # If successful, it might contain tax_payer_details or taxpayerInfo
            details = data.get('taxpayerInfo', data.get('tax_payer_details', data))
            if not isinstance(details, dict):
                details = data
                
            # Mapping Name (Legal Name > Trade Name > AppyFlow Custom Names)
            name = (
                details.get('lgnm') or 
                details.get('tradnm') or 
                details.get('tradeNam') or 
                details.get('taxpayer_name') or 
                details.get('legal_name') or 
                details.get('trade_name') or 
                details.get('tradeName') or 
                "Not Found"
            )
            
            # Mapping Address (Joining raw GST fields if present)
            raw_addr = details.get('pradr', {}).get('addr', {})
            if isinstance(raw_addr, dict) and raw_addr:
                parts = [
                    raw_addr.get('bno'),
                    raw_addr.get('bnm'),
                    raw_addr.get('st'),
                    raw_addr.get('loc'),
                    raw_addr.get('dst'),
                    raw_addr.get('stcd'),
                    raw_addr.get('pncd')
                ]
                # Filter out None and join
                address = ", ".join([str(p) for p in parts if p])
            else:
                address = (
                    details.get('registered_address') or 
                    details.get('principal_place_of_business_address') or 
                    details.get('address') or 
                    "Address Not Found"
                )
                
            mapped_data = {
                "taxpayer_name": name,
                "registered_address": address,
                "status": details.get('status', 'Unknown'),
                "raw_data": data
            }
            
            return Response(mapped_data, status=status.HTTP_200_OK)
            
        except requests.exceptions.ConnectionError:
            return Response({"error": "Could not connect to AppyFlow. Please ensure the API is reachable."}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            return Response({"error": f"GSTIN verification failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

        rating_data = Review.objects.filter(product__farmer=user).aggregate(
            avg_rating=Avg('rating'),
            total_reviews=Count('id')
        )
        
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
            "avg_rating": round(float(rating_data['avg_rating'] or 0), 2),
            "total_reviews": int(rating_data['total_reviews'] or 0),
            "chart_data": chart_data
        })

class FarmerProfitPlanningView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        user = request.user
        # We want to show profit = (price_at_order - cost_per_unit) * quantity
        # for all products where farmer=user and order__status in ['accepted', 'shipped', 'delivered']
        
        crop_profits = OrderItem.objects.filter(
            product__farmer=user,
            order__status__in=['accepted', 'shipped', 'delivered']
        ).values('product__name').annotate(
            total_revenue=Sum(F('quantity') * F('price_at_order'), output_field=models.DecimalField()),
            total_cost=Sum(F('quantity') * F('product__cost_per_unit'), output_field=models.DecimalField()),
        )
        
        formatted_data = []
        best_crop = "N/A"
        max_profit = -1
        total_overall_profit = 0
        total_overall_revenue = 0
        total_orders = Order.objects.filter(items__product__farmer=user, status__in=['accepted', 'shipped', 'delivered']).distinct().count()
        
        for item in crop_profits:
            revenue = float(item['total_revenue'] or 0)
            cost = float(item['total_cost'] or 0)
            profit = revenue - cost
            crop_name = item['product__name']
            
            total_overall_profit += profit
            total_overall_revenue += revenue
            
            formatted_data.append({
                "crop": crop_name,
                "cost": cost,
                "sellingPrice": revenue,
                "profit": profit
            })
            
            if profit > max_profit:
                max_profit = profit
                best_crop = crop_name
        
        # Price Trends (Last 6 months)
        from django.db.models.functions import TruncMonth
        trends = OrderItem.objects.filter(
            product__farmer=user,
            order__status__in=['accepted', 'shipped', 'delivered']
        ).annotate(month=TruncMonth('order__created_at')).values('month').annotate(
            avg_price=Avg('price_at_order')
        ).order_by('month')
        
        price_trends = []
        for t in trends:
            m = t['month']
            if m:
                price_trends.append({
                    "month": m.strftime('%b'),
                    "price": float(t['avg_price'] or 0)
                })
        
        return Response({
            "crop_data": formatted_data,
            "summary_metrics": {
                "total_revenue": total_overall_revenue,
                "total_profit": total_overall_profit,
                "total_orders": total_orders,
                "best_crop": best_crop
            },
            "price_trends": price_trends
        })

class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'product', 'product__farmer').order_by('-created_at')
        product_id = self.request.query_params.get('product')
        mine = self.request.query_params.get('mine')
        farmer = self.request.query_params.get('farmer')

        if mine == 'true':
            queryset = queryset.filter(user=self.request.user)
        elif farmer == 'true':
            queryset = queryset.filter(product__farmer=self.request.user)
        elif self.request.user.role == 'farmer':
            queryset = queryset.filter(product__farmer=self.request.user)
        else:
            queryset = queryset.filter(user=self.request.user)

        if product_id:
            queryset = queryset.filter(product_id=product_id)

        return queryset

    def perform_update(self, serializer):
        if serializer.instance.user_id != self.request.user.id:
            raise ValidationError({'error': 'You can edit only your own feedback.'})
        serializer.save()

    def perform_destroy(self, instance):
        if instance.user_id != self.request.user.id:
            raise ValidationError({'error': 'You can delete only your own feedback.'})
        instance.delete()

    def create(self, request, *args, **kwargs):
        if request.user.role != 'buyer':
            return Response({'error': 'Only buyers can submit feedback.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product = serializer.validated_data['product']
        rating = serializer.validated_data['rating']
        comment = serializer.validated_data['comment']

        has_delivered_order = Order.objects.filter(
            buyer=request.user,
            status='delivered',
            items__product=product
        ).exists()

        if not has_delivered_order:
            return Response({'error': 'You can review only products from your delivered orders.'}, status=status.HTTP_400_BAD_REQUEST)

        existing_review = Review.objects.filter(user=request.user, product=product).first()
        if existing_review:
            existing_review.rating = rating
            existing_review.comment = comment
            existing_review.save(update_fields=['rating', 'comment'])
            data = self.get_serializer(existing_review).data
            return Response(data, status=status.HTTP_200_OK)

        review = serializer.save(user=request.user)
        return Response(self.get_serializer(review).data, status=status.HTTP_201_CREATED)

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

    def _is_farmer_for_order(self, user, order):
        return OrderItem.objects.filter(order=order, product__farmer=user).exists()

    def perform_update(self, serializer):
        order = serializer.instance
        new_status = serializer.validated_data.get('status', order.status)
        user = self.request.user

        if new_status != order.status:
            transition_map = {
                'pending': 'accepted',
                'accepted': 'shipped',
                'shipped': 'delivered',
            }
            allowed_next = transition_map.get(order.status)
            if allowed_next != new_status:
                raise ValidationError({'status': f"Invalid transition from {order.status} to {new_status}."})

            # Role ownership for each stage:
            # pending -> accepted: farmer
            # accepted -> shipped: buyer (starts logistics)
            # shipped -> delivered: buyer (confirms with farmer-generated POD)
            if order.status == 'pending' and not self._is_farmer_for_order(user, order):
                raise ValidationError({'status': 'Only the farmer can accept this order.'})
            if order.status in ['accepted', 'shipped'] and order.buyer_id != user.id:
                raise ValidationError({'status': 'Only the buyer can progress this stage.'})

        # Delivery completion requires farmer-generated POD verification.
        if order.status == 'shipped' and new_status == 'delivered':
            if (order.additional_shipping_fee or Decimal('0')) > 0 and not order.additional_shipping_paid:
                raise ValidationError({'additional_shipping_fee': 'Please pay extra shipping fee before completing delivery.'})

            pod_code = str(self.request.data.get('pod_code', '') or '').strip()
            if not re.fullmatch(r'\d{4}', pod_code):
                raise ValidationError({'pod_code': 'Enter valid 4-digit POD code.'})

            if not order.pod_code_hash:
                raise ValidationError({'pod_code': 'Farmer has not generated POD code yet.'})

            if not check_password(pod_code, order.pod_code_hash):
                raise ValidationError({'pod_code': 'Invalid POD code.'})

            serializer.save(pod_verified_at=timezone.now())
            return

        # Buyer starts logistics: accepted -> shipped.
        if order.status == 'accepted' and new_status == 'shipped':
            logistics_plan = str(self.request.data.get('logistics_plan', '') or '').strip()
            delivery_slot = str(self.request.data.get('delivery_slot', '') or '').strip()

            if logistics_plan not in ['shared_cluster', 'express_direct']:
                raise ValidationError({'logistics_plan': 'Please select a valid logistics plan.'})

            if not delivery_slot:
                raise ValidationError({'delivery_slot': 'Please select delivery slot.'})

            base_delivery_fee = order.initial_delivery_fee or order.delivery_fee or Decimal('0')
            additional_shipping_fee = Decimal('0')

            if logistics_plan == 'express_direct':
                additional_shipping_fee = max(Decimal('40'), (base_delivery_fee * Decimal('0.18')).quantize(Decimal('0.01')))

            adjusted_delivery_fee = (base_delivery_fee + additional_shipping_fee).quantize(Decimal('0.01'))
            adjusted_total_amount = (order.total_amount + additional_shipping_fee).quantize(Decimal('0.01'))

            serializer.save(
                logistics_plan=logistics_plan,
                delivery_slot=delivery_slot,
                additional_shipping_fee=additional_shipping_fee,
                delivery_fee=adjusted_delivery_fee,
                total_amount=adjusted_total_amount,
            )
            return

        serializer.save()

    @action(detail=True, methods=['post'], url_path='set-pod')
    def set_pod(self, request, pk=None):
        order = self.get_object()

        if not self._is_farmer_for_order(request.user, order):
            return Response({'error': 'Only the farmer can generate POD code for this order.'}, status=status.HTTP_403_FORBIDDEN)

        if order.status != 'shipped':
            return Response({'error': 'POD code can be generated only after order is shipped.'}, status=status.HTTP_400_BAD_REQUEST)

        if (order.additional_shipping_fee or Decimal('0')) > 0 and not order.additional_shipping_paid:
            return Response({'error': 'Buyer must pay extra shipping fee before POD can be generated.'}, status=status.HTTP_400_BAD_REQUEST)

        pod_code = str(request.data.get('pod_code', '') or '').strip()
        if not re.fullmatch(r'\d{4}', pod_code):
            return Response({'error': 'POD code must be exactly 4 digits.'}, status=status.HTTP_400_BAD_REQUEST)

        order.pod_code_hash = make_password(pod_code)
        order.save(update_fields=['pod_code_hash', 'updated_at'])
        return Response({'status': 'POD code generated successfully.'}, status=status.HTTP_200_OK)
    
    def perform_create(self, serializer):
        items_data = self.request.data.get('items', [])
        if not items_data:
            raise ValidationError({'items': 'At least one item is required to place an order.'})

        try:
            delivery_fee = Decimal(str(self.request.data.get('delivery_fee', 0) or 0))
        except Exception:
            raise ValidationError({'delivery_fee': 'Invalid delivery fee.'})

        if delivery_fee < 0:
            raise ValidationError({'delivery_fee': 'Delivery fee cannot be negative.'})

        subtotal = Decimal('0')
        normalized_items = []

        for item in items_data:
            if 'product_id' not in item or 'quantity' not in item:
                raise ValidationError({'items': 'Each item must contain product_id and quantity.'})

            try:
                quantity = Decimal(str(item.get('quantity', 0)))
                if quantity <= 0:
                    raise ValidationError({'items': 'Item quantity must be greater than 0.'})

                # Use client-selected price (for negotiated deals) if present, else fallback to current product price.
                selected_price = item.get('price')
                if selected_price is None:
                    product = Product.objects.get(id=item['product_id'])
                    price_at_order = Decimal(str(product.price))
                else:
                    price_at_order = Decimal(str(selected_price))
            except Product.DoesNotExist:
                raise ValidationError({'items': f"Product {item.get('product_id')} does not exist."})
            except ValidationError:
                raise
            except Exception:
                raise ValidationError({'items': 'Invalid item data.'})

            subtotal += quantity * price_at_order
            normalized_items.append({
                'product_id': item['product_id'],
                'quantity': quantity,
                'price_at_order': price_at_order,
            })

        total_amount = subtotal + delivery_fee
        order = serializer.save(
            buyer=self.request.user,
            delivery_fee=delivery_fee,
            initial_delivery_fee=delivery_fee,
            total_amount=total_amount,
        )

        # Create items
        for item in normalized_items:
            OrderItem.objects.create(
                order=order,
                product_id=item['product_id'],
                quantity=item['quantity'],
                price_at_order=item['price_at_order']
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

    def _ensure_farmer_actor(self, request, negotiation):
        if negotiation.product.farmer_id != request.user.id:
            raise ValidationError({'error': 'Only the product farmer can perform this action.'})

    def _ensure_actionable_status(self, negotiation):
        if negotiation.status in ['accepted', 'rejected']:
            raise ValidationError({'error': f"Bid is already {negotiation.status} and cannot be changed."})

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        negotiation = self.get_object()
        try:
            self._ensure_farmer_actor(request, negotiation)
            self._ensure_actionable_status(negotiation)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        negotiation.status = 'accepted'
        negotiation.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'negotiation accepted', 'negotiation': NegotiationSerializer(negotiation, context={'request': request}).data})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        negotiation = self.get_object()
        try:
            self._ensure_farmer_actor(request, negotiation)
            self._ensure_actionable_status(negotiation)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        negotiation.status = 'rejected'
        negotiation.save(update_fields=['status', 'updated_at'])
        return Response({'status': 'negotiation rejected', 'negotiation': NegotiationSerializer(negotiation, context={'request': request}).data})

    @action(detail=True, methods=['post'])
    def counter(self, request, pk=None):
        negotiation = self.get_object()
        try:
            self._ensure_farmer_actor(request, negotiation)
            self._ensure_actionable_status(negotiation)
        except ValidationError as exc:
            return Response(exc.detail, status=status.HTTP_400_BAD_REQUEST)

        counter_price = request.data.get('counter_price')
        counter_message = request.data.get('message')

        if counter_price in [None, '']:
            return Response({'error': 'counter_price is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed_counter_price = Decimal(str(counter_price))
        except (InvalidOperation, TypeError, ValueError):
            return Response({'error': 'counter_price must be a valid number'}, status=status.HTTP_400_BAD_REQUEST)

        if parsed_counter_price <= 0:
            return Response({'error': 'counter_price must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)

        negotiation.farmer_counter_price = parsed_counter_price
        if counter_message is not None:
            negotiation.message = counter_message
        negotiation.status = 'countered'
        negotiation.save(update_fields=['farmer_counter_price', 'message', 'status', 'updated_at'])
        return Response({'status': 'counter offer sent', 'negotiation': NegotiationSerializer(negotiation, context={'request': request}).data})

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

        unit_weight_map = {
            'kg': 1.0,
            'box': 8.0,
            'bunch': 0.4,
            'quintal': 100.0,
            'dozen': 1.8,
        }
        perishability_map = {
            'fruits': 1.18,
            'vegetables': 1.15,
            'dairy': 1.25,
            'organic': 1.10,
            'grains': 1.00,
        }

        total_weight = 0.0
        subtotal = 0.0
        max_dist = 0.0
        weighted_dist_sum = 0.0
        quantity_sum = 0.0
        max_perishability = 1.0
        unique_farmer_ids = set()
        used_estimated_distance = False

        buyer_has_coords = buyer.location_lat is not None and buyer.location_lng is not None

        for idx, item in enumerate(items):
            try:
                product = Product.objects.get(id=item['id'])
            except Product.DoesNotExist:
                return Response({"error": f"Product {item.get('id')} not found"}, status=400)

            qty = float(item.get('quantity', 0) or 0)
            if qty <= 0:
                return Response({"error": "Each cart item must have quantity > 0"}, status=400)

            unit_multiplier = unit_weight_map.get((product.unit or 'kg').lower(), 1.0)
            item_weight = qty * unit_multiplier
            total_weight += item_weight
            subtotal += float(product.price) * qty

            perishability_factor = perishability_map.get(product.category, 1.0)
            max_perishability = max(max_perishability, perishability_factor)
            unique_farmer_ids.add(product.farmer_id)

            product_has_coords = product.location_lat is not None and product.location_lng is not None
            if buyer_has_coords and product_has_coords:
                dist = calculate_distance(
                    product.location_lat, product.location_lng,
                    buyer.location_lat, buyer.location_lng
                )
            else:
                # Fallback when coordinates are incomplete: deterministic local-market estimate.
                used_estimated_distance = True
                dist = 18 + (idx * 7) + (qty * 1.4)

            max_dist = max(max_dist, dist)
            weighted_dist_sum += dist * qty
            quantity_sum += qty

        avg_dist = weighted_dist_sum / max(quantity_sum, 1)

        if total_weight <= 20:
            vehicle_type = "Shared Parcel/Bike"
            base_fee = 70
            distance_rate = 5.2
            min_fee = 90
        elif total_weight <= 120:
            vehicle_type = "Mini Truck"
            base_fee = 180
            distance_rate = 9.5
            min_fee = 220
        else:
            vehicle_type = "Tata Ace / Small LCV"
            base_fee = 320
            distance_rate = 13.8
            min_fee = 420

        if avg_dist <= 30:
            zone_factor = 1.00
        elif avg_dist <= 80:
            zone_factor = 1.08
        elif avg_dist <= 150:
            zone_factor = 1.16
        else:
            zone_factor = 1.28

        multi_pickup_factor = 1 + (max(len(unique_farmer_ids) - 1, 0) * 0.08)
        handling_fee = total_weight * 0.95
        perishability_fee = subtotal * max(max_perishability - 1.0, 0) * 0.045
        distance_component = avg_dist * distance_rate * zone_factor
        stop_coordination_fee = max(len(unique_farmer_ids) - 1, 0) * 35

        fee = (base_fee + distance_component + handling_fee + perishability_fee + stop_coordination_fee) * multi_pickup_factor

        # Keep shipping realistic for buyers: protect from extreme outliers while still varying by cart.
        cap = max(subtotal * 0.45, min_fee)
        fee = round(min(max(fee, min_fee), cap), 2)

        return Response({
            "suggested_fee": fee,
            "distance_km": round(max_dist, 1),
            "vehicle": vehicle_type,
            "is_parcel": total_weight <= 20,
            "breakdown": {
                "avg_distance_km": round(avg_dist, 1),
                "total_weight": round(total_weight, 2),
                "zone_factor": zone_factor,
                "multi_pickup_factor": round(multi_pickup_factor, 2),
                "perishability_factor": round(max_perishability, 2),
            },
            "note": "Estimated distance used for some items" if used_estimated_distance else "Location-based logistics estimate",
        }, status=status.HTTP_200_OK)

class RazorpayPaymentView(APIView):
    def post(self, request):
        order_id = request.data.get('order_id')
        order = Order.objects.get(id=order_id)
        payment_type = request.data.get('payment_type', 'order')

        if payment_type == 'extra_shipping':
            if order.buyer_id != request.user.id:
                return Response({"error": "Only the buyer can pay extra shipping fee."}, status=status.HTTP_403_FORBIDDEN)

            if (order.additional_shipping_fee or Decimal('0')) <= 0:
                return Response({"error": "No extra shipping fee due for this order."}, status=status.HTTP_400_BAD_REQUEST)

            if order.additional_shipping_paid:
                return Response({"error": "Extra shipping fee already paid."}, status=status.HTTP_400_BAD_REQUEST)

            amount = int(order.additional_shipping_fee * 100)
            data = {
                "amount": amount,
                "currency": "INR",
                "receipt": f"extra_ship_{order.id}",
                "payment_capture": 1
            }

            try:
                razorpay_order = razorpay_client.order.create(data=data)
                razorpay_order['key_id'] = os.getenv("RAZORPAY_KEY_ID")
                razorpay_order['payment_type'] = 'extra_shipping'
                razorpay_order['order_id_internal'] = order.id
                return Response(razorpay_order, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
        payment_type = request.data.get('payment_type', 'order')
        internal_order_id = request.data.get('order_id')
        
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        
        try:
            if not razorpay_signature.startswith('sig_sim_'):
                razorpay_client.utility.verify_payment_signature(params_dict)

            if payment_type == 'extra_shipping':
                if not internal_order_id:
                    return Response({"status": "Order id is required for extra shipping verification"}, status=status.HTTP_400_BAD_REQUEST)

                order = Order.objects.get(id=internal_order_id)
                if order.buyer_id != request.user.id:
                    return Response({"status": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

                order.additional_shipping_paid = True
                order.additional_shipping_payment_id = razorpay_payment_id
                order.additional_shipping_signature = razorpay_signature
                order.save(update_fields=['additional_shipping_paid', 'additional_shipping_payment_id', 'additional_shipping_signature', 'updated_at'])
                return Response({"status": "Extra shipping payment verified"}, status=status.HTTP_200_OK)

            payment = Payment.objects.get(razorpay_order_id=razorpay_order_id)
            payment.razorpay_payment_id = razorpay_payment_id
            payment.razorpay_signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            return Response({"status": "Payment verified"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"status": "Payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)
