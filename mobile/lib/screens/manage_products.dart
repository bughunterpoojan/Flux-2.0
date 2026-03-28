import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/product.dart';
import 'package:google_fonts/google_fonts.dart';
import 'add_product_screen.dart';

class ManageProductsScreen extends StatefulWidget {
  const ManageProductsScreen({super.key});

  @override
  State<ManageProductsScreen> createState() => _ManageProductsScreenState();
}

class _ManageProductsScreenState extends State<ManageProductsScreen> {
  late Future<List<Product>> _productsFuture;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _productsFuture = _apiService.getMyProducts().then((data) => data.map((i) => Product.fromJson(i)).toList());
  }

  void _refresh() {
    setState(() {
      _productsFuture = _apiService.getMyProducts().then((data) => data.map((i) => Product.fromJson(i)).toList());
    });
  }

  Future<void> _deleteProduct(int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Crop?'),
        content: const Text('Are you sure you want to remove this listing? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _apiService.deleteProduct(id);
        _refresh();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product deleted')));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('My Crops', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () => ApiService.logout(context),
            icon: const Icon(Icons.logout, color: Colors.blueGrey),
          ),
          IconButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const AddProductScreen())).then((_) => _refresh()),
            icon: const Icon(Icons.add_circle, color: Color(0xFF16A34A), size: 30),
          ),
          const SizedBox(width: 10),
        ],
      ),
      body: FutureBuilder<List<Product>>(
        future: _productsFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF16A34A)));
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          final products = snapshot.data!;

          if (products.isEmpty) {
            return _buildEmptyState();
          }

          return RefreshIndicator(
            onRefresh: () async => _refresh(),
            child: ListView.separated(
              padding: const EdgeInsets.only(left: 20, right: 20, top: 20, bottom: 100),
              itemCount: products.length,
              separatorBuilder: (c, i) => const SizedBox(height: 15),
              itemBuilder: (context, index) {
                final product = products[index];
                return _buildProductCard(product);
              },
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const AddProductScreen())).then((_) => _refresh()),
        backgroundColor: const Color(0xFF16A34A),
        icon: const Icon(Icons.add),
        label: const Text('Add New Crop'),
        elevation: 10,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 80, color: Colors.blueGrey[200]),
          const SizedBox(height: 20),
          Text('No products yet', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blueGrey[900])),
          const SizedBox(height: 10),
          Text('Start listing your crops to get discovered.', style: GoogleFonts.outfit(fontSize: 14, color: Colors.blueGrey[500])),
          const SizedBox(height: 30),
          ElevatedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => const AddProductScreen())).then((_) => _refresh()),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF16A34A), padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))),
            child: const Text('List First Crop', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.blueGrey[100]!),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            child: AspectRatio(
              aspectRatio: 16 / 9,
              child: Image.network(
                product.image ?? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600',
                fit: BoxFit.cover,
                errorBuilder: (c, e, s) => Container(color: Colors.blueGrey[100], child: Icon(Icons.image_outlined, size: 40, color: Colors.blueGrey)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(product.name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.blueGrey[900]), overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 10),
                    Text('₹${product.price.toStringAsFixed(0)}/${product.unit}', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF16A34A))),
                  ],
                ),
                const SizedBox(height: 5),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: Colors.blueGrey[50], borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.blueGrey[100]!)),
                  child: Text(product.category.toUpperCase(), style: GoogleFonts.outfit(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.blueGrey[500], letterSpacing: 1)),
                ),
                const SizedBox(height: 15),
                Text(product.description, style: GoogleFonts.outfit(fontSize: 13, color: Colors.blueGrey[500]), maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.storefront, size: 18, color: Color(0xFF16A34A)),
                        const SizedBox(width: 5),
                        Text('Stock: ${product.stock} ${product.unit}', style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.blueGrey[700])),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (c) => AddProductScreen(product: product))).then((_) => _refresh()), 
                          icon: Icon(Icons.edit_outlined, color: Colors.blueGrey)
                        ),
                        IconButton(
                          onPressed: () => _deleteProduct(product.id), 
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent)
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
