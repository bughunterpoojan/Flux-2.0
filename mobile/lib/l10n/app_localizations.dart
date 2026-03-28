import 'package:flutter/material.dart';

class AppLocalizations {
  final Locale locale;
  AppLocalizations(this.locale);

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const Map<String, Map<String, String>> _localizedValues = {
    'en': {
      'app_title': 'Agro Sync',
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
      'owner_name': 'Owner Name',
      'owner_name_hint': 'Full legal name of owner',
      'business_verification': 'Business Verification (GSTIN)',
      'enter_gstin': 'Enter 15-digit GSTIN',
      'verify': 'Verify',
      'verifying': 'Verifying...',
      'gstin_verified': 'GSTIN Verified successfully',
      'gstin_error': 'Invalid GSTIN or verification failed',
      'i_am_a': 'I am a...',
      'farmer': 'Farmer (Seller)',
      'buyer': 'Buyer (Store/NGO)',
      'register': 'Register',
      'already_have_account': 'Already have an account? Login',
      'no_account': "Don't have an account? Sign Up",
      'chat_hint': 'Type a message...',
      'send': 'Send',
      'negotiation_chat': 'Negotiation Chat',
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
      'username': 'Username',
      'username_hint': 'Enter your name',
      'email': 'Email',
      'email_hint': 'john@example.com',
      'password': 'Password',
      'password_hint': '••••••••',
      'farm_name': 'Farm Name',
      'farm_name_hint': 'e.g. Green Valley',
      'address': 'Address',
      'address_hint': 'Full address for logistics',
      'welcome_title': 'Welcome to Agro Sync',
      'login_subtitle': 'Login to your farm account',
      'login_now': 'Login Now',
      'registration_success': 'Registration successful! Please login.',
      'registration_failed': 'Registration failed: ',
      'gstin_verification_failed': 'GSTIN verification failed',
      'join_community': 'Join the Agro Sync community',
      'gstin': 'GSTIN',
      'delivery_address': 'Delivery Address',
      'latitude': 'Latitude',
      'longitude': 'Longitude',
      'logistics_delivery': 'Logistics & Delivery',
      'profile_updated': 'Profile updated!',
      'save_changes': 'Save Changes',
      'invalid_credentials': 'Invalid username or password',
      'payment_success': 'Payment Successful! Order placed.',
      'verification_failed': 'Verification Failed: ',
      'payment_failed': 'Payment Failed',
      'external_wallet': 'External Wallet: ',
      'order_setup_failed': 'Order Setup Failed: ',
      'could_not_open_razorpay': 'Could not open Razorpay UI: ',
    },
    'hi': {
      'app_title': 'एग्रो सिंक',
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
      'owner_name': 'मालिक का नाम',
      'owner_name_hint': 'मालिक का पूरा कानूनी नाम',
      'business_verification': 'व्यवसाय सत्यापन (GSTIN)',
      'enter_gstin': '15-अंकीय GSTIN दर्ज करें',
      'verify': 'सत्यापित करें',
      'verifying': 'जाँच हो रही है...',
      'gstin_verified': 'GSTIN सफलतापूर्वक सत्यापित',
      'gstin_error': 'अमान्य GSTIN या सत्यापन विफल',
      'i_am_a': 'मैं एक हूँ...',
      'farmer': 'किसान (विक्रेता)',
      'buyer': 'खरीदार (स्टोर/एनजीओ)',
      'register': 'पंजीकरण करें',
      'already_have_account': 'पहले से ही एक खाता है? लॉगिन करें',
      'no_account': "खाता नहीं है? साइन अप करें",
      'chat_hint': 'एक संदेश टाइप करें...',
      'send': 'भेजें',
      'negotiation_chat': 'बातचीत चैट',
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
      'username': 'उपयोगकर्ता नाम',
      'username_hint': 'अपना नाम दर्ज करें',
      'email': 'ईमेल',
      'email_hint': 'नाम@उदाहरण.कॉम',
      'password': 'पासवर्ड',
      'password_hint': '••••••••',
      'farm_name': 'फार्म का नाम',
      'farm_name_hint': 'जैसे: ग्रीन वैली',
      'address': 'पता',
      'address_hint': 'लॉजिस्टिक्स के लिए पूरा पता',
      'welcome_title': 'Agro Sync में आपका स्वागत है',
      'login_subtitle': 'अपने फार्म खाते में लॉगिन करें',
      'login_now': 'अभी लॉगिन करें',
      'registration_success': 'पंजीकरण सफल! कृपया लॉगिन करें।',
      'registration_failed': 'पंजीकरण विफल: ',
      'gstin_verification_failed': 'GSTIN सत्यापन विफल रहा',
      'join_community': 'Agro Sync समुदाय में शामिल हों',
      'gstin': 'GSTIN',
      'delivery_address': 'वितरण का पता',
      'latitude': 'अक्षांश',
      'longitude': 'देशांतर',
      'logistics_delivery': 'लॉजिस्टिक्स और डिलीवरी',
      'profile_updated': 'प्रोफ़ाइल अपडेट हो गई!',
      'save_changes': 'बदलाव सहेजें',
      'invalid_credentials': 'अमान्य उपयोगकर्ता नाम या पासवर्ड',
      'payment_success': 'भुगतान सफल! आदेश दिया गया।',
      'verification_failed': 'सत्यापन विफल: ',
      'payment_failed': 'भुगतान विफल',
      'external_wallet': 'बाहरी वॉलेट: ',
      'order_setup_failed': 'ऑर्डर सेटअप विफल: ',
      'could_not_open_razorpay': 'रेजरपे यूआई नहीं खुल सका: ',
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
  String get ownerName => translate('owner_name');
  String get ownerNameHint => translate('owner_name_hint');
  String get businessVerification => translate('business_verification');
  String get enterGstin => translate('enter_gstin');
  String get verify => translate('verify');
  String get verifying => translate('verifying');
  String get gstinVerified => translate('gstin_verified');
  String get gstinError => translate('gstin_error');
  String get iAmA => translate('i_am_a');
  String get farmerRole => translate('farmer');
  String get buyerRole => translate('buyer');
  String get register => translate('register');
  String get alreadyHaveAccount => translate('already_have_account');
  String get noAccount => translate('no_account');
  String get chatHint => translate('chat_hint');
  String get send => translate('send');
  String get negotiationChat => translate('negotiation_chat');
  String get username => translate('username');
  String get usernameHint => translate('username_hint');
  String get email => translate('email');
  String get emailHint => translate('email_hint');
  String get password => translate('password');
  String get passwordHint => translate('password_hint');
  String get farmName => translate('farm_name');
  String get farmNameHint => translate('farm_name_hint');
  String get address => translate('address');
  String get addressHint => translate('address_hint');
  String get welcomeTitle => translate('welcome_title');
  String get loginSubtitle => translate('login_subtitle');
  String get loginNow => translate('login_now');
  String get registrationSuccess => translate('registration_success');
  String get registrationFailed => translate('registration_failed');
  String get gstinVerificationFailed => translate('gstin_verification_failed');
  String get joinCommunity => translate('join_community');
  String get gstin => translate('gstin');
  String get deliveryAddress => translate('delivery_address');
  String get latitude => translate('latitude');
  String get longitude => translate('longitude');
  String get logisticsDelivery => translate('logistics_delivery');
  String get profileUpdated => translate('profile_updated');
  String get saveChanges => translate('save_changes');
  String get invalidCredentials => translate('invalid_credentials');
  String get paymentSuccess => translate('payment_success');
  String get verificationFailed => translate('verification_failed');
  String get paymentFailed => translate('payment_failed');
  String get externalWallet => translate('external_wallet');
  String get orderSetupFailed => translate('order_setup_failed');
  String get couldNotOpenRazorpay => translate('could_not_open_razorpay');

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
