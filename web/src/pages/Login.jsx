import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Mail, Lock, Loader2, ArrowRight, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api, { setAuthToken } from '../api';

const Login = () => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');
    if (token && role) {
      if (role === 'farmer') navigate('/farmer');
      else navigate('/buyer');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('auth/login/', formData);
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      setAuthToken(response.data.access);

      // Decode JWT to get role (or fetch from a profile endpoint)
      // For simplicity, let's assume we have a user profile endpoint
      const userProfile = await api.get('auth/profile/');
      localStorage.setItem('role', userProfile.data.role);

      if (userProfile.data.role === 'farmer') navigate('/farmer');
      else navigate('/buyer');
    } catch (err) {
      setError(t('login_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen fresh-auth-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="glass-panel rounded-[2.5rem] p-10 border border-primary-100 page-section">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
              <Leaf className="text-primary-600 w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{t('welcome_back_title')}</h2>
            <p className="text-slate-500 font-medium">{t('login_subtitle')}</p>

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
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">{t('username')}</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('enter_username')}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-primary-500 focus:bg-white transition-all font-medium"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">{t('password')}</label>
                <a href="#" className="text-sm font-bold text-primary-600 hover:text-primary-700">{t('forgot_password')}</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-primary-600 transition-colors w-5 h-5" />
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

            {error && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600">
                  <Leaf className="w-5 h-5 rotate-180" />
                </div>
                <p className="text-red-600 text-sm font-bold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 btn-primary text-lg disabled:opacity-70 disabled:translate-y-0 group flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{t('login')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium">
              {t('no_account')}{' '}
              <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700">{t('signup')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
