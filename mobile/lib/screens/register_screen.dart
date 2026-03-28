import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../l10n/app_localizations.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _gstinController = TextEditingController();
  final _ownerNameController = TextEditingController();
  final _addressController = TextEditingController();
  
  final _apiService = ApiService();
  String _role = 'buyer';
  bool _isLoading = false;
  bool _verifyingGstin = false;
  bool _gstinVerified = false;

  Future<void> _handleRegister() async {
    final l10n = AppLocalizations.of(context)!;
    setState(() => _isLoading = true);
    try {
      await _apiService.register({
        'username': _usernameController.text,
        'email': _emailController.text,
        'password': _passwordController.text,
        'role': _role,
        'gstin': _role == 'buyer' ? _gstinController.text : '',
        'business_name': _ownerNameController.text,
        'address': _addressController.text,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.registrationSuccess)),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${l10n.registrationFailed}$e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleVerifyGstin() async {
    final l10n = AppLocalizations.of(context)!;
    if (_gstinController.text.length < 15) return;
    
    setState(() => _verifyingGstin = true);
    try {
      final data = await _apiService.verifyGSTIN(_gstinController.text.toUpperCase());
      setState(() {
        _ownerNameController.text = data['taxpayer_name'] ?? '';
        _addressController.text = data['registered_address'] ?? '';
        _gstinVerified = true;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.gstinVerificationFailed)),
        );
      }
    } finally {
      setState(() => _verifyingGstin = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.white, elevation: 0, leading: const BackButton(color: Colors.black)),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                l10n.signup,
                style: GoogleFonts.outfit(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                l10n.joinCommunity,
                style: const TextStyle(fontSize: 16, color: Colors.grey),
              ),
              const SizedBox(height: 32),
              
              // Role Selection
              Text(l10n.iAmA, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildRoleButton(l10n.buyerRole, 'buyer'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildRoleButton(l10n.farmerRole, 'farmer'),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              _buildField(l10n.username, l10n.usernameHint, _usernameController, false),
              const SizedBox(height: 20),
              _buildField(l10n.email, l10n.emailHint, _emailController, false),
              const SizedBox(height: 20),
              _buildField(l10n.password, l10n.passwordHint, _passwordController, true),
              
              const SizedBox(height: 24),
              const Divider(color: Color(0xFFF1F5F9)),
              const SizedBox(height: 24),

              // Verification Section
              if (_role == 'buyer') ...[
                Text(l10n.businessVerification, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _gstinController,
                        decoration: _inputDecoration(l10n.enterGstin),
                        textCapitalization: TextCapitalization.characters,
                        onChanged: (val) {
                          if (val.length == 15) _handleVerifyGstin();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: _verifyingGstin || _gstinController.text.isEmpty ? null : _handleVerifyGstin,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: _verifyingGstin 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Icon(_gstinVerified ? Icons.check_circle : Icons.verified_user),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
              ],

              _buildField(_role == 'buyer' ? l10n.ownerName : l10n.farmName, l10n.farmNameHint, _ownerNameController, false),
              const SizedBox(height: 20),
              _buildField(l10n.address, l10n.addressHint, _addressController, false, maxLines: 3),
              
              const SizedBox(height: 40),
              SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  child: _isLoading 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(l10n.register, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRoleButton(String label, String role) {
    bool isSelected = _role == role;
    return GestureDetector(
      onTap: () => setState(() => _role = role),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.grey[100],
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? const Color(0xFF16A34A) : Colors.transparent, width: 2),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? const Color(0xFF166534) : Colors.grey[600],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildField(String label, String hint, TextEditingController controller, bool isPassword, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isPassword,
          maxLines: maxLines,
          decoration: _inputDecoration(hint),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: Colors.grey[100],
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
    );
  }
}
