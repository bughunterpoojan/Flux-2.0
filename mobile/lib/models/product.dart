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
    );
  }
}
