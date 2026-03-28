import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/negotiation.dart';

class BuyerBidsScreen extends StatefulWidget {
  const BuyerBidsScreen({super.key});

  @override
  State<BuyerBidsScreen> createState() => _BuyerBidsScreenState();
}

class _BuyerBidsScreenState extends State<BuyerBidsScreen> {
  final ApiService _apiService = ApiService();
  late Future<List<Negotiation>> _bidsFuture;

  @override
  void initState() {
    super.initState();
    _bidsFuture = _loadBids();
  }

  Future<List<Negotiation>> _loadBids() async {
    final data = await _apiService.getNegotiations();
    return data.map((json) => Negotiation.fromJson(json)).toList();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<Negotiation>>(
      future: _bidsFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
        }
        if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        }

        final bids = snapshot.data!;
        if (bids.isEmpty) return _buildEmptyState();

        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: bids.length,
          separatorBuilder: (c, i) => const SizedBox(height: 15),
          itemBuilder: (context, index) => _buildBidCard(bids[index]),
        );
      },
    );
  }

  Widget _buildBidCard(Negotiation bid) {
    Color statusColor = Colors.orange;
    if (bid.status == 'accepted') statusColor = Colors.green;
    if (bid.status == 'countered') statusColor = Colors.blue;
    if (bid.status == 'rejected') statusColor = Colors.red;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
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
                Text(bid.productName ?? 'Unknown Product', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Text(bid.status.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: statusColor)),
                ),
            ],
          ),
          const SizedBox(height: 15),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildPriceInfo('Original', '₹${bid.originalPrice}'),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.blueGrey),
              _buildPriceInfo('Your Bid', '₹${bid.offeredPrice}', isHighlighted: true),
              if (bid.farmerCounterPrice != null && bid.farmerCounterPrice! > 0) ...[
                const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.blueGrey),
                _buildPriceInfo('Counter', '₹${bid.farmerCounterPrice}', isHighlighted: true, color: Colors.blue),
              ],
            ],
          ),
          if (bid.status == 'countered' || bid.status == 'accepted')
             Padding(
               padding: const EdgeInsets.only(top: 20),
               child: SizedBox(
                 width: double.infinity,
                 child: ElevatedButton(
                    onPressed: () {
                      // Navigate to cart with this price
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('PURCHASE NOW'),
                 ),
               ),
             ),
        ],
      ),
    );
  }

  Widget _buildPriceInfo(String label, String price, {bool isHighlighted = false, Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
        Text(price, style: GoogleFonts.outfit(fontSize: 16, fontWeight: isHighlighted ? FontWeight.w900 : FontWeight.bold, color: color ?? (isHighlighted ? const Color(0xFF16A34A) : Colors.blueGrey[900]))),
      ],
    );
  }

  Widget _buildEmptyState() {
     return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.message_outlined, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text('No active bids', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
        ],
      ),
    );
  }
}
