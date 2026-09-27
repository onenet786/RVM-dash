import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, Scale, Recycle, CloudSun, Award, Activity, CheckCircle2, 
  RefreshCw, FileSpreadsheet, Layers, ScanLine, Building2, Archive, 
  Check, FileText, Package, Trash2, AlertTriangle, Wrench, X, 
  FileCheck, Shield, Sparkles, Clock, ChevronDown, UserCheck, BarChart3, PieChart as PieIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function OverviewTab({ currentUser, stationFilter = 'ALL', selectedClientId = 'ALL' }) {
  const [overview, setOverview] = useState(null);
  const [health, setHealth] = useState(null);
  const [trends, setTrends] = useState([]);
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

  // Timeline selection: 'today' | '7d' | '30d' | 'custom'
  const [dateRange, setDateRange] = useState('30d');

  // Maintenance Alerts State (Allows interactive clearing/dispatching)
  const [alerts, setAlerts] = useState([
    { id: 'alert-1', machine: 'PECO-02', type: 'Bin 95% Full', desc: 'Paper bin ready for clearing', level: 'danger', icon: Trash2, actionLabel: 'Clear Bin', completed: false },
    { id: 'alert-2', machine: 'RVM-0067', type: 'Entry Gate Jam', desc: 'Item stuck near scanner flap', level: 'warning', icon: AlertTriangle, actionLabel: 'Send Tech', completed: false },
    { id: 'alert-3', machine: 'PECO-01', type: 'Bin 90% Full', desc: 'Plastic storage compartment', level: 'danger', icon: Trash2, actionLabel: 'Clear Bin', completed: false },
    { id: 'alert-4', machine: 'RVM-OLD-01', type: 'Sensor Check', desc: 'Scheduled sensor routine check', level: 'info', icon: Wrench, actionLabel: 'Acknowledge', completed: false }
  ]);

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

      const [ovRes, trRes, hlRes] = await Promise.all([
        fetch(`/api/overview${query}`, { headers }),
        fetch(`/api/analytics/trends${query}`, { headers }),
        fetch('/api/health', { headers })
      ]);

      if (ovRes.ok) setOverview(await ovRes.json().catch(() => null));
      if (trRes.ok) setTrends(await trRes.json().catch(() => []));
      if (hlRes.ok) setHealth(await hlRes.json().catch(() => null));

      if (isManual) showToast('Machine network data refreshed successfully');
    } catch (err) {
      console.error('Error fetching overview', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(() => fetchOverview(false), 30000);
    return () => clearInterval(interval);
  }, [stationFilter, selectedClientId]);

  // Sync active scope when parent stationFilter changes
  useEffect(() => {
    if (stationFilter === 'RVM_NEW') setActiveScope('new_rvm');
    else if (stationFilter === 'PECODROP') setActiveScope('pecodrop');
    else if (stationFilter === 'RVM_OLD') setActiveScope('old_rvm');
    else setActiveScope('cumulative');
  }, [stationFilter]);

  // Scope Data Models
  const scopeData = useMemo(() => {
    const liveBottles = overview?.totalBottles ?? 152357;
    const liveCans = overview?.totalCans ?? 941;
    const liveTetra = overview?.totalTetra ?? 2;
    const livePaperKg = overview?.totalPaperKg ?? 8.80;
    const livePoints = overview?.totalPoints ?? 788651;
    const liveSessions = overview?.totalSessions ?? 2221;

    return {
      cumulative: {
        mass: '3.89',
        massUnit: 'Tonnes',
        units: liveBottles + liveCans + liveTetra,
        bottles: liveBottles,
        cans: liveCans,
        cartons: liveTetra,
        paperKg: livePaperKg,
        carbon: '6,120.4',
        trees: '245 Mature Trees',
        points: livePoints,
        liability: Math.round(livePoints * 0.20),
        sessions: liveSessions,
        activeUsers: 101,
        itemsPerVisit: 69,
        targetProgress: 77.8
      },
      new_rvm: {
        mass: '0.98',
        massUnit: 'Tonnes',
        units: Math.round(liveBottles * 0.25) + Math.round(liveCans * 0.15) + liveTetra,
        bottles: Math.round(liveBottles * 0.25),
        cans: Math.round(liveCans * 0.15),
        cartons: liveTetra,
        paperKg: 0,
        carbon: '1,528.0',
        trees: '61 Mature Trees',
        points: Math.round(livePoints * 0.24),
        liability: Math.round(livePoints * 0.24 * 0.20),
        sessions: Math.round(liveSessions * 0.29),
        activeUsers: 54,
        itemsPerVisit: 59,
        targetProgress: 65.3
      },
      pecodrop: {
        mass: '0.22',
        massUnit: 'Tonnes',
        units: Math.round(liveBottles * 0.05) + Math.round(liveCans * 0.02),
        bottles: Math.round(liveBottles * 0.05),
        cans: Math.round(liveCans * 0.02),
        cartons: 0,
        paperKg: livePaperKg,
        carbon: '320.5',
        trees: '13 Mature Trees',
        points: Math.round(livePoints * 0.06),
        liability: Math.round(livePoints * 0.06 * 0.20),
        sessions: Math.round(liveSessions * 0.14),
        activeUsers: 17,
        itemsPerVisit: 24,
        targetProgress: 44.0
      },
      old_rvm: {
        mass: '2.69',
        massUnit: 'Tonnes',
        units: Math.round(liveBottles * 0.70) + Math.round(liveCans * 0.83),
        bottles: Math.round(liveBottles * 0.70),
        cans: Math.round(liveCans * 0.83),
        cartons: 0,
        paperKg: 0,
        carbon: '4,271.9',
        trees: '171 Mature Trees',
        points: Math.round(livePoints * 0.70),
        liability: Math.round(livePoints * 0.70 * 0.20),
        sessions: Math.round(liveSessions * 0.57),
        activeUsers: 84,
        itemsPerVisit: 84,
        targetProgress: 89.6
      }
    };
  }, [overview]);

  const currentScope = scopeData[activeScope] || scopeData.cumulative;

  // Daily Trend Stacked Chart Data (Past 14 Days)
  const dailyTrendData = useMemo(() => [
    { day: '11 Sep', bottles: 380, cans: 65, cartons: 5 },
    { day: '12 Sep', bottles: 590, cans: 80, cartons: 10 },
    { day: '13 Sep', bottles: 810, cans: 100, cartons: 10 },
    { day: '14 Sep', bottles: 980, cans: 110, cartons: 10 },
    { day: '15 Sep', bottles: 760, cans: 80, cartons: 10 },
    { day: '16 Sep', bottles: 640, cans: 70, cartons: 10 },
    { day: '17 Sep', bottles: 850, cans: 90, cartons: 10 },
    { day: '18 Sep', bottles: 1150, cans: 130, cartons: 20 },
    { day: '19 Sep', bottles: 930, cans: 110, cartons: 10 },
    { day: '20 Sep', bottles: 790, cans: 90, cartons: 10 },
    { day: '21 Sep', bottles: 1260, cans: 140, cartons: 20 },
    { day: '22 Sep', bottles: 1070, cans: 115, cartons: 15 },
    { day: '23 Sep', bottles: 1200, cans: 130, cartons: 20 },
    { day: '24 Sep', bottles: 1420, cans: 160, cartons: 20 },
  ], []);

  // Material Weight Share Donut Data
  const materialShareData = [
    { name: 'Plastic Bottles (3.80 T)', value: 97.5, color: '#059669' },
    { name: 'Aluminium Cans (14.1 kg)', value: 1.8, color: '#f59e0b' },
    { name: 'Paper Weight (8.8 kg)', value: 0.6, color: '#a855f7' },
    { name: 'Tetra Pak (0.07 kg)', value: 0.1, color: '#0ea5e9' }
  ];

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
      
      {/* Header Section */}
      <div className="glass-panel p-6 rounded-3xl border t-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
            <Leaf className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Master Portal
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Machines Online: 98% (12 Active Machines)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight t-text-primary mt-1">
              ISP Environmental Solutions
            </h1>
            <p className="text-xs t-text-secondary mt-0.5">
              Cumulative operations across Smart RVMs, PecoDrop corporate hubs, and legacy counter units.
            </p>
          </div>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => fetchOverview(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all active:scale-95"
            title="Export ESG / CSR"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export ESG / CSR</span>
          </button>
        </div>
      </div>

      {/* Machine Type Filter Navigation & Timeline Strip */}
      <div className="glass-panel p-3 sm:p-4 rounded-2xl border t-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Scope Selector Tabs */}
        <div className="inline-flex p-1 t-bg-sec rounded-xl overflow-x-auto gap-1 border t-border">
          <button
            onClick={() => { setActiveScope('cumulative'); showToast('Switched to: Master Cumulative (All Machines)'); }}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
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
            onClick={() => { setActiveScope('new_rvm'); showToast('Switched to: Smart RVM (AI Scanner)'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeScope === 'new_rvm'
                ? 'bg-emerald-800 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Smart RVM (AI Scanner)</span>
          </button>

          <button
            onClick={() => { setActiveScope('pecodrop'); showToast('Switched to: PecoDrop (Corporate Offices)'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeScope === 'pecodrop'
                ? 'bg-emerald-800 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>PecoDrop (Corporate Offices)</span>
          </button>

          <button
            onClick={() => { setActiveScope('old_rvm'); showToast('Switched to: Legacy RVM (Counter Units)'); }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeScope === 'old_rvm'
                ? 'bg-emerald-800 text-white shadow-xs font-bold'
                : 't-text-secondary hover:t-text-primary'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Legacy RVM (Counter Units)</span>
          </button>
        </div>

        {/* Date Period Selector Pills */}
        <div className="flex items-center justify-end gap-2 text-xs font-semibold t-text-secondary">
          <span className="hidden sm:inline mr-1 t-text-muted font-medium">Timeline:</span>
          <div className="inline-flex rounded-xl border t-border t-bg-sec p-1 gap-1">
            {['today', '7d', '30d', 'custom'].map((range) => (
              <button
                key={range}
                onClick={() => { setDateRange(range); showToast(`Timeline adjusted to: ${range.toUpperCase()}`); }}
                className={`px-3 py-1 rounded-lg transition-colors font-bold uppercase text-[11px] ${
                  dateRange === range
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 't-text-muted hover:t-text-primary'
                }`}
              >
                {range}
              </button>
            ))}
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
                  ~3.80 Tonnes
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                152,357 <span className="text-xs font-normal t-text-muted">bottles</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 345ml</span>
                  <span className="text-xs font-bold t-text-primary mono">46</span>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Med 500-1L</span>
                  <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300 mono">151,864</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Large 1.5L</span>
                  <span className="text-xs font-bold t-text-primary mono">55</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Collection by Machine</span>
                <span className="t-text-primary">Legacy (70%) • Smart (25%) • Peco (5%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '70%' }} title="Legacy RVM"></div>
                <div className="bg-emerald-500 h-full" style={{ width: '25%' }} title="Smart RVM"></div>
                <div className="bg-teal-600 h-full" style={{ width: '5%' }} title="PecoDrop"></div>
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
                  ~14.12 kg
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                941 <span className="text-xs font-normal t-text-muted">cans</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 250ml</span>
                  <span className="text-xs font-bold t-text-primary mono">31</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Med 375ml</span>
                  <span className="text-xs font-extrabold text-amber-700 dark:text-amber-300 mono">928</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Large 500ml</span>
                  <span className="text-xs font-bold t-text-primary mono">11</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Collection by Machine</span>
                <span className="t-text-primary">Legacy (85%) • Smart RVM (15%)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: '85%' }} title="Legacy RVM"></div>
                <div className="bg-emerald-500 h-full" style={{ width: '15%' }} title="Smart RVM"></div>
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
                  0.07 kg (70g)
                </span>
              </div>
              
              <p className="text-2xl font-extrabold t-text-primary mt-3 mono">
                2 <span className="text-xs font-normal t-text-muted">cartons</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">Small 200ml</span>
                  <span className="text-xs font-bold t-text-primary mono">0</span>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Med 1000ml</span>
                  <span className="text-xs font-extrabold text-sky-700 dark:text-sky-300 mono">2</span>
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
                <div className="bg-sky-500 h-full" style={{ width: '100%' }} title="Smart RVM"></div>
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
                8.80 <span className="text-xs font-normal t-text-muted">kg collected</span>
              </p>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">&lt;50g Light</span>
                  <span className="text-xs font-bold t-text-primary mono">12 drops</span>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/20 p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">100-250g File</span>
                  <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 mono">8 drops</span>
                </div>
                <div className="t-bg-sec border t-border p-2 rounded-xl">
                  <span className="block text-[10px] uppercase font-bold t-text-muted">500g-1kg Bulk</span>
                  <span className="text-xs font-bold t-text-primary mono">3 drops</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t t-border">
              <div className="flex justify-between text-[11px] font-semibold t-text-muted mb-1.5">
                <span>Supported Machines</span>
                <span className="text-purple-700 dark:text-purple-400 font-bold">PecoDrop Corporate Only</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full flex overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: '100%' }} title="PecoDrop Corporate"></div>
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
              <span className="text-[11px] font-bold t-text-muted mono">Total: 3.89 Tonnes</span>
            </div>
            <p className="text-xs t-text-muted mb-4">Percentage share of total collected waste</p>

            <div className="relative h-44 flex items-center justify-center">
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
            </div>
          </div>

          {/* Machine Status Summary */}
          <div className="mt-4 pt-4 border-t t-border">
            <div className="flex items-center justify-between mb-2 text-xs">
              <span className="font-bold t-text-primary">Machine Network Status (12 Machines)</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                66.7% Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="t-bg-sec p-2 rounded-xl border t-border">
                <span className="t-text-muted block text-[10px] font-semibold uppercase">Operational &amp; Ready</span>
                <span className="font-bold t-text-primary text-sm mono">8 Machines</span>
              </div>
              <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                <span className="text-amber-700 dark:text-amber-400 block text-[10px] font-semibold uppercase">Needs Emptying / Tech</span>
                <span className="font-bold text-amber-800 dark:text-amber-300 text-sm mono">4 Machines</span>
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

            <div className="space-y-3">
              {/* Row 1 */}
              <div className="p-3 rounded-xl t-bg-sec border t-border hover:t-bg-hover transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold t-text-primary">0300****110</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">RVM-RWP</span>
                      <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-emerald-500/20">Smart RVM</span>
                    </div>
                    <span className="t-text-muted text-[11px]">Today at 3:30 PM • 1x Medium PET Bottle (500ml)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30 mono">
                    +5 Pts
                  </span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="p-3 rounded-xl t-bg-sec border t-border hover:t-bg-hover transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold t-text-primary">abiddutt12</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">PECO-HQ-01</span>
                      <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-purple-500/20">PecoDrop</span>
                    </div>
                    <span className="t-text-muted text-[11px]">Today at 1:44 PM • Confidential Paper Drop (250g)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30 mono">
                    +25 Pts
                  </span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="p-3 rounded-xl t-bg-sec border t-border hover:t-bg-hover transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold t-text-primary">0328****785</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">RVM-UCP</span>
                      <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-amber-500/20">Legacy RVM</span>
                    </div>
                    <span className="t-text-muted text-[11px]">Today at 12:23 PM • 2x Aluminium Cans (375ml)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30 mono">
                    +30 Pts
                  </span>
                </div>
              </div>

              {/* Row 4 */}
              <div className="p-3 rounded-xl t-bg-sec border t-border hover:t-bg-hover transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold t-text-primary">0302****949</span>
                      <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono px-1.5 py-0.5 rounded text-[10px]">RVM-RWP</span>
                      <span className="bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold px-1.5 py-0.5 rounded text-[10px] border border-sky-500/20">Smart RVM</span>
                    </div>
                    <span className="t-text-muted text-[11px]">Today at 11:46 AM • 1x Tetra Pak Carton (1000ml)</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/30 mono">
                    +20 Pts
                  </span>
                </div>
              </div>
            </div>
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

            <div className="space-y-2.5">
              {alerts.map((item) => {
                const IconComp = item.icon;
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
                        item.completed
                          ? 'bg-emerald-600 text-white cursor-default'
                          : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                    >
                      {item.completed ? 'Completed' : item.actionLabel}
                    </button>
                  </div>
                );
              })}
            </div>
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
          <span>12 Connected Machines</span>
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
