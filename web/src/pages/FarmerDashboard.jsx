import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, ShoppingCart, TrendingUp, LogOut, 
  Trash2, Edit, ChevronRight, LayoutDashboard, History,
  Sparkles, Loader2, IndianRupee, MapPin, Store, CheckCircle, Clock, ArrowRight, MessageCircle, User, BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FarmerProfitDecisionDashboard from './FarmerProfitDecisionDashboard';

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', category: 'vegetables', price: '', stock: '', description: '', unit: 'kg', location: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [categoryError, setCategoryError] = useState(false);
  const [negotiations, setNegotiations] = useState([]);
  const [showCounterModal, setShowCounterModal] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [profileForm, setProfileForm] = useState({
    email: '',
    business_name: '',
    gstin: '',
    address: '',
    location_lat: '',
    location_lng: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const navigate = useNavigate();

  const openAddModal = () => {
    setEditingProduct(null);
    setNewProduct({ 
      name: '', 
      category: 'vegetables', 
      price: '', 
      stock: '', 
      description: '', 
      unit: 'kg', 
      location: userProfile?.address || '' 
    });
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setNewProduct({ 
      ...product, 
      location: product.location || product.address || userProfile?.address || '' 
    });
    setShowAddModal(true);
  };

  const [dashboardStats, setDashboardStats] = useState({ total_revenue: 0, active_listings: 0, pending_orders: 0, chart_data: [] });
  
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    if (userProfile?.address && !newProduct.location) {
      setNewProduct(prev => ({ ...prev, location: userProfile.address }));
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    setProfileForm({
      email: userProfile.email || '',
      business_name: userProfile.business_name || '',
      gstin: userProfile.gstin || '',
      address: userProfile.address || '',
      location_lat: userProfile.location_lat ?? '',
      location_lng: userProfile.location_lng ?? ''
    });
  }, [userProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, profileRes, statsRes, negotiationsRes] = await Promise.all([
        api.get('products/?mine=true'),
        api.get('orders/'),
        api.get('auth/profile/'),
        api.get('farmer/stats/'),
        api.get('negotiations/')
      ]);
      
      setProducts(prodRes.data);
      setOrders(orderRes.data);
      setUserProfile(profileRes.data);
      setDashboardStats(statsRes.data);
      setNegotiations(negotiationsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage('');

    try {
      const payload = {
        email: profileForm.email,
        business_name: profileForm.business_name,
        gstin: profileForm.gstin,
        address: profileForm.address,
        location_lat: profileForm.location_lat === '' ? null : Number(profileForm.location_lat),
        location_lng: profileForm.location_lng === '' ? null : Number(profileForm.location_lng)
      };

      const response = await api.patch('auth/profile/', payload);
      setUserProfile(response.data);
      setProfileMessage('Profile updated successfully.');
    } catch (err) {
      setProfileMessage('Unable to update profile. Please try again.');
      console.error(err);
    } finally {
      setProfileSaving(false);
    }
  };

  const getAiSuggestion = async () => {
    if (!newProduct.name) return;
    setAiLoading(true);
    setCategoryError(false);
    try {
      const res = await api.post('price-suggestion/', { 
        product_name: newProduct.name, 
        category: newProduct.category,
        unit: newProduct.unit,
        location: newProduct.location || undefined
      });
      
      if (res.data.suggested_price === 'INVALID_CATEGORY') {
        setCategoryError(true);
        setNewProduct({ ...newProduct, price: '' });
      } else {
        setNewProduct({ ...newProduct, price: res.data.suggested_price });
        setCategoryError(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (categoryError) {
      alert("Please correct the category mismatch first.");
      return;
    }
    if (!selectedFile && !editingProduct) {
      alert("Please upload a product photo.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('name', newProduct.name);
    formData.append('category', newProduct.category);
    formData.append('price', newProduct.price);
    formData.append('stock', newProduct.stock);
    formData.append('description', newProduct.description);
    formData.append('unit', newProduct.unit);
    formData.append('address', newProduct.location || '');
    formData.append('location_lat', userProfile?.location_lat || '');
    formData.append('location_lng', userProfile?.location_lng || '');

    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      if (editingProduct) {
        await api.put(`products/${editingProduct.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('products/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowAddModal(false);
      setEditingProduct(null);
      setNewProduct({ name: '', category: 'vegetables', price: '', stock: '', description: '', unit: 'kg' });
      setSelectedFile(null);
      setImagePreview(null);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await api.delete(`products/${id}/`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateOrderStatus = async (order) => {
    const statusCycle = ['pending', 'accepted', 'shipped', 'delivered'];
    const currentIndex = statusCycle.indexOf(order.status);
    if (order.status === 'delivered') return;
    const nextStatus = statusCycle[currentIndex + 1];
    try {
      await api.patch(`orders/${order.id}/`, { status: nextStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNegotiationAction = async (id, action, counterValue = null, messageValue = '') => {
    if (typeof id === 'string' && id.startsWith('demo-bid-')) {
      alert('This is a demo bid for UI preview. Real actions will work when buyer bids are available.');
      return;
    }

    try {
      const payload = action === 'counter'
        ? { counter_price: counterValue, message: messageValue || '' }
        : {};
      await api.post(`negotiations/${id}/${action}/`, payload);
      setShowCounterModal(null);
      setCounterPrice('');
      setCounterMessage('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  const demoBid = {
    id: 'demo-bid-1',
    product_name: 'Premium Nashik Onions',
    product_image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=600',
    buyer_name: 'Demo Buyer',
    offered_price: '39.00',
    original_price: '52.00',
    unit: 'kg',
    message: 'Need 2 tons weekly, can you offer a better wholesale rate?',
    status: 'pending',
    farmer_counter_price: null,
  };

  const displayedNegotiations = negotiations.length > 0 ? negotiations : [demoBid];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col p-8 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">AgriFarmer</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard size={22} /> Overview
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profit' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <BarChart3 size={22} /> Profit Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Package size={22} /> My Products
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <ShoppingCart size={22} /> Incoming Orders
          </button>
          <button 
            onClick={() => setActiveTab('bids')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'bids' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <MessageCircle size={22} /> Active Bids
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <History size={22} /> Sales History
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <User size={22} /> My Profile
          </button>
        </nav>

        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 px-6 py-4 text-slate-500 font-bold hover:text-red-500 transition-colors"
        >
          <LogOut size={22} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12 overflow-y-auto">
        {activeTab !== 'profit' && (
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                Welcome back, <span className="text-primary-600">
                  {userProfile ? (userProfile.business_name || userProfile.username) : 'Farmer...'}
                </span>
              </h1>
              <p className="text-slate-500 font-medium">Here's what's happening on your farm today.</p>
            </div>
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-[1.02]"
            >
              <Plus size={22} /> Add New Crop
            </button>
          </header>
        )}

        {activeTab === 'profit' && (
          <FarmerProfitDecisionDashboard userProfile={userProfile} />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600">
                  <IndianRupee size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Monthly Revenue</span>
                <span className="text-4xl font-black text-slate-900">₹{dashboardStats.total_revenue.toLocaleString('en-IN')}</span>
                <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-lg self-start">Real-time performance</span>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                  <Package size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Active Listings</span>
                <span className="text-4xl font-black text-slate-900">{dashboardStats.active_listings}</span>
                <span className="text-slate-600 font-bold text-sm">Crops currently on sale</span>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600">
                  <Clock size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Pending Orders</span>
                <span className="text-4xl font-black text-slate-900">{dashboardStats.pending_orders}</span>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="text-primary-600 font-bold text-sm hover:underline self-start"
                >
                  View all in queue
                </button>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">Revenue Forecast</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardStats.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontWeight: 600}} dx={-10} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={4} dot={{r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img src={product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 right-4 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <button 
                      onClick={() => openEditModal(product)}
                      className="p-3 bg-white text-slate-700 rounded-xl shadow-lg hover:text-primary-600"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-3 bg-white text-slate-700 rounded-xl shadow-lg hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <span className="px-4 py-1.5 bg-primary-600 text-white text-xs font-black uppercase rounded-lg shadow-lg">{product.category}</span>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-black text-slate-900">{product.name}</h4>
                    <span className="text-lg font-black text-slate-900">₹{product.price}<span className="text-sm text-slate-400 font-bold ml-1">/{product.unit}</span></span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">{product.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-primary-600">
                      <Store size={18} />
                      <span className="text-sm font-bold">Stock: {product.stock} {product.unit}</span>
                    </div>
                    <button 
                      onClick={() => openEditModal(product)}
                      className="text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      <ChevronRight size={22} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="bg-slate-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
                  <Package size={40} />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-2">No products yet</h4>
                <p className="text-slate-500 font-medium mb-8">Start listing your crops to get discovered by buyers.</p>
                <button onClick={openAddModal} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl">Add Your First Crop</button>
              </div>
            )}
          </div>
        )}

        {/* Orders Table */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">Order ID</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">Buyer</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">Amount</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <span className="font-bold text-slate-900 text-lg">#{order.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">{order.buyer_name[0]}</div>
                        <span className="font-bold text-slate-700">{order.buyer_name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg">₹{order.total_amount}</span>
                        <span className="text-[10px] text-slate-400 font-bold italic">Incl. ₹{order.delivery_fee} logistics</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase ${
                        order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => handleUpdateOrderStatus(order)}
                        className="text-primary-600 font-black hover:underline"
                      >
                        {order.status === 'pending' ? 'Accept Order' : 
                         order.status === 'accepted' ? 'Mark as Shipped' :
                         order.status === 'shipped' ? 'Mark as Delivered' : 'Completed'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">Active Bids</h2>
                <p className="text-slate-500 font-medium">Review buyer offers and accept, reject, or send counter offers.</p>
              </div>
              {negotiations.length === 0 && (
                <span className="px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 text-xs font-bold uppercase tracking-wide">
                  Showing Demo Bid
                </span>
              )}
            </div>

            <div className="grid gap-6">
              {displayedNegotiations.map((bid) => (
                <div key={bid.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                        <img
                          src={bid.product_image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600'}
                          alt={bid.product_name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900">{bid.product_name || 'Product'}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                            bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            bid.status === 'countered' ? 'bg-blue-100 text-blue-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {bid.status}
                          </span>
                        </div>

                        <p className="text-sm text-slate-500 font-bold">Buyer: {bid.buyer_name || 'Buyer'}</p>

                        <div className="flex flex-wrap gap-4 text-sm font-bold">
                          <span className="text-slate-400 line-through">Original: ₹{bid.original_price}/{bid.unit || 'kg'}</span>
                          <span className="text-primary-700">Offered: ₹{bid.offered_price}/{bid.unit || 'kg'}</span>
                          {bid.farmer_counter_price && (
                            <span className="text-blue-700">Counter: ₹{bid.farmer_counter_price}/{bid.unit || 'kg'}</span>
                          )}
                        </div>

                        {bid.message && (
                          <p className="text-sm text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                            {bid.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 lg:justify-end">
                      {bid.status !== 'rejected' ? (
                        <>
                          <button
                            onClick={() => handleNegotiationAction(bid.id, 'accept')}
                            className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              setShowCounterModal(bid);
                              setCounterPrice(bid.offered_price || '');
                              setCounterMessage('');
                            }}
                            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleNegotiationAction(bid.id, 'reject')}
                            className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-black uppercase tracking-wide">
                          Rejected permanently
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Farmer Profile</h2>
              <p className="text-slate-500 font-medium mb-8">Manage your account details for your farmer dashboard.</p>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Username</label>
                    <input
                      type="text"
                      value={userProfile?.username || ''}
                      disabled
                      className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Role</label>
                    <input
                      type="text"
                      value={userProfile?.role || 'farmer'}
                      disabled
                      className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold capitalize"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Farm Name</label>
                    <input
                      type="text"
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">GSTIN</label>
                  <input
                    type="text"
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Farm Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[120px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={profileForm.location_lat}
                      onChange={(e) => setProfileForm({ ...profileForm, location_lat: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={profileForm.location_lng}
                      onChange={(e) => setProfileForm({ ...profileForm, location_lng: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                </div>

                {profileMessage && (
                  <p className={`text-sm font-bold ${profileMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                    {profileMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all disabled:opacity-70"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 sm:p-12">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setShowAddModal(false);
                setEditingProduct(null);
                setNewProduct({ name: '', category: 'vegetables', price: '', stock: '', description: '', unit: 'kg', location: userProfile?.address || '' });
              }}
              className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 p-2 bg-slate-50 rounded-2xl transition-colors"
            >
              <Plus className="rotate-45" size={28} />
            </button>
            
            <h3 className="text-3xl font-black text-slate-900 mb-2">{editingProduct ? 'Edit Listing' : 'New Listing'}</h3>
            <p className="text-slate-500 font-medium mb-8">{editingProduct ? 'Update your crop details.' : 'Add details about your crop to start selling.'}</p>

            {categoryError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <Plus className="rotate-45" size={20} />
                </div>
                <div>
                  <p className="text-red-800 font-black text-sm uppercase tracking-tight">Category Mismatch Detected</p>
                  <p className="text-red-600 text-xs font-bold leading-tight">The AI thinks this product doesn't belong in '{newProduct.category}'. Please check and try again.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Image Upload Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">Product Photo (Required)</label>
                <div className="flex gap-4 items-start">
                  <div className="relative group overflow-hidden w-32 h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : editingProduct?.image ? (
                      <img src={editingProduct.image} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Plus className="text-slate-400 group-hover:text-primary-600" size={24} />
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-primary-600 uppercase">Upload</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 py-1">
                    <p className="text-sm font-bold text-slate-700">Add a high-quality photo</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                      Good photos build trust with buyers. Make sure the lighting is natural and the crop is clearly visible from the center.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Crop Name</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    placeholder="e.g. Organic Tomatoes"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Category</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="grains">Grains</option>
                    <option value="dairy">Dairy</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1 flex justify-between">
                  Price (per {newProduct.unit})
                  <button 
                    type="button" 
                    onClick={getAiSuggestion}
                    disabled={aiLoading}
                    className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    AI Suggest Price
                  </button>
                </label>
                <div className="relative">
                  <div className="absolute left-6 top-4 font-bold text-slate-400">₹</div>
                  <input 
                    type="number"
                    required
                    className="w-full pl-10 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Initial Stock</label>
                  <input 
                    type="number"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    placeholder="100"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Unit</label>
                  <select 
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  >
                    <option value="kg">kg</option>
                    <option value="box">box</option>
                    <option value="bunch">bunch</option>
                    <option value="quintal">quintal</option>
                    <option value="dozen">dozen</option>
                  </select>
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Farm Location (City/District)</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    placeholder="e.g. Nashik, MH"
                    value={newProduct.location}
                    onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">Description</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[120px]"
                  placeholder="Tell buyers about your crop..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
              >
                {editingProduct ? 'Save Changes' : 'Launch Listing'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showCounterModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.2rem] p-8 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Send Counter Offer</h3>
            <p className="text-sm text-slate-500 font-medium mb-6">
              Product: {showCounterModal.product_name || 'Product'}
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Counter Price (₹/{showCounterModal.unit || 'kg'})</label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500 font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400">Message (Optional)</label>
                <textarea
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                  placeholder="Add a note for buyer (delivery terms, quantity, etc.)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary-500 font-bold min-h-[96px]"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCounterModal(null);
                    setCounterPrice('');
                    setCounterMessage('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleNegotiationAction(showCounterModal.id, 'counter', counterPrice, counterMessage)}
                  className="px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700"
                >
                  Send Counter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
