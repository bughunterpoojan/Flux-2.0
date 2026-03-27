from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, ProfileView, AppyFlowGSTINView, OpenAIPriceSuggestionView,
    FarmerStatsView, AILogisticsFeeView, ProductViewSet, OrderViewSet, NegotiationViewSet, 
    NegotiationMessageViewSet, RazorpayPaymentView
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'negotiations', NegotiationViewSet, basename='negotiation')
router.register(r'negotiation-messages', NegotiationMessageViewSet, basename='negotiation-message')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/profile/', ProfileView.as_view(), name='auth_profile'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('gstin/', AppyFlowGSTINView.as_view(), name='gstin_verify'),
    path('price-suggestion/', OpenAIPriceSuggestionView.as_view(), name='price_suggestion'),
    path('payments/create/', RazorpayPaymentView.as_view(), name='razorpay_create'),
    path('payments/verify/', RazorpayPaymentView.as_view(), name='razorpay_verify'),
    path('farmer/stats/', FarmerStatsView.as_view(), name='farmer_stats'),
    path('logistics/quote/', AILogisticsFeeView.as_view(), name='logistics_quote'),
    path('', include(router.urls)),
]
