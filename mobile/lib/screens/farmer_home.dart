import 'package:flutter/material.dart';
import 'farmer_dashboard.dart';
import 'manage_products.dart';
import 'farmer_orders.dart';
import 'active_bids.dart';
import 'profit_planning.dart';
import 'buyer_profile_screen.dart';
import '../models/user_profile.dart';
import '../services/api_service.dart';
import '../l10n/app_localizations.dart';

class FarmerHome extends StatefulWidget {
  const FarmerHome({super.key});

  @override
  State<FarmerHome> createState() => _FarmerHomeState();
}

class _FarmerHomeState extends State<FarmerHome> {
  int _selectedIndex = 0;
  UserProfile? _profile;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final json = await _apiService.updateProfile({});
      setState(() => _profile = UserProfile.fromJson(json));
    } catch (e) {
      debugPrint('Profile error: $e');
    }
  }

  List<Widget> get _screens => [
    const FarmerDashboard(),
    const ManageProductsScreen(),
    const FarmerOrdersScreen(),
    const ActiveBidsScreen(),
    const ProfitPlanningScreen(),
    BuyerProfileScreen(initialProfile: _profile, onUpdate: (p) => setState(() => _profile = p)),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedIndex,
          onTap: _onItemTapped,
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF16A34A),
          unselectedItemColor: Colors.grey,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 10),
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.dashboard_outlined),
              activeIcon: const Icon(Icons.dashboard),
              label: l10n.translate('explore'), // Reuse 'Explore' for Overview if needed, or add 'Overview'
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.grass_outlined),
              activeIcon: const Icon(Icons.grass),
              label: l10n.translate('my_crops'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.shopping_cart_outlined),
              activeIcon: const Icon(Icons.shopping_cart),
              label: l10n.translate('my_orders'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.gavel_outlined),
              activeIcon: const Icon(Icons.gavel),
              label: l10n.translate('active_bids'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.analytics_outlined),
              activeIcon: const Icon(Icons.analytics),
              label: l10n.translate('profit'),
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.person_outline),
              activeIcon: const Icon(Icons.person),
              label: l10n.translate('profile'),
            ),
          ],
        ),
      ),
    );
  }
}
