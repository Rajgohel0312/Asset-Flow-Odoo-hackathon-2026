import React, { useState, useEffect } from 'react';
import { 
  Package, 
  UserCheck, 
  Wrench, 
  CalendarDays, 
  Activity, 
  Clock, 
  PlusCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/v1/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const body = await res.json();
          setData(body.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token]);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-brand-600 border-t-transparent"></div>
          <span className="text-sm font-semibold text-slate-500">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentLogs = data?.recentLogs || [];

  return (
    <div className="flex-1 bg-slate-50 overflow-y-auto flex flex-col">
      <Navbar title="Dashboard Overview" />
      
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Welcome back, {user?.firstName}!</h2>
            <p className="text-slate-400 text-sm mt-1">Here is a snapshot of AssetFlow resource allocations today.</p>
          </div>
          <div className="p-3 bg-brand-500/20 rounded-xl border border-brand-500/30 hidden sm:block">
            <Activity className="text-brand-400 animate-pulse" size={24} />
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Assets</span>
              <div className="text-2xl font-extrabold text-slate-800">{kpis.totalAssets ?? kpis.allocatedAssets ?? 0}</div>
            </div>
            <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
              <Package size={22} />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Allocations</span>
              <div className="text-2xl font-extrabold text-slate-800">{kpis.activeAllocations ?? kpis.allocatedAssets ?? 0}</div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck size={22} />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Repairs</span>
              <div className="text-2xl font-extrabold text-slate-800">{kpis.pendingRepairs ?? kpis.pendingMaintenanceCount ?? 0}</div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Wrench size={22} />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Upcoming Bookings</span>
              <div className="text-2xl font-extrabold text-slate-800">{kpis.upcomingBookings ?? kpis.activeBookingsCount ?? 0}</div>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CalendarDays size={22} />
            </div>
          </div>
        </div>

        {/* Dynamic Section: Admin charts or Personal Items */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts/Category distributions */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2">
              <Clock size={16} />
              <span>Asset Category Distribution</span>
            </h3>
            {charts.categoryDistribution && charts.categoryDistribution.length > 0 ? (
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {charts.categoryDistribution.map((item) => (
                  <div key={item.categoryId || item.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>{item.categoryName || item.name}</span>
                      <span>{item.count} assets</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((item.count / (kpis.totalAssets || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                <Package size={36} className="text-slate-300 mb-2" />
                <span className="text-sm">No category distribution data available</span>
              </div>
            )}
          </div>

          {/* Condition Distribution Meter */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Condition Metrics</h3>
            {charts.conditionDistribution ? (
              <div className="space-y-3">
                {Object.entries(charts.conditionDistribution).map(([condition, count]) => (
                  <div key={condition} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-b-0 text-xs">
                    <span className="font-semibold text-slate-500 uppercase tracking-wider">{condition}</span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-400 p-6 text-sm">No condition details found</div>
            )}
          </div>
        </div>

        {/* Recent Activity Log */}
        {recentLogs.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center space-x-2">
              <Activity size={16} />
              <span>Recent Activity Logs</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-800 font-bold">
                        {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-bold uppercase">{log.module}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
