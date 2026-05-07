import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Activity, 
  Loader2,
  BarChart3,
  Star,
  PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalMessages: 0,
    totalProducts: 0,
    ordersByStatus: [] as any[],
    categoriesDistribution: [] as any[],
    revenue: 0
  });

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const [usersSnap, ordersSnap, msgsSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'orders')),
          getDocs(collection(db, 'contactMessages')),
          getDocs(collection(db, 'products'))
        ]);

        const orders = ordersSnap.docs.map(doc => doc.data());
        
        // Status distribution
        const statusCounts: any = {};
        orders.forEach(o => {
          statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
        });
        const ordersByStatus = Object.keys(statusCounts).map(status => ({
          name: status === 'pending' ? 'جديد' : status === 'processing' ? 'قيد التجهيز' : status === 'delivered' ? 'مكتمل' : 'أخرى',
          value: statusCounts[status]
        }));

        // Category distribution (from products)
        const catCounts: any = {};
        productsSnap.docs.forEach(doc => {
          const p = doc.data();
          catCounts[p.category] = (catCounts[p.category] || 0) + 1;
        });
        const categoriesDistribution = Object.keys(catCounts).map(cat => ({
          name: cat,
          value: catCounts[cat]
        })).sort((a, b) => b.value - a.value).slice(0, 5);

        // Revenue calculation
        const totalRevenue = orders.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);

        setStats({
          totalUsers: usersSnap.size,
          totalOrders: ordersSnap.size,
          totalMessages: msgsSnap.size,
          totalProducts: productsSnap.size,
          ordersByStatus,
          categoriesDistribution,
          revenue: totalRevenue
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  const COLORS = ['#d97706', '#0f172a', '#64748b', '#94a3b8', '#cbd5e1'];

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-amber-600" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight uppercase">تحليلات الأداء الملكي</h1>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-100 font-medium">
          <Activity className="w-4 h-4 text-amber-500" />
          <span>تحديث مباشر للبيانات</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="إجمالي العملاء" 
          value={stats.totalUsers} 
          icon={Users} 
          color="bg-slate-900" 
          trend="+12%"
        />
        <StatCard 
          title="الطلبات" 
          value={stats.totalOrders} 
          icon={Calendar} 
          color="bg-amber-600" 
          trend="+5%"
        />
        <StatCard 
          title="إيرادات المتجر" 
          value={`${stats.revenue.toLocaleString()} ريال`} 
          icon={TrendingUp} 
          color="bg-emerald-600" 
          trend="+8%"
        />
        <StatCard 
          title="المنتجات المسجلة" 
          value={stats.totalProducts} 
          icon={Star} 
          color="bg-slate-500" 
          trend="+3%"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Orders Status Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-display font-bold text-slate-900 uppercase tracking-tight">حالات الطلبات</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ordersByStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#d97706" radius={[8, 8, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Distribution Chart */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-8">
            <PieChartIcon className="w-6 h-6 text-slate-900" />
            <h3 className="text-xl font-display font-bold text-slate-900 uppercase tracking-tight">توزيع الأصناف الأفضل مبيعاً</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.categoriesDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.categoriesDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            {stats.categoriesDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2.5">
                <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{backgroundColor: COLORS[index % COLORS.length]}} />
                <span className="text-sm font-bold text-slate-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-2xl ${color} text-white`}>
          <Icon className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-sm text-slate-500 font-medium">{title}</div>
    </div>
  );
}
