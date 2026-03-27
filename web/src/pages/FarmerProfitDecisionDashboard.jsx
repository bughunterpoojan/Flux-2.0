import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  IndianRupee,
  TrendingUp,
  Sprout,
  UserCircle2,
  MapPin,
  CalendarDays,
  Filter,
} from 'lucide-react';

const cropBaseData = [
  { crop: 'Wheat', cost: 38000, sellingPrice: 54000, demandLevel: 'Medium' },
  { crop: 'Rice', cost: 42000, sellingPrice: 57500, demandLevel: 'High' },
  { crop: 'Tomato', cost: 35000, sellingPrice: 64000, demandLevel: 'Very High' },
  { crop: 'Potato', cost: 31000, sellingPrice: 47500, demandLevel: 'Medium' },
  { crop: 'Onion', cost: 33000, sellingPrice: 52000, demandLevel: 'High' },
];

const regionAdjustments = {
  Maharashtra: { revenue: 1.06, cost: 1.0, transport: 1.08 },
  Punjab: { revenue: 1.04, cost: 1.02, transport: 1.04 },
  Karnataka: { revenue: 1.05, cost: 1.01, transport: 1.06 },
  Gujarat: { revenue: 1.03, cost: 0.99, transport: 1.02 },
  Rajasthan: { revenue: 0.98, cost: 0.96, transport: 0.98 },
};

const citiesByState = {
  Maharashtra: ['Nashik', 'Pune', 'Nagpur'],
  Punjab: ['Ludhiana', 'Amritsar', 'Patiala'],
  Karnataka: ['Bengaluru', 'Mysuru', 'Hubli'],
  Gujarat: ['Ahmedabad', 'Surat', 'Rajkot'],
  Rajasthan: ['Jaipur', 'Kota', 'Udaipur'],
};

const periodFactors = {
  '1m': 1.0,
  '3m': 1.03,
  '6m': 1.06,
  '12m': 1.1,
};

const periodLabelMap = {
  '1m': 'Last 1 Month',
  '3m': 'Last 3 Months',
  '6m': 'Last 6 Months',
  '12m': 'Last 12 Months',
};

const costColors = ['#8BBF6A', '#A8D08D', '#EBCB8B', '#D08770'];

const formatCurrency = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

const formatMonthLabel = (date) =>
  date.toLocaleString('en-IN', { month: 'short' });

const demandBadgeClass = {
  'Very High': 'bg-emerald-100 text-emerald-700',
  High: 'bg-lime-100 text-lime-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-200 text-slate-600',
};

function FarmerProfitDecisionDashboard({ userProfile }) {
  const [selectedState, setSelectedState] = useState('Maharashtra');
  const [selectedCity, setSelectedCity] = useState('Nashik');
  const [selectedCrop, setSelectedCrop] = useState('All Crops');
  const [selectedRegion, setSelectedRegion] = useState('Maharashtra');
  const [timePeriod, setTimePeriod] = useState('6m');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [profitView, setProfitView] = useState('performance');

  const adjustedTableData = useMemo(() => {
    const region = regionAdjustments[selectedRegion] || regionAdjustments.Maharashtra;
    const periodFactor = periodFactors[timePeriod] || 1;

    return cropBaseData
      .filter((item) => selectedCrop === 'All Crops' || item.crop === selectedCrop)
      .map((item) => {
        const adjustedCost = item.cost * region.cost * (0.97 + periodFactor * 0.03);
        const adjustedRevenue = item.sellingPrice * region.revenue * periodFactor;
        const profit = adjustedRevenue - adjustedCost;

        return {
          ...item,
          cost: Math.round(adjustedCost),
          sellingPrice: Math.round(adjustedRevenue),
          profit: Math.round(profit),
        };
      });
  }, [selectedCrop, selectedRegion, timePeriod]);

  const metrics = useMemo(() => {
    const totalCost = adjustedTableData.reduce((sum, row) => sum + row.cost, 0);
    const revenue = adjustedTableData.reduce((sum, row) => sum + row.sellingPrice, 0);
    const totalProfit = revenue - totalCost;

    const sortedByProfit = [...adjustedTableData].sort((a, b) => b.profit - a.profit);
    const bestCrop = sortedByProfit[0]?.crop || 'N/A';

    return {
      totalCost,
      revenue,
      totalProfit,
      bestCrop,
      sortedByProfit,
    };
  }, [adjustedTableData]);

  const trendData = useMemo(() => {
    const monthCount = 6;
    const now = new Date('2026-06-30');

    const rows = [];
    for (let i = monthCount - 1; i >= 0; i -= 1) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const seasonWave = 1 + Math.sin((monthCount - i) * 0.7) * 0.05;
      const rowsForMonth = adjustedTableData.map((crop, idx) => {
        const cropFactor = 1 + idx * 0.015;
        return crop.sellingPrice * seasonWave * cropFactor;
      });
      const averagePrice =
        rowsForMonth.reduce((sum, value) => sum + value, 0) / (rowsForMonth.length || 1);

      rows.push({
        month: formatMonthLabel(monthDate),
        price: Math.round(averagePrice),
      });
    }

    return rows;
  }, [adjustedTableData]);

  const pieData = useMemo(() => {
    const totalCost = metrics.totalCost || 1;
    const region = regionAdjustments[selectedRegion] || regionAdjustments.Maharashtra;

    const seeds = Math.round(totalCost * 0.28);
    const fertilizer = Math.round(totalCost * 0.26);
    const transport = Math.round(totalCost * 0.22 * region.transport);
    const labor = Math.max(totalCost - seeds - fertilizer - transport, 0);

    return [
      { name: 'Seeds', value: seeds },
      { name: 'Fertilizer', value: fertilizer },
      { name: 'Transport', value: transport },
      { name: 'Labor', value: labor },
    ];
  }, [metrics.totalCost, selectedRegion]);

  const insights = useMemo(() => {
    const [top, second] = metrics.sortedByProfit;
    const topVsSecond = top && second
      ? Math.round(((top.profit - second.profit) / Math.max(second.profit, 1)) * 100)
      : 0;

    const transportSlice = pieData.find((slice) => slice.name === 'Transport')?.value || 0;
    const transportShare = Math.round((transportSlice / Math.max(metrics.totalCost, 1)) * 100);

    const monthlyTrendUp = trendData.length > 1
      ? trendData[trendData.length - 1].price > trendData[0].price
      : false;

    return [
      top && second
        ? `${top.crop} gives ${Math.max(topVsSecond, 0)}% higher profit than ${second.crop} in this period.`
        : 'Add more crop entries to generate comparative profitability insights.',
      transportShare >= 23
        ? 'Transport cost is increasing and now contributes a larger share of total spend.'
        : 'Transport cost is currently stable and within expected range.',
      monthlyTrendUp
        ? 'Average selling prices are trending upward in the last 6 months.'
        : 'Average selling prices show a soft decline. Consider timing harvest to peak market windows.',
    ];
  }, [metrics, pieData, trendData]);

  const costLegend = [
    { label: 'Seeds', color: costColors[0] },
    { label: 'Fertilizer', color: costColors[1] },
    { label: 'Transport', color: costColors[2] },
    { label: 'Labor', color: costColors[3] },
  ];

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 pb-6">
      <header className="bg-gradient-to-br from-white to-emerald-50/20 rounded-3xl border border-slate-200 shadow-sm p-5 lg:p-7">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AgriVision Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1 text-base">
              Farmer Profit Decision Dashboard for crop-wise profitability analysis.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 bg-emerald-50/70 rounded-2xl px-4 py-3 border border-emerald-100 min-h-[64px]">
              <UserCircle2 className="w-6 h-6 text-emerald-700" />
              <div className="leading-tight">
                <p className="text-[11px] uppercase tracking-wide text-emerald-700/70 font-bold">Farmer</p>
                <p className="text-sm text-slate-900 font-bold">
                  {userProfile?.business_name || userProfile?.username || 'Agri Farmer'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-3 border border-slate-200 min-h-[64px] min-w-0">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => {
                  const newState = e.target.value;
                  setSelectedState(newState);
                  setSelectedCity(citiesByState[newState][0]);
                }}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full min-w-0"
              >
                {Object.keys(citiesByState).map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full min-w-0"
              >
                {citiesByState[selectedState].map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-3 border border-slate-200 min-h-[64px] min-w-0">
              <CalendarDays className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full min-w-0"
              />
              <span className="text-slate-400 text-sm">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none w-full min-w-0"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <aside className="xl:col-span-3 bg-white rounded-3xl border border-slate-200 shadow-sm p-5 lg:p-6 space-y-6 h-fit xl:sticky xl:top-6">
          <div className="flex items-center gap-3 text-slate-900">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Filter className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold">Filters Panel</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Crop Selection</label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option>All Crops</option>
                {cropBaseData.map((item) => (
                  <option key={item.crop} value={item.crop}>{item.crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Region Selection</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
              >
                {Object.keys(regionAdjustments).map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Time Period</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(periodLabelMap).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setTimePeriod(value)}
                    className={`rounded-xl px-3 py-2.5 text-xs font-bold transition-all border ${
                      timePeriod === value
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 border-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCrop('All Crops');
                setSelectedRegion('Maharashtra');
                setTimePeriod('6m');
                setSelectedState('Maharashtra');
                setSelectedCity('Nashik');
                setStartDate('2026-01-01');
                setEndDate('2026-06-30');
              }}
              className="w-full rounded-xl px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold text-sm border border-emerald-100 hover:bg-emerald-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </aside>

        <section className="xl:col-span-9 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 inline-flex">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setProfitView('performance')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  profitView === 'performance'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                Performance View
              </button>
              <button
                onClick={() => setProfitView('insights')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  profitView === 'insights'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100'
                }`}
              >
                Insights & Table
              </button>
            </div>
          </div>

          {profitView === 'performance' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Total Profit</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{formatCurrency(metrics.totalProfit)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Net result for selected filters</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Total Cost</p>
              <p className="text-3xl font-extrabold text-amber-700 mt-2">{formatCurrency(metrics.totalCost)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Seeds, fertilizer, transport, labor</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Revenue</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{formatCurrency(metrics.revenue)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Total selling value</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Best Performing Crop</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{metrics.bestCrop}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Top crop by current profit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Crop vs Profit</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={adjustedTableData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="crop" tick={{ fill: '#475569', fontWeight: 700 }} />
                    <YAxis tick={{ fill: '#64748b', fontWeight: 600 }} width={76} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="profit" radius={[10, 10, 6, 6]} fill="#4FAE67" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Price Trends (Last 6 Months)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" tick={{ fill: '#475569', fontWeight: 700 }} />
                    <YAxis tick={{ fill: '#64748b', fontWeight: 600 }} width={76} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#D08770"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#D08770' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
            </>
          )}

          {profitView === 'insights' && (
            <>
              <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Cost Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={64}
                      outerRadius={104}
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={entry.name} fill={costColors[index % costColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {costLegend.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 2xl:col-span-2">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Insights Panel</h3>
              <div className="space-y-3">
                {insights.map((text) => (
                  <div key={text} className="flex items-start gap-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                    <div className="w-8 h-8 rounded-xl bg-white border border-emerald-200 flex items-center justify-center mt-0.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Crop Profitability Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Crop</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Cost</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Selling Price</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Profit</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Demand Level</th>
                  </tr>
                </thead>
                <tbody>
                  {adjustedTableData.map((row) => (
                    <tr key={row.crop} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-emerald-600" />
                          {row.crop}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{formatCurrency(row.cost)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{formatCurrency(row.sellingPrice)}</td>
                      <td className="px-4 py-4 font-bold text-emerald-700">{formatCurrency(row.profit)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${demandBadgeClass[row.demandLevel] || demandBadgeClass.Low}`}>
                          {row.demandLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white px-5 py-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <p className="text-sm font-semibold text-emerald-50">
                {selectedCity}, {selectedState} | {periodLabelMap[timePeriod]} | {startDate} to {endDate}
              </p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                <span className="font-extrabold text-lg">{formatCurrency(metrics.totalProfit)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FarmerProfitDecisionDashboard;
