import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/order.dart';
import 'package:intl/intl.dart';
import '../l10n/app_localizations.dart';

class BuyerOrdersScreen extends StatefulWidget {
  const BuyerOrdersScreen({super.key});

  @override
  State<BuyerOrdersScreen> createState() => _BuyerOrdersScreenState();
}

class _BuyerOrdersScreenState extends State<BuyerOrdersScreen> {
  final ApiService _apiService = ApiService();
  late Future<List<Order>> _ordersFuture;

  @override
  void initState() {
    super.initState();
    _ordersFuture = _loadOrders();
  }

  Future<List<Order>> _loadOrders() async {
    final data = await _apiService.getOrders();
    return data.map((json) => Order.fromJson(json)).toList();
  }

  void _refresh() {
    setState(() {
      _ordersFuture = _loadOrders();
    });
  }

  Future<void> _handleLogisticsPlan(Order order, AppLocalizations l10n) async {
    String? selectedPlan;
    String? selectedSlot = '08:00-10:00';
    final slots = ['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'];

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          padding: const EdgeInsets.all(30),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.planLogistics, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              _buildPlanOption(
                'shared_cluster', 
                l10n.translate('shared_cluster_title'), 
                l10n.translate('shared_cluster_desc'), 
                selectedPlan == 'shared_cluster',
                () => setModalState(() => selectedPlan = 'shared_cluster'),
              ),
              const SizedBox(height: 12),
              _buildPlanOption(
                'express_direct', 
                l10n.translate('express_direct_title'), 
                l10n.translate('express_direct_desc'), 
                selectedPlan == 'express_direct',
                () => setModalState(() => selectedPlan = 'express_direct'),
              ),
              const SizedBox(height: 25),
              Text(l10n.translate('delivery_slot'), style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: slots.map((s) => ChoiceChip(
                  label: Text(s),
                  selected: selectedSlot == s,
                  onSelected: (val) => setModalState(() => selectedSlot = s),
                  selectedColor: const Color(0xFF16A34A).withOpacity(0.1),
                  labelStyle: GoogleFonts.outfit(color: selectedSlot == s ? const Color(0xFF16A34A) : Colors.blueGrey, fontWeight: FontWeight.bold),
                )).toList(),
              ),
              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: selectedPlan == null 
                    ? null 
                    : () async {
                        try {
                          await _apiService.updateOrderStatus(order.id, 'shipped', logisticsPlan: selectedPlan, deliverySlot: selectedSlot);
                          if (!context.mounted) return;
                          _refresh();
                          Navigator.of(context).pop();
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: Text(l10n.planLogistics, style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanOption(String id, String title, String subtitle, bool isSelected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? const Color(0xFF16A34A) : Colors.blueGrey[50]!, width: 2),
          borderRadius: BorderRadius.circular(20),
          color: isSelected ? const Color(0xFF16A34A).withOpacity(0.05) : Colors.transparent,
        ),
        child: Row(
          children: [
            Icon(isSelected ? Icons.check_circle : Icons.circle_outlined, color: isSelected ? const Color(0xFF16A34A) : Colors.blueGrey[100]),
            const SizedBox(width: 15),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.blueGrey[900])),
                  Text(subtitle, style: GoogleFonts.outfit(fontSize: 12, color: Colors.blueGrey[400])),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }


  Future<void> _handleConfirmDelivery(Order order, AppLocalizations l10n) async {
    final TextEditingController podController = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        title: Text(l10n.proofOfDelivery, style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(l10n.podInstruction, style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
            const SizedBox(height: 20),
            TextField(
              controller: podController,
              keyboardType: TextInputType.number,
              maxLength: 4,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: 10),
              decoration: InputDecoration(
                counterText: '',
                filled: true,
                fillColor: Colors.blueGrey[50],
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide.none),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.translate('cancel'), style: GoogleFonts.outfit(color: Colors.blueGrey))),
          ElevatedButton(
            onPressed: () async {
              try {
                await _apiService.updateOrderStatus(order.id, 'delivered', podCode: podController.text);
                if (!context.mounted) return;
                Navigator.of(context).pop();
                _refresh();
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.translate('delivery_confirmed'))));
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text(l10n.translate('confirm')),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return FutureBuilder<List<Order>>(
      future: _ordersFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        final orders = snapshot.data!;
        if (orders.isEmpty) return _buildEmptyState(l10n);

        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: orders.length,
            separatorBuilder: (c, i) => const SizedBox(height: 20),
            itemBuilder: (context, index) => _buildOrderCard(orders[index], l10n),
          ),
        );
      },
    );
  }

  Widget _buildOrderCard(Order order, AppLocalizations l10n) {
    return InkWell(
      onTap: () => _showOrderDetailSheet(order, l10n),
      borderRadius: BorderRadius.circular(30),
      child: Container(
        padding: const EdgeInsets.all(25),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.blueGrey[50]!),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 5)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('${l10n.translate('order_id')} #${order.id}', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.blueGrey[900])),
                _buildStatusBadge(order.status, l10n),
              ],
            ),
            const SizedBox(height: 5),
            Text(DateFormat('MMM dd, yyyy • hh:mm a').format(order.createdAt), style: GoogleFonts.outfit(fontSize: 12, color: Colors.blueGrey[400])),
            const SizedBox(height: 20),
            const Divider(height: 1),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.translate('total_paid'), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                    Text('₹${order.totalAmount}', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.blueGrey[900])),
                    if (order.deliveryFee > 0)
                      Text('incl. ₹${order.deliveryFee} ${l10n.logisticsFee}', style: GoogleFonts.outfit(fontSize: 10, fontStyle: FontStyle.italic, color: Colors.blueGrey[400])),
                  ],
                ),
                if (order.status == 'accepted')
                  ElevatedButton(
                    onPressed: () => _handleLogisticsPlan(order, l10n),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: Text(l10n.translate('plan_logistics')),
                  ),
                if (order.status == 'shipped' && order.podRequired)
                  ElevatedButton(
                    onPressed: () => _handleConfirmDelivery(order, l10n),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    child: Text(l10n.translate('confirm_pod')),
                  ),
              ],
            ),
            if (order.status == 'shipped' && order.additionalShippingFee > 0 && !order.additionalShippingPaid)
              Container(
                margin: const EdgeInsets.only(top: 20),
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(color: Colors.orange[50], borderRadius: BorderRadius.circular(15)),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: Colors.orange),
                    const SizedBox(width: 10),
                    Expanded(child: Text('${l10n.translate('extra_shipping_fee')}: ₹${order.additionalShippingFee}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.orange[900]))),
                    TextButton(
                      onPressed: () => _handleExtraPayment(order),
                      child: Text(l10n.translate('pay_now').toUpperCase()),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  void _showOrderDetailSheet(Order order, AppLocalizations l10n) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(40))),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.6,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => ListView(
          controller: scrollController,
          padding: const EdgeInsets.all(30),
          children: [
            Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 25),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.translate('order_details'), style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.blueGrey[900])),
                    Text('Order #${order.id}', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                  ],
                ),
                _buildStatusBadge(order.status, l10n),
              ],
            ),
            const SizedBox(height: 35),
            
            // Status Timeline
            _buildStatusTimeline(order.status, l10n),
            const SizedBox(height: 35),

            Text(l10n.translate('items_in_order'), style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.blueGrey[900])),
            const SizedBox(height: 15),
            ...order.items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(color: Colors.blueGrey[50]!.withOpacity(0.5), borderRadius: BorderRadius.circular(20)),
                child: Row(
                  children: [
                    Container(
                      width: 50, height: 50,
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.inventory_2_outlined, color: Color(0xFF16A34A)),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(l10n.translate(item.productName), style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text('${item.quantity} ${l10n.translate('kg')} • ₹${item.priceAtOrder}/${l10n.translate('kg')}', style: GoogleFonts.outfit(fontSize: 12, color: Colors.blueGrey[400])),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('₹${(item.quantity * item.priceAtOrder).toStringAsFixed(2)}', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)),
                        if (order.status == 'delivered')
                          TextButton.icon(
                            onPressed: () => _showItemReviewModal(item, l10n),
                            icon: const Icon(Icons.star_outline, size: 14),
                            label: Text(l10n.translate('rate_farmer').split(' ').last, style: const TextStyle(fontSize: 12)), // "Rate"
                            style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(50,30), tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            )),

            const SizedBox(height: 25),
            Text(l10n.translate('shipping_info'), style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.blueGrey[900])),
            const SizedBox(height: 15),
            _buildInfoRow(l10n.translate('logistics_fee'), (order.logisticsPlan ?? l10n.translate('pending')).replaceAll('_', ' ').toUpperCase()), // Reuse logistics_fee for Logistics Plan label
            _buildInfoRow(l10n.translate('confirm_pay'), order.deliverySlot ?? l10n.translate('no_feedback').split(' ').first), // Tweak
            _buildInfoRow(l10n.translate('est_distance'), '${order.distanceKm ?? 0} km'),
            
            const SizedBox(height: 30),
            Container(
              padding: const EdgeInsets.all(25),
              decoration: BoxDecoration(color: Colors.blueGrey[900], borderRadius: BorderRadius.circular(25)),
              child: Column(
                children: [
                  _buildSummaryRow(l10n.translate('initial_fee'), '₹${order.initialDeliveryFee.toStringAsFixed(2)}', isDark: true),
                  if (order.additionalShippingFee > 0)
                    _buildSummaryRow(l10n.translate('extra_charge'), '₹${order.additionalShippingFee.toStringAsFixed(2)}', isDark: true),
                  const Divider(color: Colors.white24),
                  _buildSummaryRow(l10n.translate('total_paid'), '₹${order.totalAmount.toStringAsFixed(2)}', isDark: true, isTotal: true),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTimeline(String currentStatus, AppLocalizations l10n) {
    final stages = ['pending', 'accepted', 'shipped', 'delivered'];
    final currentIndex = stages.indexOf(currentStatus);

    return Row(
      children: List.generate(stages.length, (index) {
        final isCompleted = index <= currentIndex;
        final isLast = index == stages.length - 1;
        return Expanded(
          child: Row(
            children: [
              Column(
                children: [
                  Container(
                    width: 24, height: 24,
                    decoration: BoxDecoration(
                      color: isCompleted ? const Color(0xFF16A34A) : Colors.blueGrey[100],
                      shape: BoxShape.circle,
                    ),
                    child: isCompleted ? const Icon(Icons.check, size: 14, color: Colors.white) : null,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.translate(stages[index]).toUpperCase(),
                    style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: isCompleted ? const Color(0xFF16A34A) : Colors.blueGrey[300]),
                  ),
                ],
              ),
              if (!isLast)
                Expanded(
                  child: Container(height: 2, color: index < currentIndex ? const Color(0xFF16A34A) : Colors.blueGrey[100]),
                ),
            ],
          ),
        );
      }),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500], fontWeight: FontWeight.bold)),
          Text(value, style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[900], fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isDark = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.outfit(fontSize: isTotal ? 16 : 14, color: isDark ? Colors.white70 : Colors.blueGrey[500], fontWeight: isTotal ? FontWeight.bold : FontWeight.normal)),
          Text(value, style: GoogleFonts.outfit(fontSize: isTotal ? 20 : 14, color: isDark ? Colors.white : Colors.blueGrey[900], fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }

  void _showItemReviewModal(OrderItem item, AppLocalizations l10n) {
    int rating = 5;
    final TextEditingController commentController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 25, right: 25, top: 25),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.rateOrder, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 5),
              Text(l10n.translate(item.productName), style: GoogleFonts.outfit(color: Colors.blueGrey)),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) => IconButton(
                  onPressed: () => setModalState(() => rating = index + 1),
                  icon: Icon(index < rating ? Icons.star : Icons.star_border, color: Colors.amber, size: 30),
                )),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: commentController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: l10n.feedbackPlaceholder,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(15)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    try {
                      await _apiService.submitReview(item.productId, rating, commentController.text);
                      if (!mounted) return;
                      Navigator.pop(context);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.reviewSuccess)));
                    } catch (e) {
                      if (!mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${l10n.errorPrefix}$e')));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 15),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  ),
                  child: Text(l10n.translate('submit_review')),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleExtraPayment(Order order) async {
    final l10n = AppLocalizations.of(context)!;
    try {
      final res = await _apiService.createPaymentTransaction(order.id, paymentType: 'extra_shipping');
      // In a real app, Razorpay SDK would be triggered here. 
      // For this hackathon demo, we will simulate verification success.
      await _apiService.verifyPaymentTransaction({
        'razorpay_order_id': res['id'],
        'razorpay_payment_id': 'pay_demo_success',
        'razorpay_signature': 'sig_demo_success',
        'payment_type': 'extra_shipping',
        'order_id': order.id,
      });
      if (!context.mounted) return;
      _refresh();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.translate('extra_shipping_paid'))));
    } catch (e) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Error: $e')));
    }
  }

  Widget _buildStatusBadge(String status, AppLocalizations l10n) {
    Color color = Colors.orange;
    if (status == 'accepted' || status == 'shipped') color = Colors.blue;
    if (status == 'delivered') color = Colors.green;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(l10n.translate(status).toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text(l10n.translate('no_orders'), style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 10),
          Text(l10n.translate('basket_empty'), style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
        ],
      ),
    );
  }
}
