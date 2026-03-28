import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, User, Mail, Lock, Building, MapPin, CheckCircle2, Loader2, ArrowRight, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

const Register = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'buyer',
    gstin: '',
    business_name: '',
    address: '',
    location_lat: 19.0760, // Default to Mumbai
    location_lng: 72.8777
  });
  const [loading, setLoading] = useState(false);
  const [verifyingGstin, setVerifyingGstin] = useState(false);
  const [gstinVerified, setGstinVerified] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({ ...prev, location_lat: latitude, location_lng: longitude }));
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setFormData(prev => ({ ...prev, address: data.display_name }));
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        }
      });
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleVerifyGstin = async () => {
    if (!formData.gstin) return;
    setVerifyingGstin(true);
    setError('');
    try {
      const response = await api.get(`gstin/?gstin=${formData.gstin}`);
      setFormData({
        ...formData,
        business_name: response.data.taxpayer_name,
        address: response.data.registered_address
      });
      setGstinVerified(true);
    } catch (err) {
      setError('Invalid GSTIN or verification failed');
    } finally {
      setVerifyingGstin(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('auth/register/', formData);
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Username or email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 py-20">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <Leaf className="text-primary-600 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{t('join_agrimarket')}</h2>
            <p className="text-slate-500 font-medium max-w-sm">{t('join_subtitle')}</p>

            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg group hover:border-primary-300 transition-colors">
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">{t('username')}</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="john_doe"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">{t('email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('i_am_a')}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`py-4 rounded-2xl font-bold border-2 transition-all ${formData.role === 'buyer' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                >
                  {t('buyer_store')}
                </button>
                <button
                  type="button"
                  className={`py-4 rounded-2xl font-bold border-2 transition-all ${formData.role === 'farmer' ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  onClick={() => setFormData({ ...formData, role: 'farmer' })}
                >
                  {t('farmer_seller')}
                </button>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              {formData.role === 'buyer' ? (
                <>
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">{t('business_verification')}</label>
                      <div className="flex gap-2">
                        <div className="relative flex-grow">
                          <Building className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                          <input
                            type="text"
                            placeholder={t('enter_gstin')}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium uppercase"
                            value={formData.gstin}
                            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyGstin}
                          disabled={verifyingGstin || !formData.gstin}
                          className="px-6 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2"
                        >
                          {verifyingGstin ? <Loader2 className="w-5 h-5 animate-spin" /> : gstinVerified ? <CheckCircle2 className="w-5 h-5" /> : t('verify')}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">{t('business_name_label')}</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder={t('store_ngo_name')}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 ml-1">{t('shipping_address')}</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                        <textarea
                          placeholder={t('full_address_hint')}
                          className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium min-h-[100px]"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          required
                        />
                        <button 
                          type="button"
                          onClick={handleGetLocation}
                          className="absolute bottom-4 right-4 text-xs font-black text-primary-600 hover:text-primary-700 bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm transition-all"
                        >
                          {t('detect_coords')}
                        </button>
                      </div>
                      <p className="text-[10px] text-primary-600 font-bold ml-2 italic">{t('gps_precision_hint')}</p>
                      {formData.location_lat && (
                        <p className="text-[10px] text-slate-400 font-bold ml-2">Location: {formData.location_lat.toFixed(4)}, {formData.location_lng.toFixed(4)}</p>
                      )}
                    </div>
                  </div>
                </div>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t('farm_name_label')}</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={t('farm_name_hint')}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">{t('farm_address_label')}</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                      <textarea
                        placeholder={t('farm_address_hint')}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium min-h-[100px]"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                      <button 
                        type="button"
                        onClick={handleGetLocation}
                        className="absolute bottom-4 right-4 text-xs font-black text-primary-600 hover:text-primary-700 bg-white px-3 py-1.5 rounded-lg border border-primary-100 shadow-sm transition-all"
                      >
                        {t('detect_location')}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading || (formData.role === 'buyer' && !gstinVerified)}
              className="w-full py-4 bg-primary-600 text-white text-lg font-bold rounded-2xl shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-70 disabled:scale-100 group flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t('register')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium">
              {t('already_have_account')}{' '}
              <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700">{t('login_now')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
