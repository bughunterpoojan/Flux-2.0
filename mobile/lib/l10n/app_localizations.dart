import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'app_title': 'Farm-to-Market',
      'welcome': 'Welcome back!',
      'login': 'Login',
      'signup': 'Sign Up',
      'explore': 'Explore',
      'my_orders': 'My Orders',
      'bids': 'Bids',
      'profile': 'Profile',
      'farmer_dashboard': 'Farmer Dashboard',
      'my_crops': 'My Crops',
      'profit': 'Profit',
      'active_bids': 'Active Bids',
      'add_product': 'Add Product',
      'total_revenue': 'Total Revenue',
      'avg_rating': 'Avg Rating',
      'reviews': 'reviews',
      'recent_feedback': 'Recent Buyer Feedback',
      'rate_farmer': 'Rate Farmer',
      'change_language': 'Change Language',
      'logout': 'Logout',
      'crops': 'Crops',
      'mandi_price': 'Mandi Price',
      'status': 'Status',
      'pending': 'Pending',
      'accepted': 'Accepted',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'search_hint': 'Search wholesale fresh produce...',
      'all': 'All',
      'vegetables': 'Vegetables',
      'fruits': 'Fruits',
      'grains': 'Grains',
      'dairy': 'Dairy',
      'organic': 'Organic',
      'buy_now': 'Buy Now',
      'quantity': 'Quantity',
      'subtotal': 'Subtotal',
      'logistics_fee': 'AI Logistics Fee',
      'grand_total': 'Grand Total',
      'confirm_pay': 'Confirm & Pay',
      'calculating': 'Calculating...',
      'active_listings': 'Active Listings',
      'pending_orders': 'Pending Orders',
      'revenue_forecast': 'Revenue Forecast',
      'no_feedback': 'No feedback yet',
      'performance_summary': "Here's your performance summary",
      'on': 'on',
      'order_details': 'Order Details',
      'items_in_order': 'Items in Order',
      'shipping_info': 'Shipping Information',
      'est_distance': 'Estimated Distance',
      'initial_fee': 'Initial Delivery Fee',
      'extra_charge': 'Extra Shipping Charge',
      'total_paid': 'Total Paid',
      'plan_logistics': 'Plan Logistics',
      'confirm_pod': 'Confirm POD',
      'proof_delivery': 'Proof of Delivery',
      'rate_product': 'Rate this Product',
      'submit_review': 'Submit Review',
      'no_orders': 'No orders yet',
      'basket_empty': 'Your basket is empty. Time to stock up!',
      'share_exp': 'Share your experience with this product...',
      'review_submitted': 'Review submitted! Thank you.',
      'pod_instruction': 'Enter the 4-digit POD code shared by the farmer.',
      'cancel': 'Cancel',
      'order_id': 'Order',
      'placed_on': 'Placed On',
      'no_results_found': 'No products found',
      'order_status_update': 'Order marked as',
      'error_prefix': 'Error: ',
      'extra_shipping_fee': 'Extra Shipping Fee',
    },
    'hi': {
      'app_title': 'खेत से बाजार तक',
      'welcome': 'वापस स्वागत है!',
      'login': 'लॉगिन',
      'signup': 'साइन अप',
      'explore': 'खोजें',
      'my_orders': 'मेरे आदेश',
      'bids': 'बोलियां',
      'profile': 'प्रोफ़ाइल',
      'farmer_dashboard': 'किसान डैशबोर्ड',
      'my_crops': 'मेरी फसलें',
      'profit': 'मुनाफ़ा',
      'active_bids': 'सक्रिय बोलियां',
      'add_product': 'उत्पाद जोड़ें',
      'total_revenue': 'कुल आय',
      'avg_rating': 'औसत रेटिंग',
      'reviews': 'समीक्षाएं',
      'recent_feedback': 'हालिया खरीदार प्रतिक्रिया',
      'rate_farmer': 'किसान को रेट करें',
      'change_language': 'भाषा बदलें',
      'logout': 'लॉगआउट',
      'crops': 'फसलें',
      'mandi_price': 'मंडी भाव',
      'status': 'स्थिति',
      'pending': 'लंबित',
      'accepted': 'स्वीकृत',
      'shipped': 'भेजा गया',
      'delivered': 'पहुचा दिया',
      'search_hint': 'थोक ताज़ी उपज खोजें...',
      'all': 'सभी',
      'vegetables': 'सब्जियां',
      'fruits': 'फल',
      'grains': 'अनाज',
      'dairy': 'डेयरी',
      'organic': 'जैविक',
      'buy_now': 'अभी खरीदें',
      'quantity': 'मात्रा',
      'subtotal': 'उप-योग',
      'logistics_fee': 'एआई लॉजिस्टिक्स शुल्क',
      'grand_total': 'कुल योग',
      'confirm_pay': 'पुष्टि करें और भुगतान करें',
      'calculating': 'हिसाब लगाया जा रहा है...',
      'active_listings': 'सक्रिय लिस्टिंग',
      'pending_orders': 'लंबित आदेश',
      'revenue_forecast': 'आय का पूर्वानुमान',
      'no_feedback': 'अभी तक कोई प्रतिक्रिया नहीं',
      'performance_summary': "यहाँ आपका प्रदर्शन सारांश है",
      'on': 'पर',
      'order_details': 'आदेश का विवरण',
      'items_in_order': 'आदेश में आइटम',
      'shipping_info': 'शिपिंग की जानकारी',
      'est_distance': 'अनुमानित दूरी',
      'initial_fee': 'प्रारंभिक वितरण शुल्क',
      'extra_charge': 'अतिरिक्त शिपिंग शुल्क',
      'total_paid': 'कुल भुगतान',
      'plan_logistics': 'लॉजिस्टिक्स की योजना बनाएं',
      'confirm_pod': 'पीओडी की पुष्टि करें',
      'proof_delivery': 'डिलीवरी का प्रमाण',
      'rate_product': 'इस उत्पाद को रेट करें',
      'submit_review': 'समीक्षा जमा करें',
      'no_orders': 'अभी तक कोई आदेश नहीं',
      'basket_empty': 'आपकी टोकरी खाली है। खरीदारी शुरू करें!',
      'share_exp': 'इस उत्पाद के साथ अपना अनुभव साझा करें...',
      'review_submitted': 'समीक्षा सबमिट की गई! धन्यवाद।',
      'pod_instruction': 'किसान द्वारा साझा किया गया 4-अंकीय पीओडी कोड दर्ज करें।',
      'cancel': 'रद्द करें',
      'order_id': 'आदेश संख्या',
      'placed_on': 'दिनांक',
      'no_results_found': 'कोई उत्पाद नहीं मिला',
      'order_status_update': 'ऑर्डर को चिह्नित किया गया',
      'error_prefix': 'त्रुटि: ',
      'extra_shipping_fee': 'अतिरिक्त शिपिंग शुल्क',
    },
  };

  String translate(String key) {
    return _localizedValues[locale.languageCode]?[key] ?? key;
  }

  // Common Getters
  String get appTitle => translate('app_title');
  String get welcome => translate('welcome');
  String get login => translate('login');
  String get signup => translate('signup');
  String get explore => translate('explore');
  String get myOrders => translate('my_orders');
  String get bids => translate('bids');
  String get profile => translate('profile');
  String get farmerDashboard => translate('farmer_dashboard');
  String get myCrops => translate('my_crops');
  String get profit => translate('profit');
  String get activeBids => translate('active_bids');
  String get addProduct => translate('add_product');
  String get totalRevenue => translate('total_revenue');
  String get avgRating => translate('avg_rating');
  String get reviews => translate('reviews');
  String get recentFeedback => translate('recent_feedback');
  String get rateFarmer => translate('rate_farmer');
  String get changeLanguage => translate('change_language');
  String get logout => translate('logout');
  String get crops => translate('crops');
  String get mandiPrice => translate('mandi_price');
  String get status => translate('status');
  String get pending => translate('pending');
  String get accepted => translate('accepted');
  String get shipped => translate('shipped');
  String get delivered => translate('delivered');
  String get searchHint => translate('search_hint');
  String get all => translate('all');
  String get vegetables => translate('vegetables');
  String get fruits => translate('fruits');
  String get grains => translate('grains');
  String get dairy => translate('dairy');
  String get organic => translate('organic');
  String get buyNow => translate('buy_now');
  String get quantity => translate('quantity');
  String get subtotal => translate('subtotal');
  String get logisticsFee => translate('logistics_fee');
  String get grandTotal => translate('grand_total');
  String get confirmPay => translate('confirm_pay');
  String get calculating => translate('calculating');
  String get activeListings => translate('active_listings');
  String get pendingOrders => translate('pending_orders');
  String get revenueForecast => translate('revenue_forecast');
  String get noFeedback => translate('no_feedback');
  String get performanceSummary => translate('performance_summary');
  String get onText => translate('on');
  String get orderDetails => translate('order_details');
  String get itemsInOrder => translate('items_in_order');
  String get shippingInfo => translate('shipping_info');
  String get estDistance => translate('est_distance');
  String get initialFee => translate('initial_fee');
  String get extraCharge => translate('extra_charge');
  String get totalPaid => translate('total_paid');
  String get planLogistics => translate('plan_logistics');
  String get confirmPod => translate('confirm_pod');
  String get proofOfDelivery => translate('proof_delivery');
  String get rateOrder => translate('rate_product');
  String get submitReview => translate('submit_review');
  String get noOrders => translate('no_orders');
  String get basketEmpty => translate('basket_empty');
  String get feedbackPlaceholder => translate('share_exp');
  String get reviewSuccess => translate('review_submitted');
  String get podInstruction => translate('pod_instruction');
  String get orderStatusUpdate => translate('order_status_update');
  String get errorPrefix => translate('error_prefix');
  String get noResultsFound => translate('no_results_found');

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => ['en', 'hi'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) async => AppLocalizations(locale);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
