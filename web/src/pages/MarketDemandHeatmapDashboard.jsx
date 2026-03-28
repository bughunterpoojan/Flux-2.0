import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { Flame, MapPin, TrendingUp } from 'lucide-react';

const getCrops = (t) => [
  { label: t('wheat_crop'), value: 'Wheat' },
  { label: t('rice_crop'), value: 'Rice' },
  { label: t('tomato_crop'), value: 'Tomato' },
  { label: t('onion_crop'), value: 'Onion' },
  { label: t('potato_crop'), value: 'Potato' }
];

const getTimeOptions = (t) => [
  { label: t('today'), value: 'today' },
  { label: t('last_7_days'), value: '7d' },
  { label: t('last_30_days'), value: '30d' },
];

const getLocationOptions = (t) => [
  t('india'),
  t('north_india'),
  t('south_india'),
  t('west_india'),
  t('east_india')
];

const regionLabelMap = (t) => ({
  'India': t('india'),
  'North India': t('north_india'),
  'South India': t('south_india'),
  'West India': t('west_india'),
  'East India': t('east_india')
});

const regionForCity = {
  Delhi: 'North India',
  Chandigarh: 'North India',
  Lucknow: 'North India',
  Jaipur: 'North India',
  Mumbai: 'West India',
  Ahmedabad: 'West India',
  Pune: 'West India',
  Bengaluru: 'South India',
  Hyderabad: 'South India',
  Chennai: 'South India',
  Kolkata: 'East India',
  Bhubaneswar: 'East India',
};

const cityHeatNodes = [
  {
    city: 'Delhi',
    x: 176,
    y: 124,
    baseDemand: { Wheat: 86, Rice: 72, Tomato: 78, Onion: 80, Potato: 74 },
    basePrice: { Wheat: 2450, Rice: 2650, Tomato: 2850, Onion: 2300, Potato: 2150 },
    baseQty: { Wheat: 68, Rice: 72, Tomato: 63, Onion: 58, Potato: 55 },
  },
  {
    city: 'Chandigarh',
    x: 164,
    y: 100,
    baseDemand: { Wheat: 91, Rice: 70, Tomato: 65, Onion: 62, Potato: 59 },
    basePrice: { Wheat: 2320, Rice: 2520, Tomato: 2680, Onion: 2190, Potato: 2090 },
    baseQty: { Wheat: 52, Rice: 54, Tomato: 49, Onion: 42, Potato: 40 },
  },
  {
    city: 'Lucknow',
    x: 212,
    y: 140,
    baseDemand: { Wheat: 78, Rice: 81, Tomato: 76, Onion: 71, Potato: 68 },
    basePrice: { Wheat: 2380, Rice: 2710, Tomato: 2790, Onion: 2270, Potato: 2140 },
    baseQty: { Wheat: 55, Rice: 62, Tomato: 57, Onion: 50, Potato: 46 },
  },
  {
    city: 'Jaipur',
    x: 152,
    y: 152,
    baseDemand: { Wheat: 84, Rice: 66, Tomato: 61, Onion: 74, Potato: 53 },
    basePrice: { Wheat: 2340, Rice: 2480, Tomato: 2650, Onion: 2230, Potato: 2040 },
    baseQty: { Wheat: 47, Rice: 45, Tomato: 42, Onion: 48, Potato: 36 },
  },
  {
    city: 'Ahmedabad',
    x: 142,
    y: 212,
    baseDemand: { Wheat: 73, Rice: 58, Tomato: 67, Onion: 81, Potato: 62 },
    basePrice: { Wheat: 2290, Rice: 2400, Tomato: 2710, Onion: 2360, Potato: 2100 },
    baseQty: { Wheat: 44, Rice: 39, Tomato: 50, Onion: 53, Potato: 41 },
  },
  {
    city: 'Mumbai',
    x: 146,
    y: 252,
    baseDemand: { Wheat: 70, Rice: 64, Tomato: 86, Onion: 88, Potato: 75 },
    basePrice: { Wheat: 2480, Rice: 2610, Tomato: 3080, Onion: 2920, Potato: 2540 },
    baseQty: { Wheat: 52, Rice: 56, Tomato: 72, Onion: 66, Potato: 61 },
  },
  {
    city: 'Pune',
    x: 160,
    y: 280,
    baseDemand: { Wheat: 64, Rice: 58, Tomato: 83, Onion: 80, Potato: 72 },
    basePrice: { Wheat: 2420, Rice: 2540, Tomato: 3010, Onion: 2790, Potato: 2470 },
    baseQty: { Wheat: 45, Rice: 47, Tomato: 67, Onion: 61, Potato: 57 },
  },
  {
    city: 'Hyderabad',
    x: 212,
    y: 304,
    baseDemand: { Wheat: 58, Rice: 82, Tomato: 79, Onion: 70, Potato: 66 },
    basePrice: { Wheat: 2370, Rice: 2860, Tomato: 2920, Onion: 2480, Potato: 2320 },
    baseQty: { Wheat: 41, Rice: 68, Tomato: 59, Onion: 49, Potato: 46 },
  },
  {
    city: 'Bengaluru',
    x: 216,
    y: 358,
    baseDemand: { Wheat: 54, Rice: 76, Tomato: 88, Onion: 74, Potato: 63 },
    basePrice: { Wheat: 2350, Rice: 2790, Tomato: 3120, Onion: 2610, Potato: 2340 },
    baseQty: { Wheat: 35, Rice: 58, Tomato: 64, Onion: 50, Potato: 43 },
  },
  {
    city: 'Chennai',
    x: 258,
    y: 396,
    baseDemand: { Wheat: 51, Rice: 79, Tomato: 76, Onion: 67, Potato: 58 },
    basePrice: { Wheat: 2310, Rice: 2840, Tomato: 2890, Onion: 2440, Potato: 2280 },
    baseQty: { Wheat: 30, Rice: 54, Tomato: 52, Onion: 43, Potato: 38 },
  },
  {
    city: 'Kolkata',
    x: 296,
    y: 200,
    baseDemand: { Wheat: 60, Rice: 89, Tomato: 71, Onion: 63, Potato: 67 },
    basePrice: { Wheat: 2410, Rice: 2960, Tomato: 2810, Onion: 2380, Potato: 2360 },
    baseQty: { Wheat: 38, Rice: 74, Tomato: 52, Onion: 44, Potato: 46 },
  },
  {
    city: 'Bhubaneswar',
    x: 278,
    y: 252,
    baseDemand: { Wheat: 57, Rice: 84, Tomato: 68, Onion: 61, Potato: 60 },
    basePrice: { Wheat: 2360, Rice: 2890, Tomato: 2760, Onion: 2330, Potato: 2240 },
    baseQty: { Wheat: 34, Rice: 62, Tomato: 47, Onion: 41, Potato: 39 },
  },
];

const timeMultiplier = {
  today: 0.92,
  '7d': 1,
  '30d': 1.12,
};

const cropPieColors = ['#EAB308', '#F97316', '#DC2626', '#65A30D', '#15803D'];

const demandColor = (score) => {
  if (score < 45) return '#FDE68A';
  if (score < 75) return '#FB923C';
  return '#DC2626';
};

const demandLabel = (t, score) => {
  if (score < 45) return t('low');
  if (score < 75) return t('medium_demand');
  return t('high');
};

const formatCurrency = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

function MarketDemandHeatmapDashboard() {
  const { t } = useTranslation();
  const [selectedLocation, setSelectedLocation] = useState('India');
  const [selectedCrop, setSelectedCrop] = useState('Tomato');
  const [selectedTime, setSelectedTime] = useState('7d');
  const [hoveredNode, setHoveredNode] = useState(null);

  const cropsList = getCrops(t);
  const timeOptions = getTimeOptions(t);
  const locationOptions = getLocationOptions(t);
  const regionMap = regionLabelMap(t);

  const processedCities = useMemo(() => {
    const multiplier = timeMultiplier[selectedTime] || 1;

    return cityHeatNodes.map((city) => {
      const base = city.baseDemand[selectedCrop] || 60;
      const score = Math.min(Math.round(base * multiplier), 100);
      const avgPrice = Math.round((city.basePrice[selectedCrop] || 2000) * (0.95 + score / 180));
      const quantity = Math.round((city.baseQty[selectedCrop] || 35) * multiplier * (0.82 + score / 160));

      return {
        ...city,
        region: regionForCity[city.city] || 'India',
        demandScore: score,
        demandLevel: demandLabel(t, score),
        avgPrice,
        quantity,
        heatColor: demandColor(score),
      };
    });
  }, [selectedCrop, selectedTime, t]);

  const visibleCities = useMemo(() => {
    if (selectedLocation === 'India') return processedCities;
    return processedCities.filter((city) => city.region === selectedLocation);
  }, [processedCities, selectedLocation]);

  const topHighDemandCities = useMemo(() => {
    return [...visibleCities].sort((a, b) => b.demandScore - a.demandScore).slice(0, 5);
  }, [visibleCities]);

  const lowDemandRegions = useMemo(() => {
    const regionScores = ['North India', 'South India', 'West India', 'East India']
      .map((region) => {
        const regionCities = processedCities.filter((city) => city.region === region);
        const avg =
          regionCities.reduce((sum, city) => sum + city.demandScore, 0) /
          Math.max(regionCities.length, 1);
        return { region: regionMap[region], avg: Math.round(avg) };
      });

    return regionScores.sort((a, b) => a.avg - b.avg).slice(0, 3);
  }, [processedCities, regionMap]);

  const trendingCrop = useMemo(() => {
    const multiplier = timeMultiplier[selectedTime] || 1;

    const totals = ['Wheat', 'Rice', 'Tomato', 'Onion', 'Potato'].map((crop) => {
      const total = visibleCities.reduce((sum, city) => {
        const base = city.baseDemand[crop] || 60;
        return sum + Math.round(base * multiplier);
      }, 0);
      return { crop, total };
    });

    const topCrop = totals.sort((a, b) => b.total - a.total)[0]?.crop || 'Tomato';
    return cropsList.find(c => c.value === topCrop)?.label || topCrop;
  }, [visibleCities, selectedTime, cropsList]);

  const demandByCityData = useMemo(() => {
    return visibleCities
      .map((city) => ({ city: city.city, demand: city.demandScore }))
      .sort((a, b) => b.demand - a.demand)
      .slice(0, 8);
  }, [visibleCities]);

  const trendData = useMemo(() => {
    if (selectedTime === 'today') {
      const slots = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      return slots.map((slot, idx) => {
        const base = visibleCities.reduce((sum, city) => sum + city.demandScore, 0) / Math.max(visibleCities.length, 1);
        const drift = Math.sin((idx + 1) * 0.9) * 5;
        return { label: slot, demand: Math.round(base + drift + idx * 1.8) };
      });
    }

    if (selectedTime === '7d') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map((day, idx) => {
        const base = visibleCities.reduce((sum, city) => sum + city.demandScore, 0) / Math.max(visibleCities.length, 1);
        const drift = Math.cos((idx + 1) * 0.7) * 6;
        return { label: day, demand: Math.round(base + drift + idx * 1.2) };
      });
    }

    const buckets = ['W1', 'W2', 'W3', 'W4', 'W5'];
    return buckets.map((week, idx) => {
      const base = visibleCities.reduce((sum, city) => sum + city.demandScore, 0) / Math.max(visibleCities.length, 1);
      const drift = Math.sin((idx + 1) * 1.1) * 8;
      return { label: week, demand: Math.round(base + drift + idx * 1.6) };
    });
  }, [selectedTime, visibleCities]);

  const cropShareData = useMemo(() => {
    const multiplier = timeMultiplier[selectedTime] || 1;
    return cropsList.map((crop) => {
      const totalDemand = visibleCities.reduce((sum, city) => {
        return sum + Math.round((city.baseDemand[crop.value] || 60) * multiplier);
      }, 0);
      return { name: crop.label, value: totalDemand };
    });
  }, [visibleCities, selectedTime, cropsList]);

  return (
    <div className="max-w-[1450px] mx-auto space-y-6 pb-6">
      <header className="bg-gradient-to-br from-white via-emerald-50/40 to-orange-50/40 rounded-3xl border border-emerald-100 shadow-sm p-5 lg:p-7">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('market_heatmap_title')}</h1>
            <p className="text-slate-500 font-medium mt-1">
              {t('market_heatmap_subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-2">{t('location_focus')}</p>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {['India', 'North India', 'South India', 'West India', 'East India'].map((option) => (
                  <option key={option} value={option}>{regionMap[option]}</option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-2">{t('crop_filter')}</p>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                {cropsList.map((crop) => (
                  <option key={crop.value} value={crop.value}>{crop.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-2">{t('time_filter')}</p>
              <div className="grid grid-cols-3 gap-2">
                {timeOptions.map((time) => (
                  <button
                    key={time.value}
                    onClick={() => setSelectedTime(time.value)}
                    className={`px-2 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedTime === time.value
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {time.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">
        <section className="2xl:col-span-8 bg-white rounded-3xl border border-emerald-100 shadow-sm p-5 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-slate-900">{t('interactive_heatmap_title')}</h2>
            <div className="inline-flex items-center gap-2 rounded-xl bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 text-xs font-bold">
              <Flame className="w-4 h-4" />
              {t('demand_pulse', { crop: cropsList.find(c => c.value === selectedCrop)?.label || selectedCrop })}
            </div>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-emerald-50/50 to-amber-50/50 border border-emerald-100 p-4 lg:p-6 overflow-hidden min-h-[470px]">
            <svg viewBox="0 0 420 520" className="w-full max-w-[560px] mx-auto">
              <defs>
                <linearGradient id="indiaFillGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#E2F8E6" />
                  <stop offset="100%" stopColor="#F8F3D6" />
                </linearGradient>
              </defs>

              <path
                d="M150 58 L184 70 L216 95 L245 92 L280 112 L292 144 L278 168 L296 196 L286 220 L305 244 L296 284 L274 306 L260 346 L272 386 L254 424 L228 450 L202 438 L176 402 L152 364 L124 326 L120 276 L104 230 L112 198 L128 168 L118 136 L132 98 Z"
                fill="url(#indiaFillGradient)"
                stroke="#9FD3AA"
                strokeWidth="3"
                strokeLinejoin="round"
              />

              {processedCities.map((node) => {
                const isVisible = selectedLocation === 'India' || node.region === selectedLocation;
                const opacity = isVisible ? 1 : 0.15;
                const ringSize = isVisible ? Math.max(8, Math.round(node.demandScore / 8)) : 6;
                return (
                  <g
                    key={node.city}
                    style={{ cursor: 'pointer', opacity }}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                  >
                    <circle cx={node.x} cy={node.y} r={ringSize + 4} fill={node.heatColor} opacity="0.18" />
                    <circle cx={node.x} cy={node.y} r={ringSize} fill={node.heatColor} stroke="#ffffff" strokeWidth="2" />
                  </g>
                );
              })}
            </svg>

            {hoveredNode && (
              <div className="absolute bottom-4 left-4 max-w-[280px] bg-white/95 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">{hoveredNode.city}</p>
                  <span
                    className="px-2 py-1 rounded-full text-[11px] font-bold"
                    style={{ color: hoveredNode.heatColor, backgroundColor: `${hoveredNode.heatColor}22` }}
                  >
                    {hoveredNode.demandLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{t('demand_pulse', { crop: cropsList.find(c => c.value === selectedCrop)?.label || selectedCrop })}</p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-slate-400 font-semibold">{t('average_price')}</p>
                    <p className="text-slate-900 font-bold">{formatCurrency(hoveredNode.avgPrice)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2">
                    <p className="text-slate-400 font-semibold">{t('qty_required')}</p>
                    <p className="text-slate-900 font-bold">{hoveredNode.quantity} {t('tons')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-3">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold mb-2">{t('demand_legend')}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FDE68A' }} /> {t('low')}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FB923C' }} /> {t('medium_demand')}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600 mt-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }} /> {t('high')}
              </div>
            </div>
          </div>
        </section>

        <aside className="2xl:col-span-4 bg-white rounded-3xl border border-emerald-100 shadow-sm p-5 lg:p-6 space-y-5">
          <h2 className="text-2xl font-extrabold text-slate-900">{t('overview')}</h2>

          <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-red-500 font-bold mb-2">{t('high_demand_cities')}</p>
            <ul className="space-y-2">
              {topHighDemandCities.map((city, idx) => (
                <li key={city.city} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{idx + 1}. {city.city}</span>
                  <span className="font-bold text-red-600">{city.demandScore}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-600 font-bold mb-2">{t('low_demand_regions')}</p>
            <ul className="space-y-2">
              {lowDemandRegions.map((region) => (
                <li key={region.region} className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-700">{region.region}</span>
                  <span className="font-bold text-amber-600">{region.avg}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-600 font-bold mb-2">{t('trending_crop_market')}</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-emerald-700">{trendingCrop}</span>
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">{t('demand_by_city')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandByCityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="city" tick={{ fill: '#475569', fontWeight: 700, fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontWeight: 600 }} />
                <Tooltip />
                <Bar dataKey="demand" radius={[8, 8, 4, 4]} fill="#F97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">{t('demand_trend_time')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#475569', fontWeight: 700, fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontWeight: 600 }} />
                <Tooltip />
                <Line type="monotone" dataKey="demand" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5">
          <h3 className="text-xl font-extrabold text-slate-900 mb-4">{t('demand_share_crop')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={cropShareData} dataKey="value" nameKey="name" innerRadius={56} outerRadius={96}>
                  {cropShareData.map((entry, index) => (
                    <Cell key={entry.name} fill={cropPieColors[index % cropPieColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            {cropShareData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cropPieColors[index % cropPieColors.length] }} />
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketDemandHeatmapDashboard;
