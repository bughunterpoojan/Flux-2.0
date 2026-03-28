import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/user_profile.dart';
import 'explore_screen.dart';
import 'buyer_orders_screen.dart';
import 'buyer_bids_screen.dart';
import 'buyer_profile_screen.dart';

class BuyerHomeShell extends StatefulWidget {
  const BuyerHomeShell({super.key});

  @override
  State<BuyerHomeShell> createState() => _BuyerHomeShellState();
}

class _BuyerHomeShellState extends State<BuyerHomeShell> {
  int _currentIndex = 0;
  UserProfile? _profile;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final data = await _apiService.updateProfile({});
      setState(() => _profile = UserProfile.fromJson(data));
    } catch (e) {
      debugPrint('Failed to load profile: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      ExploreScreen(onAddToCart: (p) => setState(() => _currentIndex = 1), profile: _profile),
      const BuyerOrdersScreen(),
      const BuyerBidsScreen(),
      BuyerProfileScreen(initialProfile: _profile, onUpdate: (p) => setState(() => _profile = p)),
    ];

    final List<String> titles = ['AgriBuyer', 'My Orders', 'Active Bids', 'Settings'];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(titles[_currentIndex], style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          if (_currentIndex == 0)
            IconButton(onPressed: () {}, icon: const Icon(Icons.shopping_cart_outlined, color: Colors.blueGrey)),
          IconButton(onPressed: () => ApiService.logout(context), icon: const Icon(Icons.logout, color: Colors.blueGrey)),
          const SizedBox(width: 10),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, -5)),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) => setState(() => _currentIndex = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF16A34A),
          unselectedItemColor: Colors.blueGrey[200],
          selectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
          unselectedLabelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 12),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: 'Explore'),
            BottomNavigationBarItem(icon: Icon(Icons.shopping_bag_outlined), activeIcon: Icon(Icons.shopping_bag), label: 'Orders'),
            BottomNavigationBarItem(icon: Icon(Icons.message_outlined), activeIcon: Icon(Icons.message), label: 'Bids'),
            BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
          ],
        ),
      ),
    );
  }
}
