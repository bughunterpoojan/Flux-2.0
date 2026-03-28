import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../models/user_profile.dart';
import '../l10n/app_localizations.dart';
import '../providers/language_provider.dart';

class BuyerProfileScreen extends StatefulWidget {
  final UserProfile? initialProfile;
  final Function(UserProfile) onUpdate;

  const BuyerProfileScreen({super.key, this.initialProfile, required this.onUpdate});

  @override
  State<BuyerProfileScreen> createState() => _BuyerProfileScreenState();
}

class _BuyerProfileScreenState extends State<BuyerProfileScreen> {
  final ApiService _apiService = ApiService();
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _businessController;
  late TextEditingController _gstinController;
  late TextEditingController _addressController;
  late TextEditingController _latController;
  late TextEditingController _lngController;
  
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _businessController = TextEditingController(text: widget.initialProfile?.businessName);
    _gstinController = TextEditingController(text: widget.initialProfile?.gstin);
    _addressController = TextEditingController(text: widget.initialProfile?.address);
    _latController = TextEditingController(text: widget.initialProfile?.locationLat?.toString());
    _lngController = TextEditingController(text: widget.initialProfile?.locationLng?.toString());
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    try {
      final data = {
        'business_name': _businessController.text,
        'gstin': _gstinController.text,
        'address': _addressController.text,
        'location_lat': double.tryParse(_latController.text),
        'location_lng': double.tryParse(_lngController.text),
      };
      
      final updatedData = await _apiService.updateProfile(data);
      if (!mounted) return;
      final updatedProfile = UserProfile.fromJson(updatedData);
      widget.onUpdate(updatedProfile);
      
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final langProvider = Provider.of<LanguageProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(25),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Stack(
                children: [
                  CircleAvatar(radius: 50, backgroundColor: Colors.blueGrey[50], child: Icon(Icons.person, size: 50, color: Colors.blueGrey[300])),
                  Positioned(bottom: 0, right: 0, child: CircleAvatar(radius: 15, backgroundColor: Color(0xFF16A34A), child: Icon(Icons.edit, size: 15, color: Colors.white))),
                ],
              ),
            ),
            const SizedBox(height: 30),
            _buildSectionHeader(l10n.translate('change_language')),
            const SizedBox(height: 15),
            Row(
              children: [
                _buildLanguageChip('English', 'en', langProvider),
                const SizedBox(width: 15),
                _buildLanguageChip('हिंदी', 'hi', langProvider),
              ],
            ),
            const SizedBox(height: 30),
            _buildSectionHeader('Business Identity'),
            const SizedBox(height: 15),
            _buildField('Business Name', _businessController, Icons.storefront),
            const SizedBox(height: 15),
            _buildField('GSTIN', _gstinController, Icons.verified_user_outlined),
            const SizedBox(height: 30),
            _buildSectionHeader('Logistics & Delivery'),
            const SizedBox(height: 15),
            _buildField('Delivery Address', _addressController, Icons.location_on_outlined, maxLines: 3),
            const SizedBox(height: 15),
            Row(
              children: [
                Expanded(child: _buildField('Latitude', _latController, Icons.map_outlined, keyboardType: TextInputType.number)),
                const SizedBox(width: 15),
                Expanded(child: _buildField('Longitude', _lngController, Icons.map_outlined, keyboardType: TextInputType.number)),
              ],
            ),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _saveProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  elevation: 0,
                ),
                child: _isSaving 
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(l10n.translate('status') == 'delivered' ? 'Save Changes' : 'Save Changes', style: GoogleFonts.outfit(fontWeight: FontWeight.w900, fontSize: 16)), 
              ),
            ),
            const SizedBox(height: 15),
            SizedBox(
              width: double.infinity,
              child: TextButton.icon(
                onPressed: () => ApiService.logout(context),
                icon: const Icon(Icons.logout, color: Colors.red),
                label: Text(l10n.translate('logout'), style: GoogleFonts.outfit(color: Colors.red, fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildLanguageChip(String label, String code, LanguageProvider provider) {
    final isSelected = provider.currentLocale.languageCode == code;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (val) {
        if (val) provider.changeLanguage(code);
      },
      selectedColor: const Color(0xFF16A34A).withOpacity(0.1),
      labelStyle: GoogleFonts.outfit(
        color: isSelected ? const Color(0xFF16A34A) : Colors.blueGrey,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(title, style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.blueGrey[400], letterSpacing: 1));
  }

  Widget _buildField(String label, TextEditingController controller, IconData icon, {int maxLines = 1, TextInputType keyboardType = TextInputType.text}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: Colors.blueGrey[200]),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.blueGrey[50]!)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Colors.blueGrey[50]!)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: BorderSide(color: Color(0xFF16A34A))),
      ),
    );
  }
}
