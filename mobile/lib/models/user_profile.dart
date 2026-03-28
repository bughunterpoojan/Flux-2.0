class UserProfile {
  final int id;
  final String username;
  final String email;
  final String role;
  final String? gstin;
  final bool isVerified;
  final String? businessName;
  final String? address;
  final double? locationLat;
  final double? locationLng;

  UserProfile({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.gstin,
    required this.isVerified,
    this.businessName,
    this.address,
    this.locationLat,
    this.locationLng,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'],
      username: json['username'],
      email: json['email'] ?? '',
      role: json['role'] ?? 'buyer',
      gstin: json['gstin'],
      isVerified: json['is_verified'] ?? false,
      businessName: json['business_name'],
      address: json['address'],
      locationLat: json['location_lat'] != null ? double.parse(json['location_lat'].toString()) : null,
      locationLng: json['location_lng'] != null ? double.parse(json['location_lng'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
      'business_name': businessName,
      'gstin': gstin,
      'address': address,
      'location_lat': locationLat,
      'location_lng': locationLng,
    };
  }
}
