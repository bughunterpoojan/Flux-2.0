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

const periodLabelMap = {
  '1m': 'Last 1 Month',
  '3m': 'Last 3 Months',
  '6m': 'Last 6 Months',
  '12m': 'Last 12 Months',
};

const shareColors = ['#4FAE67', '#7BC67E', '#A6D988', '#D6E7A3', '#F6E6A5', '#E6B782'];

const formatCurrency = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;

const formatMonthLabel = (date) =>
  date.toLocaleString('en-IN', { month: 'short' });

const demandBadgeClass = {
  'Very High': 'bg-emerald-100 text-emerald-700',
  High: 'bg-lime-100 text-lime-700',
  Medium: 'bg-amber-100 text-amber-700',
  Low: 'bg-slate-200 text-slate-600',
};

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateForMonthsBack = (monthsBack) => {
  const now = new Date();
  const shifted = new Date(now.getFullYear(), now.getMonth() - monthsBack, now.getDate());
  return getDateString(shifted);
};

const demandByUnits = (unitsSold) => {
  if (unitsSold >= 200) return 'Very High';
  if (unitsSold >= 120) return 'High';
  if (unitsSold >= 40) return 'Medium';
  return 'Low';
};

function FarmerProfitDecisionDashboard({ userProfile, products = [], orders = [] }) {
  const [selectedCrop, setSelectedCrop] = useState('All Crops');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [timePeriod, setTimePeriod] = useState('6m');
  const [startDate, setStartDate] = useState(dateForMonthsBack(6));
  const [endDate, setEndDate] = useState(getDateString(new Date()));
  const [profitView, setProfitView] = useState('performance');

  const productById = useMemo(
    () => products.reduce((acc, product) => ({ ...acc, [product.id]: product }), {}),
    [products]
  );

  const availableLocations = useMemo(() => {
    const locationSet = new Set();
    products.forEach((product) => {
      if (product.address) {
        locationSet.add(product.address);
      }
    });
    return Array.from(locationSet).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const availableCrops = useMemo(() => {
    const cropSet = new Set();
    products.forEach((product) => {
      if (product.name) {
        cropSet.add(product.name);
      }
    });
    return Array.from(cropSet).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredOrderItems = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const validStatuses = new Set(['accepted', 'shipped', 'delivered']);
    const rows = [];

    orders.forEach((order) => {
      if (!validStatuses.has(order.status)) return;

      const createdAt = order.created_at ? new Date(order.created_at) : null;
      if (!createdAt || Number.isNaN(createdAt.getTime())) return;
      if (start && createdAt < start) return;
      if (end && createdAt > end) return;

      (order.items || []).forEach((item) => {
        const product = productById[item.product];
        if (!product) return;
        if (selectedCrop !== 'All Crops' && product.name !== selectedCrop) return;
        if (selectedLocation !== 'All Locations' && product.address !== selectedLocation) return;

        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.price_at_order ?? product.price ?? 0);
        if (quantity <= 0 || unitPrice < 0) return;

        rows.push({
          orderId: order.id,
          orderDate: createdAt,
          crop: product.name,
          location: product.address || 'Unspecified',
          unit: product.unit || 'kg',
          quantity,
          unitPrice,
          revenue: quantity * unitPrice,
        });
      });
    });

    return rows;
  }, [orders, productById, selectedCrop, selectedLocation, startDate, endDate]);

  const tableData = useMemo(() => {
    const cropAgg = new Map();

    filteredOrderItems.forEach((row) => {
      if (!cropAgg.has(row.crop)) {
        cropAgg.set(row.crop, {
          crop: row.crop,
          unitsSold: 0,
          revenue: 0,
          orderIds: new Set(),
          weightedPriceSum: 0,
          unit: row.unit,
        });
      }

      const current = cropAgg.get(row.crop);
      current.unitsSold += row.quantity;
      current.revenue += row.revenue;
      current.orderIds.add(row.orderId);
      current.weightedPriceSum += row.quantity * row.unitPrice;
    });

    return Array.from(cropAgg.values())
      .map((entry) => ({
        crop: entry.crop,
        unitsSold: Math.round(entry.unitsSold * 100) / 100,
        revenue: Math.round(entry.revenue),
        avgPrice: entry.unitsSold > 0 ? Math.round(entry.weightedPriceSum / entry.unitsSold) : 0,
        orders: entry.orderIds.size,
        unit: entry.unit,
        demandLevel: demandByUnits(entry.unitsSold),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrderItems]);

  const metrics = useMemo(() => {
    const revenue = tableData.reduce((sum, row) => sum + row.revenue, 0);
    const unitsSold = tableData.reduce((sum, row) => sum + row.unitsSold, 0);
    const totalOrders = new Set(filteredOrderItems.map((item) => item.orderId)).size;

    const sortedByRevenue = [...tableData].sort((a, b) => b.revenue - a.revenue);
    const bestCrop = sortedByRevenue[0]?.crop || 'N/A';

    return {
      revenue,
      unitsSold,
      totalOrders,
      bestCrop,
      sortedByRevenue,
    };
  }, [tableData, filteredOrderItems]);

  const trendData = useMemo(() => {
    const monthly = new Map();

    filteredOrderItems.forEach((item) => {
      const monthKey = `${item.orderDate.getFullYear()}-${item.orderDate.getMonth()}`;
      if (!monthly.has(monthKey)) {
        monthly.set(monthKey, {
          label: formatMonthLabel(new Date(item.orderDate.getFullYear(), item.orderDate.getMonth(), 1)),
          weightedPriceSum: 0,
          quantity: 0,
        });
      }
      const entry = monthly.get(monthKey);
      entry.weightedPriceSum += item.unitPrice * item.quantity;
      entry.quantity += item.quantity;
    });

    return Array.from(monthly.entries())
      .sort((a, b) => {
        const [aYear, aMonth] = a[0].split('-').map(Number);
        const [bYear, bMonth] = b[0].split('-').map(Number);
        if (aYear !== bYear) return aYear - bYear;
        return aMonth - bMonth;
      })
      .map(([, value]) => ({
        month: value.label,
        price: value.quantity > 0 ? Math.round(value.weightedPriceSum / value.quantity) : 0,
      }));
  }, [filteredOrderItems]);

  const pieData = useMemo(() => {
    return tableData.map((row) => ({ name: row.crop, value: row.revenue }));
  }, [tableData]);

  const insights = useMemo(() => {
    const [top, second] = metrics.sortedByRevenue;
    const topVsSecond = top && second
      ? Math.round(((top.revenue - second.revenue) / Math.max(second.revenue, 1)) * 100)
      : 0;
    const topShare = Math.round((Number(top?.revenue || 0) / Math.max(metrics.revenue, 1)) * 100);

    const monthlyTrendUp = trendData.length > 1
      ? trendData[trendData.length - 1].price > trendData[0].price
      : false;

    return [
      top && second
        ? `${top.crop} generated ${Math.max(topVsSecond, 0)}% more revenue than ${second.crop} in this period.`
        : 'Add more crop entries to generate comparative profitability insights.',
      top
        ? `${top.crop} contributes ${topShare}% of your filtered revenue.`
        : 'No sales data found for selected filters.',
      monthlyTrendUp
        ? 'Average selling prices are trending upward in the last 6 months.'
        : 'Average selling prices show a soft decline. Consider timing harvest to peak market windows.',
    ];
  }, [metrics, pieData, trendData]);

  const shareLegend = pieData
    .slice(0, 6)
    .map((item, index) => ({ label: item.name, color: shareColors[index % shareColors.length] }));

  const totalUnitsLabel = (() => {
    const unitSet = new Set(tableData.map((row) => row.unit));
    return unitSet.size === 1 ? Array.from(unitSet)[0] : 'units';
  })();

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
              <p className="text-sm font-semibold text-slate-700 truncate w-full min-w-0">
                {userProfile?.address || 'No farm address in profile'}
              </p>
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
                {availableCrops.map((crop) => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Location Selection</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="All Locations">All Locations</option>
                {availableLocations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Time Period</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(periodLabelMap).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setTimePeriod(value);
                      if (value === '1m') setStartDate(dateForMonthsBack(1));
                      if (value === '3m') setStartDate(dateForMonthsBack(3));
                      if (value === '6m') setStartDate(dateForMonthsBack(6));
                      if (value === '12m') setStartDate(dateForMonthsBack(12));
                      setEndDate(getDateString(new Date()));
                    }}
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
                setSelectedLocation('All Locations');
                setTimePeriod('6m');
                setStartDate(dateForMonthsBack(6));
                setEndDate(getDateString(new Date()));
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
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Total Revenue</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{formatCurrency(metrics.revenue)}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">From accepted, shipped and delivered orders</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Total Units Sold</p>
              <p className="text-3xl font-extrabold text-amber-700 mt-2">{metrics.unitsSold.toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Measured in {totalUnitsLabel}</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Total Orders</p>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{metrics.totalOrders}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Orders matching current filters</p>
            </div>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 min-h-[150px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Best Performing Crop</p>
              <p className="text-3xl font-extrabold text-emerald-700 mt-2">{metrics.bestCrop}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Top crop by current profit</p>
            </div>
          </div>

          <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Crop vs Revenue</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tableData} margin={{ top: 4, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="crop" tick={{ fill: '#475569', fontWeight: 700 }} />
                    <YAxis tick={{ fill: '#64748b', fontWeight: 600 }} width={76} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" radius={[10, 10, 6, 6]} fill="#4FAE67" />
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
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Revenue Share by Crop</h3>
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
                        <Cell key={entry.name} fill={shareColors[index % shareColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {shareLegend.map((item) => (
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
            <h3 className="text-2xl font-extrabold text-slate-900 mb-4">Crop Sales Table</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Crop</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Units Sold</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Avg Selling Price</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Revenue</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Orders</th>
                    <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Demand Level</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row) => (
                    <tr key={row.crop} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">
                        <span className="inline-flex items-center gap-2">
                          <Sprout className="w-4 h-4 text-emerald-600" />
                          {row.crop}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{row.unitsSold.toLocaleString('en-IN')} {row.unit}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{formatCurrency(row.avgPrice)} / {row.unit}</td>
                      <td className="px-4 py-4 font-bold text-emerald-700">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-4 font-semibold text-slate-700">{row.orders}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${demandBadgeClass[row.demandLevel] || demandBadgeClass.Low}`}>
                          {row.demandLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {tableData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-semibold">
                        No real sales data found for selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}

          <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-600 text-white px-5 py-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <p className="text-sm font-semibold text-emerald-50">
                {selectedLocation} | {periodLabelMap[timePeriod]} | {startDate} to {endDate}
              </p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                <span className="font-extrabold text-lg">{formatCurrency(metrics.revenue)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FarmerProfitDecisionDashboard;
