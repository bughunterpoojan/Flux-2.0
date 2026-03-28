import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/product.dart';
import '../models/user_profile.dart';
import '../l10n/app_localizations.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'dart:math' as math;

class ExploreScreen extends StatefulWidget {
  final Function(Product) onAddToCart;
  final UserProfile? profile;

  const ExploreScreen({super.key, required this.onAddToCart, this.profile});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final ApiService _apiService = ApiService();
  late Razorpay _razorpay;
  late Future<List<Product>> _productsFuture;
  String _searchQuery = '';
  String _selectedCategory = 'all';

  // Temporary storage for order-in-progress to be used in payment callbacks
  Map<String, dynamic>? _lastOrderRes;
  Product? _lastProduct;

  @override
  void initState() {
    super.initState();
    _productsFuture = _loadProducts();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    try {
      showDialog(context: context, barrierDismissible: false, builder: (c) => const Center(child: CircularProgressIndicator()));
      
      await _apiService.verifyPaymentTransaction({
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
        'order_id': _lastOrderRes?['id'],
      });

      if (!mounted) return;
      Navigator.pop(context); // Close loading
      
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful! Order placed.')));
      if (_lastProduct != null) widget.onAddToCart(_lastProduct!);
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Verification Failed: $e')));
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed [${response.code}]: ${response.message}')));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet: ${response.walletName}')));
  }

  final List<String> _categories = ['all', 'vegetables', 'fruits', 'grains', 'dairy', 'organic'];


  Future<List<Product>> _loadProducts() async {
    final data = await _apiService.getProducts();
    return data.map((json) => Product.fromJson(json)).toList();
  }

  double _calculateDistance(double? lat1, double? lon1, double? lat2, double? lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 15.0;
    const r = 6371; // Earth radius in km
    final dLat = (lat2 - lat1) * math.pi / 180;
    final dLon = (lon2 - lon1) * math.pi / 180;
    final a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * math.pi / 180) * math.cos(lat2 * math.pi / 180) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return r * c;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          _buildSearchBar(l10n),
          const SizedBox(height: 25),
          _buildCategoryList(l10n),
          const SizedBox(height: 25),
          Expanded(
            child: FutureBuilder<List<Product>>(
              future: _productsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
                }
                if (snapshot.hasError) {
                  return Center(child: Text('Error: ${snapshot.error}'));
                }

                final products = snapshot.data!.filter((p) {
                  final matchesSearch = p.name.toLowerCase().contains(_searchQuery.toLowerCase());
                  final matchesCat = _selectedCategory == 'all' || p.category.toLowerCase() == _selectedCategory;
                  return matchesSearch && matchesCat;
                }).toList();

                if (products.isEmpty) {
                  return _buildEmptyState(l10n);
                }

                return ListView.builder(
                  padding: const EdgeInsets.only(bottom: 100),
                  itemCount: products.length,
                  itemBuilder: (context, index) {
                    return _buildProductCard(products[index], l10n);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 5)),
        ],
      ),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: InputDecoration(
          icon: const Icon(Icons.search, color: Colors.blueGrey),
          hintText: l10n.translate('search_hint'),
          hintStyle: GoogleFonts.outfit(color: Colors.blueGrey[300], fontWeight: FontWeight.w500),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _buildCategoryList(AppLocalizations l10n) {
    return SizedBox(
      height: 45,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: () => setState(() => _selectedCategory = cat),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFF16A34A) : Colors.white,
                  borderRadius: BorderRadius.circular(15),
                  border: Border.all(color: isSelected ? Colors.transparent : Colors.blueGrey[50]!),
                ),
                alignment: Alignment.center,
                child: Text(
                  l10n.translate(cat),
                  style: GoogleFonts.outfit(
                    color: isSelected ? Colors.white : Colors.blueGrey[600],
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildProductCard(Product p, AppLocalizations l10n) {
    final dist = _calculateDistance(
      widget.profile?.locationLat,
      widget.profile?.locationLng,
      p.locationLat,
      p.locationLng,
    ).toStringAsFixed(1);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
                child: Image.network(
                  p.image ?? 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=600',
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                top: 20,
                left: 20,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(10)),
                  child: Text(l10n.translate(p.category).toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(l10n.translate(p.name), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900]))),
                    Text('₹${p.price} / ${l10n.translate(p.unit)}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.w900, color: const Color(0xFF16A34A))),
                  ],
                ),
                const SizedBox(height: 5),
                Row(
                  children: [
                    Icon(Icons.location_on, size: 14, color: Colors.red[300]),
                    const SizedBox(width: 4),
                    Text('${l10n.estDistance}: ${dist}km', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Colors.amber[50], borderRadius: BorderRadius.circular(5)),
                      child: Row(
                        children: [
                          const Icon(Icons.star, size: 12, color: Colors.amber),
                          const SizedBox(width: 2),
                          Text('${p.farmerAvgRating}', style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amber[900])),
                          Text(' (${p.farmerTotalReviews})', style: GoogleFonts.outfit(fontSize: 10, color: Colors.amber[700])),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('${l10n.translate('farmer_seller')}: ${p.farmerName ?? "AgriFarmer"}', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[600])),
                const SizedBox(height: 10),
                Text(p.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () => _showCheckoutModal(p, l10n),
                        icon: const Icon(Icons.shopping_cart_outlined, size: 20),
                        label: Text(l10n.translate('buy_now')),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blueGrey[900],
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                          elevation: 0,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.blueGrey[100]!),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: IconButton(
                        onPressed: () {}, // Detail view or negotiation
                        icon: const Icon(Icons.message_outlined, color: Colors.blueGrey),
                        padding: const EdgeInsets.all(12),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showCheckoutModal(Product p, AppLocalizations l10n) async {
    double quantity = 1.0;
    Map<String, dynamic>? quote;
    bool isQuoting = false;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> fetchQuote() async {
            setModalState(() => isQuoting = true);
            try {
              final res = await _apiService.getLogisticsQuote([{'id': p.id, 'quantity': quantity}]);
              setModalState(() {
                quote = res;
                isQuoting = false;
              });
            } catch (e) {
              setModalState(() => isQuoting = false);
            }
          }

          if (quote == null && !isQuoting) fetchQuote();

          final subtotal = quantity * p.price;
          final shipping = quote != null ? double.parse(quote!['suggested_fee'].toString()) : 0.0;
          final total = subtotal + shipping;

          return Container(
            padding: const EdgeInsets.all(30),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    ClipRRect(borderRadius: BorderRadius.circular(12), child: Image.network(p.image ?? 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=100', height: 60, width: 60, fit: BoxFit.cover)),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.translate(p.name), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
                          Text('₹${p.price} / ${l10n.translate(p.unit)}', style: GoogleFonts.outfit(color: const Color(0xFF16A34A), fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Text(l10n.translate('quantity'), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildQtyBtn(Icons.remove, () {
                      if (quantity > 1) {
                        setModalState(() => quantity--);
                        fetchQuote();
                      }
                    }),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Text(quantity.toInt().toString(), style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                    ),
                    _buildQtyBtn(Icons.add, () {
                      setModalState(() => quantity++);
                      fetchQuote();
                    }),
                    const SizedBox(width: 15),
                    Text(p.unit, style: GoogleFonts.outfit(color: Colors.blueGrey, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 30),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.blueGrey[50], borderRadius: BorderRadius.circular(20)),
                  child: Column(
                    children: [
                      _buildSummaryRow(l10n.translate('subtotal'), '₹${subtotal.toStringAsFixed(2)}'),
                      const SizedBox(height: 10),
                      _buildSummaryRow(
                        l10n.translate('logistics_fee'), 
                        isQuoting ? l10n.translate('calculating') : '₹${shipping.toStringAsFixed(2)}',
                        isHigh: true,
                      ),
                      const Padding(padding: EdgeInsets.symmetric(vertical: 15), child: Divider()),
                      _buildSummaryRow(l10n.translate('grand_total'), '₹${total.toStringAsFixed(2)}', isBold: true),
                    ],
                  ),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: (isQuoting || quote == null) 
                      ? null 
                      : () => _handlePlaceOrder(p, quantity, shipping, double.parse(quote!['distance_km'].toString())),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      disabledBackgroundColor: Colors.blueGrey[100],
                    ),
                    child: Text(
                      isQuoting ? l10n.translate('calculating') : l10n.translate('confirm_pay'), 
                      style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildQtyBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(border: Border.all(color: Colors.blueGrey[100]!), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, size: 20, color: Colors.blueGrey[900]),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String val, {bool isHigh = false, bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: GoogleFonts.outfit(color: isHigh ? const Color(0xFF16A34A) : Colors.blueGrey[600], fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
        Text(val, style: GoogleFonts.outfit(fontWeight: isBold ? FontWeight.w900 : FontWeight.bold, fontSize: isBold ? 18 : 14)),
      ],
    );
  }

  Future<void> _handlePlaceOrder(Product p, double qty, double shipping, double dist) async {
    try {
      showDialog(context: context, barrierDismissible: false, builder: (c) => const Center(child: CircularProgressIndicator()));
      
      final orderRes = await _apiService.createOrder(
        items: [{'product_id': p.id, 'quantity': qty}],
        deliveryFee: shipping,
        distanceKm: dist,
      );

      final paymentRes = await _apiService.createPaymentTransaction(orderRes['id']);
      
      setState(() {
        _lastOrderRes = orderRes;
        _lastProduct = p;
      });

      if (!mounted) return;
      debugPrint('Closing modal and opening Razorpay for order ${orderRes['id']}');
      Navigator.pop(context); // Close loading
      Navigator.pop(context); // Close modal

      final amount = int.parse(paymentRes['amount'].toString());
      final keyId = paymentRes['key_id'].toString();
      final razorOrderId = paymentRes['id'].toString();

      debugPrint('Razorpay Options: key=$keyId, amount=$amount, orderId=$razorOrderId');

      var options = {
        'key': keyId,
        'amount': amount,
        'name': 'AgriBuyer Checkout',
        'order_id': razorOrderId,
        'description': '${p.name} (${qty.toInt()} ${p.unit})',
        'timeout': 300,
        'prefill': {
          'contact': widget.profile?.address ?? '',
          'email': 'buyer@farmtomarket.com'
        }
      };

      try {
        _razorpay.open(options);
      } catch (err) {
        debugPrint('Razorpay Open Error: $err');
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open Razorpay UI: $err')));
      }
    } catch (e) {
      debugPrint('Order Setup Error: $e');
      if (!mounted) return;
      Navigator.pop(context); // Close loading
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order Setup Failed: $e')));
    }
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text(l10n.noResultsFound, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 10),
          Text(l10n.translate('search_hint'), style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
        ],
      ),
    );
  }
}

extension ProductFilter on List<Product> {
  List<Product> filter(bool Function(Product) test) {
    return where(test).toList();
  }
}
