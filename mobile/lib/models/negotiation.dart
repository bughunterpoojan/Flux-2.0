class Negotiation {
  final int id;
  final String? productName;
  final String? productImage;
  final String? buyerName;
  final String? farmerName;
  final double offeredPrice;
  final double originalPrice;
  final String? unit;
  final String? message;
  final String status;
  final double? farmerCounterPrice;

  Negotiation({
    required this.id,
    this.productName,
    this.productImage,
    this.buyerName,
    this.farmerName,
    required this.offeredPrice,
    required this.originalPrice,
    this.unit,
    this.message,
    required this.status,
    this.farmerCounterPrice,
  });

  factory Negotiation.fromJson(Map<String, dynamic> json) {
    return Negotiation(
      id: json['id'],
      productName: json['product_name'],
      productImage: json['product_image'],
      buyerName: json['buyer_name'],
      farmerName: json['farmer_name'],
      offeredPrice: double.parse(json['offered_price'].toString()),
      originalPrice: double.parse(json['original_price'].toString()),
      unit: json['unit'],
      message: json['message'],
      status: json['status'],
      farmerCounterPrice: json['farmer_counter_price'] != null 
          ? double.parse(json['farmer_counter_price'].toString()) 
          : null,
    );
  }
}
