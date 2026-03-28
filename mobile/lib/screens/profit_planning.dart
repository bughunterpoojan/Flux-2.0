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
  final List<Map<String, dynamic>> _cropData = [
    {'crop': 'Wheat', 'cost': 38000, 'sellingPrice': 54000, 'profit': 16000},
    {'crop': 'Rice', 'cost': 42000, 'sellingPrice': 57500, 'profit': 15500},
    {'crop': 'Tomato', 'cost': 35000, 'sellingPrice': 64000, 'profit': 29000},
    {'crop': 'Potato', 'cost': 31000, 'sellingPrice': 47500, 'profit': 16500},
    {'crop': 'Onion', 'cost': 33000, 'sellingPrice': 52000, 'profit': 19000},
  ];

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
            onPressed: () => ApiService.logout(context),
            icon: const Icon(Icons.logout, color: Colors.blueGrey),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInsightCard(),
            const SizedBox(height: 25),
            _buildProfitBarChart(),
            const SizedBox(height: 25),
            _buildCostDistributionPie(),
            const SizedBox(height: 25),
          ],
        ),
      ),
    );
  }

  Widget _buildInsightCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFF16A34A), Color(0xFF15803D)]),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Row(
        children: [
          const Icon(Icons.auto_awesome, color: Colors.white, size: 30),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('AI Insight', style: GoogleFonts.outfit(color: Colors.white.withValues(alpha: 0.8), fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 5),
                Text('Tomato is currently providing the highest profit margin in your region. Consider increasing yield.', 
                  style: GoogleFonts.outfit(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfitBarChart() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.blueGrey[100]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Crop Profit Comparison', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
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
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(_cropData[value.toInt()]['crop'], style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                barGroups: _cropData.asMap().entries.map((e) => BarChartGroupData(x: e.key, barRods: [BarChartRodData(toY: e.value['profit'].toDouble() / 1000, color: const Color(0xFF16A34A), width: 20, borderRadius: BorderRadius.circular(6))])).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCostDistributionPie() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.blueGrey[100]!)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Average Cost Distribution', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 30),
          SizedBox(
            height: 200,
            child: PieChart(
              PieChartData(
                sections: [
                  PieChartSectionData(value: 30, title: 'Seeds', color: Colors.green, radius: 50, titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  PieChartSectionData(value: 25, title: 'Fert', color: Colors.blue, radius: 50, titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  PieChartSectionData(value: 20, title: 'Logistics', color: Colors.orange, radius: 50, titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  PieChartSectionData(value: 25, title: 'Labor', color: Colors.red, radius: 50, titleStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
                centerSpaceRadius: 40,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
