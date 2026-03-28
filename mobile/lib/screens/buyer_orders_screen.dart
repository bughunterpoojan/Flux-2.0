import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/order.dart';
import 'package:intl/intl.dart';

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

  Future<void> _handleLogisticsPlan(Order order) async {
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
              Text('Plan Logistics', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              _buildPlanOption(
                'shared_cluster', 
                'Shared Cluster Delivery', 
                'Budget friendly. Optimized mandi route.', 
                selectedPlan == 'shared_cluster',
                () => setModalState(() => selectedPlan = 'shared_cluster'),
              ),
              const SizedBox(height: 12),
              _buildPlanOption(
                'express_direct', 
                'Express Direct Dispatch', 
                'Fastest. Priority handling (Extra fee).', 
                selectedPlan == 'express_direct',
                () => setModalState(() => selectedPlan = 'express_direct'),
              ),
              const SizedBox(height: 25),
              Text('Delivery Slot', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: slots.map((s) => ChoiceChip(
                  label: Text(s),
                  selected: selectedSlot == s,
                  onSelected: (val) => setModalState(() => selectedSlot = s),
                  selectedColor: const Color(0xFF16A34A).withValues(alpha: 0.1),
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
                          if (!mounted) return;
                          Navigator.of(context).pop();
                          _refresh();
                        } catch (e) {
                          if (!mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: Text('Request Dispatch', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)),
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
          color: isSelected ? const Color(0xFF16A34A).withValues(alpha: 0.05) : Colors.transparent,
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

  Future<void> _handleConfirmDelivery(Order order) async {
    final TextEditingController podController = TextEditingController();
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        title: Text('Proof of Delivery', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Enter the 4-digit POD code shared by the farmer.', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
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
          TextButton(onPressed: () => Navigator.pop(context), child: Text('Cancel', style: GoogleFonts.outfit(color: Colors.blueGrey))),
          ElevatedButton(
            onPressed: () async {
              try {
                await _apiService.updateOrderStatus(order.id, 'delivered', podCode: podController.text);
                if (!mounted) return;
                Navigator.of(context).pop();
                _refresh();
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delivery confirmed successfully!')));
              } catch (e) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: const Text('Confirm'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
        if (orders.isEmpty) return _buildEmptyState();

        return RefreshIndicator(
          onRefresh: () async => _refresh(),
          child: ListView.separated(
            padding: const EdgeInsets.all(20),
            itemCount: orders.length,
            separatorBuilder: (c, i) => const SizedBox(height: 20),
            itemBuilder: (context, index) => _buildOrderCard(orders[index]),
          ),
        );
      },
    );
  }

  Widget _buildOrderCard(Order order) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.blueGrey[50]!),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 5)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Order #${order.id}', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16, color: Colors.blueGrey[900])),
              _buildStatusBadge(order.status),
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
                  Text('Total Amount', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                  Text('₹${order.totalAmount}', style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w900, color: Colors.blueGrey[900])),
                  if (order.deliveryFee > 0)
                    Text('incl. ₹${order.deliveryFee} AI shipping', style: GoogleFonts.outfit(fontSize: 10, fontStyle: FontStyle.italic, color: Colors.blueGrey[400])),
                ],
              ),
              if (order.status == 'accepted')
                ElevatedButton(
                  onPressed: () => _handleLogisticsPlan(order),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Plan Logistics'),
                ),
              if (order.status == 'shipped' && order.podRequired)
                ElevatedButton(
                  onPressed: () => _handleConfirmDelivery(order),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: const Text('Confirm POD'),
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
                  Expanded(child: Text('Extra Shipping Fee: ₹${order.additionalShippingFee}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.orange[900]))),
                  TextButton(
                    onPressed: () => _handleExtraPayment(order),
                    child: const Text('PAY NOW'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _handleExtraPayment(Order order) async {
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
      if (!mounted) return;
      _refresh();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Extra shipping paid!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Error: $e')));
    }
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.orange;
    if (status == 'accepted' || status == 'shipped') color = Colors.blue;
    if (status == 'delivered') color = Colors.green;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.shopping_bag_outlined, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text('No orders yet', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 10),
          Text('Your basket is empty. Time to stock up!', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
        ],
      ),
    );
  }
}
