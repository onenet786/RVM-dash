import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Leaf, Activity, Layers, Coins, Download, Printer, 
  ShieldCheck, SlidersHorizontal, ChevronDown, CheckCircle2, X,
  FileCheck, Zap, Trees, Archive, Cpu, Scale, AlertTriangle, 
  Sliders, Check, Copy, TrendingUp, Sparkles, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function ReportingHubTab() {
  const [activeReport, setActiveReport] = useState('sustainability');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv'
  const [toastMessage, setToastMessage] = useState(null);

  // Filters State
  const [timelineScope, setTimelineScope] = useState('30d');
  const [clientScope, setClientScope] = useState('all');
  const [locationScope, setLocationScope] = useState('all');
  const [machineScope, setMachineScope] = useState('all');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'timeline') setTimelineScope(value);
    if (filterType === 'client') setClientScope(value);
    if (filterType === 'location') setLocationScope(value);
    if (filterType === 'machine') setMachineScope(value);
    showToast(`Updated report criteria: [${value.toUpperCase()}]`);
  };

  const resetFilters = () => {
    setTimelineScope('30d');
    setClientScope('all');
    setLocationScope('all');
    setMachineScope('all');
    showToast('Filters reset to default 30-day scope');
  };

  // Dynamic Multipliers based on timeline
  const scopeMultiplier = useMemo(() => {
    switch (timelineScope) {
      case 'today': return 0.04;
      case '7d': return 0.25;
      case '30d': return 1.0;
      case 'q3': return 2.8;
      case 'ytd': return 7.5;
      default: return 1.0;
    }
  }, [timelineScope]);

  // Scaled Data for Report Views
  const esgMetrics = useMemo(() => {
    const mult = scopeMultiplier;
    const petUnits = Math.round(8420 * mult);
    const aluUnits = Math.round(3615 * mult);
    const tetraUnits = Math.round(1240 * mult);
    const paperKg = Math.round(148.5 * mult * 10) / 10;
    const co2Kg = Math.round((petUnits * 0.0375 + aluUnits * 0.1365 + tetraUnits * 0.0775 + paperKg * 2.90) * 10) / 10;
    const matureTrees = Math.round((co2Kg / 21.77) * 10) / 10;
    const kwh = Math.round(co2Kg * 1.89);
    const landfillM3 = Math.round((petUnits * 0.00035 + aluUnits * 0.00015 + tetraUnits * 0.00025 + paperKg * 0.0018) * 100) / 100;

    return {
      co2Kg,
      matureTrees,
      kwh,
      landfillM3,
      petUnits,
      aluUnits,
      tetraUnits,
      paperKg
    };
  }, [scopeMultiplier]);

  // Daily Trend Chart Data (Last 14 Days)
  const esgTrendData = useMemo(() => [
    { day: '11 Sep', co2: 95 },
    { day: '12 Sep', co2: 110 },
    { day: '13 Sep', co2: 85 },
    { day: '14 Sep', co2: 145 },
    { day: '15 Sep', co2: 130 },
    { day: '16 Sep', co2: 160 },
    { day: '17 Sep', co2: 140 },
    { day: '18 Sep', co2: 175 },
    { day: '19 Sep', co2: 150 },
    { day: '20 Sep', co2: 135 },
    { day: '21 Sep', co2: 165 },
    { day: '22 Sep', co2: 190 },
    { day: '23 Sep', co2: 170 },
    { day: '24 Sep', co2: 210 },
  ], []);

  // Material Donut Chart Data
  const streamShareData = useMemo(() => [
    { name: 'Plastic Bottles (PET)', value: esgMetrics.petUnits, color: '#059669' },
    { name: 'Aluminium Cans', value: esgMetrics.aluUnits, color: '#f59e0b' },
    { name: 'Tetra Pak Cartons', value: esgMetrics.tetraUnits, color: '#0ea5e9' },
    { name: 'Weighed Paper (kg)', value: Math.round(esgMetrics.paperKg), color: '#a855f7' },
  ], [esgMetrics]);

  // Report 2: Fleet Reliability by Location
  const fleetLocations = [
    { location: 'Central Metro Station (Lahore)', rvmUptime: '99.4%', pecoUptime: '98.8%', turnaround: '34 mins', weeklyIntake: '~3,200 units / wk', status: 'Active', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    { location: 'North Commercial Plaza (Rawalpindi)', rvmUptime: '97.2%', pecoUptime: '99.1%', turnaround: '42 mins', weeklyIntake: '~2,850 units / wk', status: 'Active', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    { location: 'Green Campus University Center', rvmUptime: '99.8%', pecoUptime: '99.5%', turnaround: '22 mins', weeklyIntake: '~4,100 units / wk', status: 'Optimal', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' },
    { location: 'West Eco Business District', rvmUptime: '96.5%', pecoUptime: '95.8%', turnaround: '58 mins', weeklyIntake: '~1,920 units / wk', status: 'Staff Dispatched', badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  ];

  // Report 2: Tare Calibration Logs & Anomalies (preserved from previous version)
  const calibrationLogs = [
    { id: 'CAL-901', unit: 'PecoDrop-01', timestamp: '2026-09-24 14:10', tareOffset: '0.00 g', zeroDrift: '+0.02 g', status: 'Optimal', technician: 'Tech-44' },
    { id: 'CAL-902', unit: 'PecoDrop-02', timestamp: '2026-09-23 09:25', tareOffset: '0.00 g', zeroDrift: '-0.05 g', status: 'Optimal', technician: 'Auto-Tare Routine' },
    { id: 'CAL-903', unit: 'PecoDrop-03', timestamp: '2026-09-22 18:40', tareOffset: '+0.15 g', zeroDrift: '+0.32 g', status: 'Compensated', technician: 'Auto-Tare Routine' },
    { id: 'CAL-904', unit: 'PecoDrop-05', timestamp: '2026-09-21 11:15', tareOffset: '+0.45 g', zeroDrift: '+1.20 g', status: 'Drift Warning', technician: 'Field Service Req' },
  ];

  const scaleAnomalies = [
    { id: 'ANOM-12', unit: 'PecoDrop-05', event: 'Tare Drift Exceeded > 1.0g', timestamp: '2026-09-24 10:15', action: 'Auto-flagged for recalibration' },
    { id: 'ANOM-11', unit: 'PecoDrop-03', event: 'Paper Bin Weight Limit Exceeded (> 15.0 kg)', timestamp: '2026-09-23 08:30', action: 'Chute auto-locked until bin cleared by team' },
    { id: 'ANOM-10', unit: 'PecoDrop-01', event: 'Sudden Negative Mass Spike (-120g)', timestamp: '2026-09-22 16:45', action: 'Auto-zero recovery executed' },
  ];

  // Report 4: Financial Ledger Items
  const financialRows = useMemo(() => {
    const petPts = Math.round(esgMetrics.petUnits * 10);
    const aluPts = Math.round(esgMetrics.aluUnits * 10);
    const tetraPts = Math.round(esgMetrics.tetraUnits * 10);
    const paperPts = Math.round(esgMetrics.paperKg * 100);
    const totalPts = petPts + aluPts + tetraPts + paperPts;

    return [
      {
        material: '🥤 Plastic Bottles (PET)',
        volume: `${esgMetrics.petUnits.toLocaleString()} units`,
        rule: '10 – 15 pts / unit',
        points: petPts,
        cashPkr: Math.round(petPts * 0.20)
      },
      {
        material: '🥫 Aluminium Cans',
        volume: `${esgMetrics.aluUnits.toLocaleString()} units`,
        rule: '15 – 20 pts / unit',
        points: aluPts,
        cashPkr: Math.round(aluPts * 0.20)
      },
      {
        material: '🧃 Tetra Pak Cartons',
        volume: `${esgMetrics.tetraUnits.toLocaleString()} units`,
        rule: '10 pts / unit',
        points: tetraPts,
        cashPkr: Math.round(tetraPts * 0.20)
      },
      {
        material: '📄 Paper (PecoDrop Scales)',
        volume: `${esgMetrics.paperKg.toLocaleString()} kg`,
        rule: '100 pts / kg',
        points: paperPts,
        cashPkr: Math.round(paperPts * 0.20)
      }
    ];
  }, [esgMetrics]);

  const totalFinancialLiability = useMemo(() => {
    const totalPoints = financialRows.reduce((sum, r) => sum + r.points, 0);
    const totalCash = financialRows.reduce((sum, r) => sum + r.cashPkr, 0);
    return { totalPoints, totalCash };
  }, [financialRows]);

  // Export File Function
  const handleExecuteExport = () => {
    setIsExportModalOpen(false);
    if (exportFormat === 'pdf') {
      window.print();
      showToast('Opening print dialog for Executive PDF Audit Report');
    } else {
      // Generate and download CSV
      const headers = ['Category / Material', 'Volume', 'Point Conversion Rule', 'Points Issued', 'Cash Liability (PKR)'];
      const rows = financialRows.map(r => [
        `"${r.material.replace(/"/g, '""')}"`,
        `"${r.volume}"`,
        `"${r.rule}"`,
        r.points,
        r.cashPkr
      ]);
      rows.push([
        '"TOTAL FLEET POINT LIABILITY"',
        '""',
        '""',
        totalFinancialLiability.totalPoints,
        totalFinancialLiability.totalCash
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `ISP_Compliance_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Analytics Audit Report (CSV) downloaded successfully');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Section */}
      <div className="glass-panel p-6 rounded-3xl border t-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white shrink-0">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Analytics &amp; Compliance Hub
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Machine Network Audits
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight t-text-primary mt-1">
              ISP Environmental Solutions
            </h1>
            <p className="text-xs t-text-secondary mt-0.5">
              Comprehensive compliance audits, machine reliability uptime, intake material volumes, and financial voucher reconciliation.
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 t-bg-sec hover:t-bg-hover t-text-primary border t-border rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs"
            title="Print Audit"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Audit</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/25 transition-all active:scale-95"
            title="Export Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>

      {/* Customizable Multi-Variable Filter Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border t-border space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b t-border gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold t-text-primary">Customizable Report Query Filters</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs t-text-muted">Live Aggregated Scope</span>
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Timeline Scope */}
          <div>
            <label className="block text-xs font-semibold t-text-secondary mb-1">Timeline Scope</label>
            <div className="relative">
              <select
                value={timelineScope}
                onChange={(e) => handleFilterChange('timeline', e.target.value)}
                className="w-full appearance-none t-bg-sec border t-border t-text-primary text-xs font-medium rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="today">Today (Live Stream)</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days (Standard Audit)</option>
                <option value="q3">Q3 2026 (Quarter to Date)</option>
                <option value="ytd">Year to Date (2026)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Client Organization Scope */}
          <div>
            <label className="block text-xs font-semibold t-text-secondary mb-1">Client Organization</label>
            <div className="relative">
              <select
                value={clientScope}
                onChange={(e) => handleFilterChange('client', e.target.value)}
                className="w-full appearance-none t-bg-sec border t-border t-text-primary text-xs font-medium rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="all">All Clients &amp; Public Spots</option>
                <option value="pepsico">PepsiCo Corporate Campuses</option>
                <option value="metro">Mass Transit Metro Hubs</option>
                <option value="ucp">University Campus Network</option>
                <option value="unilever">Unilever Pakistan HQ</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Site Location Scope */}
          <div>
            <label className="block text-xs font-semibold t-text-secondary mb-1">Machine Location / City</label>
            <div className="relative">
              <select
                value={locationScope}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full appearance-none t-bg-sec border t-border t-text-primary text-xs font-medium rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="all">Nationwide Machine Network</option>
                <option value="lhr-hub">Lahore - Central Metro Station</option>
                <option value="rwp-plaza">Rawalpindi - North Plaza</option>
                <option value="isb-campus">Islamabad - Green Campus</option>
                <option value="khi-west">Karachi - West Business District</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Machine Category */}
          <div>
            <label className="block text-xs font-semibold t-text-secondary mb-1">Machine Category</label>
            <div className="relative">
              <select
                value={machineScope}
                onChange={(e) => handleFilterChange('machine', e.target.value)}
                className="w-full appearance-none t-bg-sec border t-border t-text-primary text-xs font-medium rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              >
                <option value="all">All Machines (Cumulative)</option>
                <option value="smart-rvm">Smart RVM (Public AI Optical Kiosks)</option>
                <option value="pecodrop">PecoDrop (Corporate Scale Units)</option>
                <option value="old-rvm">Legacy RVM (Counter Kiosks)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 t-text-muted absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Report Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Tab 1: Sustainability & ESG */}
        <button
          onClick={() => { setActiveReport('sustainability'); showToast('Switched report to: 1. Sustainability & ESG'); }}
          className={`p-4 rounded-2xl border-2 transition-all text-left group ${
            activeReport === 'sustainability'
              ? 'glass-panel border-emerald-600 shadow-md ring-1 ring-emerald-500/30'
              : 't-bg-sec border t-border hover:border-slate-400/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Leaf className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              ISO 14064
            </span>
          </div>
          <div className="font-bold text-sm t-text-primary group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
            1. Sustainability &amp; ESG
          </div>
          <div className="text-xs t-text-muted truncate mt-0.5">
            Carbon offsets, trees &amp; landfill savings
          </div>
        </button>

        {/* Tab 2: Machine Uptime & Speed */}
        <button
          onClick={() => { setActiveReport('uptime'); showToast('Switched report to: 2. Machine Uptime & Speed'); }}
          className={`p-4 rounded-2xl border-2 transition-all text-left group ${
            activeReport === 'uptime'
              ? 'glass-panel border-blue-600 shadow-md ring-1 ring-blue-500/30'
              : 't-bg-sec border t-border hover:border-slate-400/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20">
              Hardware Fleet
            </span>
          </div>
          <div className="font-bold text-sm t-text-primary group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
            2. Machine Uptime &amp; Speed
          </div>
          <div className="text-xs t-text-muted truncate mt-0.5">
            Uptime %, bin emptying &amp; alerts
          </div>
        </button>

        {/* Tab 3: Material Volumes & Sizes */}
        <button
          onClick={() => { setActiveReport('intake'); showToast('Switched report to: 3. Material Volumes & Sizes'); }}
          className={`p-4 rounded-2xl border-2 transition-all text-left group ${
            activeReport === 'intake'
              ? 'glass-panel border-amber-600 shadow-md ring-1 ring-amber-500/30'
              : 't-bg-sec border t-border hover:border-slate-400/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20">
              Intake Mass
            </span>
          </div>
          <div className="font-bold text-sm t-text-primary group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            3. Material Volumes &amp; Sizes
          </div>
          <div className="text-xs t-text-muted truncate mt-0.5">
            Variant breakdown &amp; peak intake hours
          </div>
        </button>

        {/* Tab 4: Financial & Rewards Audit */}
        <button
          onClick={() => { setActiveReport('financial'); showToast('Switched report to: 4. Financial & Rewards Audit'); }}
          className={`p-4 rounded-2xl border-2 transition-all text-left group ${
            activeReport === 'financial'
              ? 'glass-panel border-purple-600 shadow-md ring-1 ring-purple-500/30'
              : 't-bg-sec border t-border hover:border-slate-400/40'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20">
              Audit Ledger
            </span>
          </div>
          <div className="font-bold text-sm t-text-primary group-hover:text-purple-700 dark:group-hover:text-purple-400 transition-colors">
            4. Financial &amp; Rewards Audit
          </div>
          <div className="text-xs t-text-muted truncate mt-0.5">
            Voucher liabilities &amp; unit reward cost
          </div>
        </button>

      </div>

      {/* REPORT VIEW 1: SUSTAINABILITY & ESG */}
      {activeReport === 'sustainability' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Verified Green Impact Hero Strip */}
          <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 rounded-3xl p-6 text-white shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border border-emerald-700/50">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/40 text-emerald-200 border border-emerald-400/20 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audited Environmental Offset</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mono">
                {esgMetrics.co2Kg.toLocaleString()} kg CO₂e Diverted
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl">
                Calculated across verified machine intake using standardized life-cycle emissions saved by recycling PET, Aluminium, and Paper instead of virgin manufacturing.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-emerald-700/60 pt-4 lg:pt-0 lg:pl-6 text-center">
              <div>
                <div className="text-2xl sm:text-3xl font-black text-amber-300 mono">~{esgMetrics.matureTrees}</div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-medium">Mature Trees Saved</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-300 mono">{esgMetrics.kwh.toLocaleString()}</div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-medium">kWh Energy Conserved</div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-black text-white mono">{esgMetrics.landfillM3} m³</div>
                <div className="text-[11px] uppercase tracking-wider text-emerald-200 font-medium">Landfill Diverted</div>
              </div>
            </div>
          </div>

          {/* 4 ESG Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="flex items-center justify-between text-xs font-bold uppercase t-text-muted mb-2">
                <span>Plastic Bottles (PET)</span>
                <span className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm">🥤</span>
              </div>
              <div className="text-2xl font-black t-text-primary mono">
                {esgMetrics.petUnits.toLocaleString()} <span className="text-xs font-semibold t-text-muted">units</span>
              </div>
              <div className="text-xs t-text-muted mt-2">
                Est. {(esgMetrics.petUnits * 0.03).toFixed(1)} kg plastic diverted
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="flex items-center justify-between text-xs font-bold uppercase t-text-muted mb-2">
                <span>Aluminium Cans</span>
                <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center text-sm">🥫</span>
              </div>
              <div className="text-2xl font-black t-text-primary mono">
                {esgMetrics.aluUnits.toLocaleString()} <span className="text-xs font-semibold t-text-muted">units</span>
              </div>
              <div className="text-xs t-text-muted mt-2">
                Est. {(esgMetrics.aluUnits * 0.015).toFixed(1)} kg high-grade alloy
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="flex items-center justify-between text-xs font-bold uppercase t-text-muted mb-2">
                <span>Tetra Pak Cartons</span>
                <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400 flex items-center justify-center text-sm">🧃</span>
              </div>
              <div className="text-2xl font-black t-text-primary mono">
                {esgMetrics.tetraUnits.toLocaleString()} <span className="text-xs font-semibold t-text-muted">units</span>
              </div>
              <div className="text-xs t-text-muted mt-2">
                Est. {(esgMetrics.tetraUnits * 0.03).toFixed(1)} kg carton fibre saved
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="flex items-center justify-between text-xs font-bold uppercase t-text-muted mb-2">
                <span>Weighed Office Paper</span>
                <span className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 flex items-center justify-center text-sm">📄</span>
              </div>
              <div className="text-2xl font-black t-text-primary mono">
                {esgMetrics.paperKg.toLocaleString()} <span className="text-xs font-semibold t-text-muted">kg</span>
              </div>
              <div className="text-xs t-text-muted mt-2">
                100% Weighed on PecoDrop scales
              </div>
            </div>
          </div>

          {/* ESG Trend Velocity Chart & CSR Equivalents */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border t-border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold t-text-primary">Daily Carbon Avoided Velocity (kg CO₂e)</h3>
                  <p className="text-xs t-text-muted">Verified environmental emission offsets over past 14 days</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                  ISO Compliant
                </span>
              </div>
              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={esgTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                      formatter={(val) => [`${val} kg CO₂e`, 'Avoided']}
                    />
                    <Bar dataKey="co2" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold t-text-primary mb-1">Corporate CSR Equivalents</h3>
                <p className="text-xs t-text-muted mb-4">Real-world environmental translations</p>
                
                <div className="space-y-3.5">
                  <div className="flex items-center gap-3 p-3 rounded-xl t-bg-sec border t-border">
                    <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <Archive className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs t-text-muted font-medium">Compacted Landfill Diverted</div>
                      <div className="text-sm font-bold t-text-primary mono">{esgMetrics.landfillM3} m³ Volume</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl t-bg-sec border t-border">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs t-text-muted font-medium">Electricity Saved</div>
                      <div className="text-sm font-bold t-text-primary mono">{esgMetrics.kwh.toLocaleString()} kWh Clean Energy</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-xl t-bg-sec border t-border">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Trees className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs t-text-muted font-medium">Forestry Conservation</div>
                      <div className="text-sm font-bold t-text-primary mono">~{esgMetrics.matureTrees} Mature Trees Equivalent</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t t-border text-[11px] t-text-muted mt-4">
                Audit standard complies with Pakistan EPA recycling guidelines and GHG Protocol Scope 3 mitigation.
              </div>
            </div>
          </div>

        </div>
      )}

      {/* REPORT VIEW 2: MACHINE UPTIME & SPEED */}
      {activeReport === 'uptime' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Network Machine Availability</div>
              <div className="text-2xl font-black t-text-primary mono">98.5%</div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1">Average uptime across 12 units</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Avg Service Turnaround</div>
              <div className="text-2xl font-black t-text-primary mono">34.2 <span className="text-xs font-semibold t-text-muted">mins</span></div>
              <div className="text-xs t-text-muted mt-1">From "Bin Full" trigger to emptied</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Total Full-Bin Occurrences</div>
              <div className="text-2xl font-black t-text-primary mono">17 <span className="text-xs font-semibold t-text-muted">events</span></div>
              <div className="text-xs t-text-muted mt-1">12 Smart RVMs • 5 PecoDrop Paper</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Pending Field Actions</div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mono">2 <span className="text-xs font-semibold t-text-muted">units</span></div>
              <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1">Field staff notified</div>
            </div>
          </div>

          {/* Location Reliability Table */}
          <div className="glass-panel rounded-2xl border t-border overflow-hidden">
            <div className="p-5 border-b t-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold t-text-primary">Machine Reliability &amp; Service Turnaround by Location</h3>
                <p className="text-xs t-text-muted">Live service telemetry across corporate campuses and transit spots</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                Live Network Sync
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="t-bg-sec/70 border-b t-border t-text-muted uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Location Name</th>
                    <th className="py-3.5 px-4">Smart RVM Uptime</th>
                    <th className="py-3.5 px-4">PecoDrop Uptime</th>
                    <th className="py-3.5 px-4">Avg Emptying Speed</th>
                    <th className="py-3.5 px-4">Weekly Intake</th>
                    <th className="py-3.5 px-4 text-right">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y t-border t-text-primary">
                  {fleetLocations.map((row, idx) => (
                    <tr key={idx} className="hover:t-bg-hover transition-colors">
                      <td className="py-3.5 px-4 font-bold">{row.location}</td>
                      <td className="py-3.5 px-4 text-emerald-700 dark:text-emerald-400 font-bold mono">{row.rvmUptime}</td>
                      <td className="py-3.5 px-4 text-emerald-700 dark:text-emerald-400 font-bold mono">{row.pecoUptime}</td>
                      <td className="py-3.5 px-4 mono">{row.turnaround}</td>
                      <td className="py-3.5 px-4 mono">{row.weeklyIntake}</td>
                      <td className="py-3.5 px-4 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${row.badgeColor}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Diagnostic Load Cell Tare & Anomalies Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scale Calibration Log */}
            <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b t-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600" />
                  Load Scale Tare Calibration Log
                </h4>
                <span className="text-[11px] t-text-muted mono">PecoDrop Load Cells</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="t-bg-sec/50 text-[10px] uppercase font-bold t-text-muted">
                    <tr>
                      <th className="p-2">Log ID</th>
                      <th className="p-2">Unit</th>
                      <th className="p-2">Zero Drift</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y t-border">
                    {calibrationLogs.map(log => (
                      <tr key={log.id} className="hover:t-bg-hover">
                        <td className="p-2 font-bold text-cyan-600 dark:text-cyan-400">{log.id}</td>
                        <td className="p-2 t-text-primary font-bold">{log.unit}</td>
                        <td className="p-2 text-amber-600 dark:text-amber-400">{log.zeroDrift}</td>
                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'Optimal' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Scale Strain Gauge Anomalies */}
            <div className="glass-panel p-5 rounded-2xl border t-border space-y-3">
              <div className="flex items-center justify-between pb-2 border-b t-border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Strain Gauge Anomaly Feed
                </h4>
                <span className="text-[11px] t-text-muted mono">Live Alerts</span>
              </div>
              <div className="space-y-2 text-xs">
                {scaleAnomalies.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl t-bg-sec border t-border flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold t-text-primary flex items-center gap-1.5">
                        <span className="text-cyan-600 dark:text-cyan-400 font-mono">[{item.id}]</span>
                        <span>{item.unit}:</span>
                        <span className="font-normal">{item.event}</span>
                      </div>
                      <div className="text-[10px] t-text-muted mt-0.5">{item.action}</div>
                    </div>
                    <span className="text-[10px] t-text-muted mono shrink-0">{item.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* REPORT VIEW 3: MATERIAL INTAKE VOLUMES */}
      {activeReport === 'intake' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Donut Chart */}
            <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border t-border flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold t-text-primary mb-1">Recycled Stream Share</h3>
                <p className="text-xs t-text-muted mb-4">Volume distribution across the machine network</p>
                <div className="relative h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={streamShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {streamShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                        formatter={(val) => [val.toLocaleString(), 'Count / kg']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t t-border flex items-center justify-between text-xs">
                <span className="t-text-muted">Peak Intake Window:</span>
                <span className="font-bold t-text-primary t-bg-sec px-2.5 py-1 rounded-lg border t-border mono">
                  12:00 PM – 3:00 PM
                </span>
              </div>
            </div>

            {/* Variant Breakdowns */}
            <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border t-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b t-border">
                <div>
                  <h3 className="text-sm font-bold t-text-primary">Variant Sizes &amp; Quantity Distribution</h3>
                  <p className="text-xs t-text-muted">Detailed item intake counts by sub-size</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  All Machines
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* PET Variants */}
                <div className="p-3.5 rounded-xl t-bg-sec border t-border">
                  <div className="font-bold text-xs t-text-primary mb-2 flex items-center justify-between">
                    <span>🥤 Plastic Bottles (PET)</span>
                    <span className="t-text-muted font-medium mono">{esgMetrics.petUnits.toLocaleString()} Total pcs</span>
                  </div>
                  <div className="space-y-1.5 text-xs t-text-secondary">
                    <div className="flex justify-between">
                      <span>Small (345 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.petUnits * 0.15).toLocaleString()} (15%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium (500 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.petUnits * 0.69).toLocaleString()} (69%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Large (1,000 - 1,500 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.petUnits * 0.16).toLocaleString()} (16%)</span>
                    </div>
                  </div>
                </div>

                {/* Aluminium Variants */}
                <div className="p-3.5 rounded-xl t-bg-sec border t-border">
                  <div className="font-bold text-xs t-text-primary mb-2 flex items-center justify-between">
                    <span>🥫 Aluminium Cans</span>
                    <span className="t-text-muted font-medium mono">{esgMetrics.aluUnits.toLocaleString()} Total pcs</span>
                  </div>
                  <div className="space-y-1.5 text-xs t-text-secondary">
                    <div className="flex justify-between">
                      <span>Slim (250 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.aluUnits * 0.50).toLocaleString()} (50%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard (375 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.aluUnits * 0.40).toLocaleString()} (40%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tallboy (500 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.aluUnits * 0.10).toLocaleString()} (10%)</span>
                    </div>
                  </div>
                </div>

                {/* Tetra Pak Variants */}
                <div className="p-3.5 rounded-xl t-bg-sec border t-border">
                  <div className="font-bold text-xs t-text-primary mb-2 flex items-center justify-between">
                    <span>🧃 Tetra Pak Cartons</span>
                    <span className="t-text-muted font-medium mono">{esgMetrics.tetraUnits.toLocaleString()} Total pcs</span>
                  </div>
                  <div className="space-y-1.5 text-xs t-text-secondary">
                    <div className="flex justify-between">
                      <span>Portion (200 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.tetraUnits * 0.72).toLocaleString()} (72%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Standard (1,000 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.tetraUnits * 0.25).toLocaleString()} (25%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Family (1,500 ml):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(esgMetrics.tetraUnits * 0.03).toLocaleString()} (3%)</span>
                    </div>
                  </div>
                </div>

                {/* Paper Tiers */}
                <div className="p-3.5 rounded-xl t-bg-sec border t-border">
                  <div className="font-bold text-xs t-text-primary mb-2 flex items-center justify-between">
                    <span>📄 Weighed Paper (PecoDrop)</span>
                    <span className="t-text-muted font-medium mono">{esgMetrics.paperKg.toLocaleString()} kg Total</span>
                  </div>
                  <div className="space-y-1.5 text-xs t-text-secondary">
                    <div className="flex justify-between">
                      <span>Micro Drops (&lt; 50g):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(42 * scopeMultiplier)} drops</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Office Files (100 - 250g):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(84 * scopeMultiplier)} drops</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bulk Archives (500g - 1kg):</span> 
                      <span className="font-bold t-text-primary mono">{Math.round(62 * scopeMultiplier)} drops</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      )}

      {/* REPORT VIEW 4: FINANCIAL & REWARDS AUDIT */}
      {activeReport === 'financial' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Total Points Issued</div>
              <div className="text-2xl font-black t-text-primary mono">
                {totalFinancialLiability.totalPoints.toLocaleString()} <span className="text-xs font-semibold t-text-muted">pts</span>
              </div>
              <div className="text-xs t-text-muted mt-1">Across all recycling drops</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Total Voucher Liability</div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-400 mono">
                PKR {totalFinancialLiability.totalCash.toLocaleString()}
              </div>
              <div className="text-xs t-text-muted mt-1">Rule: 1,000 pts = PKR 200 Voucher</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Avg Reward Cost per Unit</div>
              <div className="text-2xl font-black t-text-primary mono">PKR 1.15</div>
              <div className="text-xs t-text-muted mt-1">Weighted average across bottles/cans</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl border t-border">
              <div className="text-xs font-bold uppercase t-text-muted mb-1">Paper Acquisition Cost</div>
              <div className="text-2xl font-black t-text-primary mono">
                PKR 10.00 <span className="text-xs font-semibold t-text-muted">/ kg</span>
              </div>
              <div className="text-xs t-text-muted mt-1">Based on 100 pts per kg scale policy</div>
            </div>
          </div>

          {/* Financial Reconciliation Audit Ledger Table */}
          <div className="glass-panel rounded-2xl border t-border overflow-hidden">
            <div className="p-5 border-b t-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold t-text-primary">Reward Points Reconciliation by Material Category</h3>
                <p className="text-xs t-text-muted">Corporate and public payout liability balance</p>
              </div>
              <span className="text-xs font-semibold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
                Reconciled Ledger
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="t-bg-sec/70 border-b t-border t-text-muted uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Material Category</th>
                    <th className="py-3.5 px-4">Intake Volume</th>
                    <th className="py-3.5 px-4">Point Conversion Rule</th>
                    <th className="py-3.5 px-4">Points Issued</th>
                    <th className="py-3.5 px-4 text-right">Cash Value (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y t-border t-text-primary">
                  {financialRows.map((row, idx) => (
                    <tr key={idx} className="hover:t-bg-hover transition-colors">
                      <td className="py-3.5 px-4 font-bold">{row.material}</td>
                      <td className="py-3.5 px-4 mono">{row.volume}</td>
                      <td className="py-3.5 px-4 t-text-muted">{row.rule}</td>
                      <td className="py-3.5 px-4 font-semibold mono">{row.points.toLocaleString()} pts</td>
                      <td className="py-3.5 px-4 font-bold text-right mono">PKR {row.cashPkr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="t-bg-sec/80 font-bold border-t t-border">
                  <tr>
                    <td className="py-3.5 px-4 t-text-primary" colSpan={3}>Total Fleet Point Liability</td>
                    <td className="py-3.5 px-4 text-purple-700 dark:text-purple-400 font-extrabold mono">
                      {totalFinancialLiability.totalPoints.toLocaleString()} pts
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-700 dark:text-purple-400 font-extrabold mono">
                      PKR {totalFinancialLiability.totalCash.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Export Report Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-md w-full p-6 border t-border shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b t-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold t-text-primary text-base">Export Audit Report</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 t-text-muted hover:t-text-primary rounded-lg t-bg-sec border t-border"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs t-text-secondary leading-relaxed">
              Download the customized analytics report matching your selected query filters for management review, executive presentations, or CSR disclosures.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold t-text-primary">Choose Format</label>
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
                    name="reportFormat"
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
                    name="reportFormat"
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
                Download File
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
          <span>Reports &amp; Analytics Hub</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Audited Machine Network</span>
          <span>•</span>
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Ready
          </span>
        </div>
      </footer>

    </div>
  );
}
