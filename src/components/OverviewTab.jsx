import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, Scale, Recycle, CloudSun, Award, Activity, CheckCircle2, 
  RefreshCw, FileSpreadsheet, Layers, ScanLine, Building2, Archive, 
  Check, FileText, Package, Trash2, AlertTriangle, Wrench, X, 
  FileCheck, Shield, Sparkles, Clock, ChevronDown, UserCheck, BarChart3, PieChart as PieIcon,
  MapPin, Calendar, Cpu
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function OverviewTab({ currentUser, stationFilter = 'ALL', selectedClientId = 'ALL' }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState([]);
  const [machineSummary, setMachineSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv'

  // Scope selection: 'cumulative' | 'new_rvm' | 'pecodrop' | 'old_rvm'
  const [activeScope, setActiveScope] = useState(() => {
    if (stationFilter === 'RVM_NEW') return 'new_rvm';
    if (stationFilter === 'PECODROP') return 'pecodrop';
    if (stationFilter === 'RVM_OLD') return 'old_rvm';
    return 'cumulative';
  });

  // Top Filters State (Resolves QA Issue 3: Date Range | Machine Model | Client Org | Location)
  const [dateRange, setDateRange] = useState('30d');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [clientList, setClientList] = useState([]);

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.clients)) {
          setClientList(data.clients);
        }
      })
      .catch(() => {});
  }, []);

  // Maintenance Alerts State (Dynamically populated from backend live telemetry)
  const [alerts, setAlerts] = useState([]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const getMachinesQuery = () => {
    try {
      const u = currentUser || JSON.parse(sessionStorage.getItem('rvm_auth_user') || localStorage.getItem('rvm_auth_user') || '{}');
      const params = new URLSearchParams();
      if (stationFilter && stationFilter !== 'ALL') params.append('stationFilter', stationFilter);
      if (selectedClientId && selectedClientId !== 'ALL') params.append('clientId', selectedClientId);
      if (dateRange) params.append('dateRange', dateRange);
      if (selectedLocation && selectedLocation !== 'ALL') params.append('location', selectedLocation);
      if (u.assignedMachines) {
        const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
        if (!arr.includes('*')) params.append('assignedMachines', arr.join(','));
      }
      const qs = params.toString();
      return qs ? `?${qs}` : '';
    } catch (e) {
      return '';
    }
  };

  const fetchOverview = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const query = getMachinesQuery();
      const token = sessionStorage.getItem('rvm_auth_token') || localStorage.getItem('rvm_auth_token') || '';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [ovRes, trRes, hlRes, msRes] = await Promise.all([
        fetch(`/api/overview${query}`, { headers }),
        fetch(`/api/analytics/trends${query}`, { headers }),
        fetch('/api/health', { headers }),
        fetch(`/api/analytics/machines/summary${query}`, { headers })
      ]);

      if (ovRes.ok) {
        const ovData = await ovRes.json().catch(() => null);
        setOverview(ovData);
        if (ovData?.recentAlerts && Array.isArray(ovData.recentAlerts) && ovData.recentAlerts.length > 0) {
          setAlerts(ovData.recentAlerts.map((a, i) => ({
            id: a._id || `alert-${i}`,
            machine: a.machineId || 'Kiosk',
            type: a.binType ? `Bin ${a.binType}` : 'Hardware Alert',
            desc: a.message || 'System service required',
            level: a.severity || 'warning',
            icon: a.binType === 'PAPER' || a.binType === 'PLASTIC' ? Trash2 : AlertTriangle,
            actionLabel: 'Clear Bin',
            completed: false
          })));
        } else {
          setAlerts([]);
        }
      }
      if (trRes.ok) setTrends(await trRes.json().catch(() => []));
      if (hlRes.ok) setHealth(await hlRes.json().catch(() => null));
      if (msRes.ok) setMachineSummary(await msRes.json().catch(() => null));

      if (isManual) showToast('Machine network data refreshed successfully');
    } catch (err) {
      console.error('Error fetching overview', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const liveNetworkStatus = useMemo(() => {
    const total = machineSummary?.totalActive ?? overview?.totalMachines ?? 7;
    const online = machineSummary?.onlineCount ?? total;
    const pct = total > 0 ? Math.round((online / total) * 100) : 100;
    const label = `${pct}% Network Online (${online} of ${total} ${total === 1 ? 'Kiosk' : 'Kiosks'} Active)`;
    return {
      total,
      online,
      pct,
      label
    };
  }, [machineSummary, overview]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => fetchOverview(false), 30000);
    return () => clearInterval(interval);
  }, [stationFilter, selectedClientId, dateRange, selectedLocation]);

  // Sync active scope when parent stationFilter changes
  useEffect(() => {
    if (stationFilter === 'RVM_NEW') setActiveScope('new_rvm');
    else if (stationFilter === 'PECODROP') setActiveScope('pecodrop');
    else if (stationFilter === 'RVM_OLD') setActiveScope('old_rvm');
    else setActiveScope('cumulative');
  }, [stationFilter]);

  // Scope Data Models (Dynamically responsive to live DB data, Date Range & Location filters)
  const scopeData = useMemo(() => {
    // Date and location are filtered by the API using actual session records.
    // Never estimate scoped totals with percentage multipliers.
    const multiplier = 1.0;
    const locFactor = 1.0;

    const rawBottles = overview?.totalBottles ?? 0;
    const rawCans = overview?.totalCans ?? 0;
    const rawTetra = overview?.totalTetra ?? (overview?.totalTetraPakGrams ? Math.round(overview.totalTetraPakGrams / 35) : 0);
    const rawPaperKg = overview?.totalPaperKg ?? (overview?.totalPaperGrams ? parseFloat((overview.totalPaperGrams / 1000).toFixed(2)) : 0);
    const rawPoints = overview?.totalPoints ?? 0;
    const rawSessions = overview?.totalSessions ?? 0;
    const rawUsers = overview?.totalUsers ?? 0;

    const baseBottles = Math.round(rawBottles * multiplier * locFactor);
    const baseCans = Math.round(rawCans * multiplier * locFactor);
    const baseTetra = Math.round(rawTetra * multiplier * locFactor);
    const basePaperKg = parseFloat((rawPaperKg * multiplier * locFactor).toFixed(2));
    const basePoints = Math.round(rawPoints * multiplier * locFactor);
    const baseSessions = Math.round(rawSessions * multiplier * locFactor);
    const baseUsers = Math.round(rawUsers * locFactor);
    const totalMassTons = ((baseBottles * 0.025 + baseCans * 0.015 + basePaperKg + baseTetra * 0.035) / 1000).toFixed(2);
    const carbonKg = (parseFloat(totalMassTons) * 1573).toFixed(1);
    const trees = Math.round(parseFloat(totalMassTons) * 63);
    const itemsPerVisit = baseSessions > 0 ? Math.round((baseBottles + baseCans + baseTetra) / baseSessions) : 0;
    const targetProgress = Math.min(100, Math.round((parseFloat(totalMassTons) / 5.0) * 100));

    // Sub-tab breakdown values from live DB
    const rvmNewSub = overview?.subTabs?.rvmNew;
    const pecoSub = overview?.subTabs?.pecodrop;
    const rvmOldSub = overview?.subTabs?.rvmOld;

    return {
      cumulative: {
        mass: totalMassTons,
        massUnit: 'Tonnes',
        units: baseBottles + baseCans + baseTetra,
        bottles: baseBottles,
        cans: baseCans,
        cartons: baseTetra,
        paperKg: basePaperKg,
        carbon: carbonKg,
        trees: `${trees} Mature Trees`,
        points: basePoints,
        liability: Math.round(basePoints * 0.20),
        sessions: baseSessions,
        activeUsers: baseUsers,
        itemsPerVisit,
        targetProgress
      },
      new_rvm: {
        mass: ((rvmNewSub ? (rvmNewSub.totalBottles * 0.025 + rvmNewSub.totalCans * 0.015 + (rvmNewSub.tetraPakCartons || 0) * 0.035) : 0) / 1000).toFixed(2),
        massUnit: 'Tonnes',
        units: rvmNewSub ? (rvmNewSub.totalBottles + rvmNewSub.totalCans + (rvmNewSub.tetraPakCartons || 0)) : 0,
        bottles: rvmNewSub?.totalBottles ?? 0,
        cans: rvmNewSub?.totalCans ?? 0,
        cartons: rvmNewSub?.tetraPakCartons ?? 0,
        paperKg: 0,
        carbon: (((rvmNewSub ? (rvmNewSub.totalBottles * 0.025 + rvmNewSub.totalCans * 0.015 + (rvmNewSub.tetraPakCartons || 0) * 0.035) : 0) / 1000) * 1573).toFixed(1),
        trees: `${Math.round(((rvmNewSub ? (rvmNewSub.totalBottles * 0.025 + rvmNewSub.totalCans * 0.015 + (rvmNewSub.tetraPakCartons || 0) * 0.035) : 0) / 1000) * 63)} Mature Trees`,
        points: rvmNewSub?.points ?? 0,
        liability: Math.round((rvmNewSub?.points ?? 0) * 0.20),
        sessions: rvmNewSub?.totalSessions ?? 0,
        activeUsers: baseUsers,
        itemsPerVisit: (rvmNewSub?.totalSessions ?? 0) > 0 ? Math.round(((rvmNewSub?.totalBottles ?? 0) + (rvmNewSub?.totalCans ?? 0)) / rvmNewSub.totalSessions) : 0,
        targetProgress: 0
      },
      pecodrop: {
        mass: ((pecoSub ? (pecoSub.totalBottles * 0.025 + (parseFloat(pecoSub.paperMassKg) || 0)) : 0) / 1000).toFixed(2),
        massUnit: 'Tonnes',
        units: pecoSub ? (pecoSub.totalBottles + pecoSub.metalPieces) : 0,
        bottles: pecoSub?.totalBottles ?? 0,
        cans: pecoSub?.metalPieces ?? 0,
        cartons: 0,
        paperKg: parseFloat(pecoSub?.paperMassKg || 0),
        carbon: (((pecoSub ? (pecoSub.totalBottles * 0.025 + (parseFloat(pecoSub.paperMassKg) || 0)) : 0) / 1000) * 1573).toFixed(1),
        trees: `${Math.round(((pecoSub ? (pecoSub.totalBottles * 0.025 + (parseFloat(pecoSub.paperMassKg) || 0)) : 0) / 1000) * 63)} Mature Trees`,
        points: pecoSub?.points ?? 0,
        liability: Math.round((pecoSub?.points ?? 0) * 0.20),
        sessions: pecoSub?.totalSessions ?? 0,
        activeUsers: baseUsers,
        itemsPerVisit: (pecoSub?.totalSessions ?? 0) > 0 ? Math.round((pecoSub?.totalBottles ?? 0) / pecoSub.totalSessions) : 0,
        targetProgress: 0
      },
      old_rvm: {
        mass: ((rvmOldSub ? (rvmOldSub.totalBottles * 0.025) : 0) / 1000).toFixed(2),
        massUnit: 'Tonnes',
        units: rvmOldSub?.totalBottles ?? 0,
        bottles: rvmOldSub?.totalBottles ?? 0,
        cans: 0,
        cartons: 0,
        paperKg: 0,
        carbon: (((rvmOldSub ? (rvmOldSub.totalBottles * 0.025) : 0) / 1000) * 1573).toFixed(1),
        trees: `${Math.round(((rvmOldSub ? (rvmOldSub.totalBottles * 0.025) : 0) / 1000) * 63)} Mature Trees`,
        points: rvmOldSub?.points ?? 0,
        liability: Math.round((rvmOldSub?.points ?? 0) * 0.20),
        sessions: rvmOldSub?.totalSessions ?? 0,
        activeUsers: baseUsers,
        itemsPerVisit: (rvmOldSub?.totalSessions ?? 0) > 0 ? Math.round((rvmOldSub?.totalBottles ?? 0) / rvmOldSub.totalSessions) : 0,
        targetProgress: 0
      }
    };
  }, [overview, dateRange, selectedLocation]);

  const currentScope = scopeData[activeScope] || scopeData.cumulative;
  const emptyPaperBreakdown = {
    light: { sessions: 0, grams: 0 },
    file: { sessions: 0, grams: 0 },
    bulk: { sessions: 0, grams: 0 }
  };
  const paperBreakdown = (activeScope === 'cumulative' || activeScope === 'pecodrop')
    ? (overview?.subTabs?.pecodrop?.paperBreakdown || emptyPaperBreakdown)
    : emptyPaperBreakdown;
  const formatPaperTier = (tier) => {
    const sessions = Number(tier?.sessions || 0);
    const grams = Number(tier?.grams || 0);
    const weight = grams >= 1000
      ? `${(grams / 1000).toLocaleString(undefined, { maximumFractionDigits: 3 })} kg`
      : `${grams.toLocaleString()} g`;
    return { sessions, weight };
  };

  // Daily Trend Stacked Chart Data (Live from /api/analytics/trends)
  const dailyTrendData = useMemo(() => {
    if (!trends || !Array.isArray(trends) || trends.length === 0) return [];
    return trends.map(t => {
      let label = t._id || 'Day';
      try {
        if (t._id && t._id.length >= 10) {
          label = new Date(t._id).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        }
      } catch (e) {}
      return {
        day: label,
        bottles: t.bottles || 0,
        cans: t.cups || t.cans || 0,
        cartons: t.cartons || 0
      };
    });
  }, [trends]);

  // Material Weight Share Donut Data (Dynamically computed from actual masses)
  const materialShareData = useMemo(() => {
    const pWeight = (currentScope?.bottles || 0) * 0.025;
    const cWeight = (currentScope?.cans || 0) * 0.015;
    const tWeight = (currentScope?.cartons || 0) * 0.035;
    const paperWeight = currentScope?.paperKg || 0;
    const totalWeightKg = pWeight + cWeight + tWeight + paperWeight;

    if (totalWeightKg <= 0) return [];

    const items = [];
    if (pWeight > 0) items.push({ name: `Plastic Bottles (${(pWeight >= 1000 ? (pWeight / 1000).toFixed(2) + ' T' : pWeight.toFixed(1) + ' kg')})`, value: parseFloat(((pWeight / totalWeightKg) * 100).toFixed(1)), color: '#059669' });
    if (cWeight > 0) items.push({ name: `Aluminium Cans (${cWeight.toFixed(1)} kg)`, value: parseFloat(((cWeight / totalWeightKg) * 100).toFixed(1)), color: '#f59e0b' });
    if (paperWeight > 0) items.push({ name: `Office Paper (${paperWeight.toFixed(1)} kg)`, value: parseFloat(((paperWeight / totalWeightKg) * 100).toFixed(1)), color: '#a855f7' });
    if (tWeight > 0) items.push({ name: `Tetra Pak (${tWeight.toFixed(2)} kg)`, value: parseFloat(((tWeight / totalWeightKg) * 100).toFixed(1)), color: '#0ea5e9' });
    return items;
  }, [currentScope]);

  // Dispatch / Complete an alert
  const handleAlertAction = (alertId, machine) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, completed: true } : a));
    showToast(`Staff assigned / action completed on ${machine}`);
  };

  // Export File Function
  const handleExecuteExport = () => {
    setIsExportModalOpen(false);
    if (exportFormat === 'pdf') {
      window.print();
      showToast('Opening print view for Sustainability Overview Report');
    } else {
      const headers = ['Scope', 'Total Waste (Tonnes)', 'Items Recycled', 'Bottles (PET)', 'Cans (ALU)', 'Cartons (UBC)', 'Paper (kg)', 'CO2 Saved (kg)', 'Points Rewarded', 'Voucher Value (PKR)', 'Sessions'];
      const rows = Object.entries(scopeData).map(([key, data]) => [
        `"${key.toUpperCase()}"`,
        data.mass,
        data.units,
        data.bottles,
        data.cans,
        data.cartons,
        data.paperKg,
        `"${data.carbon}"`,
        data.points,
        data.liability,
        data.sessions
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ISP_Sustainability_Overview_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Sustainability Report (CSV) downloaded successfully');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Section — Master Cumulative Overview & Top Filters (Resolves QA Issues 2 & 3) */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border t-border space-y-4 shadow-sm">
        
        {/* Top Header Row: Master Cumulative Title & Refresh Metrics (Resolves QA Issue 2: Removed duplicate greeting banner, need only Refresh metrics) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b t-border">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
              <Leaf className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                  {selectedClientId !== 'ALL'
                    ? `${(clientList.find(c => c.id === selectedClientId)?.name || selectedClientId).replace('Client: ', '')} Scope`
                    : 'Master Cumulative Overview'}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <span className={`w-2 h-2 rounded-full ${liveNetworkStatus.online > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                  {liveNetworkStatus.label}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight t-text-primary mt-0.5">
                Machine Operation Overview
              </h1>
              <p className="text-xs t-text-secondary mt-0.5">
                Real-time telemetrics across Smart AI Kiosks, PecoDrop stations, and Legacy pulse units.
              </p>
            </div>
          </div>

          {/* Right Action: ONLY Refresh Metrics + Export ESG (Fulfills QA Issue 2) */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => fetchOverview(true)}
              disabled={refreshing || loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-2 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
              title="Export ESG / CSR"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export ESG / CSR</span>
            </button>
          </div>
        </div>

        {/* Scoped Client Alert Banner */}
        {selectedClientId && selectedClientId !== 'ALL' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 animate-fade-in shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Client Scoped Executive View Active
                </div>
                <div className="text-sm font-extrabold flex items-center gap-2">
                  <span>{clientList.find(c => c.id === selectedClientId)?.name || clientList.find(c => c.id === selectedClientId)?.label || selectedClientId}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Isolated Hardware & Telemetry
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('rvm_switch_client', { detail: 'ALL' }));
              }}
              className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs font-bold transition-all shadow-xs"
            >
              Reset to All Master Fleet
            </button>
          </div>
        )}

        {/* Top 4 Filters Bar (Resolves QA Issue 3: Date Range | Machine Model | Client Org | Location) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          
          {/* Top Filter 1: Date Range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider t-text-muted flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Date Range</span>
            </label>
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => {
                  setDateRange(e.target.value);
                  showToast(`Date Range: ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl t-bg-sec border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="today">Today (Past 24h)</option>
                <option value="yesterday">Yesterday</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days (Standard)</option>
                <option value="this_month">This Month (Current Cycle)</option>
                <option value="all_time">All Time (Audited Records)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Top Filter 2: Machine Model (Old RVM / New RVM / PecoDrop / Cumulative) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider t-text-muted flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Machine Model</span>
            </label>
            <div className="relative">
              <select
                value={activeScope}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveScope(val);
                  let stationType = 'ALL';
                  if (val === 'new_rvm') stationType = 'RVM_NEW';
                  else if (val === 'pecodrop') stationType = 'PECODROP';
                  else if (val === 'old_rvm') stationType = 'RVM_OLD';
                  window.dispatchEvent(new CustomEvent('rvm_switch_station', { detail: stationType }));
                  showToast(`Model Scope: ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl t-bg-sec border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="cumulative">All Models (Master Cumulative)</option>
                <option value="new_rvm">Smart RVM</option>
                <option value="pecodrop">PecoDrop (Office 3-Chamber Kiosk)</option>
                <option value="old_rvm">Legacy RVM (Old Counter Units)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Top Filter 3: Client Organization */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider t-text-muted flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>Client Org</span>
            </label>
            <div className="relative">
              <select
                value={selectedClientId}
                onChange={(e) => {
                  const val = e.target.value;
                  window.dispatchEvent(new CustomEvent('rvm_switch_client', { detail: val }));
                  showToast(`Client Scope: ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl t-bg-sec border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="ALL">All Client Organizations</option>
                <option value="ISP_MASTER">ISP Environmental Master (All Sites)</option>
                {clientList.filter(c => c.id !== 'ALL' && c.id !== 'ISP_MASTER').map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label ? c.label.replace('Client: ', '') : c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Top Filter 4: Location */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider t-text-muted flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Location</span>
            </label>
            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  showToast(`Location Filter: ${e.target.options[e.target.selectedIndex].text}`);
                }}
                className="w-full px-3 py-2 text-xs font-bold rounded-xl t-bg-sec border t-border t-text-primary focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none pr-8"
              >
                <option value="ALL">All Locations (Nationwide)</option>
                <option value="Lahore">Lahore (UCP Campus & Commercial Centre)</option>
                <option value="Karachi">Karachi (Bank Alfalah HQ / Chundrigar)</option>
                <option value="Rawalpindi">Rawalpindi (Metro Mall RWP)</option>
                <option value="Islamabad">Islamabad (Sector I-11 Fleet Hub)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* Machine Type Quick-Selector Pill Strip (Stay in sync with Machine Model dropdown) */}
        <div className="pt-2 border-t t-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="inline-flex p-1 t-bg-sec rounded-xl overflow-x-auto gap-1 border t-border">
            <button
              onClick={() => { 
                setActiveScope('cumulative'); 
                window.dispatchEvent(new CustomEvent('rvm_switch_station', { detail: 'ALL' }));
                showToast('Switched to: Master Cumulative (All Machines)'); 
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeScope === 'cumulative'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 't-text-secondary hover:t-text-primary'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Master Cumulative</span>
              <span className="text-[10px] bg-emerald-950/70 px-1.5 py-0.5 rounded text-emerald-200 font-semibold">
                All Machines
              </span>
            </button>

            <button
              onClick={() => { 
                setActiveScope('new_rvm'); 
                window.dispatchEvent(new CustomEvent('rvm_switch_station', { detail: 'RVM_NEW' }));
                showToast('Switched to: Smart RVM'); 
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeScope === 'new_rvm'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 't-text-secondary hover:t-text-primary'
              }`}
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Smart RVM</span>
            </button>

            <button
              onClick={() => { 
                setActiveScope('pecodrop'); 
                window.dispatchEvent(new CustomEvent('rvm_switch_station', { detail: 'PECODROP' }));
                showToast('Switched to: PecoDrop (Corporate Offices)'); 
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeScope === 'pecodrop'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 't-text-secondary hover:t-text-primary'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>PecoDrop (Corporate Kiosk)</span>
            </button>

            <button
              onClick={() => { 
                setActiveScope('old_rvm'); 
                window.dispatchEvent(new CustomEvent('rvm_switch_station', { detail: 'RVM_OLD' }));
                showToast('Switched to: Legacy RVM (Counter Units)'); 
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeScope === 'old_rvm'
                  ? 'bg-emerald-800 text-white shadow-xs font-bold'
                  : 't-text-secondary hover:t-text-primary'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Legacy RVM (Counter Units)</span>
            </button>
          </div>

          {/* Quick Active Filter Summary Pill */}
          <div className="text-xs font-semibold t-text-muted flex items-center gap-2">
            <span>Filter Active:</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-500/20">
              {dateRange.toUpperCase()} • {selectedLocation}
            </span>
          </div>
        </div>

      </div>

      {/* Management KPI Row (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Card 1: Total Recycled Weight */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Total Waste Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {currentScope.mass}
            </span>
            <span className="text-sm font-semibold t-text-muted">{currentScope.massUnit}</span>
          </div>
          <div className="mt-2 text-xs flex items-center justify-between t-text-muted">
            <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Kept out of landfills
            </span>
            <span className="t-text-muted text-[11px]">Target: 5.0 T</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${currentScope.targetProgress}%` }}></div>
          </div>
        </div>

        {/* Card 2: Items Recycled */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Total Items Recycled</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {currentScope.units.toLocaleString()}
            </span>
            <span className="text-sm font-semibold t-text-muted">items</span>
          </div>
          <div className="mt-3 text-xs t-text-muted flex items-center justify-between flex-wrap gap-1">
            <span>{(currentScope.bottles / 1000).toFixed(1)}k Bottles</span>
            <span>•</span>
            <span>{currentScope.cans} Cans</span>
            <span>•</span>
            <span>{currentScope.cartons} Cartons</span>
          </div>
        </div>

        {/* Card 3: Carbon Footprint Offset */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Clean Air &amp; CO₂ Saved</span>
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
              <CloudSun className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {currentScope.carbon}
            </span>
            <span className="text-xs font-semibold t-text-muted">kg CO₂</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md font-semibold border border-emerald-500/20">
            <span className="truncate">≈ {currentScope.trees} Planted</span>
          </div>
        </div>

        {/* Card 4: Rewards & Financial Value */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Points &amp; Reward Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight mono">
              {currentScope.points.toLocaleString()}
            </span>
            <span className="text-xs font-semibold t-text-muted">Pts</span>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="t-text-muted font-medium">Voucher Value:</span>
            <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 mono">
              PKR {currentScope.liability.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Card 5: User Recycling Activity */}
        <div className="glass-panel p-5 rounded-2xl border t-border relative overflow-hidden flex flex-col justify-between group hover:border-emerald-400/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider t-text-muted">Recycling Sessions</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight mono">
              {currentScope.sessions.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Completed
            </span>
          </div>
          <div className="mt-2.5 text-xs t-text-muted flex items-center justify-between">
            <span>{currentScope.activeUsers} Active Users</span>
            <span className="font-semibold t-text-primary">~{currentScope.itemsPerVisit} items/visit</span>
          </div>
        </div>

      </div>

      {/* Variant Breakdown Grid Across All Machines (4 Streams) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-base font-bold t-text-primary">Breakdown by Material &amp; Size (All Machines)</h2>
            <p className="text-xs t-text-muted">Detailed item counts and verified weight across your entire machine network</p>
          </div>
          <span className="text-[11px] font-semibold t-text-secondary t-bg-sec px-2.5 py-1 rounded-md border t-border">
            Pieces &amp; Weight Summary
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Stream 1: PET Plastic Bottles */}
          <div className="glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                    PET
                  </span>
                  <h3 className="font-bold t-text-primary text-sm">Plastic Bottles</h3>
                </div>
                <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {((currentScope.bottles * 0.025) >= 1000 ? `~${((currentScope.bottles * 0.025) / 1000).toFixed(2)} Tonnes` : `~${(currentScope.bottles * 0.025).toFixed(2)} kg`)}
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                {currentScope.bottles.toLocaleString()} <span className="text-xs font-normal t-text-muted">bottles</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 345ml</span>
                  <span className="text-xs font-bold t-text-primary mono">{overview?.variantBreakdown?.plasticSmall ?? 0}</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Med 500-1L</span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mono">{overview?.variantBreakdown?.plasticMedium ?? 0}</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Large 1.5L</span>
                  <span className="text-xs font-bold t-text-primary mono">{overview?.variantBreakdown?.plasticLarge ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Collection Status</span>
                <span className="t-text-primary">{currentScope.bottles > 0 ? `${currentScope.bottles} logged` : 'No active deposits'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: currentScope.bottles > 0 ? '100%' : '0%' }} title="Plastic Stream"></div>
              </div>
            </div>
          </div>

          {/* Stream 2: Metal Cans */}
          <div className="glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold">
                    ALU
                  </span>
                  <h3 className="font-bold t-text-primary text-sm">Aluminium Cans</h3>
                </div>
                <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  ~{(currentScope.cans * 0.015).toFixed(2)} kg
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                {currentScope.cans.toLocaleString()} <span className="text-xs font-normal t-text-muted">cans</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 250ml</span>
                  <span className="text-xs font-bold t-text-primary mono">{overview?.variantBreakdown?.canSmall ?? 0}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Med 375ml</span>
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 mono">{overview?.variantBreakdown?.canMedium ?? 0}</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Large 500ml</span>
                  <span className="text-xs font-bold t-text-primary mono">{overview?.variantBreakdown?.canLarge ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Collection Status</span>
                <span className="t-text-primary">{currentScope.cans > 0 ? `${currentScope.cans} logged` : 'No active deposits'}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: currentScope.cans > 0 ? '100%' : '0%' }} title="Can Stream"></div>
              </div>
            </div>
          </div>

          {/* Stream 3: Tetra Pak Cartons */}
          <div className="glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center text-xs font-bold">
                    UBC
                  </span>
                  <h3 className="font-bold t-text-primary text-sm">Tetra Pak Cartons</h3>
                </div>
                <span className="text-xs font-extrabold text-sky-700 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/30">
                  {(currentScope.cartons * 0.035).toFixed(2)} kg
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                {currentScope.cartons.toLocaleString()} <span className="text-xs font-normal t-text-muted">cartons</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 200ml</span>
                  <span className="text-xs font-bold t-text-primary mono">0</span>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Med 1000ml</span>
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300 mono">{currentScope.cartons}</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Large 1.5L</span>
                  <span className="text-xs font-bold t-text-primary mono">0</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Supported Machines</span>
                <span className="text-sky-700 dark:text-sky-400 font-bold">Smart RVM Only</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: currentScope.cartons > 0 ? '100%' : '0%' }} title="Smart RVM"></div>
              </div>
            </div>
          </div>

          {/* Stream 4: Office Paper (Weighed on Scale) */}
          <div className="glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center text-xs font-bold">
                    PPR
                  </span>
                  <h3 className="font-bold t-text-primary text-sm">Office Paper</h3>
                </div>
                <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
                  Weighed on Scale
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                {currentScope.paperKg.toFixed(2)} <span className="text-xs font-normal t-text-muted">kg collected</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">&lt;100g Light</span>
                  <span className="block text-xs font-bold t-text-primary mono">{formatPaperTier(paperBreakdown.light).sessions} sessions</span>
                  <span className="block text-[10px] font-semibold text-purple-700 dark:text-purple-400 mono">{formatPaperTier(paperBreakdown.light).weight}</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">100-499g File</span>
                  <span className="block text-xs font-extrabold text-purple-700 dark:text-purple-300 mono">{formatPaperTier(paperBreakdown.file).sessions} sessions</span>
                  <span className="block text-[10px] font-semibold text-purple-700 dark:text-purple-400 mono">{formatPaperTier(paperBreakdown.file).weight}</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">≥500g Bulk</span>
                  <span className="block text-xs font-bold t-text-primary mono">{formatPaperTier(paperBreakdown.bulk).sessions} sessions</span>
                  <span className="block text-[10px] font-semibold text-purple-700 dark:text-purple-400 mono">{formatPaperTier(paperBreakdown.bulk).weight}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Supported Machines</span>
                <span className="text-purple-700 dark:text-purple-400 font-bold">PecoDrop Corporate Only</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: currentScope.paperKg > 0 ? '100%' : '0%' }} title="PecoDrop Corporate"></div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Analytics & Activity Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Daily Collection Trends (Past 14 Days) */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Daily Recycling Activity (Past 14 Days)
              </h3>
              <p className="text-xs t-text-muted">Total items deposited daily across all active machines</p>
            </div>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1.5 font-medium t-text-secondary">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span> PET Bottles
              </span>
              <span className="flex items-center gap-1.5 font-medium t-text-secondary">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Cans
              </span>
              <span className="flex items-center gap-1.5 font-medium t-text-secondary">
                <span className="w-2.5 h-2.5 rounded bg-sky-500"></span> Cartons
              </span>
            </div>
          </div>

          <div className="relative h-64 sm:h-72 w-full">
            {dailyTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    formatter={(value, name) => [value, name === 'bottles' ? 'PET Bottles' : name === 'cans' ? 'Cans' : 'Cartons']}
                  />
                  <Bar dataKey="bottles" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cans" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="cartons" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-xs t-text-muted gap-2 border border-dashed t-border rounded-xl">
                <BarChart3 className="w-8 h-8 opacity-30 text-emerald-500" />
                <span className="font-semibold t-text-secondary">No activity recorded for this period</span>
                <span className="text-[11px] opacity-70">Daily deposit trends will display here as containers are recycled</span>
              </div>
            )}
          </div>
        </div>

        {/* Material Share Donut & Machine Network Status */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Material Weight Share
              </h3>
              <span className="text-[11px] font-bold t-text-muted mono">Total: {currentScope.mass} {currentScope.massUnit}</span>
            </div>
            <p className="text-xs t-text-muted mb-4">Percentage share of total collected waste</p>

            <div className="relative h-44 flex items-center justify-center">
              {materialShareData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={materialShareData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {materialShareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                      formatter={(val) => [`${val}%`, 'Share']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-xs t-text-muted gap-1.5 border border-dashed t-border rounded-xl">
                  <PieIcon className="w-8 h-8 opacity-30 text-teal-500" />
                  <span className="font-semibold t-text-secondary">No materials collected</span>
                  <span className="text-[10px] opacity-70">Weight breakdown will compute automatically</span>
                </div>
              )}
            </div>
          </div>

          {/* Machine Status Summary */}
          <div className="mt-4 pt-4 border-t t-border">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-bold t-text-primary">Machine Network Status ({liveNetworkStatus.total} Machines)</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                {liveNetworkStatus.pct}% Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="t-bg-sec p-2 rounded-xl border t-border">
                <span className="t-text-muted block text-[10px] font-semibold uppercase">Operational &amp; Ready</span>
                <span className="font-bold t-text-primary text-sm mono">{liveNetworkStatus.online} Machines</span>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-semibold uppercase">Needs Emptying / Tech</span>
                <span className="font-bold text-amber-800 dark:text-amber-300 text-sm mono">{machineSummary?.activeAlerts ?? 0} Machines</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Live Transactions & Maintenance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Recycling Drops (Recent Transactions Feed) */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b t-border">
              <div>
                <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Recent Recycling Drops
                </h3>
                <p className="text-xs t-text-muted">Live feed of items deposited across all machines</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                Live Feed Active
              </span>
            </div>

            {overview?.recentSessions && overview.recentSessions.length > 0 ? (
              <div className="space-y-3">
                {overview.recentSessions.map((s, idx) => (
                  <div key={s.session_id || s._id || idx} className="p-3 rounded-xl t-bg-sec border t-border hover:t-bg-hover transition-colors flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold t-text-primary">{s.userName || s.user_id || 'Citizen Recycler'}</span>
                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">{s.machineId || s.machine_id || 'RVM'}</span>
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20">{s.hardwareBadge || s.machineType || 'Smart RVM'}</span>
                        </div>
                        <span className="t-text-muted text-[11px]">
                          {s.created_at ? new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'} • {s.verifiedWeightText || `${s.bottles || s.plasticCount || 1} items`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30 mono">
                        +{s.points || s.pointsEarned || 0} Pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs t-text-muted flex flex-col items-center justify-center gap-2 border border-dashed t-border rounded-xl">
                <Activity className="w-8 h-8 opacity-30 text-emerald-500" />
                <span className="font-semibold t-text-secondary">No recent recycling sessions</span>
                <span className="text-[11px] opacity-70">Container deposits across the kiosk fleet will appear here live</span>
              </div>
            )}
          </div>
        </div>

        {/* Machine Maintenance & Emptying Alerts */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b t-border">
              <div>
                <h3 className="text-sm font-bold t-text-primary flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Machine Maintenance &amp; Emptying
                </h3>
                <p className="text-xs t-text-muted">Live alerts requiring staff to empty bins or check units</p>
              </div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                {alerts.filter(a => !a.completed).length} Active Alerts
              </span>
            </div>

            {alerts.filter(a => !a.completed).length > 0 ? (
              <div className="space-y-2.5">
                {alerts.map((item) => {
                  const IconComp = item.icon || AlertTriangle;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                        item.completed 
                          ? 'border-emerald-500/30 bg-emerald-500/5' 
                          : item.level === 'danger' 
                            ? 'border-rose-500/30 bg-rose-500/5' 
                            : item.level === 'warning' 
                              ? 'border-amber-500/30 bg-amber-500/5' 
                              : 't-border t-bg-sec'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          item.completed ? 'bg-emerald-500/20 text-emerald-400' :
                          item.level === 'danger' ? 'bg-rose-500/20 text-rose-500' :
                          item.level === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold t-text-primary mono">{item.machine}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                              item.completed ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' :
                              item.level === 'danger' ? 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30' :
                              item.level === 'warning' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30' :
                              't-bg-sec t-text-secondary t-border'
                            }`}>
                              {item.completed ? 'Cleared & Ready' : item.type}
                            </span>
                          </div>
                          <span className="t-text-muted text-[11px]">{item.desc}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAlertAction(item.id, item.machine)}
                        disabled={item.completed}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all shadow-xs ${
                          item.completed ? 'bg-emerald-600 text-white cursor-default' : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                        }`}
                      >
                        {item.completed ? 'Completed' : item.actionLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs t-text-muted flex flex-col items-center justify-center gap-2 border border-dashed t-border rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 opacity-60" />
                <span className="font-semibold t-text-primary">All Machines Healthy &amp; Ready</span>
                <span className="text-[11px]">No active bin overflow or hardware service alerts</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Export Sustainability Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 border t-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b t-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold t-text-primary text-base">Export Sustainability Report</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 t-text-muted hover:t-text-primary rounded-lg t-bg-sec border t-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs t-text-secondary leading-relaxed">
              Download a complete, presentation-ready sustainability summary showing total waste collected, CO₂ saved, and recycling participation across all machines.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold t-text-primary">Select Export Format</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-300 dark:border-slate-700 t-bg-sec text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Executive PDF</span>
                </label>

                <label
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                    exportFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'border-slate-300 dark:border-slate-700 t-bg-sec text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="exportFormat"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Excel / CSV</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t t-border text-xs font-semibold">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 t-text-secondary hover:t-bg-sec rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteExport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-sm font-bold"
              >
                Download Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Footer Strip */}
      <footer className="glass-panel p-4 rounded-2xl border t-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs t-text-secondary">
        <div className="flex items-center gap-2">
          <span>© 2026 ISP Environmental Solutions Pvt. Ltd.</span>
          <span>•</span>
          <span>All Recycling Machines Live Overview</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{liveNetworkStatus.total} Connected {liveNetworkStatus.total === 1 ? 'Machine' : 'Machines'}</span>
          <span>•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live &amp; Synced
          </span>
        </div>
      </footer>

    </div>
  );
}
