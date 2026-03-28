class Product {
  final int id;
  final String name;
  final String category;
  final double price;
  final String stock;
  final String description;
  final String unit;
  final String? image;
  final String? address;
  final double? locationLat;
  final double? locationLng;
  final String? farmerName;
  final double farmerAvgRating;
  final int farmerTotalReviews;

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.stock,
    required this.description,
    required this.unit,
    this.image,
    this.address,
    this.locationLat,
    this.locationLng,
    this.farmerName,
    this.farmerAvgRating = 0.0,
    this.farmerTotalReviews = 0,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      category: json['category'],
      price: double.parse(json['price'].toString()),
      stock: json['stock']?.toString() ?? '0',
      description: json['description'] ?? '',
      unit: json['unit'] ?? 'kg',
      image: json['image'],
      address: json['address'],
      locationLat: json['location_lat'] != null ? double.parse(json['location_lat'].toString()) : null,
      locationLng: json['location_lng'] != null ? double.parse(json['location_lng'].toString()) : null,
      farmerName: json['farmer_name'],
      farmerAvgRating: double.parse((json['farmer_avg_rating'] ?? 0.0).toString()),
      farmerTotalReviews: int.parse((json['farmer_total_reviews'] ?? 0).toString()),
    );
  }
}
