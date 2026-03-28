class FarmerStats {
  final double totalRevenue;
  final int activeListings;
  final int pendingOrders;
  final double avgRating;
  final int totalReviews;
  final List<ChartData> chartData;

  FarmerStats({
    required this.totalRevenue,
    required this.activeListings,
    required this.pendingOrders,
    required this.avgRating,
    required this.totalReviews,
    required this.chartData,
  });

  factory FarmerStats.fromJson(Map<String, dynamic> json) {
    return FarmerStats(
      totalRevenue: double.parse(json['total_revenue'].toString()),
      activeListings: json['active_listings'],
      pendingOrders: json['pending_orders'],
      avgRating: double.parse((json['avg_rating'] ?? 0.0).toString()),
      totalReviews: int.parse((json['total_reviews'] ?? 0).toString()),
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
