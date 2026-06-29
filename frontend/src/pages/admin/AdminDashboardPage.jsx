import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Calendar, Star, Clock, IndianRupee } from 'lucide-react';
import { adminApi } from '../../services/apiServices';
import { LoadingSpinner, StarRating, Badge } from '../../components/common/UI';
import { useAuthStore } from '../../store/authStore';

// Hard-coded hospital id from auth — in production, store this in user profile
const HOSPITAL_ID = 1;

const STATUS_COLORS = {
  confirmed: 'green', pending: 'amber', completed: 'blue',
  cancelled: 'red', no_show: 'gray',
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard', HOSPITAL_ID],
    queryFn: () => adminApi.dashboard(HOSPITAL_ID),
    refetchInterval: 60000,
  });

  if (isLoading) return <LoadingSpinner text="Loading dashboard..." />;

  const { stats, recentBookings, topServices } = data || {};

  const statCards = [
    { icon: <Calendar size={20} className="text-blue-500" />, label: "Today's Bookings", value: stats?.bookings_today ?? 0, bg: 'bg-blue-50' },
    { icon: <TrendingUp size={20} className="text-emerald-500" />, label: 'This Month', value: stats?.bookings_month ?? 0, bg: 'bg-emerald-50' },
    { icon: <IndianRupee size={20} className="text-violet-500" />, label: 'Monthly Revenue', value: `₹${Number(stats?.revenue_month ?? 0).toLocaleString('en-IN')}`, bg: 'bg-violet-50' },
    { icon: <Star size={20} className="text-amber-500" />, label: 'Avg Rating', value: `${Number(stats?.avg_rating ?? 0).toFixed(1)} / 5`, bg: 'bg-amber-50' },
    { icon: <Clock size={20} className="text-rose-500" />, label: 'Avg Wait Time', value: `${stats?.avg_wait ?? 0} min`, bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview for your hospital</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center mb-3`}>{c.icon}</div>
            <div className="text-xl font-bold text-gray-900">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top services chart */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Top Services This Month</h2>
          {topServices?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topServices} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="service_name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip
                  formatter={(v) => [v, 'Bookings']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Bar dataKey="booking_count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No bookings yet</p>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4 text-sm">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings?.slice(0, 6).map((b) => (
              <div key={b.uuid} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <div className="font-medium text-gray-800">{b.patient_name}</div>
                  <div className="text-xs text-gray-400">{b.service_name} · {String(b.slot_time).substring(0,5)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">₹{Number(b.total_amount).toLocaleString('en-IN')}</span>
                  <Badge color={STATUS_COLORS[b.status] || 'gray'}>{b.status}</Badge>
                </div>
              </div>
            ))}
            {!recentBookings?.length && <p className="text-sm text-gray-400 text-center py-8">No bookings yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
