import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class ProfitPlanningScreen extends StatefulWidget {
  const ProfitPlanningScreen({super.key});

  @override
  State<ProfitPlanningScreen> createState() => _ProfitPlanningScreenState();
}

class _ProfitPlanningScreenState extends State<ProfitPlanningScreen> {
  final ApiService _apiService = ApiService();
  List<Map<String, dynamic>> _cropData = [];
  Map<String, dynamic> _summaryMetrics = {};
  List<Map<String, dynamic>> _priceTrends = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final data = await _apiService.getProfitPlanningData();
      setState(() {
        _cropData = List<Map<String, dynamic>>.from(data['crop_data']);
        _summaryMetrics = Map<String, dynamic>.from(data['summary_metrics']);
        _priceTrends = List<Map<String, dynamic>>.from(data['price_trends']);
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profit data: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Profit Planning', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _loadData,
            icon: const Icon(Icons.refresh, color: Colors.blueGrey),
          ),
          IconButton(
            onPressed: () => ApiService.logout(context),
            icon: const Icon(Icons.logout, color: Colors.blueGrey),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSummaryMetrics(),
                    const SizedBox(height: 25),
                    _buildProfitBarChart(),
                    const SizedBox(height: 25),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSummaryMetrics() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('Total Revenue', '₹${_summaryMetrics['total_revenue']}', Colors.green, Icons.payments)),
            const SizedBox(width: 15),
            Expanded(child: _buildMetricCard('Total Profit', '₹${_summaryMetrics['total_profit']}', Colors.blue, Icons.trending_up)),
          ],
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            Expanded(child: _buildMetricCard('Orders', '${_summaryMetrics['total_orders']}', Colors.orange, Icons.shopping_bag)),
            const SizedBox(width: 15),
            Expanded(child: _buildMetricCard('Best Crop', '${_summaryMetrics['best_crop']}', Colors.purple, Icons.star)),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.outfit(color: Colors.blueGrey, fontSize: 12, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(value, style: GoogleFonts.outfit(color: Colors.black, fontSize: 18, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }

  Widget _buildProfitBarChart() {
    if (_cropData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        width: double.infinity,
        decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.blueGrey[100]!)),
        child: Text('No sales data available for comparison.',
            style: GoogleFonts.outfit(color: Colors.blueGrey, fontStyle: FontStyle.italic)),
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.blueGrey[100]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Crop Profit Comparison',
              style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 30),
          SizedBox(
            height: 200,
            child: BarChart(
              BarChartData(
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        int index = value.toInt();
                        if (index < 0 || index >= _cropData.length) return const SizedBox.shrink();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(_cropData[index]['crop'],
                              style: GoogleFonts.outfit(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: _cropData
                    .asMap()
                    .entries
                    .map((e) => BarChartGroupData(x: e.key, barRods: [
                          BarChartRodData(
                              toY: e.value['profit'].toDouble() / (e.value['profit'] > 1000 ? 1000 : 1),
                              color: const Color(0xFF16A34A),
                              width: 16,
                              borderRadius: BorderRadius.circular(4))
                        ]))
                    .toList(),
              ),
            ),
          ),
          if (_cropData.any((e) => e['profit'] > 1000))
            Padding(
              padding: const EdgeInsets.only(top: 8.0),
              child: Text('* Values in thousands', style: GoogleFonts.outfit(fontSize: 10, color: Colors.grey)),
            ),
        ],
      ),
    );
  }
}
