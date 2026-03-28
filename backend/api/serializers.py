from rest_framework import serializers
from .models import User, Product, Order, OrderItem, Negotiation, Payment, Review, NegotiationMessage

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'gstin', 'is_verified', 'location_lat', 'location_lng', 'business_name', 'address')

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('email', 'business_name', 'gstin', 'address', 'location_lat', 'location_lng')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'gstin', 'location_lat', 'location_lng', 'business_name', 'address')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'buyer'),
            gstin=validated_data.get('gstin', ''),
            business_name=validated_data.get('business_name', ''),
            address=validated_data.get('address', ''),
            location_lat=validated_data.get('location_lat'),
            location_lng=validated_data.get('location_lng'),
        )
        return user

class ProductSerializer(serializers.ModelSerializer):
    farmer_name = serializers.CharField(source='farmer.username', read_only=True)
    class Meta:
        model = Product
        fields = '__all__'
        read_only_fields = ('farmer',)

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    class Meta:
        model = OrderItem
        fields = '__all__'

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    pod_required = serializers.SerializerMethodField()
    pod_configured = serializers.SerializerMethodField()
    pod_verified = serializers.SerializerMethodField()

    def get_pod_required(self, obj):
        return obj.status == 'shipped' and obj.pod_verified_at is None

    def get_pod_configured(self, obj):
        return bool(obj.pod_code_hash)

    def get_pod_verified(self, obj):
        return obj.pod_verified_at is not None

    class Meta:
        model = Order
        fields = '__all__'
        read_only_fields = (
            'buyer',
            'total_amount',
            'created_at',
            'updated_at',
            'pod_code_hash',
            'pod_verified_at',
            'additional_shipping_paid',
            'additional_shipping_payment_id',
            'additional_shipping_signature',
        )

class NegotiationSerializer(serializers.ModelSerializer):
    buyer_name = serializers.CharField(source='buyer.username', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)
    original_price = serializers.DecimalField(source='product.price', max_digits=10, decimal_places=2, read_only=True)
    unit = serializers.CharField(source='product.unit', read_only=True)
    class Meta:
        model = Negotiation
        fields = '__all__'
        read_only_fields = ('buyer',)

class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    class Meta:
        model = Review
        fields = '__all__'

class NegotiationMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    is_me = serializers.SerializerMethodField()

    class Meta:
        model = NegotiationMessage
        fields = ['id', 'negotiation', 'sender', 'sender_name', 'text', 'created_at', 'is_me']
        read_only_fields = ['sender']

    def get_is_me(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.sender == request.user
        return False
