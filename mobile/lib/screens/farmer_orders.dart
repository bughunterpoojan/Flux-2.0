import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

class FarmerOrdersScreen extends StatefulWidget {
  const FarmerOrdersScreen({super.key});

  @override
  State<FarmerOrdersScreen> createState() => _FarmerOrdersScreenState();
}

class _FarmerOrdersScreenState extends State<FarmerOrdersScreen> {
  late Future<List<dynamic>> _ordersFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _ordersFuture = _apiService.getOrders();
  }

  void _refresh() {
    setState(() {
      _ordersFuture = _apiService.getOrders();
    });
  }

  Future<void> _updateStatus(int id, String currentStatus) async {
    final statusCycle = ['pending', 'accepted', 'shipped', 'delivered'];
    final currentIndex = statusCycle.indexOf(currentStatus);
    if (currentIndex == -1 || currentIndex == statusCycle.length - 1) return;
    
    final nextStatus = statusCycle[currentIndex + 1];
    
    try {
      await _apiService.updateOrderStatus(id, nextStatus);
      if (!mounted) return;
      _refresh();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order marked as $nextStatus')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Incoming Orders', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0, actions: [IconButton(onPressed: () => ApiService.logout(context), icon: const Icon(Icons.logout, color: Colors.blueGrey)), const SizedBox(width: 10)],
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _ordersFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final orders = snapshot.data!;

          if (orders.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: orders.length,
              separatorBuilder: (c, i) => const SizedBox(height: 15),
              itemBuilder: (context, index) {
                final order = orders[index];
                return _buildOrderCard(order);
              },
            ),
          );
        },
      ),
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
          Text('Your crops are ready. Waiting for buyers!', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
        ],
      ),
    );
  }

  Widget _buildOrderCard(dynamic order) {
    final status = order['status'];
    final id = order['id'];
    final buyer = order['buyer_name'] ?? 'Unknown Buyer';
    final amount = order['total_amount'];
    final date = DateTime.parse(order['created_at']);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.blueGrey[100]!),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Order #${id.toString().padLeft(4, '0')}', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
              _buildStatusBadge(status),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            children: [
              CircleAvatar(backgroundColor: Colors.blueGrey[50], child: Text(buyer[0].toUpperCase(), style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey))),
              const SizedBox(width: 15),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(buyer, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
                  Text(DateFormat('MMM dd, yyyy • hh:mm a').format(date), style: GoogleFonts.outfit(fontSize: 12, color: Colors.blueGrey[400])),
                ],
              ),
            ],
          ),
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
                  Text('₹$amount', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
                ],
              ),
              if (status != 'delivered' && status != 'cancelled')
                ElevatedButton(
                  onPressed: () => _updateStatus(id, status),
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12)),
                  child: Text(
                    status == 'pending' ? 'Accept Order' : 
                    status == 'accepted' ? 'Mark Shipped' : 
                    status == 'shipped' ? 'Mark Delivered' : 'Done',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.orange;
    if (status == 'accepted') color = Colors.blue;
    if (status == 'shipped') color = Colors.deepPurple;
    if (status == 'delivered') color = Colors.green;
    if (status == 'cancelled') color = Colors.red;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
    );
  }
}
