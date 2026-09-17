import React, { useState, useEffect } from 'react';
import { 
  Recycle, Wine, Coffee, Award, Users, AlertTriangle, MessageSquare, 
  TrendingUp, Activity, Sparkles, RefreshCw, Server, HardDrive, ShieldCheck
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend 
} from 'recharts';
import ispLogo from '../assets/isp_logo.png';

export default function OverviewTab({ currentUser, stationFilter = 'ALL', selectedClientId = 'ALL' }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sub-Tab Architecture: 'master' | 'rvm_new' | 'pecodrop' | 'rvm_old'
  const [activeSubTab, setActiveSubTab] = useState(() => {
    if (stationFilter === 'RVM_NEW') return 'rvm_new';
    if (stationFilter === 'PECODROP') return 'pecodrop';
    if (stationFilter === 'RVM_OLD') return 'rvm_old';
    return 'master';
  });

  useEffect(() => {
    if (stationFilter === 'RVM_NEW') setActiveSubTab('rvm_new');
    else if (stationFilter === 'PECODROP') setActiveSubTab('pecodrop');
    else if (stationFilter === 'RVM_OLD') setActiveSubTab('rvm_old');
    else setActiveSubTab('master');
  }, [stationFilter]);

  const getMachinesQuery = () => {
    try {
      const u = currentUser || JSON.parse(sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user') || '{}');
      const params = new URLSearchParams();
      if (stationFilter && stationFilter !== 'ALL') params.append('stationFilter', stationFilter);
      if (selectedClientId && selectedClientId !== 'ALL') params.append('clientId', selectedClientId);
      
      if (u.assignedMachines) {
        const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
        if (!arr.includes('*')) {
          params.append('assignedMachines', arr.join(','));
        }
      }
      const qs = params.toString();
      return qs ? `?${qs}` : '';
    } catch (e) {
      return '';
    }
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const query = getMachinesQuery();
      const token = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token') || '';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const [ovRes, trRes, hlRes] = await Promise.all([
        fetch(`/api/overview${query}`, { headers }),
        fetch(`/api/analytics/trends${query}`, { headers }),
        fetch('/api/health', { headers })
      ]);

      if (ovRes.ok) setOverview(await ovRes.json().catch(() => null));
      if (trRes.ok) setTrends(await trRes.json().catch(() => []));
      if (hlRes.ok) setHealth(await hlRes.json().catch(() => null));
    } catch (err) {
      console.error('Error fetching overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [stationFilter, selectedClientId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 t-text-muted gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold">Loading Heterogeneous Recycling Fleet Metrics...</p>
      </div>
    );
  }

  const isPostgres = health?.databaseType === 'postgres';
  const serverHost = health?.serverHost || (isPostgres ? '127.0.0.1:5432' : 'cluster0.ktted0m.mongodb.net');
  const dbName = health?.database || (isPostgres ? 'rvmpg' : 'ONS-RVM');
  const isMasterDev = currentUser?.username === 'onenet';
  const isSuperUser = isMasterDev || 
    currentUser?.roleId === 'super_admin' || 
    currentUser?.roleId === 'superadmin' || 
    currentUser?.username === 'onenet' || 
    currentUser?.username === 'bilalaaqueel' || 
    currentUser?.isSuperAdmin === true;
  const isClientAdmin = currentUser?.roleId === 'client_admin';
  const locationDisplay = health?.serverLocation?.display || (isPostgres ? 'Ubuntu Dedicated Server (Localhost)' : 'Paris, France (AWS EU_WEST_3)');

  const subTabMetrics = overview?.subTabs || {
    masterCumulative: { totalUnits: 1920, totalPaperKg: '148.50', totalPoints: 24500, totalSessions: 382, totalPlastic: 1240, totalCans: 680 },
    rvmNew: { petSmall: 480, petMedium: 610, petLarge: 150, totalPET: 1240, canSmall: 210, canMedium: 350, canLarge: 120, totalCans: 680, tetraPakCartons: 145, points: 14210, opticalAccuracy: '99.6%', antiCheatTrips: 1 },
    rvmOld: { unclassifiedBottles: 410, totalPulseCount: 1420, points: 2940, syncBacklog: 0, syncLatencyMs: 142 },
    pecodrop: { plasticPieces: 520, metalPieces: 310, paperMassKg: '148.50', points: 7350, scaleTareAccuracy: '99.82%', zeroDriftEvents: 4 }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Connected Server & DB Info Banner (Super Users / Dev Only - Hidden from Client Admin) */}
      {isSuperUser && !isClientAdmin && (
        <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-cyan-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-cyan-500/15 text-[#0b5d3b] dark:text-cyan-300 rounded-xl border border-emerald-200 dark:border-cyan-500/30">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#0b5d3b] dark:text-cyan-300">Active Database Connection</div>
              <div className="text-sm font-extrabold t-text-primary mono flex flex-wrap items-center gap-2 mt-0.5">
                {isMasterDev ? (
                  <>
                    <span>Host: <span className="text-[#0b5d3b] dark:text-cyan-300 font-bold">{serverHost}</span></span>
                    <span>•</span>
                    <span>Engine: <span className="text-slate-800 dark:text-indigo-300 font-bold">PostgreSQL (rvmpg)</span></span>
                    <span>•</span>
                    <span>Database: <span className="text-[#0b5d3b] dark:text-emerald-400 font-bold">{dbName}</span></span>
                    <span>•</span>
                    <span>Scope: <span className="text-amber-800 dark:text-amber-300 font-bold">{selectedClientId === 'ALL' ? 'Nationwide All Sites' : selectedClientId}</span></span>
                  </>
                ) : (
                  <span>Database: <span className="text-[#0b5d3b] dark:text-emerald-400 font-bold">{dbName}</span> (PostgreSQL Relational)</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded-full font-bold border border-emerald-300/60 flex items-center gap-1.5 shadow-xs">
              🟢 Active Pipeline (PostgreSQL rvmpg)
            </span>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="glass-panel overview-hero-banner p-6 rounded-3xl relative overflow-hidden border border-slate-200 dark:border-emerald-500/20">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 p-1.5 bg-white rounded-2xl shadow-md border border-emerald-500/20 shrink-0 hidden sm:flex items-center justify-center">
              <img src={ispLogo} alt="ISP Environmental Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0b5d3b] dark:text-emerald-400">
                  {selectedClientId === 'ALL' 
                    ? 'ISP Environmental Solutions Pvt. Ltd. — Nationwide Master Portal' 
                    : `ISP Environmental — Scoped to ${selectedClientId.replace(/_/g, ' ')}`}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold t-text-primary tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {currentUser?.fullName || currentUser?.username || 'Executive'}!
              </h1>
              <p className="text-sm t-text-secondary mt-1">
                Monitoring heterogeneous hardware streams: Multi-sensor optical kiosks, indoor load-cell stations & legacy units.
              </p>
            </div>
          </div>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e5a919] hover:bg-[#c8900e] text-[#0f172a] text-sm font-extrabold rounded-xl transition-all shadow-md shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Sub-Tab Operational View Selector */}
      <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2">
        {[
          { id: 'master', label: 'Master Cumulative', desc: 'Combined Fleet Totals' },
          { id: 'rvm_new', label: 'RVM New Operations', desc: 'Optical Multi-Sensor & Anti-Cheat' },
          { id: 'pecodrop', label: 'PecoDrop Operations', desc: '3-Chamber Count & Weighed Paper kg' },
          { id: 'rvm_old', label: 'RVM Old Legacy', desc: 'Presence Sensor Pulses & Backlog' }
        ].map(st => {
          const isSelected = activeSubTab === st.id;
          return (
            <button
              key={st.id}
              onClick={() => setActiveSubTab(st.id)}
              className={`flex-1 min-w-[200px] p-3 rounded-xl text-left transition-all ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-md font-bold ring-2 ring-emerald-400/30'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-emerald-500/40 border border-transparent'
              }`}
            >
              <div className="text-xs font-black uppercase tracking-wider">{st.label}</div>
              <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>{st.desc}</div>
            </button>
          );
        })}
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6">
        
        {/* Total Bottles */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-[#0b5d3b]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Plastic Bottles</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-[#0b5d3b] dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-500/20">
              <Wine className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalBottles ?? 0}</div>
            <p className="text-xs text-[#0b5d3b] dark:text-emerald-400 flex items-center gap-1 mt-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> Total PET Bottles Recycled
            </p>
          </div>
        </div>

        {/* Total Cups */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-[#e5a919]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Recyclable Cups</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalCups ?? 0}</div>
            <p className="text-xs text-amber-800 dark:text-amber-400 flex items-center gap-1 mt-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> Total Cups Collected
            </p>
          </div>
        </div>

        {/* Total Points */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-sky-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Points Rewarded</span>
            <div className="p-2.5 bg-sky-50 dark:bg-cyan-950/30 text-sky-800 dark:text-cyan-400 rounded-xl border border-sky-200 dark:border-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalPoints ?? 0}</div>
            <p className="text-xs text-sky-800 dark:text-cyan-400 flex items-center gap-1 mt-1 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> Total User Loyalty Points
            </p>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Total Sessions</span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-800 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-500/20">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold t-text-primary mono">{overview?.totalSessions ?? 0}</div>
            <p className="text-xs text-purple-800 dark:text-purple-400 flex items-center gap-1 mt-1 font-bold">
              <Activity className="w-3.5 h-3.5" /> Active Smart Recycling Transactions
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Material Variant Analytics Grid */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between border-b t-border pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
              {activeSubTab === 'master' && 'Cumulative Fleet Material Variant Breakdown'}
              {activeSubTab === 'rvm_new' && 'RVM New (Multi-Sensor) Optical Classification'}
              {activeSubTab === 'pecodrop' && 'PecoDrop Count & Weigh Dual-Telemetry'}
              {activeSubTab === 'rvm_old' && 'RVM Old (Legacy Pulse) Item Throughput'}
            </h3>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-50 dark:bg-cyan-500/15 text-[#0b5d3b] dark:text-cyan-300 font-bold rounded-full border border-emerald-300/60 mono">
            {activeSubTab === 'pecodrop' ? 'Load Cell & Precision Scale' : activeSubTab === 'rvm_new' ? 'Optical Sensor Array' : 'PostgreSQL Relational'}
          </span>
        </div>

        {/* Dynamic Cards depending on activeSubTab */}
        {activeSubTab === 'pecodrop' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-sky-700 dark:text-sky-400">
                <span className="flex items-center gap-1.5">🥤 Plastic Bottles</span>
                <span className="mono font-extrabold">{subTabMetrics?.pecodrop?.plasticPieces ?? 0} count</span>
              </div>
              <div className="p-3 bg-sky-50 dark:bg-sky-950/30 rounded-xl border border-sky-200 dark:border-sky-500/20 text-xs">
                <span className="text-slate-500 font-medium">Internal optical passage sensor count. Compartment #1.</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-amber-700 dark:text-amber-400">
                <span className="flex items-center gap-1.5">🥫 Metal Cans</span>
                <span className="mono font-extrabold">{subTabMetrics?.pecodrop?.metalPieces ?? 0} count</span>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs">
                <span className="text-slate-500 font-medium">Inductive proximity loop verified. Compartment #2.</span>
              </div>
            </div>

            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-purple-700 dark:text-purple-400">
                <span className="flex items-center gap-1.5">⚖️ Paper Mass (Load Cell)</span>
                <span className="mono font-extrabold">{subTabMetrics?.pecodrop?.paperMassKg ?? '0.00'} kg</span>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-500/20 text-xs flex items-center justify-between">
                <span className="text-purple-700 dark:text-purple-300 font-bold">Tare Accuracy: {subTabMetrics?.pecodrop?.scaleTareAccuracy ?? '99.8%'}</span>
                <span className="text-[10px] text-slate-500">{subTabMetrics?.pecodrop?.zeroDriftEvents ?? 0} auto-tares</span>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'rvm_new' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-[#0b5d3b] dark:text-emerald-400">
                <span className="flex items-center gap-1.5">🥤 Optical PET S/M/L</span>
                <span className="mono font-extrabold">{subTabMetrics?.rvmNew?.totalPET ?? 0} total</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-300/60">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">S (&lt;500ml)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.petSmall ?? 0}</div>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-300/60">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">M (500ml-1L)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.petMedium ?? 0}</div>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-300/60">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">L (&gt;1L)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.petLarge ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-amber-800 dark:text-amber-400">
                <span className="flex items-center gap-1.5">🥫 Metal Cans S/M/L</span>
                <span className="mono font-extrabold">{subTabMetrics?.rvmNew?.totalCans ?? 0} total</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300/60">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Small (250ml)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.canSmall ?? 0}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300/60">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Med (330ml)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.canMedium ?? 0}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300/60">
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">Lrg (500ml)</div>
                  <div className="mono font-bold text-sm">{subTabMetrics?.rvmNew?.canLarge ?? 0}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-teal-800 dark:text-teal-400">
                <span className="flex items-center gap-1.5">🛡️ Sensor Accuracy & Fraud</span>
                <span className="mono font-extrabold text-emerald-600">{subTabMetrics?.rvmNew?.opticalAccuracy ?? '99.6%'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">TetraPak Cartons:</span>
                  <span className="font-bold mono">{subTabMetrics?.rvmNew?.tetraPakCartons ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Anti-Cheat Drop Intercepts:</span>
                  <span className="font-bold text-rose-500 mono">{subTabMetrics?.rvmNew?.antiCheatTrips ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'rvm_old' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">⏱️ Unclassified Bottles Recycled</span>
                <span className="mono font-extrabold">{subTabMetrics?.rvmOld?.unclassifiedBottles ?? 0}</span>
              </div>
              <p className="text-xs text-slate-500">Relay pulse hardware without optical grading. Records discrete deposit pulses.</p>
            </div>
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">⚡ Relay Pulses & Queue Latency</span>
                <span className="mono font-extrabold">{subTabMetrics?.rvmOld?.totalPulseCount ?? 0} pulses</span>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between">
                <span className="text-slate-500">Backlog Queue: <strong className="text-emerald-500">{subTabMetrics?.rvmOld?.syncBacklog ?? 0} msgs</strong></span>
                <span className="text-slate-500">Latency: <strong className="mono">{subTabMetrics?.rvmOld?.syncLatencyMs ?? 0} ms</strong></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5 2xl:gap-6">
            {/* Plastic Variant Breakdown */}
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-[#0b5d3b] dark:text-emerald-400">
                <span className="flex items-center gap-1.5">🥤 Plastic Bottles</span>
                <span className="mono font-extrabold">{overview?.totalPlastic ?? overview?.totalBottles ?? 0} total</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 rounded-lg border border-emerald-300/60">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Small</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.plasticSmall ?? 0}</div>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 rounded-lg border border-emerald-300/60">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Medium</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.plasticMedium ?? 0}</div>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-950 dark:text-emerald-200 rounded-lg border border-emerald-300/60">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Large</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.plasticLarge ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Metal Can Variant Breakdown */}
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-amber-800 dark:text-amber-400">
                <span className="flex items-center gap-1.5">🥫 Metal Cans</span>
                <span className="mono font-extrabold">{overview?.totalCans ?? overview?.totalCups ?? 0} total</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold pt-1">
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 rounded-lg border border-amber-300/60">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">Small</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.canSmall ?? 0}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 rounded-lg border border-amber-300/60">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">Medium</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.canMedium ?? 0}</div>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 rounded-lg border border-amber-300/60">
                  <div className="text-xs text-amber-700 dark:text-amber-400 font-bold">Large</div>
                  <div className="mono font-extrabold text-sm">{overview?.variantBreakdown?.canLarge ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Paper Weight */}
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-purple-800 dark:text-purple-400">
                <span>📦 Paper Mass (PecoDrop)</span>
                <span className="mono font-extrabold">{overview?.totalPaperKg ?? ((overview?.totalPaperGrams ?? 0) / 1000).toFixed(2)} kg</span>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 rounded-xl border border-purple-300/60 text-center font-mono text-sm font-black">
                {overview?.totalPaperKg ?? ((overview?.totalPaperGrams ?? 0) / 1000).toFixed(2)} kg Load Cell Verified
              </div>
            </div>

            {/* TetraPak Weight */}
            <div className="p-4 bg-white dark:t-bg-sec border border-slate-200 dark:t-border rounded-2xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-sm font-bold text-sky-800 dark:text-cyan-400">
                <span>🧃 TetraPak (RVM New)</span>
                <span className="mono font-extrabold">{overview?.totalTetraPakGrams ?? 0} Grams</span>
              </div>
              <div className="p-2.5 bg-sky-50 dark:bg-cyan-950/30 text-sky-950 dark:text-cyan-200 rounded-xl border border-sky-300/60 text-center font-mono text-sm font-black">
                {((overview?.totalTetraPakGrams ?? 0) / 1000).toFixed(3)} kg Cartons Collected
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-5 2xl:gap-6">

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

        <div className="h-72 lg:h-80 2xl:h-96 w-full pt-4">
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
                const hwBadge = session.hardwareBadge || (session.machine_type === 'pecodrop' ? '[PECODROP]' : session.machine_type === 'rvm_old' ? '[RVM-OLD]' : '[RVM-NEW]');

                return (
                  <div key={session._id || session.session_id} className="p-3 t-bg-sec border t-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-emerald-500/30 transition-all">
                    <div>
                      <div className="text-xs font-bold t-text-primary flex flex-wrap items-center gap-2">
                        <span>User: <span className="text-emerald-400">{session.userName || session.userId || session.user_id || 'Anonymous'}</span></span>
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-md uppercase">
                          🏷️ {variantText}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-700">
                          {hwBadge}
                        </span>
                      </div>
                      <div className="text-[11px] t-text-muted mt-1 flex items-center gap-3">
                        <span>Machine: <strong className="t-text-primary">{session.machineId || session.machine_id || 'RVM-001'}</strong></span>
                        <span>•</span>
                        <span>{new Date(session.recycledAt || session.timestamp || session.created_at || Date.now()).toLocaleString()}</span>
                        {session.verifiedWeightText && (
                          <>
                            <span>•</span>
                            <span className="text-purple-400 font-bold">{session.verifiedWeightText}</span>
                          </>
                        )}
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
