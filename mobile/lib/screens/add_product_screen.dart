import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/product.dart';
import '../services/api_service.dart';
import 'package:google_fonts/google_fonts.dart';

class AddProductScreen extends StatefulWidget {
  final Product? product;
  const AddProductScreen({super.key, this.product});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  final ImagePicker _picker = ImagePicker();
  
  late String name;
  late String category;
  late double price;
  late int stock;
  late String description;
  late String unit;
  XFile? _image;
  bool _isLoading = false;
  bool _isAiLoading = false;

  final List<String> _categories = ['vegetables', 'fruits', 'grains', 'dairy', 'poultry'];
  final List<String> _units = ['kg', 'quintal', 'ton', 'box', 'piece', 'liter'];

  @override
  void initState() {
    super.initState();
    name = widget.product?.name ?? '';
    category = widget.product?.category ?? 'vegetables';
    price = widget.product?.price ?? 0;
    stock = int.tryParse(widget.product?.stock ?? '0') ?? 0;
    description = widget.product?.description ?? '';
    unit = widget.product?.unit ?? 'kg';
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    setState(() {
      _image = image;
    });
  }

  Future<void> _getAiSuggestion() async {
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter crop name first')));
      return;
    }
    setState(() => _isAiLoading = true);
    try {
      final suggestion = await _apiService.getPriceSuggestion(name, category);
      if (!mounted) return;
      setState(() {
        price = double.tryParse(suggestion) ?? price;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('AI suggests ₹$suggestion per $unit')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error getting AI suggestion: $e')));
    } finally {
      if (mounted) {
        setState(() => _isAiLoading = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    try {
      final data = {
        'name': name,
        'category': category,
        'price': price.toString(),
        'stock': stock.toString(),
        'description': description,
        'unit': unit,
      };
      
      if (widget.product != null) {
        await _apiService.updateProduct(widget.product!.id, data, _image?.path);
      } else {
        if (_image == null) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload a product photo')));
          setState(() => _isLoading = false);
          return;
        }
        await _apiService.addProduct(data, _image?.path);
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.product != null ? 'Product updated!' : 'Product listed!')));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(widget.product != null ? 'Edit Crop' : 'List New Crop', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)))
        : SingleChildScrollView(
            padding: const EdgeInsets.all(25),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildImagePicker(),
                  const SizedBox(height: 30),
                  _buildTextField('Crop Name', (v) => name = v!, Icons.grass),
                  const SizedBox(height: 20),
                  _buildDropdown('Category', category, _categories, (v) => setState(() => category = v!)),
                  const SizedBox(height: 20),
                  _buildPriceField(),
                  const SizedBox(height: 20),
                  _buildStockAndUnitFields(),
                  const SizedBox(height: 20),
                  _buildTextField('Description', (v) => description = v!, Icons.description, maxLines: 3),
                  const SizedBox(height: 40),
                  _buildSubmitButton(),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildImagePicker() {
    return GestureDetector(
      onTap: _pickImage,
      child: Container(
        height: 200,
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.blueGrey[50],
          borderRadius: BorderRadius.circular(30),
          border: Border.all(color: Colors.blueGrey[100]!),
        ),
        child: _image == null && widget.product?.image == null
            ? Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt_outlined, size: 40, color: Colors.blueGrey[300]),
                  const SizedBox(height: 10),
                  Text('Upload Photo', style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.blueGrey[400])),
                ],
              )
            : ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: _image != null 
                  ? Image.file(File(_image!.path), fit: BoxFit.cover)
                  : Image.network(widget.product!.image!, fit: BoxFit.cover),
              ),
      ),
    );
  }

  Widget _buildTextField(String label, FormFieldSetter<String> onSaved, IconData icon, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400], letterSpacing: 0.5)),
        const SizedBox(height: 10),
        TextFormField(
          initialValue: (label == 'Crop Name') ? name : description,
          maxLines: maxLines,
          decoration: InputDecoration(
            prefixIcon: Icon(icon, color: const Color(0xFF16A34A), size: 18),
            filled: true,
            fillColor: Colors.blueGrey[50],
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
          ),
          onChanged: (v) {
            if (label == 'Crop Name') name = v;
          },
          onSaved: onSaved,
          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
        ),
      ],
    );
  }

  Widget _buildDropdown(String label, String value, List<String> items, ValueChanged<String?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400], letterSpacing: 0.5)),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(color: Colors.blueGrey[50], borderRadius: BorderRadius.circular(20)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              items: items.map((i) => DropdownMenuItem(value: i, child: Text(i.toUpperCase(), style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPriceField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Price per $unit', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400], letterSpacing: 0.5)),
            GestureDetector(
              onTap: _isAiLoading ? null : _getAiSuggestion,
              child: Row(
                children: [
                  Icon(Icons.auto_awesome, size: 14, color: _isAiLoading ? Colors.grey : const Color(0xFF16A34A)),
                  const SizedBox(width: 5),
                  Text(
                    _isAiLoading ? 'Analyzing...' : 'Get AI Price',
                    style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: _isAiLoading ? Colors.grey : const Color(0xFF16A34A)),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        TextFormField(
          key: Key(price.toString()),
          initialValue: price > 0 ? price.toString() : '',
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            prefixIcon: const Icon(Icons.currency_rupee, color: Color(0xFF16A34A), size: 18),
            filled: true,
            fillColor: Colors.blueGrey[50],
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
          ),
          onSaved: (v) => price = double.tryParse(v!) ?? 0,
          validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
        ),
      ],
    );
  }

  Widget _buildStockAndUnitFields() {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Available Stock', style: GoogleFonts.outfit(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blueGrey[400], letterSpacing: 0.5)),
              const SizedBox(height: 10),
              TextFormField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.inventory_2, color: Color(0xFF16A34A), size: 18),
                  filled: true,
                  fillColor: Colors.blueGrey[50],
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(20), borderSide: BorderSide.none),
                ),
                onSaved: (v) => stock = int.tryParse(v!) ?? 0,
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
            ],
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          flex: 1,
          child: _buildDropdown('Unit', unit, _units, (v) => setState(() => unit = v!)),
        ),
      ],
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      height: 60,
      child: ElevatedButton(
        onPressed: _submit,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF16A34A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          elevation: 10,
          shadowColor: const Color(0xFF16A34A).withValues(alpha: 0.5),
        ),
        child: Text(widget.product != null ? 'Update Listing' : 'List Crop on Market', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
      ),
    );
  }
}
