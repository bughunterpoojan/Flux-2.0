import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../services/api_service.dart';
import '../models/farmer_stats.dart';
import 'package:google_fonts/google_fonts.dart';

class FarmerDashboard extends StatefulWidget {
  const FarmerDashboard({super.key});

  @override
  State<FarmerDashboard> createState() => _FarmerDashboardState();
}

class _FarmerDashboardState extends State<FarmerDashboard> {
  late Future<FarmerStats> _statsFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _statsFuture = _apiService.getFarmerStats().then((data) => FarmerStats.fromJson(data));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Farmer Dashboard', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => ApiService.logout(context),
            icon: const Icon(Icons.logout, color: Colors.blueGrey),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: FutureBuilder<FarmerStats>(
        future: _statsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final stats = snapshot.data!;

          return RefreshIndicator(
            onRefresh: () async {
              setState(() {
                _statsFuture = _apiService.getFarmerStats().then((data) => FarmerStats.fromJson(data));
              });
            },
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome back, Farmer',
                    style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.blueGrey[900]),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    "Here's your performance summary",
                    style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500]),
                  ),
                  const SizedBox(height: 25),
                  _buildStatCards(stats),
                  const SizedBox(height: 25),
                  _buildRevenueChart(stats.chartData),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCards(FarmerStats stats) {
    return Column(
      children: [
        _statCard(
          'Total Revenue',
          '₹${stats.totalRevenue.toStringAsFixed(0)}',
          Icons.currency_rupee,
          Colors.green[50]!,
          Colors.green[700]!,
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            Expanded(
              child: _statCard(
                'Active Listings',
                stats.activeListings.toString(),
                Icons.inventory_2_outlined,
                Colors.blue[50]!,
                Colors.blue[700]!,
              ),
            ),
            const SizedBox(width: 15),
            Expanded(
              child: _statCard(
                'Pending Orders',
                stats.pendingOrders.toString(),
                Icons.shopping_cart_outlined,
                Colors.orange[50]!,
                Colors.orange[700]!,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _statCard(String label, String value, IconData icon, Color bgColor, Color iconColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.blueGrey[100]!),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(height: 15),
          Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400], letterSpacing: 0.5)),
          const SizedBox(height: 5),
          Text(value, style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
        ],
      ),
    );
  }

  Widget _buildRevenueChart(List<ChartData> data) {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.blueGrey[100]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Revenue Forecast', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 30),
          SizedBox(
            height: 250,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (value) => FlLine(color: Colors.blueGrey[100], strokeWidth: 1)),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      interval: 1,
                      getTitlesWidget: (value, meta) {
                        if (value.toInt() >= data.length) return const Text('');
                        return Padding(
                          padding: const EdgeInsets.only(top: 10),
                          child: Text(data[value.toInt()].name, style: GoogleFonts.outfit(color: Colors.blueGrey[400], fontWeight: FontWeight.bold, fontSize: 10)),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 42,
                      getTitlesWidget: (value, meta) {
                        return Text('₹${(value / 1000).toStringAsFixed(0)}k', style: GoogleFonts.outfit(color: Colors.blueGrey[400], fontWeight: FontWeight.bold, fontSize: 10));
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: data.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.revenue)).toList(),
                    isCurved: true,
                    gradient: const LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF4ADE80)]),
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: true, getDotPainter: (spot, percent, barData, index) => FlDotCirclePainter(radius: 6, color: Colors.white, strokeWidth: 3, strokeColor: const Color(0xFF16A34A))),
                    belowBarData: BarAreaData(show: true, gradient: LinearGradient(colors: [const Color(0xFF16A34A).withValues(alpha: 0.1), const Color(0xFF16A34A).withValues(alpha: 0.0)])),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
