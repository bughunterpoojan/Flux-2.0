class Order {
  final int id;
  final String status;
  final double totalAmount;
  final double deliveryFee;
  final double initialDeliveryFee;
  final double additionalShippingFee;
  final bool additionalShippingPaid;
  final String? logisticsPlan;
  final String? deliverySlot;
  final double? distanceKm;
  final DateTime createdAt;
  final List<OrderItem> items;
  final String? buyerName;
  final bool podRequired;
  final bool podConfigured;
  final bool podVerified;

  Order({
    required this.id,
    required this.status,
    required this.totalAmount,
    required this.deliveryFee,
    required this.initialDeliveryFee,
    required this.additionalShippingFee,
    required this.additionalShippingPaid,
    this.logisticsPlan,
    this.deliverySlot,
    this.distanceKm,
    required this.createdAt,
    required this.items,
    this.buyerName,
    required this.podRequired,
    required this.podConfigured,
    required this.podVerified,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: json['id'],
      status: json['status'],
      totalAmount: double.parse(json['total_amount'].toString()),
      deliveryFee: double.parse(json['delivery_fee'].toString()),
      initialDeliveryFee: double.parse(json['initial_delivery_fee'].toString()),
      additionalShippingFee: double.parse(json['additional_shipping_fee'].toString()),
      additionalShippingPaid: json['additional_shipping_paid'] ?? false,
      logisticsPlan: json['logistics_plan'],
      deliverySlot: json['delivery_slot'],
      distanceKm: json['distance_km'] != null ? double.parse(json['distance_km'].toString()) : null,
      createdAt: DateTime.parse(json['created_at']),
      items: (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList(),
      buyerName: json['buyer_name'],
      podRequired: json['pod_required'] ?? false,
      podConfigured: json['pod_configured'] ?? false,
      podVerified: json['pod_verified'] ?? false,
    );
  }
}

class OrderItem {
  final int id;
  final int productId;
  final String productName;
  final double quantity;
  final double priceAtOrder;

  OrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.priceAtOrder,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: json['id'],
      productId: json['product'],
      productName: json['product_name'] ?? 'Unknown Product',
      quantity: double.parse(json['quantity'].toString()),
      priceAtOrder: double.parse(json['price_at_order'].toString()),
    );
  }
}
