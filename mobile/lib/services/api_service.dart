import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../screens/login_screen.dart';
import 'package:flutter/material.dart';

class ApiService {
  static const String baseUrl = 'http://10.212.5.93:8000/api/'; // For Android Emulator and External Devices

  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('${baseUrl}auth/login/'),
      body: {'username': username, 'password': password},
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access', data['access']);
      await prefs.setString('refresh', data['refresh']);
      return data;
    } else {
      throw Exception('Failed to login');
    }
  }

  Future<List<dynamic>> getProducts() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}products/'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load products');
    }
  }

  Future<List<dynamic>> getOrders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}orders/'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load orders');
    }
  }

  Future<Map<String, dynamic>> createOrder({
    required List<Map<String, dynamic>> items,
    required double deliveryFee,
    required double distanceKm,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}orders/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'items': items,
        'delivery_fee': deliveryFee,
        'distance_km': distanceKm,
      }),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create order: ${response.body}');
    }
  }

  Future<void> updateOrderStatus(int id, String status, {String? logisticsPlan, String? deliverySlot, String? podCode}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final Map<String, dynamic> body = {'status': status};
    if (logisticsPlan != null) body['logistics_plan'] = logisticsPlan;
    if (deliverySlot != null) body['delivery_slot'] = deliverySlot;
    if (podCode != null) body['pod_code'] = podCode;

    final response = await http.patch(
      Uri.parse('${baseUrl}orders/$id/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(body),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to update order: ${response.body}');
    }
  }

  Future<void> setPodCode(int id, String podCode) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}orders/$id/set-pod/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'pod_code': podCode}),
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to set POD: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> createPaymentTransaction(int orderId, {String? paymentType}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final Map<String, dynamic> body = {'order_id': orderId};
    if (paymentType != null) body['payment_type'] = paymentType;

    final response = await http.post(
      Uri.parse('${baseUrl}payments/create/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(body),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create payment: ${response.body}');
    }
  }

  Future<void> verifyPaymentTransaction(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.put(
      Uri.parse('${baseUrl}payments/verify/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(data),
    );
    if (response.statusCode != 200) {
      throw Exception('Payment verification failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> getLogisticsQuote(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}logistics/quote/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'items': items}),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to get logistics quote');
    }
  }

  // Farmer Specific Methods
  Future<Map<String, dynamic>> getFarmerStats() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}farmer/stats/'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load farmer stats');
    }
  }

  Future<Map<String, dynamic>> getProfitPlanningData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}farmer/profit-planning/'),
      headers: {'Authorization': 'Bearer $token'},
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load profit planning data');
    }
  }

  Future<List<dynamic>> getMyProducts() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}products/?mine=true'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load your products');
    }
  }

  Future<void> addProduct(Map<String, String> data, String? imagePath) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    var request = http.MultipartRequest('POST', Uri.parse('${baseUrl}products/'));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(data);
    
    if (imagePath != null) {
      request.files.add(await http.MultipartFile.fromPath(
        'image',
        imagePath,
        contentType: MediaType('image', 'jpeg'),
      ));
    }

    var response = await request.send();
    if (response.statusCode != 201) {
      throw Exception('Failed to add product');
    }
  }

  Future<List<dynamic>> getNegotiations() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}negotiations/'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load negotiations');
    }
  }

  Future<void> actionNegotiation(int id, String action, {double? counterPrice}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final body = counterPrice != null ? json.encode({'counter_price': counterPrice}) : json.encode({});
    final response = await http.post(
      Uri.parse('${baseUrl}negotiations/$id/$action/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: body,
    );
    if (response.statusCode != 200) {
      throw Exception('Failed to $action negotiation');
    }
  }

  Future<String> getPriceSuggestion(String name, String category) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}price-suggestion/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'product_name': name, 'category': category}),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body)['suggested_price'];
    } else {
      throw Exception('Failed to get price suggestion');
    }
  }

  // Review Methods
  Future<List<dynamic>> getReviews({bool mine = false, bool farmer = false}) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    String url = '${baseUrl}reviews/';
    if (mine) url += '?mine=true';
    if (farmer) url += '?farmer=true';

    final response = await http.get(
      Uri.parse(url),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load reviews');
    }
  }

  Future<void> submitReview(int productId, int rating, String comment) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}reviews/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'product': productId,
        'rating': rating,
        'comment': comment,
      }),
    );
    if (response.statusCode != 201) {
      throw Exception('Failed to submit review: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.patch(
      Uri.parse('${baseUrl}auth/profile/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode(data),
    ).timeout(const Duration(seconds: 10));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to update profile');
    }
  }

  Future<void> register(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('${baseUrl}auth/register/'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode != 201) {
      throw Exception('Registration failed: ${response.body}');
    }
  }

  Future<Map<String, dynamic>> verifyGSTIN(String gstin) async {
    final response = await http.get(
      Uri.parse('${baseUrl}gstin/?gstin=$gstin'),
    ).timeout(const Duration(seconds: 15));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('GSTIN verification failed: ${response.body}');
    }
  }

  Future<List<dynamic>> getNegotiationMessages(int negotiationId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.get(
      Uri.parse('${baseUrl}negotiation-messages/?negotiation=$negotiationId'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load messages');
    }
  }

  Future<Map<String, dynamic>> sendNegotiationMessage(int negotiationId, String message) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.post(
      Uri.parse('${baseUrl}negotiation-messages/'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'negotiation': negotiationId,
        'text': message,
      }),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to send message: ${response.body}');
    }
  }

  Future<void> deleteProduct(int id) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    final response = await http.delete(
      Uri.parse('${baseUrl}products/$id/'),
      headers: {'Authorization': 'Bearer $token'},
    );
    if (response.statusCode != 204) {
      throw Exception('Failed to delete product');
    }
  }

  Future<void> updateProduct(int id, Map<String, String> data, String? imagePath) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    var request = http.MultipartRequest('PATCH', Uri.parse('${baseUrl}products/$id/'));
    request.headers['Authorization'] = 'Bearer $token';
    request.fields.addAll(data);
    
    if (imagePath != null && !imagePath.startsWith('http')) {
      request.files.add(await http.MultipartFile.fromPath(
        'image',
        imagePath,
        contentType: MediaType('image', 'jpeg'),
      ));
    }

    var response = await request.send();
    if (response.statusCode != 200) {
      throw Exception('Failed to update product');
    }
  }

  static Future<void> logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (context.mounted) {
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  }
}
