import React, { useState, useEffect } from 'react';
import {
  Plus, Package, ShoppingCart, TrendingUp, LogOut,
  Trash2, Edit, ChevronRight, LayoutDashboard, History,
  Sparkles, Loader2, IndianRupee, MapPin, Store, CheckCircle, Clock, ArrowRight, MessageCircle, User, BarChart3, Star, Download, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import FarmerProfitDecisionDashboard from './FarmerProfitDecisionDashboard';
import { generateOrderInvoicePdf } from '../utils/invoicePdf';
import { getProductImage } from '../utils/productImage';

const FarmerDashboard = () => {
  const { t, i18n } = useTranslation();
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
  const [bidActionLoadingKey, setBidActionLoadingKey] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [listingError, setListingError] = useState('');
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [logisticsOrder, setLogisticsOrder] = useState(null);
  const [podOtp, setPodOtp] = useState('');
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false);
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
  const [farmerReviews, setFarmerReviews] = useState([]);
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

  const [dashboardStats, setDashboardStats] = useState({ total_revenue: 0, active_listings: 0, pending_orders: 0, avg_rating: 0, total_reviews: 0, chart_data: [] });

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
      const [prodRes, orderRes, profileRes, statsRes, negotiationsRes, reviewsRes] = await Promise.all([
        api.get('products/?mine=true'),
        api.get('orders/'),
        api.get('auth/profile/'),
        api.get('farmer/stats/'),
        api.get('negotiations/'),
        api.get('reviews/?farmer=true')
      ]);

      setProducts(prodRes.data);
      setOrders(
        [...orderRes.data].sort((a, b) => {
          const aTime = new Date(a.created_at || 0).getTime();
          const bTime = new Date(b.created_at || 0).getTime();
          if (bTime !== aTime) return bTime - aTime;
          return Number(b.id || 0) - Number(a.id || 0);
        })
      );
      setUserProfile(profileRes.data);
      setDashboardStats(statsRes.data);
      setNegotiations(negotiationsRes.data);
      setFarmerReviews(reviewsRes.data);
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

  const handleFarmerAcceptOrder = async (order) => {
    if (order.status !== 'pending') return;
    setLogisticsSubmitting(true);
    try {
      await api.patch(`orders/${order.id}/`, { status: 'accepted' });
      alert('Order accepted. Buyer will now complete logistics planning from buyer panel.');
      fetchData();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.status || err?.response?.data?.detail || 'Unable to accept this order.';
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
    } finally {
      setLogisticsSubmitting(false);
    }
  };

  const handleOpenLogistics = (order) => {
    if (order.status !== 'shipped') return;

    if (Number(order.additional_shipping_fee || 0) > 0 && !order.additional_shipping_paid) {
      alert('Buyer must pay extra shipping fee first. POD code cannot be generated yet.');
      return;
    }

    setLogisticsOrder(order);
    setPodOtp('');
  };

  const handleLogisticsProgress = async () => {
    if (!logisticsOrder || logisticsOrder.status !== 'shipped') return;

    if (podOtp.trim().length !== 4) {
      alert('Please generate a 4-digit POD code.');
      return;
    }

    setLogisticsSubmitting(true);
    try {
      await api.post(`orders/${logisticsOrder.id}/set-pod/`, { pod_code: podOtp.trim() });
      alert('POD code generated. Share this 4-digit code with buyer for delivery confirmation.');
      setLogisticsOrder(null);
      setPodOtp('');
      fetchData();
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.detail || 'Unable to generate POD code. Please try again.';
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
    } finally {
      setLogisticsSubmitting(false);
    }
  };

  const orderStages = ['pending', 'accepted', 'shipped', 'delivered'];

  const getStageIndex = (status) => {
    const idx = orderStages.indexOf(status);
    return idx === -1 ? 0 : idx;
  };

  const stageLabel = (stage) => {
    if (stage === 'pending') return t('pending');
    if (stage === 'accepted') return t('accepted');
    if (stage === 'shipped') return t('shipped');
    return t('delivered');
  };

  const handleDownloadBill = (order) => {
    generateOrderInvoicePdf({
      order,
      viewerRole: 'farmer',
      viewerProfile: userProfile,
    });
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
    setListingError('');
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

    if (userProfile?.location_lat !== null && userProfile?.location_lat !== undefined && userProfile?.location_lat !== '') {
      formData.append('location_lat', userProfile.location_lat);
    }
    if (userProfile?.location_lng !== null && userProfile?.location_lng !== undefined && userProfile?.location_lng !== '') {
      formData.append('location_lng', userProfile.location_lng);
    }

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
      const backendError = err?.response?.data;
      if (typeof backendError === 'string') {
        setListingError(backendError);
      } else if (backendError && typeof backendError === 'object') {
        const firstField = Object.keys(backendError)[0];
        const firstMsg = Array.isArray(backendError[firstField]) ? backendError[firstField][0] : backendError[firstField];
        setListingError(`${firstField}: ${firstMsg}`);
      } else {
        setListingError('Unable to launch listing. Please check all fields and try again.');
      }
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

  const handleNegotiationAction = async (bid, action, counterValue = null, messageValue = '') => {
    if (!bid) return;

    if (bid.status === 'accepted' || bid.status === 'rejected') {
      alert(`This bid is already ${bid.status}.`);
      return;
    }

    if (action === 'reject' && !window.confirm('Reject this bid permanently?')) {
      return;
    }

    const payload = {};
    if (action === 'counter') {
      const parsedCounter = Number(counterValue);
      if (!Number.isFinite(parsedCounter) || parsedCounter <= 0) {
        alert('Please enter a valid counter price greater than 0.');
        return;
      }
      payload.counter_price = parsedCounter;
      payload.message = (messageValue || '').trim();
    }

    const actionKey = `${bid.id}-${action}`;
    setBidActionLoadingKey(actionKey);
    try {
      await api.post(`negotiations/${bid.id}/${action}/`, payload);
      setShowCounterModal(null);
      setCounterPrice('');
      setCounterMessage('');
      fetchData();
    } catch (err) {
      const apiMessage = err?.response?.data?.error || err?.response?.data?.detail || `Unable to ${action} this bid.`;
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
      console.error(err);
    } finally {
      setBidActionLoadingKey('');
    }
  };

  const incomingOrders = orders.filter((order) => order.status !== 'delivered' && order.status !== 'cancelled');
  const salesHistoryOrders = orders.filter((order) => order.status === 'delivered');

  return (
    <div className="flex h-screen dashboard-shell overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-72 dashboard-sidebar flex flex-col p-8 fixed h-full z-40">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <TrendingUp size={24} />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">Agro Sync</span>
        </div>

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <LayoutDashboard size={22} /> {t('overview')}
          </button>
          <button
            onClick={() => setActiveTab('profit')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profit' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <BarChart3 size={22} /> {t('profit_dashboard')}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'products' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <Package size={22} /> {t('my_crops')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <ShoppingCart size={22} /> {t('incoming_orders')}
          </button>
          <button
            onClick={() => setActiveTab('bids')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'bids' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <MessageCircle size={22} /> {t('active_bids')}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'history' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <History size={22} /> {t('sales_history')}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
          >
            <User size={22} /> {t('profile')}
          </button>
        </nav>

        <div className="mb-6 px-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg group hover:border-primary-300 transition-colors">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
            <select
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              value={i18n.language}
              className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none cursor-pointer w-full"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 px-6 py-4 text-slate-500 font-bold hover:text-red-500 transition-colors"
        >
          <LogOut size={22} /> {t('logout')}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12 overflow-y-auto dashboard-main">
        {activeTab !== 'profit' && (
          <header className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
                {t('welcome_back', { name: '' })} <span className="text-primary-600">
                  {userProfile ? (userProfile.business_name || userProfile.username) : 'Farmer...'}
                </span>
              </h1>
              <p className="text-slate-500 font-medium">{t('farm_happening')}</p>
            </div>
            {activeTab === 'products' && (
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all hover:scale-[1.02]"
              >
                <Plus size={22} /> {t('add_new_crop')}
              </button>
            )}
          </header>
        )}

        {activeTab === 'profit' && (
          <FarmerProfitDecisionDashboard userProfile={userProfile} products={products} orders={orders} />
        )}

        {activeTab === 'overview' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Stats */}
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center text-green-600">
                  <IndianRupee size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">{t('monthly_revenue')}</span>
                <span className="text-4xl font-black text-slate-900">₹{dashboardStats.total_revenue.toLocaleString('en-IN')}</span>
                <span className="text-green-600 font-bold text-sm bg-green-50 px-2 py-1 rounded-lg self-start">Real-time performance</span>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600">
                  <Package size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">{t('active_listings')}</span>
                <span className="text-4xl font-black text-slate-900">{dashboardStats.active_listings}</span>
                <span className="text-slate-600 font-bold text-sm">{t('start_listing_crops')}</span>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center text-orange-600">
                  <Clock size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">{t('pending_orders')}</span>
                <span className="text-4xl font-black text-slate-900">{dashboardStats.pending_orders}</span>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-primary-600 font-bold text-sm hover:underline self-start"
                >
                  {t('view_all_queue')}
                </button>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="bg-yellow-100 w-12 h-12 rounded-xl flex items-center justify-center text-yellow-600">
                  <Star size={24} />
                </div>
                <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">{t('farmer_rating')}</span>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-slate-900">{Number(dashboardStats.avg_rating || 0).toFixed(1)}</span>
                  <span className="text-slate-500 font-bold mb-1">/5</span>
                </div>
                <span className="text-yellow-700 font-bold text-sm bg-yellow-50 px-2 py-1 rounded-lg self-start">
                  {t('buyer_reviews', { count: dashboardStats.total_reviews || 0 })}
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-2xl font-bold text-slate-900 mb-8">{t('revenue_forecast')}</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardStats.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 600 }} dx={-10} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={4} dot={{ r: 6, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">{t('recent_feedback_title')}</h3>
                <span className="text-xs font-black uppercase tracking-wide px-3 py-1 rounded-full bg-yellow-50 text-yellow-700">
                  {t('rating_review_system')}
                </span>
              </div>

              {farmerReviews.length > 0 ? (
                <div className="space-y-4">
                  {farmerReviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-900">{review.user_name}</p>
                          <p className="text-xs text-slate-500 font-semibold">{t('product')}: {review.product_name}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={16} fill="currentColor" />
                          <span className="text-sm font-black text-slate-800">{review.rating}/5</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 font-medium">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-slate-500 font-semibold">
                  {t('no_feedback_yet')}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-700">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  <img src={getProductImage(product)} alt={product.name} className="w-full h-full object-cover" />
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
                    <span className="px-4 py-1.5 bg-primary-600 text-white text-xs font-black uppercase rounded-lg shadow-lg">{t(product.category)}</span>
                  </div>
                </div>
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-black text-slate-900">{t(product.name, product.name)}</h4>
                    <span className="text-lg font-black text-slate-900">₹{product.price}<span className="text-sm text-slate-400 font-bold ml-1">/{t(product.unit)}</span></span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium line-clamp-2">{t(product.description, product.description)}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-primary-600">
                      <Store size={18} />
                      <span className="text-sm font-bold">{t('quantity')}: {product.stock} {t(product.unit)}</span>
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
                <h4 className="text-2xl font-bold text-slate-900 mb-2">{t('no_products_yet')}</h4>
                <p className="text-slate-500 font-medium mb-8">{t('start_listing_crops')}</p>
                <button onClick={openAddModal} className="px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl">{t('add_first_crop')}</button>
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
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('order_id')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('buyer')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('amount')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('status')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {incomingOrders.map((order) => (
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
                      <span className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                          order.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                        }`}>
                        {t(order.status)}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'pending' && (
                          <button
                            onClick={() => handleFarmerAcceptOrder(order)}
                            disabled={logisticsSubmitting}
                            className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-black text-primary-700 transition-colors hover:bg-primary-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {logisticsSubmitting ? t('updating') : t('accept_order')}
                          </button>
                        )}
                        {order.status === 'accepted' && (
                          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">Awaiting Buyer Logistics</span>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleOpenLogistics(order)}
                            disabled={Number(order.additional_shipping_fee || 0) > 0 && !order.additional_shipping_paid}
                            className="inline-flex items-center rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-black text-primary-700 transition-colors hover:bg-primary-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {order.pod_configured ? t('regenerate_pod') : t('generate_pod')}
                          </button>
                        )}
                        {(order.status === 'delivered' || order.status === 'cancelled') && (
                          <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">Completed</span>
                        )}
                        <button
                          onClick={() => setTrackingOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                        >
                          {t('view_details')}
                        </button>
                        <button
                          onClick={() => handleDownloadBill(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-slate-800"
                        >
                          Download Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {incomingOrders.length === 0 && (
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-semibold">
                    {t('no_incoming_orders')}
                  </td>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-700">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('order_id')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('buyer')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('delivered_on')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('amount')}</th>
                  <th className="px-8 py-6 text-xs font-black uppercase tracking-wider text-slate-400">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {salesHistoryOrders.map((order) => (
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
                      <span className="text-slate-600 font-bold">{new Date(order.updated_at || order.created_at).toLocaleDateString()}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg">₹{order.total_amount}</span>
                        <span className="text-[10px] text-slate-400 font-bold italic">Incl. ₹{order.delivery_fee} logistics</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setTrackingOrder(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleDownloadBill(order)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-black text-white transition-colors hover:bg-slate-800"
                        >
                          Download Bill
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {salesHistoryOrders.length === 0 && (
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-semibold">
                    {t('no_sales_history')}
                  </td>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bids' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900">{t('active_bids_title')}</h2>
                <p className="text-slate-500 font-medium">{t('active_bids_subtitle')}</p>
              </div>
            </div>

            {negotiations.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 font-semibold">
                No active bids yet. Buyer negotiations will appear here in real time.
              </div>
            ) : (
              <div className="grid gap-6">
                {negotiations.map((bid) => (
                  <div key={bid.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 md:p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                          <img
                            src={getProductImage({ product_image: bid.product_image, product_name: bid.product_name })}
                            alt={bid.product_name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black text-slate-900">{t(bid.product_name || 'Product')}</h3>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                  bid.status === 'countered' ? 'bg-blue-100 text-blue-700' :
                                    'bg-orange-100 text-orange-700'
                              }`}>
                              {t(bid.status)}
                            </span>
                          </div>

                          <p className="text-sm text-slate-500 font-bold">{t('buyer_label')}: {bid.buyer_name || 'Buyer'}</p>

                          <div className="flex flex-wrap gap-4 text-sm font-bold">
                            <span className="text-slate-400 line-through">{t('original')}: ₹{bid.original_price}/{t(bid.unit || 'kg')}</span>
                            <span className="text-primary-700">{t('offered')}: ₹{bid.offered_price}/{t(bid.unit || 'kg')}</span>
                            {bid.farmer_counter_price && (
                              <span className="text-blue-700">{t('counter')}: ₹{bid.farmer_counter_price}/{bid.unit || 'kg'}</span>
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
                        {bid.status === 'pending' || bid.status === 'countered' ? (
                          <>
                            <button
                              onClick={() => handleNegotiationAction(bid, 'accept')}
                              disabled={bidActionLoadingKey.startsWith(`${bid.id}-`)}
                              className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {bidActionLoadingKey === `${bid.id}-accept` ? t('updating') : t('accept')}
                            </button>
                            <button
                              onClick={() => {
                                setShowCounterModal(bid);
                                setCounterPrice(String(bid.farmer_counter_price || bid.offered_price || ''));
                                setCounterMessage(bid.message || '');
                              }}
                              disabled={bidActionLoadingKey.startsWith(`${bid.id}-`)}
                              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {bidActionLoadingKey === `${bid.id}-counter` ? t('updating') : t('counter')}
                            </button>
                            <button
                              onClick={() => handleNegotiationAction(bid, 'reject')}
                              disabled={bidActionLoadingKey.startsWith(`${bid.id}-`)}
                              className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {bidActionLoadingKey === `${bid.id}-reject` ? t('updating') : t('reject')}
                            </button>
                          </>
                        ) : bid.status === 'accepted' ? (
                          <span className="px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-100 text-xs font-black uppercase tracking-wide">
                            Accepted and finalized
                          </span>
                        ) : (
                          <span className="px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-100 text-xs font-black uppercase tracking-wide">
                            {t('rejected_permanently')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-3xl animate-in fade-in duration-700">
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-10">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">{t('farmer_profile')}</h2>
              <p className="text-slate-500 font-medium mb-8">{t('farmer_profile_subtitle')}</p>

              <form onSubmit={handleProfileSave} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('username')}</label>
                    <input
                      type="text"
                      value={userProfile?.username || ''}
                      disabled
                      className="w-full px-6 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('role')}</label>
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
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('email')}</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('farm_name_label')}</label>
                    <input
                      type="text"
                      value={profileForm.business_name}
                      onChange={(e) => setProfileForm({ ...profileForm, business_name: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('business_verification')}</label>
                  <input
                    type="text"
                    value={profileForm.gstin}
                    onChange={(e) => setProfileForm({ ...profileForm, gstin: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('farm_address_label')}</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[120px]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('lat')}</label>
                    <input
                      type="number"
                      step="any"
                      value={profileForm.location_lat}
                      onChange={(e) => setProfileForm({ ...profileForm, location_lat: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('lng')}</label>
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
                  {profileSaving ? t('saving') : t('save_profile')}
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

            <h3 className="text-3xl font-black text-slate-900 mb-2">{editingProduct ? t('edit_listing') : t('new_listing')}</h3>
            <p className="text-slate-500 font-medium mb-8">{editingProduct ? t('update_crop_details') : t('add_crop_details')}</p>

            {categoryError && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                  <Plus className="rotate-45" size={20} />
                </div>
                <div>
                  <p className="text-red-800 font-black text-sm uppercase tracking-tight">{t('category_mismatch')}</p>
                  <p className="text-red-600 text-xs font-bold leading-tight">{t('ai_category_warning', { category: t(newProduct.category) })}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-6">
              {/* Image Upload Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('product_photo_req')}</label>
                <div className="flex gap-4 items-start">
                  <div className="relative group overflow-hidden w-32 h-32 bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : editingProduct?.image ? (
                      <img src={editingProduct.image} alt="Current" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Plus className="text-slate-400 group-hover:text-primary-600" size={24} />
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-primary-600 uppercase">{t('upload')}</span>
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
                    <p className="text-sm font-bold text-slate-700">{t('high_quality_photo')}</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed mt-1">
                      {t('photo_trust_hint')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('crop_name')}</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    placeholder={t('crop_name_hint')}
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('categories')}</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  >
                    <option value="vegetables">{t('vegetables')}</option>
                    <option value="fruits">{t('fruits')}</option>
                    <option value="grains">{t('grains')}</option>
                    <option value="dairy">{t('dairy')}</option>
                    <option value="organic">{t('organic')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1 flex justify-between">
                  {t('price_per_unit', { unit: t(newProduct.unit) })}
                  <button
                    type="button"
                    onClick={getAiSuggestion}
                    disabled={aiLoading}
                    className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                  >
                    {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {t('ai_suggest_price')}
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
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('initial_stock')}</label>
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
                  <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('unit')}</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  >
                    <option value="kg">{t('kg')}</option>
                    <option value="box">{t('box')}</option>
                    <option value="bunch">{t('bunch')}</option>
                    <option value="quintal">{t('quintal')}</option>
                    <option value="dozen">{t('dozen')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('farm_location_hint')}</label>
                <input
                  type="text"
                  required
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold"
                  placeholder={t('location_example')}
                  value={newProduct.location}
                  onChange={(e) => setNewProduct({ ...newProduct, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('description')}</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[120px]"
                  placeholder={t('description_hint')}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>

              {listingError && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 text-sm font-bold">
                  {listingError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-[2rem] shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95"
              >
                {editingProduct ? t('save_listing') : t('new_listing')}
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
                  onClick={() => handleNegotiationAction(showCounterModal, 'counter', counterPrice, counterMessage)}
                  disabled={!counterPrice || Number(counterPrice) <= 0 || bidActionLoadingKey === `${showCounterModal.id}-counter`}
                  className="px-4 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {bidActionLoadingKey === `${showCounterModal.id}-counter` ? t('updating') : t('send_counter')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {trackingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[2.2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900">Order Details & Tracking</h3>
                <p className="text-slate-500 font-medium mt-1">Order #{trackingOrder.id.toString().padStart(4, '0')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadBill(trackingOrder)}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 flex items-center gap-2"
                >
                  <Download size={16} /> Download Bill PDF
                </button>
                <button
                  onClick={() => setTrackingOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">Buyer</p>
                <p className="text-lg font-black text-slate-900 mt-1">{trackingOrder.buyer_name}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">Order Value</p>
                <p className="text-lg font-black text-slate-900 mt-1">₹{trackingOrder.total_amount}</p>
                <p className="text-xs text-slate-500 font-bold">Incl. ₹{trackingOrder.delivery_fee} logistics</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">Placed On</p>
                <p className="text-lg font-black text-slate-900 mt-1">{new Date(trackingOrder.created_at).toLocaleString()}</p>
              </div>
            </div>

            <div className="mb-8">
              <h4 className="text-xl font-black text-slate-900 mb-4">Order Tracking</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {orderStages.map((stage, idx) => {
                  const activeIndex = getStageIndex(trackingOrder.status);
                  const isCompleted = idx <= activeIndex;
                  const isCurrent = idx === activeIndex;

                  return (
                    <div
                      key={stage}
                      className={`rounded-2xl border p-4 ${isCompleted
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-slate-400" />
                        )}
                        <span className={`text-xs font-black uppercase ${isCurrent ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {isCurrent ? 'Current Stage' : 'Stage'}
                        </span>
                      </div>
                      <p className={`font-black ${isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {stageLabel(stage)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 mb-4">Items</h4>
              <div className="space-y-3">
                {(trackingOrder.items || []).length > 0 ? (
                  trackingOrder.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                      <div>
                        <p className="font-black text-slate-900">{item.product_name || `Product #${item.product}`}</p>
                        <p className="text-sm text-slate-500 font-bold">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-black text-slate-900">₹{item.price_at_order}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-500 font-medium">
                    {t('no_items_detail')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {logisticsOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[2.2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-900">Generate POD Code</h3>
                <p className="text-slate-500 font-medium mt-1">Order #{logisticsOrder.id.toString().padStart(4, '0')} - Stage: {stageLabel(logisticsOrder.status)}</p>
              </div>
              <button
                onClick={() => setLogisticsOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">Buyer</p>
                <p className="text-lg font-black text-slate-900 mt-1">{logisticsOrder.buyer_name}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">Order Stage</p>
                <p className="text-lg font-black text-slate-900 mt-1">{stageLabel(logisticsOrder.status)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-400 font-black">POD Status</p>
                <p className="text-lg font-black text-slate-900 mt-1">{logisticsOrder.pod_configured ? 'Configured' : 'Not Generated'}</p>
              </div>
            </div>

            {logisticsOrder.status === 'shipped' && (
              <div className="space-y-4 mb-6">
                <h4 className="text-xl font-black text-slate-900">Generate 4-Digit POD Code</h4>
                {Number(logisticsOrder.additional_shipping_fee || 0) > 0 && !logisticsOrder.additional_shipping_paid && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                    <p className="text-sm font-bold text-rose-700">Blocked: Buyer must pay extra shipping fee before POD generation.</p>
                  </div>
                )}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-bold text-blue-700 mb-2">Create POD code and share it with buyer for delivery confirmation</p>
                  <input
                    type="text"
                    maxLength={4}
                    value={podOtp}
                    onChange={(e) => setPodOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full md:w-60 px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 font-black text-lg tracking-[0.35em]"
                    placeholder="0000"
                  />
                  <p className="text-xs text-blue-600 font-semibold mt-2">
                    Buyer will enter this code in buyer panel to complete delivery.
                  </p>
                </div>
              </div>
            )}

            {logisticsOrder.status !== 'shipped' && (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 mb-6">
                <p className="text-sm font-bold text-amber-700">
                  POD generation is available after buyer starts logistics and order reaches shipped stage.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLogisticsOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              {logisticsOrder.status === 'shipped' && (
                <button
                  onClick={handleLogisticsProgress}
                  disabled={logisticsSubmitting || (Number(logisticsOrder.additional_shipping_fee || 0) > 0 && !logisticsOrder.additional_shipping_paid)}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {logisticsSubmitting
                    ? 'Updating...'
                    : logisticsOrder.pod_configured ? 'Update POD Code' : 'Generate POD Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
