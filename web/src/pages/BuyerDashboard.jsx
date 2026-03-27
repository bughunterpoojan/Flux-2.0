import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ShoppingCart, User, LogOut, 
  MapPin, Star, History, Package, ChevronRight,
  TrendingDown, MessageCircle, CreditCard, Loader2,
  CheckCircle2, AlertCircle, ArrowRight, Store, X, Plus, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const BuyerDashboard = () => {
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
  const navigate = useNavigate();

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, profileRes, negRes] = await Promise.all([
        api.get('products/'),
        api.get('orders/'),
        api.get('auth/profile/'),
        api.get('negotiations/')
      ]);
      setProducts(prodRes.data);
      setOrders(orderRes.data);
      setUserProfile(profileRes.data);
      setNegotiations(negRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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
    if (!cart.find(p => p.id === product.id)) {
      setCart([...cart, { ...product, price: finalPrice, quantity: 1 }]);
    }
  };

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
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalAmount = subtotal + logisticsFee;
      
      const orderRes = await api.post('orders/', {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, price: item.price })),
        delivery_fee: logisticsFee,
        total_amount: totalAmount,
        distance_km: distanceKm
      });
      
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
          ondismiss: function() {
            setCheckingOut(false);
          }
        },
        theme: { color: "#3e9150" }
      };
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      setCheckingOut(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) && 
    (filter === 'all' || p.category === filter)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
            <TrendingDown size={24} />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">AgriBuyer</span>
        </div>

        <div className="flex-1 max-w-2xl mx-12">
          <div className="relative group">
            <Search className="absolute left-6 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search wholesale fresh produce..." 
              className="w-full pl-16 pr-6 py-4 bg-slate-100 border-none rounded-2xl outline-none focus:bg-white focus:ring-2 ring-primary-500/10 transition-all font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`p-3 rounded-2xl transition-all ${activeTab === 'orders' ? 'bg-primary-50 text-primary-600 font-bold px-5 flex items-center gap-2 ring-1 ring-primary-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {activeTab === 'orders' ? <><History size={20}/> My Orders</> : <History size={24}/>}
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
        <aside className="w-80 bg-white border-r border-slate-100 p-8 space-y-10 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Categories</h3>
            <div className="space-y-2">
              {['all', 'vegetables', 'fruits', 'grains', 'dairy', 'organic'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold capitalize transition-all ${filter === cat ? 'bg-primary-600 text-white shadow-xl shadow-primary-200' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  {cat} {filter === cat && <ChevronRight size={18} />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">My Activity</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <Package size={20} /> My Orders
              </button>
              <button 
                onClick={() => setActiveTab('bids')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'bids' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                <MessageCircle size={20} /> My Bids
              </button>
            </div>
          </div>

          <div className="p-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-[2.5rem] shadow-2xl shadow-primary-200 text-white space-y-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <TrendingDown size={28} />
            </div>
            <h4 className="text-2xl font-black leading-tight">Smart Negotiation</h4>
            <p className="text-sm font-medium text-primary-100">Our platform allows you to directly counter-offer prices with farmers for bulk orders.</p>
            <button className="w-full py-3 bg-white text-primary-700 font-black rounded-xl hover:bg-primary-50 transition-all">Learn How</button>
          </div>
        </aside>

        {/* Product Grid / Cart / Orders */}
        <main className="flex-1 p-10 overflow-y-auto">
          {activeTab === 'browse' && (
            <div className="space-y-10">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-2">Fresh Collection</h2>
                  <p className="text-slate-500 font-medium">Over {products.length} types of produce ready for harvest.</p>
                </div>
                <div className="flex gap-4">
                  <span className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-slate-600">Sort by: Relevancy</span>
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
                        <span className="px-4 py-1.5 bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-black uppercase rounded-lg shadow-sm">{p.category}</span>
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
                          <span className="text-xs font-bold leading-none">Dist: {calculateDisplayDistance(p)}</span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 rounded text-slate-600 ml-auto">{p.farmer_name || 'AgriFarmer'}</span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{p.description}</p>
                      </div>
                      <div className="mt-8 flex gap-3">
                        <button 
                          onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                          className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                          <ShoppingCart size={18} /> Buy Now
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
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-left-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900">Checkout Basket</h2>
              {cart.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-12">
                  <div className="md:col-span-2 space-y-6">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden">
                            <img src={item.image} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-slate-900">{item.name}</h4>
                            <p className="text-slate-500 font-bold">₹{item.price}/{item.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <input 
                            type="number" 
                            className="w-16 p-2 bg-slate-50 border-none rounded-xl text-center font-bold" 
                            value={item.quantity}
                            onChange={(e) => {
                              const newCart = [...cart];
                              newCart.find(p => p.id === item.id).quantity = e.target.value;
                              setCart(newCart);
                            }}
                          />
                          <button 
                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                            onClick={() => setCart(cart.filter(p => p.id !== item.id))}
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-8">
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                      <h3 className="text-2xl font-black text-slate-900">Summary</h3>
                      <div className="space-y-4 font-bold text-slate-500">
                        <div className="flex justify-between"><span>Subtotal</span><span className="text-slate-900">₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}</span></div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1">
                            <span>Logistics Fee</span>
                            <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] uppercase font-black">AI Quote</span>
                          </div>
                          {logisticsLoading ? <Loader2 size={12} className="animate-spin" /> : <span className="text-slate-900 text-sm">₹{logisticsFee}</span>}
                        </div>
                        <div className="flex justify-between text-xs italic">
                          <span>Total Distance</span>
                          <span>{distanceKm}km</span>
                        </div>
                        <div className="flex justify-between"><span>Tax (GST)</span><span className="text-slate-900">₹0.00</span></div>
                      </div>
                      <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-3xl font-black text-slate-900">
                        <span>Total</span>
                        <span>₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + logisticsFee}</span>
                      </div>
                      <button 
                        onClick={handleCheckout}
                        disabled={checkingOut}
                        className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3"
                      >
                        {checkingOut ? <Loader2 className="animate-spin" /> : <><CreditCard /> Pay with Razorpay</>}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white py-32 rounded-[2.5rem] text-center space-y-6">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart size={48} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Your basket is empty</h3>
                  <button onClick={() => setActiveTab('browse')} className="px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:scale-105 transition-transform">Browse Fresh Produce</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900">Order Tracking</h2>
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Package size={32} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900">Order #{order.id}</h4>
                        <p className="text-slate-500 font-bold">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-4 py-1.5 rounded-full font-black text-[10px] uppercase ${
                        order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
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
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bids' && (
            <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-700">
              <h2 className="text-4xl font-extrabold text-slate-900">Your Negotiations</h2>
              <div className="grid gap-6">
                {negotiations.length > 0 ? (
                  negotiations.map((neg) => (
                    <div key={neg.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden">
                          <img src={neg.product_image} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xl font-black text-slate-900">{neg.product_name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              neg.status === 'accepted' ? 'bg-green-100 text-green-600' :
                              neg.status === 'rejected' ? 'bg-red-100 text-red-600' :
                              'bg-orange-100 text-orange-600'
                            }`}>
                              {neg.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-slate-400 font-bold line-through text-sm">₹{neg.original_price}</p>
                            <p className="text-primary-600 font-black">Your Offer: ₹{neg.offered_price}</p>
                            {neg.farmer_counter_price && (
                              <p className="text-orange-500 font-black">Counter: ₹{neg.farmer_counter_price}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {(neg.status === 'accepted' || neg.status === 'countered') && (
                          <button 
                            onClick={() => {
                              const product = products.find(p => p.id === neg.product);
                              addToCart(product, neg.status === 'accepted' ? neg.offered_price : neg.farmer_counter_price);
                              setActiveTab('cart');
                            }}
                            className="px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all flex items-center gap-2"
                          >
                            <ShoppingCart size={18} /> Purchase Now
                          </button>
                        )}
                        {neg.status === 'pending' && (
                          <p className="text-slate-400 font-bold italic">Waiting for farmer...</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white py-32 rounded-[2.5rem] text-center space-y-6">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                      <TrendingDown size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">No negotiations yet</h3>
                    <button onClick={() => setActiveTab('browse')} className="px-10 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:scale-105 transition-transform">Browse Fresh Produce</button>
                  </div>
                )}
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
                <span className="px-4 py-1.5 bg-primary-100 text-primary-700 text-xs font-black uppercase rounded-lg">{selectedProduct.category}</span>
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
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Farmer</p>
                    <p className="text-lg font-black text-slate-900">{selectedProduct.farmer_name || 'AgriFarmer'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-red-400 shadow-sm">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location</p>
                    <p className="text-lg font-black text-slate-900">{selectedProduct.address || 'Farm Land'} ({calculateDisplayDistance(selectedProduct)} away)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xl font-black text-slate-900">Description</h4>
                <p className="text-slate-500 font-medium leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="pt-6 flex gap-4">
                <button 
                  onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                  className="flex-1 py-5 bg-primary-600 text-white text-xl font-black rounded-3xl shadow-xl shadow-primary-200 hover:bg-primary-700 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingCart size={24} /> Add to Basket
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
            <h3 className="text-3xl font-black text-slate-900 mb-2">Negotiate Price</h3>
            <p className="text-slate-500 font-medium mb-8">Send an offer directly to {showNegotiate.farmer_name}.</p>
            
            <form onSubmit={handleNegotiate} className="space-y-6">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-500">Original Price</span>
                <span className="text-xl font-black text-slate-900">₹{showNegotiate.price}<span className="text-sm font-bold text-slate-400">/{showNegotiate.unit}</span></span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 ml-1">Your Offer Price</label>
                <div className="relative">
                  <span className="absolute left-6 top-4 font-black text-slate-400">₹</span>
                  <input 
                    type="number" 
                    required
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-black"
                    placeholder="Enter low or fair price"
                    value={negotiationPrice}
                    onChange={(e) => setNegotiationPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-900 ml-1">Message (Optional)</label>
                <textarea 
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 font-bold min-h-[100px]"
                  placeholder="Ask about bulk discounts or quality..."
                  value={negotiationMessage}
                  onChange={(e) => setNegotiationMessage(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full py-5 bg-primary-600 text-white text-xl font-black rounded-3xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200">Send Price Offer</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboard;
