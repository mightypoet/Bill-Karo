import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, FileText, IndianRupee, TrendingDown, Package } from 'lucide-react';
import { startOfDay, endOfDay, isWithinInterval, subDays, format, subMonths, startOfMonth, endOfMonth, subYears, startOfYear, endOfYear } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { invoices } = useStore();
  const [chartView, setChartView] = useState<'daily' | 'monthly' | 'yearly'>('daily');

  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  const yesterday = subDays(today, 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);

  // Today's invoices
  const todaysInvoices = invoices.filter(inv => isWithinInterval(new Date(inv.date), { start: todayStart, end: todayEnd }));
  const todayTotal = todaysInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const todayCount = todaysInvoices.length;
  const averageValue = todayCount > 0 ? todayTotal / todayCount : 0;

  // Yesterday's invoices
  const yesterdaysInvoices = invoices.filter(inv => isWithinInterval(new Date(inv.date), { start: yesterdayStart, end: yesterdayEnd }));
  const yesterdayTotal = yesterdaysInvoices.reduce((acc, inv) => acc + inv.total, 0);
  const yesterdayCount = yesterdaysInvoices.length;
  const yesterdayAverage = yesterdayCount > 0 ? yesterdayTotal / yesterdayCount : 0;

  // Percentage Changes
  const calculatePercentage = (todayVal: number, yesterdayVal: number) => {
    if (yesterdayVal === 0) return todayVal > 0 ? 100 : 0;
    return ((todayVal - yesterdayVal) / yesterdayVal) * 100;
  };

  const revenueChange = calculatePercentage(todayTotal, yesterdayTotal);
  const countChange = calculatePercentage(todayCount, yesterdayCount);
  const averageChange = calculatePercentage(averageValue, yesterdayAverage);

  // Chart Data
  let chartData = [];
  if (chartView === 'daily') {
    chartData = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const start = startOfDay(d);
      const end = endOfDay(d);
      const dayInvoices = invoices.filter(inv => isWithinInterval(new Date(inv.date), { start, end }));
      const sales = dayInvoices.reduce((acc, inv) => acc + inv.total, 0);
      return {
        name: format(d, 'EEE'),
        sales: sales
      };
    });
  } else if (chartView === 'monthly') {
    chartData = Array.from({ length: 6 }).map((_, i) => {
      const d = subMonths(today, 5 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const monthInvoices = invoices.filter(inv => isWithinInterval(new Date(inv.date), { start, end }));
      const sales = monthInvoices.reduce((acc, inv) => acc + inv.total, 0);
      return {
        name: format(d, 'MMM'),
        sales: sales
      };
    });
  } else if (chartView === 'yearly') {
    chartData = Array.from({ length: 5 }).map((_, i) => {
      const d = subYears(today, 4 - i);
      const start = startOfYear(d);
      const end = endOfYear(d);
      const yearInvoices = invoices.filter(inv => isWithinInterval(new Date(inv.date), { start, end }));
      const sales = yearInvoices.reduce((acc, inv) => acc + inv.total, 0);
      return {
        name: format(d, 'yyyy'),
        sales: sales
      };
    });
  }

  // Top Selling Products (Overall)
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  invoices.forEach(inv => {
    inv.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.quantity * item.price;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-500">Overview of your restaurant's performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayTotal.toFixed(2)}</div>
            <div className="flex items-center text-xs mt-1">
              {revenueChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={revenueChange >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {Math.abs(revenueChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bills Generated</CardTitle>
            <FileText className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <div className="flex items-center text-xs mt-1">
              {countChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={countChange >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {Math.abs(countChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bill Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{averageValue.toFixed(2)}</div>
            <div className="flex items-center text-xs mt-1">
              {averageChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={averageChange >= 0 ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                {Math.abs(averageChange).toFixed(1)}%
              </span>
              <span className="text-muted-foreground ml-1">from yesterday</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                {chartView === 'daily' && 'Revenue over the last 7 days'}
                {chartView === 'monthly' && 'Revenue over the last 6 months'}
                {chartView === 'yearly' && 'Revenue over the last 5 years'}
              </CardDescription>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setChartView('daily')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  chartView === 'daily' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartView('monthly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  chartView === 'monthly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartView('yearly')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  chartView === 'yearly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Yearly
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="min-w-[400px]">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}/>
                    <Bar dataKey="sales" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
            <CardDescription>Most popular products overall</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-4">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.quantity} sold</p>
                      </div>
                    </div>
                    <div className="font-semibold text-sm">
                      ₹{product.revenue.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <Package className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No sales data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
