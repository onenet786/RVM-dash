import React, { useState, useEffect } from 'react';
import { 
  Recycle, Wine, Coffee, Award, Users, AlertTriangle, MessageSquare, 
  TrendingUp, Activity, ArrowUpRight, Sparkles, RefreshCw
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function OverviewTab() {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const [ovRes, trRes] = await Promise.all([
        fetch('/api/overview'),
        fetch('/api/analytics/trends')
      ]);

      if (ovRes.ok) setOverview(await ovRes.ok ? await ovRes.json() : null);
      if (trRes.ok) setTrends(await trRes.ok ? await trRes.json() : []);
    } catch (err) {
      console.error('Error fetching overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Loading MongoDB Live Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-emerald-500/20 glow-emerald">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Master Developer Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Reverse Vending Machine System Analytics
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Real-time monitoring of recycling sessions, material throughput, user participation, and machine status.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Bottles */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Plastic Bottles</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white mono">{overview?.totalBottles ?? 0}</div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Total PET Bottles Recycled
            </p>
          </div>
        </div>

        {/* Total Cups */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recyclable Cups</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white mono">{overview?.totalCups ?? 0}</div>
            <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Total Cups Collected
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Points Rewarded</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white mono">{overview?.totalPoints ?? 0}</div>
            <p className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Total User Loyalty Points
            </p>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Sessions</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white mono">{overview?.totalSessions ?? 0}</div>
            <p className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-medium">
              <Activity className="w-3.5 h-3.5" /> Active RVM Transactions
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white mono">{overview?.totalUsers ?? 0}</div>
            <div className="text-xs text-slate-400">Registered Eco Users</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white mono">{overview?.totalBinAlerts ?? 0}</div>
            <div className="text-xs text-slate-400">Bin Full Notifications</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold text-white mono">{overview?.totalFeedbacks ?? 0}</div>
            <div className="text-xs text-slate-400">User Feedbacks Submitted</div>
          </div>
        </div>
      </div>

      {/* Interactive Trends Chart */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Recycling Material Throughput</h3>
            <p className="text-xs text-slate-400">Daily PET Bottles and Recyclable Cups volume</p>
          </div>
          <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Daily Aggregates
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-500">
              No daily trends data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBottles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="_id" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="bottles" name="Bottles" stroke="#10b981" fillOpacity={1} fill="url(#colorBottles)" strokeWidth={2} />
                <Area type="monotone" dataKey="cups" name="Cups" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCups)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Live Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Recycling Sessions */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Recycling Transactions
            </h3>
            <span className="text-[11px] text-slate-400">Latest 5</span>
          </div>

          <div className="space-y-2.5">
            {(!overview?.recentSessions || overview.recentSessions.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No recent sessions.</p>
            ) : (
              overview.recentSessions.map(session => (
                <div key={session._id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between hover:border-slate-700 transition-all">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{session.userName || 'Anonymous'}</span>
                      <span className="mono text-[10px] text-slate-400">{session.phoneNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {new Date(session.recycledAt || session._id).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-semibold border border-emerald-500/20">
                      {session.bottles} bottles
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded font-semibold border border-amber-500/20">
                      {session.cups} cups
                    </span>
                    <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded font-bold border border-cyan-500/20 mono">
                      +{session.points} pts
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Bin Full Alerts */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Bin Full Operational Alerts
            </h3>
            <span className="text-[11px] text-slate-400">Latest Alerts</span>
          </div>

          <div className="space-y-2.5">
            {(!overview?.recentAlerts || overview.recentAlerts.length === 0) ? (
              <p className="text-xs text-slate-500 py-4 text-center">No bin full notifications recorded.</p>
            ) : (
              overview.recentAlerts.map(alert => (
                <div key={alert._id} className="p-3 bg-slate-950/70 border border-rose-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">
                        Machine ID: <span className="mono text-rose-300">{alert.machineId}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(alert.occurredAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 text-xs font-bold uppercase rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    {alert.binType} BIN
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
