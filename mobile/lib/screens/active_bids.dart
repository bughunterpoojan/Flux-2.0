import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/negotiation.dart';
import 'package:google_fonts/google_fonts.dart';

class ActiveBidsScreen extends StatefulWidget {
  const ActiveBidsScreen({super.key});

  @override
  State<ActiveBidsScreen> createState() => _ActiveBidsScreenState();
}

class _ActiveBidsScreenState extends State<ActiveBidsScreen> {
  late Future<List<Negotiation>> _bidsFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _bidsFuture = _apiService.getNegotiations().then((data) => data.map((i) => Negotiation.fromJson(i)).toList());
  }

  void _refresh() {
    setState(() {
      _bidsFuture = _apiService.getNegotiations().then((data) => data.map((i) => Negotiation.fromJson(i)).toList());
    });
  }

  Future<void> _handleAction(int id, String action, {double? price}) async {
    try {
      await _apiService.actionNegotiation(id, action, counterPrice: price);
      _refresh();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Negotiation $action success!')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _showCounterModal(Negotiation bid) {
    double counterPrice = bid.offeredPrice;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Container(
              padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 25, right: 25, top: 25),
              decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Send Counter Offer', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
                  const SizedBox(height: 10),
                  Text('Set a price that you are comfortable with.', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
                  const SizedBox(height: 25),
                  TextField(
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.currency_rupee, color: Color(0xFF16A34A)),
                      filled: true,
                      fillColor: Colors.blueGrey[50],
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                      hintText: 'Enter counter price',
                    ),
                    onChanged: (v) => counterPrice = double.tryParse(v) ?? counterPrice,
                  ),
                  const SizedBox(height: 30),
                  SizedBox(
                    width: double.infinity,
                    height: 60,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        if (mounted) {
        _handleAction(bid.id, 'counter', price: counterPrice);
      }
                      },
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))),
                      child: const Text('Submit Counter Price', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 30),
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Active Bids', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0, actions: [IconButton(onPressed: () => ApiService.logout(context), icon: const Icon(Icons.logout, color: Colors.blueGrey)), const SizedBox(width: 10)],
      ),
      body: FutureBuilder<List<Negotiation>>(
        future: _bidsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final bids = snapshot.data!;

          if (bids.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: bids.length,
              separatorBuilder: (c, i) => const SizedBox(height: 15),
              itemBuilder: (context, index) {
                final bid = bids[index];
                return _buildBidCard(bid);
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
          Icon(Icons.gavel_outlined, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text('No active bids', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 10),
          Text('Buyers will start bidding once you list crops.', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
        ],
      ),
    );
  }

  Widget _buildBidCard(Negotiation bid) {
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
              Text(bid.productName ?? 'Product', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
              _buildStatusBadge(bid.status),
            ],
          ),
          const SizedBox(height: 5),
          Text('Buyer: ${bid.buyerName ?? 'Anonymous'}', style: GoogleFonts.outfit(fontSize: 13, color: Colors.blueGrey[500])),
          const SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Original Price', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                  Text('₹${bid.originalPrice.toStringAsFixed(0)}/${bid.unit ?? 'kg'}', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blueGrey[500], decoration: TextDecoration.lineThrough)),
                ],
              ),
              Icon(Icons.arrow_forward_rounded, size: 20, color: Colors.blueGrey),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('Buyer Offered', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                  Text('₹${bid.offeredPrice.toStringAsFixed(0)}/${bid.unit ?? 'kg'}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF16A34A))),
                ],
              ),
            ],
          ),
          if (bid.farmerCounterPrice != null) ...[
            const SizedBox(height: 15),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blue[50], borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.info_outline, size: 16, color: Colors.blue),
                  const SizedBox(width: 8),
                  Text('Your Counter: ₹${bid.farmerCounterPrice!.toStringAsFixed(0)}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.blue[700])),
                ],
              ),
            ),
          ],
          if (bid.message != null && bid.message!.isNotEmpty) ...[
            const SizedBox(height: 15),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.blueGrey[50], borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.blueGrey[100]!)),
              child: Text('Message: "${bid.message}"', style: GoogleFonts.outfit(fontSize: 12, color: Colors.blueGrey[600], fontStyle: FontStyle.italic)),
            ),
          ],
          if (bid.status == 'pending' || bid.status == 'countered') ...[
            const SizedBox(height: 25),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _handleAction(bid.id, 'reject'),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.redAccent), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 15)),
                    child: const Text('Reject', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showCounterModal(bid),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.blue), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 15)),
                    child: const Text('Counter', style: TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _handleAction(bid.id, 'accept'),
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 15)),
                    child: const Text('Accept', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = Colors.orange;
    if (status == 'accepted') color = Colors.green;
    if (status == 'rejected') color = Colors.red;
    if (status == 'countered') color = Colors.blue;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: color, letterSpacing: 0.5)),
    );
  }
}
