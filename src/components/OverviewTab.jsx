import React, { useState, useEffect } from 'react';
import { 
  Recycle, Wine, Coffee, Award, Users, AlertTriangle, MessageSquare, 
  TrendingUp, Activity, Sparkles, RefreshCw, Server, HardDrive, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';

export default function OverviewTab({ currentUser }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  const getMachinesQuery = () => {
    try {
      const u = currentUser || JSON.parse(sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user') || '{}');
      if (!u.assignedMachines) return '';
      const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
      if (arr.includes('*')) return '';
      return `?assignedMachines=${encodeURIComponent(arr.join(','))}`;
    } catch (e) {
      return '';
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const query = getMachinesQuery();
      const [ovRes, trRes, hlRes] = await Promise.all([
        fetch(`/api/overview${query}`),
        fetch(`/api/analytics/trends${query}`),
        fetch('/api/health')
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (trRes.ok) setTrends(await trRes.json());
      if (hlRes.ok) setHealth(await hlRes.json());
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
      <div className="flex flex-col items-center justify-center py-20 t-text-muted gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Loading MongoDB Live Dashboard Metrics...</p>
      </div>
    );
  }

  const serverHost = health?.serverHost || 'cluster0.ktted0m.mongodb.net';
  const dbName = health?.database || 'ONS-RVM';
  const isMasterDev = currentUser?.username === 'onenet';


  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Connected Server & DB Info Banner */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Active Database Connection</div>
            <div className="text-xs font-extrabold t-text-primary mono flex flex-wrap items-center gap-2 mt-0.5">
              {isMasterDev ? (
                <>
                  <span>Cluster Host: <span className="text-cyan-400">{serverHost}</span></span>
                  <span>•</span>
                  <span>Database: <span className="text-emerald-400 font-bold">{dbName}</span></span>
                  <span>•</span>
                  <span>Location: <span className="text-amber-400 font-bold">{health?.serverLocation?.display || 'Paris, France (AWS EU_WEST_3)'}</span></span>
                </>
              ) : (
                <span>Database: <span className="text-emerald-400 font-bold">{dbName}</span></span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {isMasterDev && (
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full font-bold border border-amber-500/20 flex items-center gap-1.5">
              📍 {health?.serverLocation?.display || 'Paris, France (AWS EU_WEST_3)'}
            </span>
          )}
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1.5">
            🟢 Active ({dbName})
          </span>
        </div>
      </div>


      {/* Main Header Banner */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-emerald-500/20 glow-emerald">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Master Developer Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold t-text-primary tracking-tight">
              Reverse Vending Machine System Analytics
            </h1>
            <p className="text-xs md:text-sm t-text-secondary mt-1">
              Real-time monitoring of recycling sessions, material throughput, user participation, and machine status.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 shrink-0"
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
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Plastic Bottles</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Wine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalBottles ?? 0}</div>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Total PET Bottles Recycled
            </p>
          </div>
        </div>

        {/* Total Cups */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Recyclable Cups</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalCups ?? 0}</div>
            <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Total Cups Collected
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Points Rewarded</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalPoints ?? 0}</div>
            <p className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Total User Loyalty Points
            </p>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Total Sessions</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalSessions ?? 0}</div>
            <p className="text-[11px] text-purple-400 flex items-center gap-1 mt-1 font-semibold">
              <Activity className="w-3.5 h-3.5" /> Active RVM Transactions
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Material Variant Analytics Grid */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between border-b t-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
              Material Variant Breakdown & Unit Throughput
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 bg-cyan-500/10 text-cyan-300 font-bold rounded-full border border-cyan-500/20 mono">
            PostgreSQL Multi-Variant Metrics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Plastic Variant Breakdown */}
          <div className="p-4 t-bg-sec border t-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
              <span className="flex items-center gap-1.5">🥤 Plastic Bottles</span>
              <span className="mono text-sm">{overview?.totalPlastic ?? overview?.totalBottles ?? 0} total</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold pt-1">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg border border-emerald-500/20">
                <div className="text-[10px] t-text-muted">Small</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.plasticSmall ?? 0}</div>
              </div>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg border border-emerald-500/20">
                <div className="text-[10px] t-text-muted">Medium</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.plasticMedium ?? 0}</div>
              </div>
              <div className="p-1.5 bg-emerald-500/10 text-emerald-300 rounded-lg border border-emerald-500/20">
                <div className="text-[10px] t-text-muted">Large</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.plasticLarge ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Metal Can Variant Breakdown */}
          <div className="p-4 t-bg-sec border t-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">🥫 Metal Cans</span>
              <span className="mono text-sm">{overview?.totalCans ?? overview?.totalCups ?? 0} total</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-semibold pt-1">
              <div className="p-1.5 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                <div className="text-[10px] t-text-muted">Small</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.canSmall ?? 0}</div>
              </div>
              <div className="p-1.5 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                <div className="text-[10px] t-text-muted">Medium</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.canMedium ?? 0}</div>
              </div>
              <div className="p-1.5 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20">
                <div className="text-[10px] t-text-muted">Large</div>
                <div className="mono font-bold">{overview?.variantBreakdown?.canLarge ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Paper Weight */}
          <div className="p-4 t-bg-sec border t-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-purple-400">
              <span>📦 Paper Weight</span>
              <span className="mono text-sm">{overview?.totalPaperGrams ?? 0} gGams</span>
            </div>
            <div className="p-2 bg-purple-500/10 text-purple-300 rounded-xl border border-purple-500/20 text-center font-mono text-xs font-extrabold">
              {((overview?.totalPaperGrams ?? 0) / 1000).toFixed(3)} kg Paper Collected
            </div>
          </div>

          {/* TetraPak Weight */}
          <div className="p-4 t-bg-sec border t-border rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>🧃 TetraPak Weight</span>
              <span className="mono text-sm">{overview?.totalTetraPakGrams ?? 0} Grams</span>
            </div>
            <div className="p-2 bg-cyan-500/10 text-cyan-300 rounded-xl border border-cyan-500/20 text-center font-mono text-xs font-extrabold">
              {((overview?.totalTetraPakGrams ?? 0) / 1000).toFixed(3)} kg TetraPak Collected
            </div>
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
            <div className="text-xl font-bold t-text-primary mono">{overview?.totalUsers ?? 0}</div>
            <div className="text-xs t-text-secondary font-medium">Registered Eco Users</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold t-text-primary mono">{overview?.totalBinAlerts ?? 0}</div>
            <div className="text-xs t-text-secondary font-medium">Bin Full Notifications</div>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl border border-teal-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold t-text-primary mono">{overview?.totalFeedbacks ?? 0}</div>
            <div className="text-xs t-text-secondary font-medium">User Feedbacks Submitted</div>
          </div>
        </div>
      </div>

      {/* Interactive Trends Chart */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold t-text-primary tracking-wide">Recycling Material Throughput</h3>
            <p className="text-xs t-text-secondary">Daily PET Bottles and Recyclable Cups volume</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Daily Aggregates
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs t-text-muted">
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
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="_id" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} 
                  itemStyle={{ color: 'var(--text-primary)' }}
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
          <div className="flex items-center justify-between border-b t-border pb-3">
            <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Recycling Transactions
            </h3>
            <span className="text-[11px] t-text-muted font-bold">Latest 5</span>
          </div>

          <div className="space-y-2.5">
            {(!overview?.recentSessions || overview.recentSessions.length === 0) ? (
              <p className="text-xs t-text-muted py-4 text-center">No recent sessions.</p>
            ) : (
              overview.recentSessions.map(session => {
                const variantText = session.itemVariant || session.item_variant || (session.plasticCount > 0 ? `${session.plasticCount}x ${session.bottleSize || 'MEDIUM'} PLASTIC` : session.aluminiumCount > 0 ? `${session.aluminiumCount}x CAN (Metal)` : session.paperCardboardCount > 0 ? `${session.paperCardboardCount}x PAPER / TETRA PAK` : session.glassCount > 0 ? `${session.glassCount}x GLASS` : `${session.bottles || 1}x RECYCLABLE ITEM`);
                const pCount = session.plasticCount || session.plastic_count || 0;
                const aCount = session.aluminiumCount || session.aluminium_count || 0;
                const paperCount = session.paperCardboardCount || session.paper_cardboard_count || 0;
                const gCount = session.glassCount || session.glass_count || 0;

                return (
                  <div key={session._id || session.session_id} className="p-3 t-bg-sec border t-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-emerald-500/30 transition-all">
                    <div>
                      <div className="text-xs font-bold t-text-primary flex flex-wrap items-center gap-2">
                        <span>User: <span className="text-emerald-400">{session.userName || session.userId || session.user_id || 'Anonymous'}</span></span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md uppercase">
                          🏷️ {variantText}
                        </span>
                      </div>
                      <div className="text-[11px] t-text-muted mt-1 flex items-center gap-3">
                        <span>Machine: <strong className="t-text-primary">{session.machineId || session.machine_id || 'RVM-001'}</strong></span>
                        <span>•</span>
                        <span>{new Date(session.recycledAt || session.timestamp || session.created_at || Date.now()).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 text-xs shrink-0">
                      {pCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded font-bold border border-emerald-500/20 text-[11px]">
                          🥤 {pCount} Plastic
                        </span>
                      )}
                      {aCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded font-bold border border-amber-500/20 text-[11px]">
                          🥫 {aCount} Can
                        </span>
                      )}
                      {paperCount > 0 && (
                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded font-bold border border-purple-500/20 text-[11px]">
                          📦 {paperCount} Paper/Tetra
                        </span>
                      )}
                      {gCount > 0 && (
                        <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded font-bold border border-cyan-500/20 text-[11px]">
                          🍾 {gCount} Glass
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-extrabold shadow-sm mono text-[11px]">
                        +{session.points || session.pointsEarned || session.points_earned || 30} pts
                      </span>
                    </div>
                  </div>
                );
              })

            )}
          </div>
        </div>

        {/* Recent Bin Full Alerts */}
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b t-border pb-3">
            <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Bin Full Operational Alerts
            </h3>
            <span className="text-[11px] t-text-muted font-bold">Latest Alerts</span>
          </div>

          <div className="space-y-2.5">
            {(!overview?.recentAlerts || overview.recentAlerts.length === 0) ? (
              <p className="text-xs t-text-muted py-4 text-center">No bin full notifications recorded.</p>
            ) : (
              overview.recentAlerts.map(alert => (
                <div key={alert._id} className="p-3 t-bg-sec border border-rose-500/20 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold t-text-primary">
                        Machine ID: <span className="mono text-rose-400">{alert.machineId}</span>
                      </div>
                      <div className="text-[11px] t-text-muted">
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
