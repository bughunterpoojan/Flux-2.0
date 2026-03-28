import React, { useState, useEffect } from 'react';
import {
  Search, Filter, ShoppingCart, User, LogOut,
  MapPin, Star, History, Package, ChevronRight,
  TrendingDown, MessageCircle, CreditCard, Loader2,
  CheckCircle2, AlertCircle, ArrowRight, Store, X, Plus, Trash2, Download, Globe, Mic
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { generateOrderInvoicePdf } from '../utils/invoicePdf';

const BuyerDashboard = () => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('browse');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showNegotiate, setShowNegotiate] = useState(null);
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const [negotiationMessage, setNegotiationMessage] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsFee, setLogisticsFee] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [negotiations, setNegotiations] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '' });
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
  const [logisticsOrder, setLogisticsOrder] = useState(null);
  const [selectedLogisticsPlan, setSelectedLogisticsPlan] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('08:00-10:00');
  const [podCodeInput, setPodCodeInput] = useState('');
  const [logisticsSubmitting, setLogisticsSubmitting] = useState(false);
  const [payingExtraOrderId, setPayingExtraOrderId] = useState(null);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const navigate = useNavigate();

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 2200);
  };

  const normalizeCategory = (value) => {
    const raw = (value || '').toString().trim().toLowerCase();
    if (raw === 'vegetable') return 'vegetables';
    if (raw === 'fruit') return 'fruits';
    return raw;
  };

  const formatCategoryLabel = (value) => {
    const normalized = normalizeCategory(value);
    if (!normalized) return 'Unknown';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  useEffect(() => {
    if (cart.length > 0) {
      fetchLogisticsQuote();
    } else {
      setLogisticsFee(0);
      setDistanceKm(0);
    }
  }, [cart]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

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
      const [prodRes, orderRes, profileRes, negRes, reviewRes] = await Promise.all([
        api.get('products/'),
        api.get('orders/'),
        api.get('auth/profile/'),
        api.get('negotiations/'),
        api.get('reviews/?mine=true')
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
      setNegotiations(negRes.data);
      setMyReviews(reviewRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support voice search. Please use Chrome/Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearch(transcript);
      setIsListening(false);
    };

    recognition.start();
  };

  const fetchLogisticsQuote = async () => {
    setLogisticsLoading(true);
    try {
      const res = await api.post('logistics/quote/', { items: cart });
      setLogisticsFee(res.data.suggested_fee);
      setDistanceKm(res.data.distance_km);
    } catch (err) {
      console.error(err);
    } finally {
      setLogisticsLoading(false);
    }
  };

  const calculateDisplayDistance = (p) => {
    if (!userProfile || !p.location_lat || !p.location_lng) return '15km';
    const lat1 = userProfile.location_lat;
    const lon1 = userProfile.location_lng;
    const lat2 = p.location_lat;
    const lon2 = p.location_lng;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c) + 'km';
  };

  const addToCart = (product, priceOverride = null) => {
    const finalPrice = priceOverride ? parseFloat(priceOverride) : product.price;
    const existing = cart.find((p) => p.id === product.id);

    if (!existing) {
      setCart([...cart, { ...product, price: finalPrice, quantity: 1 }]);
      showToast(t('added_to_cart', { name: product.name }));
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: (Number(item.quantity) || 1) + 1 }
          : item
      )
    );
    showToast(t('quantity_updated', { name: product.name }));
  };

  const updateCartQuantity = (productId, nextQuantity) => {
    const safeQty = Math.max(1, Number(nextQuantity) || 1);
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: safeQty } : item
      )
    );
  };

  const changeCartQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id !== productId) return item;
        const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
        return { ...item, quantity: nextQty };
      })
    );
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * (Number(item.quantity) || 0)), 0);
  const cartTotal = cartSubtotal + Number(logisticsFee || 0);

  const handleNegotiate = async (e) => {
    e.preventDefault();
    try {
      await api.post('negotiations/', {
        product: showNegotiate.id,
        offered_price: negotiationPrice,
        message: negotiationMessage
      });
      setShowNegotiate(null);
      setNegotiationPrice('');
      setNegotiationMessage('');
      alert('Negotiation request sent to farmer!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const deliveryFee = Number(logisticsFee || 0);

      const orderRes = await api.post('orders/', {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price })),
        delivery_fee: deliveryFee,
        distance_km: distanceKm
      });

      const serverTotal = Number(orderRes.data?.total_amount || 0);
      if (!Number.isFinite(serverTotal) || serverTotal <= 0) {
        throw new Error('Invalid server total amount.');
      }

      const razorpayRes = await api.post('payments/create/', { order_id: orderRes.data.id });

      const options = {
        key: razorpayRes.data.key_id,
        amount: razorpayRes.data.amount,
        currency: razorpayRes.data.currency,
        name: "AgriMarket",
        description: "Fresh Produce Purchase",
        order_id: razorpayRes.data.id,
        handler: async function (response) {
          try {
            await api.put('payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            setCart([]);
            setActiveTab('orders');
          } catch (err) {
            console.error(err);
            alert("Payment verification failed. Please contact support.");
          } finally {
            setCheckingOut(false);
          }
        },
        modal: {
          ondismiss: function () {
            setCheckingOut(false);
          }
        },
        theme: { color: "#3e9150" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.detail
        || err?.response?.data?.items
        || err?.response?.data?.delivery_fee
        || err?.response?.data?.error
        || 'Checkout failed. Please review cart details and try again.';
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
      setCheckingOut(false);
    }
  };

  const getSmartLogisticsOptions = (order) => {
    const distance = Number(order.distance_km) || 45;
    const baseFee = Number(order.delivery_fee) || 160;
    return [
      {
        id: 'shared_cluster',
        title: 'Shared Cluster Delivery',
        eta: `${Math.max(8, Math.round(distance / 7))} hrs`,
        note: `Optimized mandi route. Budget friendly around ₹${Math.max(90, Math.round(baseFee * 0.85))}`,
      },
      {
        id: 'express_direct',
        title: 'Express Direct Dispatch',
        eta: `${Math.max(4, Math.round(distance / 12))} hrs`,
        note: 'Fastest option with direct line-haul priority',
      },
    ];
  };

  const handleOpenLogistics = (order) => {
    setLogisticsOrder(order);
    setSelectedLogisticsPlan('');
    setDeliverySlot('08:00-10:00');
    setPodCodeInput('');
  };

  const handleBuyerLogisticsProgress = async () => {
    if (!logisticsOrder) return;

    if (logisticsOrder.status === 'accepted' && !selectedLogisticsPlan) {
      alert('Please select a logistics plan before dispatch request.');
      return;
    }

    if (logisticsOrder.status === 'shipped' && podCodeInput.trim().length !== 4) {
      alert('Please enter the 4-digit POD code shared by farmer.');
      return;
    }

    setLogisticsSubmitting(true);
    try {
      const payload = logisticsOrder.status === 'shipped'
        ? { status: 'delivered', pod_code: podCodeInput.trim() }
        : { status: 'shipped', logistics_plan: selectedLogisticsPlan, delivery_slot: deliverySlot };

      await api.patch(`orders/${logisticsOrder.id}/`, payload);

      const msg = logisticsOrder.status === 'accepted'
        ? `Logistics started with ${selectedLogisticsPlan.replace('_', ' ')} and slot ${deliverySlot}.`
        : 'POD verified. Delivery completed successfully.';
      alert(msg);
      setLogisticsOrder(null);
      await fetchData();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.pod_code
        || err?.response?.data?.additional_shipping_fee
        || err?.response?.data?.status
        || err?.response?.data?.detail
        || err?.response?.data?.error
        || 'Unable to progress logistics stage.';
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
    } finally {
      setLogisticsSubmitting(false);
    }
  };

  const getExpectedExtraShipping = (order, planId) => {
    if (planId !== 'express_direct') return 0;
    const base = Number(order?.initial_delivery_fee ?? order?.delivery_fee ?? 0);
    return Math.max(40, Number((base * 0.18).toFixed(2)));
  };

  const handlePayExtraShipping = async (order) => {
    setPayingExtraOrderId(order.id);
    try {
      const razorpayRes = await api.post('payments/create/', {
        order_id: order.id,
        payment_type: 'extra_shipping',
      });

      const options = {
        key: razorpayRes.data.key_id,
        amount: razorpayRes.data.amount,
        currency: razorpayRes.data.currency,
        name: 'AgriMarket',
        description: `Extra Shipping Payment - Order #${order.id}`,
        order_id: razorpayRes.data.id,
        handler: async function (response) {
          try {
            await api.put('payments/verify/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              payment_type: 'extra_shipping',
              order_id: order.id,
            });
            alert('Extra shipping fee paid successfully. You can now complete delivery with POD.');
            await fetchData();
          } catch (err) {
            console.error(err);
            alert('Extra shipping payment verification failed. Please contact support.');
          } finally {
            setPayingExtraOrderId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPayingExtraOrderId(null);
          }
        },
        theme: { color: '#3e9150' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.error || 'Unable to start extra shipping payment.';
      alert(String(apiMessage));
      setPayingExtraOrderId(null);
    }
  };

  const getOrderReviews = (order) => {
    const productIds = (order?.items || []).map((item) => Number(item.product));
    return myReviews.filter((review) => productIds.includes(Number(review.product)));
  };

  const handleOpenReview = (order) => {
    const firstItem = order?.items?.[0];
    if (!firstItem) {
      alert('No order items available to review.');
      return;
    }

    const initialProductId = Number(firstItem.product);
    const existing = myReviews.find((review) => Number(review.product) === initialProductId);

    setReviewOrder(order);
    setReviewProductId(String(initialProductId));
    setReviewRating(existing?.rating || 5);
    setReviewComment(existing?.comment || '');
  };

  const handleReviewProductChange = (value) => {
    setReviewProductId(value);
    const existing = myReviews.find((review) => Number(review.product) === Number(value));
    setReviewRating(existing?.rating || 5);
    setReviewComment(existing?.comment || '');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!reviewProductId) {
      alert('Please select a product to review.');
      return;
    }

    if (!reviewComment.trim()) {
      alert('Please add feedback comment.');
      return;
    }

    setReviewSubmitting(true);
    try {
      await api.post('reviews/', {
        product: Number(reviewProductId),
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      alert('Thanks! Your farmer rating and feedback are saved.');
      setReviewOrder(null);
      setReviewComment('');
      setReviewRating(5);
      await fetchData();
    } catch (err) {
      console.error(err);
      const apiMessage = err?.response?.data?.error || err?.response?.data?.detail || 'Unable to submit feedback right now.';
      alert(Array.isArray(apiMessage) ? apiMessage.join(', ') : String(apiMessage));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBidPurchase = (neg) => {
    const product = products.find((p) => p.id === neg.product);
    if (!product) {
      alert('Product is not available right now. Please refresh and try again.');
      return;
    }

    addToCart(product, neg.status === 'accepted' ? neg.offered_price : neg.farmer_counter_price);
    setActiveTab('cart');
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

  const filteredProducts = products.filter((p) => {
    const normalizedProductCategory = normalizeCategory(p.category);
    return (
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || normalizedProductCategory === filter)
    );
  });

  const handleDownloadBill = (order) => {
    generateOrderInvoicePdf({
      order,
      viewerRole: 'buyer',
      viewerProfile: userProfile,
    });
  };

  return (
    <div className="min-h-screen dashboard-shell flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 glass-panel border-b border-primary-100 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <TrendingDown size={24} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">{t('buyer_dashboard')}</span>
        </div>

        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative group">
            <Search className="absolute left-6 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input
              type="text"
              placeholder={t('search_hint')}
              className="w-full pl-16 pr-16 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:bg-white focus:ring-2 ring-primary-500/10 transition-all font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={startVoiceRecognition}
              className={`absolute right-6 top-4 p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-primary-600'}`}
              title="Voice Search"
            >
              <Mic size={20} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg group hover:border-primary-300 transition-colors">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
            <select
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              value={i18n.language}
              className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`p-3 rounded-2xl transition-all ${activeTab === 'profile' ? 'bg-primary-50 text-primary-600 font-bold px-5 flex items-center gap-2 ring-1 ring-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {activeTab === 'profile' ? <><User size={20} /> {t('profile')}</> : <User size={24} />}
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`p-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-primary-50 text-primary-600 font-bold px-5 flex items-center gap-2 ring-1 ring-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {activeTab === 'orders' ? <><History size={20} /> {t('my_orders')}</> : <History size={24} />}
          </button>

          <button
            className="p-3 bg-slate-100 text-slate-900 rounded-2xl hover:bg-slate-200 transition-all relative font-black px-6 flex items-center gap-3"
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingCart size={22} className="text-primary-600" />
            ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-4 border-white">
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { localStorage.clear(); navigate('/login'); }}
            className="p-3 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Filters */}
        <aside className="w-80 dashboard-sidebar p-8 space-y-10 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('categories')}</h3>
            <div className="space-y-2">
              {['all', 'vegetables', 'fruits', 'grains', 'dairy', 'organic'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setFilter(cat);
                    setActiveTab('browse');
                  }}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold capitalize transition-all ${filter === cat ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {t(cat)} {filter === cat && <ChevronRight size={18} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">{t('my_activity')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Package size={20} /> {t('my_orders')}
              </button>
              <button
                onClick={() => setActiveTab('bids')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'bids' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <MessageCircle size={20} /> {t('bids')}
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <User size={20} /> {t('profile')}
              </button>
            </div>
          </div>
        </aside>

        {/* Product Grid / Cart / Orders */}
        <main className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'browse' && (
            <div className="space-y-10">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{t('fresh_collection')}</h2>
                  <p className="text-slate-500 font-medium">{t('produce_ready', { count: products.length })}</p>
                </div>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600">{t('sort_by')}: {t('relevancy')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col cursor-pointer"
                  >
                    <div className="h-64 bg-slate-100 relative group-hover:scale-105 transition-transform duration-500">
                      <img src={p.image || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=600'} alt={p.name} className="w-full h-full object-cover" />
                      <div className="absolute top-6 left-6">
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase rounded-lg shadow-sm">{formatCategoryLabel(p.category)}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="absolute bottom-6 right-6 w-12 h-12 bg-primary-600 text-white rounded-2xl shadow-xl flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                      >
                        <Plus className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="text-xl font-black text-slate-900 leading-tight">{p.name}</h4>
                          <span className="text-lg font-black text-primary-600">₹{p.price}<span className="text-xs text-slate-400 font-bold ml-1">/{p.unit || 'kg'}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <MapPin size={14} className="text-red-400" />
                          <span className="text-xs font-bold leading-none">{t('dist')}: {calculateDisplayDistance(p)}</span>
                          <div className="ml-auto flex items-center gap-1">
                            <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600">{p.farmer_name || 'AgriFarmer'}</span>
                            <div className="flex items-center gap-0.5">
                              <span className="text-yellow-400">★</span>
                              <span className="text-xs font-bold text-slate-600">{p.farmer_avg_rating || 0}</span>
                              <span className="text-xs text-slate-400">({p.farmer_total_reviews || 0})</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>
                      <div className="mt-8 flex gap-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                          className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={18} /> {t('buy_now')}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowNegotiate(p); }}
                          className="w-14 h-14 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center"
                        >
                          <MessageCircle size={22} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cart' && (
            <div className="max-w-5xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-700">
              <div className="flex items-end justify-between">
                <h2 className="text-4xl font-extrabold text-slate-900">{t('checkout_basket')}</h2>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {t('continue_shopping')}
                </button>
              </div>
              {cart.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900">{t(item.name)}</h4>
                            <p className="text-slate-500 font-bold">₹{item.price}/{t(item.unit)}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1">{t('line_total_amount', { amount: (item.price * (Number(item.quantity) || 0)).toFixed(2) })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50">
                            <button
                              onClick={() => changeCartQuantity(item.id, -1)}
                              className="px-3 py-2 text-slate-600 font-black hover:bg-slate-100 rounded-l-xl"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              className="w-14 py-2 bg-transparent border-none text-center font-bold outline-none"
                              value={item.quantity}
                              min={1}
                              onChange={(e) => updateCartQuantity(item.id, e.target.value)}
                            />
                            <button
                              onClick={() => changeCartQuantity(item.id, 1)}
                              className="px-3 py-2 text-slate-600 font-black hover:bg-slate-100 rounded-r-xl"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            onClick={() => setCart(cart.filter(p => p.id !== item.id))}
                            title="Remove item"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6 md:sticky md:top-8">
                      <h3 className="text-2xl font-black text-slate-900">{t('summary')}</h3>
                      <div className="space-y-4 font-bold text-slate-500">
                        <div className="flex justify-between"><span>{t('subtotal')}</span><span className="text-slate-900">₹{cartSubtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <span>{t('logistics_fee')}</span>
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] uppercase font-black">{t('ai_quote')}</span>
                          </div>
                          {logisticsLoading ? <Loader2 size={12} className="animate-spin" /> : <span className="text-slate-900 text-sm">₹{logisticsFee}</span>}
                        </div>
                        <div className="flex justify-between text-xs italic">
                          <span>{t('total_dist')}</span>
                          <span>{distanceKm}km</span>
                        </div>
                        <div className="flex justify-between"><span>{t('tax')}</span><span className="text-slate-900">₹0.00</span></div>
                      </div>
                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-3xl font-black text-slate-900">
                        <span>{t('total')}</span>
                        <span>₹{cartTotal.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold bg-slate-50 rounded-xl px-3 py-2">
                        {t('secure_payment')}
                      </p>
                      <button
                        onClick={handleCheckout}
                        disabled={checkingOut}
                        className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3"
                      >
                        {checkingOut ? <Loader2 className="animate-spin" /> : <><CreditCard /> {t('pay_with_razorpay')}</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white py-32 rounded-[2.5rem] text-center space-y-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{t('empty_basket')}</h3>
                  <button onClick={() => setActiveTab('browse')} className="px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:scale-105 transition-transform">{t('browse_produce')}</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900">{t('order_tracking')}</h2>
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Package size={32} />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-slate-900">{t('order_num', { id: order.id })}</h4>
                          <p className="text-slate-500 font-bold">{t('placed_on_date', { date: new Date(order.created_at).toLocaleDateString() })}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase ${order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-600' :
                              'bg-green-100 text-green-600'
                          }`}>
                          {order.status}
                        </span>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">₹{order.total_amount}</p>
                          {order.delivery_fee > 0 && (
                            <p className="text-[10px] text-slate-400 font-bold italic">Incl. ₹{order.delivery_fee} AI Shipping</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <p className="text-sm font-black text-amber-700">Waiting for farmer to accept order.</p>
                      </div>
                    )}

                    {order.status === 'accepted' && (
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-indigo-700">Start logistics from buyer side</p>
                          <p className="text-xs text-indigo-600 font-semibold">Select slot and plan, then request dispatch.</p>
                        </div>
                        <button
                          onClick={() => handleOpenLogistics(order)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-black hover:bg-indigo-700"
                        >
                          Plan Logistics
                        </button>
                      </div>
                    )}

                    {Number(order.additional_shipping_fee || 0) > 0 && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        {!order.additional_shipping_paid ? (
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-black text-rose-700">
                                Extra Shipping Due: ₹{Number(order.additional_shipping_fee).toFixed(2)}
                              </p>
                              <p className="text-xs text-rose-600 font-semibold mt-1">
                                Pay this amount first. Delivery cannot be completed until extra shipping is paid.
                              </p>
                            </div>
                            <button
                              onClick={() => handlePayExtraShipping(order)}
                              disabled={payingExtraOrderId === order.id}
                              className="px-4 py-2 rounded-xl bg-rose-600 text-white font-black hover:bg-rose-700 disabled:bg-rose-300"
                            >
                              {payingExtraOrderId === order.id ? 'Processing...' : 'Pay Now'}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-black text-emerald-700">
                              Extra Shipping Paid: ₹{Number(order.additional_shipping_fee).toFixed(2)}
                            </p>
                            <p className="text-xs text-emerald-600 font-semibold mt-1">
                              Extra shipping payment completed successfully.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {order.status === 'shipped' && !order.pod_verified && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-blue-700">Confirm delivery with farmer POD code</p>
                          <p className="text-xs text-blue-600 font-semibold">
                            {order.pod_configured ? 'Farmer has generated POD code. Enter it to complete delivery.' : 'Waiting for farmer to generate POD code.'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleOpenLogistics(order)}
                          disabled={!order.pod_configured}
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-black hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          Enter POD
                        </button>
                      </div>
                    )}

                    {order.pod_verified && (
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                        <p className="text-sm font-black text-emerald-700">POD verified. Delivery confirmed.</p>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="rounded-2xl border border-yellow-100 bg-yellow-50 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-yellow-800">Rating and Review System</p>
                            <p className="text-xs text-yellow-700 font-semibold">Rate farmer service and share your feedback for this order.</p>
                          </div>
                          <button
                            onClick={() => handleOpenReview(order)}
                            className="px-4 py-2 rounded-xl bg-yellow-500 text-white font-black hover:bg-yellow-600"
                          >
                            Rate Farmer
                          </button>
                        </div>

                        {getOrderReviews(order).length > 0 && (
                          <div className="space-y-2">
                            {getOrderReviews(order).map((review) => (
                              <div key={review.id} className="rounded-xl bg-white border border-yellow-100 px-3 py-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-black text-slate-800">{review.product_name}</p>
                                  <p className="text-xs font-black text-yellow-700">{review.rating}/5</p>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{review.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDownloadBill(order)}
                        className="px-4 py-2 rounded-xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-colors flex items-center gap-2"
                      >
                        <Download size={16} /> Download Bill PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {logisticsOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-3xl rounded-[2.2rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">Buyer Logistics Control</h3>
                    <p className="text-slate-500 font-medium mt-1">Order #{logisticsOrder.id} - Stage: {logisticsOrder.status}</p>
                  </div>
                  <button
                    onClick={() => setLogisticsOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>

                {logisticsOrder.status === 'accepted' && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-xl font-black text-slate-900">Step 1: Choose Delivery Slot</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['08:00-10:00', '10:00-12:00', '14:00-16:00', '16:00-18:00'].map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setDeliverySlot(slot)}
                          className={`px-3 py-2 rounded-lg text-xs font-black transition-colors ${deliverySlot === slot ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>

                    <h4 className="text-xl font-black text-slate-900 mt-4">Step 2: Choose Logistics Plan</h4>
                    <div className="grid gap-3">
                      {getSmartLogisticsOptions(logisticsOrder).map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => setSelectedLogisticsPlan(plan.id)}
                          className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedLogisticsPlan === plan.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white hover:border-indigo-200'}`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-black text-slate-900">{plan.title}</p>
                            <span className="text-xs font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-700">ETA {plan.eta}</span>
                          </div>
                          <p className="text-xs text-slate-600 font-semibold mt-1">{plan.note}</p>
                        </button>
                      ))}
                    </div>
                    {selectedLogisticsPlan === 'express_direct' && (
                      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                        <p className="text-sm font-black text-rose-700">
                          Extra shipping to pay: ₹{getExpectedExtraShipping(logisticsOrder, selectedLogisticsPlan).toFixed(2)}
                        </p>
                        <p className="text-xs text-rose-600 font-semibold mt-1">
                          Express Direct adds premium dispatch charges and will reflect in your order shipping total.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {logisticsOrder.status === 'shipped' && (
                  <div className="space-y-4 mb-6">
                    <h4 className="text-xl font-black text-slate-900">Step 3: Confirm Delivery with POD</h4>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <p className="text-sm font-bold text-blue-700 mb-2">Enter 4-digit POD code generated by farmer</p>
                      <input
                        type="text"
                        maxLength={4}
                        value={podCodeInput}
                        onChange={(e) => setPodCodeInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full md:w-60 px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:border-blue-500 font-black text-lg tracking-[0.35em]"
                        placeholder="0000"
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setLogisticsOrder(null)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  {(logisticsOrder.status === 'accepted' || logisticsOrder.status === 'shipped') && (
                    <button
                      onClick={handleBuyerLogisticsProgress}
                      disabled={logisticsSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      {logisticsSubmitting
                        ? 'Updating...'
                        : logisticsOrder.status === 'accepted'
                          ? 'Start Logistics'
                          : 'Complete Delivery'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {reviewOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-2xl rounded-[2rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900">Farmer Rating & Buyer Feedback</h3>
                    <p className="text-slate-500 font-medium mt-1">Order #{reviewOrder.id} • Share your delivery experience</p>
                  </div>
                  <button
                    onClick={() => setReviewOrder(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleSubmitReview} className="space-y-6">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">{t('product')}</label>
                    <select
                      value={reviewProductId}
                      onChange={(e) => handleReviewProductChange(e.target.value)}
                      className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl font-semibold outline-none focus:border-yellow-500"
                    >
                      {(reviewOrder.items || []).map((item) => (
                        <option key={item.id} value={item.product}>{item.product_name || `Product #${item.product}`}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">{t('farmer_rating')}</label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`p-1 ${star <= reviewRating ? 'text-yellow-500' : 'text-slate-300'}`}
                        >
                          <Star size={28} fill={star <= reviewRating ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm font-black text-slate-700">{reviewRating}/5</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black uppercase tracking-wide text-slate-400">{t('buyer_feedback')}</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      placeholder={t('feedback_placeholder')}
                      className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl font-medium outline-none focus:border-yellow-500 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewOrder(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={reviewSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-yellow-500 text-white font-black hover:bg-yellow-600 disabled:bg-yellow-300"
                    >
                      {reviewSubmitting ? t('saving') : t('submit_feedback')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900">Your Negotiations</h2>
              {negotiations.length === 0 ? (
                <div className="px-6 py-10 rounded-2xl bg-white border border-slate-200 text-slate-500 font-semibold text-center">
                  No negotiations yet. Your real bids and counters will appear here.
                </div>
              ) : (
                <div className="grid gap-6">
                  {negotiations.map((neg) => (
                    <div key={neg.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden">
                          <img src={neg.product_image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-black text-slate-900">{neg.product_name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${neg.status === 'accepted' ? 'bg-green-100 text-green-600' :
                                neg.status === 'rejected' ? 'bg-red-100 text-red-600' :
                                  'bg-orange-100 text-orange-600'
                              }`}>
                              {t(neg.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-slate-400 font-bold line-through text-sm">₹{neg.original_price}</p>
                            <p className="text-primary-600 font-black">{t('your_offer')}: ₹{neg.offered_price}</p>
                            {neg.farmer_counter_price && (
                              <p className="text-orange-500 font-black">{t('counter')}: ₹{neg.farmer_counter_price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(neg.status === 'accepted' || neg.status === 'countered') && (
                          <button
                            onClick={() => handleBidPurchase(neg)}
                            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all flex items-center gap-2"
                          >
                            <ShoppingCart size={18} /> {t('purchase_now')}
                          </button>
                        )}
                        {neg.status === 'pending' && (
                          <p className="text-slate-400 font-bold italic">{t('waiting_farmer')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-3xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
                <h2 className="text-4xl font-extrabold text-slate-900 mb-2">{t('buyer_profile')}</h2>
                <p className="text-slate-500 font-medium mb-8">{t('buyer_profile_subtitle')}</p>

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
                        value={userProfile?.role || 'buyer'}
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
                      <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('business_name')}</label>
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
                    <label className="text-xs font-black uppercase text-slate-400 ml-1">{t('shipping_address_label')}</label>
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
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300 flex flex-col md:flex-row">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-8 right-8 z-10 text-slate-400 hover:text-slate-900 bg-white/80 backdrop-blur-md rounded-full p-2"><X size={28} /></button>

            <div className="md:w-1/2 h-80 md:h-auto bg-slate-100">
              <img src={selectedProduct.image || 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&q=80&w=600'} className="w-full h-full object-cover" alt={selectedProduct.name} />
            </div>

            <div className="md:w-1/2 p-12 space-y-8 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                <span className="px-4 py-1.5 bg-primary-100 text-primary-700 text-xs font-black uppercase rounded-lg">{formatCategoryLabel(selectedProduct.category)}</span>
                <h3 className="text-4xl font-black text-slate-900">{selectedProduct.name}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-black text-primary-600">₹{selectedProduct.price}<span className="text-sm text-slate-400 font-bold ml-1">/{selectedProduct.unit || 'kg'}</span></span>
                  <div className="flex items-center gap-1 text-orange-400">
                    <Star size={18} fill="currentColor" />
                    <span className="text-slate-900 font-black">4.8</span>
                    <span className="text-slate-400 font-bold">(120 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm">
                    <Store size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('farmer_seller')}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-black text-slate-900">{selectedProduct.farmer_name || 'AgriFarmer'}</p>
                      <div className="flex items-center gap-0.5">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-sm font-bold text-slate-600">{selectedProduct.farmer_avg_rating || 0}</span>
                        <span className="text-sm text-slate-400">({selectedProduct.farmer_total_reviews || 0})</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-400 shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('farm_address_label')}</p>
                    <p className="text-lg font-black text-slate-900">{selectedProduct.address || 'Farm Land'} ({calculateDisplayDistance(selectedProduct)} away)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-900">{t('description')}</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="pt-6 flex gap-4">
                <button
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="flex-1 py-5 bg-primary-600 text-white text-xl font-black rounded-3xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} /> {t('add_to_basket')}
                </button>
                <button
                  onClick={() => { setShowNegotiate(selectedProduct); setSelectedProduct(null); }}
                  className="w-20 h-20 bg-white border-2 border-slate-100 text-slate-900 rounded-3xl hover:border-primary-500 hover:text-primary-600 transition-all flex items-center justify-center"
                >
                  <MessageCircle size={32} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowNegotiate(null)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900"><X size={28} /></button>
            <h3 className="text-3xl font-black text-slate-900 mb-2">{t('negotiate_price')}</h3>
            <div className="mb-8">
              <p className="text-slate-500 font-medium">{t('send_offer_to')}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-black text-slate-900">{showNegotiate.farmer_name}</span>
                <div className="flex items-center gap-0.5">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-bold text-slate-600">{showNegotiate.farmer_avg_rating || 0}</span>
                  <span className="text-sm text-slate-400">({showNegotiate.farmer_total_reviews || 0})</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleNegotiate} className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">{t('original_price')}</span>
                <span className="text-xl font-black text-slate-900">₹{showNegotiate.price}<span className="text-sm font-bold text-slate-400">/{showNegotiate.unit}</span></span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 ml-1">{t('your_offer_price')}</label>
                <div className="relative">
                  <span className="absolute left-6 top-4 font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-black"
                    placeholder={t('enter_offer_hint')}
                    value={negotiationPrice}
                    onChange={(e) => setNegotiationPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 ml-1">{t('message_optional')}</label>
                <textarea
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[100px]"
                  placeholder={t('ask_bulk_hint')}
                  value={negotiationMessage}
                  onChange={(e) => setNegotiationMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-3xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200">{t('send_price_offer')}</button>
            </form>
          </div>
        </div>
      )}

      {toast.show && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]">
          <div className="bg-white text-slate-900 rounded-[1.75rem] shadow-2xl p-6 w-full max-w-md border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-lg font-black text-slate-900">{t('added_to_cart_title')}</p>
                <p className="text-sm font-semibold text-slate-600 mt-1">{toast.message}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setActiveTab('cart');
                  setToast({ show: false, message: '' });
                }}
                className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-black hover:bg-primary-700 transition-colors"
              >
                {t('view_cart')}
              </button>
              <button
                onClick={() => setToast({ show: false, message: '' })}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-black hover:bg-slate-200 transition-colors"
              >
                {t('dismiss')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
