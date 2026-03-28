class FarmerStats {
  final double totalRevenue;
  final int activeListings;
  final int pendingOrders;
  final List<ChartData> chartData;

  FarmerStats({
    required this.totalRevenue,
    required this.activeListings,
    required this.pendingOrders,
    required this.chartData,
  });

  factory FarmerStats.fromJson(Map<String, dynamic> json) {
    return FarmerStats(
      totalRevenue: double.parse(json['total_revenue'].toString()),
      activeListings: json['active_listings'],
      pendingOrders: json['pending_orders'],
      chartData: (json['chart_data'] as List)
          .map((i) => ChartData.fromJson(i))
          .toList(),
    );
  }
}

class ChartData {
  final String name;
  final double revenue;

  ChartData({required this.name, required this.revenue});

  factory ChartData.fromJson(Map<String, dynamic> json) {
    return ChartData(
      name: json['name'],
      revenue: double.parse(json['revenue'].toString()),
    );
  }
}
