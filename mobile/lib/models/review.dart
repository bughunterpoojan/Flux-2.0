class Review {
  final int id;
  final String userName;
  final String productName;
  final String farmerName;
  final int rating;
  final String comment;
  final DateTime createdAt;
  final int product;

  Review({
    required this.id,
    required this.userName,
    required this.productName,
    required this.farmerName,
    required this.rating,
    required this.comment,
    required this.createdAt,
    required this.product,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      userName: json['user_name'] ?? 'Buyer',
      productName: json['product_name'] ?? 'Product',
      farmerName: json['farmer_name'] ?? 'Farmer',
      rating: json['rating'] ?? 5,
      comment: json['comment'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
      product: json['product'],
    );
  }
}
