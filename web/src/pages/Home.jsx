import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, ShoppingBag, TrendingUp, ShieldCheck, MapPin, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Home = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Leaf className="text-primary-600 w-8 h-8" />
          <span className="text-2xl font-bold text-slate-800 tracking-tight">{t('app_title')}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border rounded-lg group hover:border-primary-300 transition-colors">
            <Globe className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
            <select 
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
              className="bg-transparent text-sm font-semibold text-slate-600 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
            </select>
          </div>
          <Link to="/login" className="px-5 py-2 text-slate-600 font-medium hover:text-primary-600 transition-colors">{t('login')}</Link>
          <Link to="/register" className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-all shadow-primary-200">{t('signup')}</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-primary-50 to-white overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2 space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full font-semibold text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              Empowering Direct Trade
            </div>
            <h1 className="text-6xl font-extrabold text-slate-900 leading-[1.1]">
              {t('hero_title', { target: '' })} <span className="text-primary-600">{t('hero_target')}</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
              {t('hero_subtitle')}
            </p>
            <div className="flex gap-4 pt-4">
              <Link to="/register" className="group flex items-center gap-2 px-8 py-4 bg-primary-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-95 shadow-primary-200">
                {t('start_trading')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white text-slate-800 text-lg font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 transition-all">
                {t('learn_more')}
              </button>
            </div>
          </div>
          <div className="md:w-1/2 relative group">
            <div className="absolute inset-0 bg-primary-200 blur-3xl rounded-full opacity-30 -z-10 animate-pulse"></div>
            <img 
              src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1000" 
              alt="Sustainable Farming" 
              className="rounded-3xl shadow-2xl transform transition-transform group-hover:-translate-y-2 group-hover:rotate-1 duration-500"
            />
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl font-bold text-slate-900">{t('why_choose', { app: t('app_title') })}</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">{t('why_subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 hover:bg-white border hover:border-primary-100 transition-all group">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="text-primary-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('ai_pricing_title')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('ai_pricing_desc')}</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 hover:bg-white border hover:border-primary-100 transition-all group">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MapPin className="text-primary-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('ai_logistics_title')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('ai_logistics_desc')}</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 hover:bg-white border hover:border-primary-100 transition-all group">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-primary-600 w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">{t('verified_trade_title')}</h3>
              <p className="text-slate-600 leading-relaxed">{t('verified_trade_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-slate-900">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h2 className="text-5xl font-extrabold text-white leading-tight">{t('cta_title')}</h2>
          <p className="text-xl text-slate-400">{t('cta_subtitle', { app: t('app_title') })}</p>
          <div className="flex justify-center gap-6 pt-6">
            <Link to="/register" className="px-10 py-5 bg-primary-500 text-white text-xl font-bold rounded-2xl hover:bg-primary-400 transition-all shadow-xl shadow-primary-900/40">{t('reg_farmer')}</Link>
            <Link to="/register" className="px-10 py-5 bg-white text-slate-900 text-xl font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-xl shadow-black/20">{t('reg_buyer')}</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-white border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500">
          <div className="flex items-center gap-2">
            <Leaf className="text-primary-600 w-6 h-6" />
            <span className="text-xl font-bold text-slate-800 tracking-tight">{t('app_title')}</span>
          </div>
          <div className="flex gap-8 font-medium">
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Contact Us</a>
          </div>
          <p>© {new Date().getFullYear()} {t('app_title')} Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
