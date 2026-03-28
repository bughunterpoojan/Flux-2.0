import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/login_screen.dart';
import 'screens/buyer_home.dart';
import 'screens/farmer_home.dart';
import 'services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const AgriMarketApp());
}

class AgriMarketApp extends StatelessWidget {
  const AgriMarketApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AgriMarket',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3e9150),
          primary: const Color(0xFF3e9150),
          secondary: const Color(0xFF2e753d),
        ),
        textTheme: GoogleFonts.outfitTextTheme(),
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isLoading = true;
  bool _isLoggedIn = false;
  String _role = 'buyer';

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access');
    
    if (token != null) {
      try {
        // Add a 5-second timeout to prevent indefinite hanging
        final profile = await ApiService().updateProfile({}).timeout(
          const Duration(seconds: 5),
          onTimeout: () => throw Exception('Connection timeout'),
        );
        _role = profile['role'] ?? 'buyer';
        _isLoggedIn = true;
      } catch (e) {
        _isLoggedIn = false;
        debugPrint('Auth check failed: $e');
      }
    } else {
      _isLoggedIn = false;
    }

    setState(() {
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_isLoggedIn) {
      return _role == 'farmer' ? const FarmerHome() : const BuyerHomeScreen();
    }
    return const LoginScreen();
  }
}
