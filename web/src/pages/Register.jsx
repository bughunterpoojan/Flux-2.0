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
  const [lastVerifiedGstin, setLastVerifiedGstin] = useState('');
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

  const verifyGstin = async (gstinToVerify) => {
    if (!gstinToVerify) return false;

    const normalizedGstin = gstinToVerify.trim().toUpperCase();
    if (normalizedGstin.length !== 15) return false;
    if (normalizedGstin === lastVerifiedGstin && gstinVerified) return true;

    setVerifyingGstin(true);
    setError('');
    try {
      const response = await api.get(`gstin/?gstin=${normalizedGstin}`);
      setFormData((prev) => ({
        ...prev,
        gstin: normalizedGstin,
        business_name: response.data.taxpayer_name,
        address: response.data.registered_address
      }));
      setGstinVerified(true);
      setLastVerifiedGstin(normalizedGstin);
      return true;
    } catch (err) {
      setError('Invalid GSTIN or verification failed');
      setGstinVerified(false);
      setLastVerifiedGstin('');
      return false;
    } finally {
      setVerifyingGstin(false);
    }
  };

  const handleVerifyGstin = async () => {
    await verifyGstin(formData.gstin);
  };

  React.useEffect(() => {
    if (formData.role !== 'buyer') return;

    const normalizedGstin = (formData.gstin || '').trim().toUpperCase();
    if (normalizedGstin.length < 15) {
      if (gstinVerified) {
        setGstinVerified(false);
      }
      if (lastVerifiedGstin) {
        setLastVerifiedGstin('');
      }
      return;
    }

    const timer = setTimeout(() => {
      verifyGstin(normalizedGstin);
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.gstin, formData.role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedGstin = (formData.gstin || '').trim().toUpperCase();
    if (formData.role === 'buyer' && normalizedGstin) {
      if (normalizedGstin.length !== 15) {
        setError('GSTIN must be 15 characters if provided.');
        return;
      }
      if (!gstinVerified) {
        const verified = await verifyGstin(normalizedGstin);
        if (!verified) {
          setError('Please verify a valid GSTIN or clear GSTIN to continue.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      await api.post('auth/register/', {
        ...formData,
        gstin: normalizedGstin,
      });
      navigate('/login');
    } catch (err) {
      setError('Registration failed. Username or email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen fresh-auth-bg flex items-center justify-center p-6 py-20">
      <div className="max-w-2xl w-full">
        <div className="glass-panel rounded-[2.5rem] p-10 border border-primary-100 page-section">
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
                  className={`py-4 rounded-2xl font-bold border-2 transition-all ${formData.role === 'buyer' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md shadow-primary-100/50' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                  onClick={() => setFormData({ ...formData, role: 'buyer' })}
                >
                  {t('buyer_store')}
                </button>
                <button
                  type="button"
                  className={`py-4 rounded-2xl font-bold border-2 transition-all ${formData.role === 'farmer' ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md shadow-primary-100/50' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
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
                              onChange={(e) => {
                                const nextGstin = e.target.value.toUpperCase().slice(0, 15);
                                setFormData({ ...formData, gstin: nextGstin });
                                if (error) setError('');
                                if (nextGstin.length < 15 && gstinVerified) setGstinVerified(false);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleVerifyGstin}
                            disabled={verifyingGstin || !formData.gstin}
                            className="px-6 btn-primary text-white disabled:opacity-50 flex items-center gap-2"
                          >
                            {verifyingGstin ? <Loader2 className="w-5 h-5 animate-spin" /> : gstinVerified ? <CheckCircle2 className="w-5 h-5" /> : t('verify')}
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 font-semibold ml-1">
                          GSTIN auto-verifies when all 15 characters are entered.
                        </p>
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
              disabled={loading}
              className="w-full py-4 btn-primary text-white text-lg disabled:opacity-70 disabled:translate-y-0 group flex items-center justify-center gap-2"
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
