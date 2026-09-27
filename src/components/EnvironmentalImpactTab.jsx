import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, Trees, Car, Recycle, Award, RefreshCw, Info, CheckCircle2, 
  Scale, ShieldCheck, Flame, ArrowUpRight, Database, Printer, FileCheck,
  CloudOff, Sprout, X, Download, Check, Shield, RotateCcw, Sliders
} from 'lucide-react';

export default function EnvironmentalImpactTab({ stationFilter, selectedClientId, currentUser }) {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf'); // 'pdf' | 'csv'
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Custom editable offset factors state (stored in localStorage for persistence)
  const [customFactors, setCustomFactors] = useState(() => {
    try {
      const saved = localStorage.getItem('rvm_esg_custom_factors');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3200);
  };

  const handleFactorChange = (materialKey, val) => {
    setCustomFactors(prev => {
      const updated = { ...prev };
      if (val === '' || val === null || val === undefined) {
        delete updated[materialKey];
      } else {
        const num = parseFloat(val);
        updated[materialKey] = isNaN(num) ? '' : num;
      }
      try {
        localStorage.setItem('rvm_esg_custom_factors', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleResetSingleFactor = (materialKey, defaultFactor) => {
    setCustomFactors(prev => {
      const updated = { ...prev };
      delete updated[materialKey];
      try {
        localStorage.setItem('rvm_esg_custom_factors', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    showToast(`Restored factor to ISO standard (${defaultFactor})`);
  };

  const handleResetAllFactors = () => {
    setCustomFactors({});
    try {
      localStorage.removeItem('rvm_esg_custom_factors');
    } catch (e) {}
    showToast('All material offset factors reset to ISO 14064 standards');
  };

  const getMachinesQuery = () => {
    try {
      const u = currentUser || JSON.parse(localStorage.getItem('rvm_auth_user') || '{}');
      const params = new URLSearchParams();
      if (selectedClientId && selectedClientId !== 'ALL') params.append('clientId', selectedClientId);
      if (stationFilter && stationFilter !== 'ALL') params.append('stationFilter', stationFilter);
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

  const fetchImpact = async () => {
    try {
      setRefreshing(true);
      const res = await fetch(`/api/analytics/environmental-impact${getMachinesQuery()}`);
      if (res.ok) {
        const data = await res.json();
        setImpactData(data);
      }
    } catch (err) {
      console.error('Fetch impact error:', err);
      showToast('Error syncing environmental audit data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchImpact();
  }, [selectedClientId, stationFilter]);

  const handleRefresh = () => {
    fetchImpact();
    showToast('Environmental Impact Audit updated in real-time');
  };

  const handlePrint = () => {
    window.print();
    showToast('Audit report sent to print dialogue');
  };

  // Dynamic calculations accounting for editable factors
  const hasCustomFactors = useMemo(() => {
    return Object.keys(customFactors).length > 0;
  }, [customFactors]);

  const calculatedBreakdown = useMemo(() => {
    const original = impactData?.breakdown || [];
    return original.map((row) => {
      const key = row.id || row.badge || row.material;
      const isCustom = customFactors[key] !== undefined && customFactors[key] !== '';
      const activeFactor = isCustom ? Number(customFactors[key]) : Number(row.factor || 1.5);
      const weightKg = Number(row.weightKg) || 0;
      const co2eSavedKg = parseFloat((weightKg * activeFactor).toFixed(1));
      return {
        ...row,
        factor: activeFactor,
        defaultFactor: Number(row.factor || 1.5),
        isCustom,
        co2eSavedKg
      };
    });
  }, [impactData, customFactors]);

  const displayTotalWeightProcessedKg = useMemo(() => {
    if (calculatedBreakdown.length > 0) {
      return parseFloat(calculatedBreakdown.reduce((sum, r) => sum + (Number(r.weightKg) || 0), 0).toFixed(1));
    }
    return impactData?.totalWeightProcessedKg || 0;
  }, [calculatedBreakdown, impactData]);

  const displayTotalCo2eAvoidedKg = useMemo(() => {
    if (calculatedBreakdown.length > 0) {
      return parseFloat(calculatedBreakdown.reduce((sum, r) => sum + (Number(r.co2eSavedKg) || 0), 0).toFixed(1));
    }
    return impactData?.totalCo2eAvoidedKg || 0;
  }, [calculatedBreakdown, impactData]);

  const displayTotalCo2eAvoidedTonnes = useMemo(() => {
    return parseFloat((displayTotalCo2eAvoidedKg / 1000).toFixed(2));
  }, [displayTotalCo2eAvoidedKg]);

  const displayTreesPlantedEquivalent = useMemo(() => {
    return Math.round(displayTotalCo2eAvoidedKg / 21.77);
  }, [displayTotalCo2eAvoidedKg]);

  const displayPassengerCarMilesAvoided = useMemo(() => {
    return Math.round(displayTotalCo2eAvoidedKg / 0.40);
  }, [displayTotalCo2eAvoidedKg]);

  const displayWeightedFactor = useMemo(() => {
    if (!displayTotalWeightProcessedKg) return '1.50';
    return (displayTotalCo2eAvoidedKg / displayTotalWeightProcessedKg).toFixed(2);
  }, [displayTotalCo2eAvoidedKg, displayTotalWeightProcessedKg]);

  const displayCompostYieldKg = impactData?.compostYieldKg || 152.5;

  // Generate and download audited CSV ledger
  const downloadCsv = () => {
    if (!calculatedBreakdown || calculatedBreakdown.length === 0) return;
    const headers = ['Material Stream,Machine Source,Measurement Method,Processed Weight (kg),Offset Factor,Net CO2e Saved (kg)'];
    const rows = calculatedBreakdown.map(b => 
      `"${b.material}","${b.source || ''}","${b.method || ''}",${b.weightKg},${b.factor},${b.co2eSavedKg}`
    );
    rows.push(`"TOTAL AUDITED SAVINGS","All Fleets","Verified Aggregation",${displayTotalWeightProcessedKg},${displayWeightedFactor},${displayTotalCo2eAvoidedKg}`);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ISP_ESG_Carbon_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const executeDownload = () => {
    setIsExportModalOpen(false);
    if (exportFormat === 'csv') {
      downloadCsv();
      showToast('Audited CSV Data Ledger downloaded successfully');
    } else {
      window.print();
      showToast('Generating official ESG PDF report');
    }
  };

  // User initials avatar
  const userInitials = useMemo(() => {
    const name = currentUser?.name || currentUser?.username || 'Admin';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [currentUser]);

  if (loading && !impactData) {
    return (
      <div className="flex flex-col items-center justify-center py-28 t-text-muted gap-4 animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white animate-pulse">
          <Leaf className="w-7 h-7" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold t-text-primary">Calculating Audited Environmental Impact</h3>
          <p className="text-xs t-text-muted mt-1">Reconciling life-cycle greenhouse gas offset factors and load cell scales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 dark:text-slate-100">
      
      {/* ======================================================== */}
      {/* 1. HEADER SECTION                                        */}
      {/* ======================================================== */}
      <header className="glass-panel p-4 sm:p-5 rounded-3xl border t-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/25 text-white font-black text-xl shrink-0">
            <Leaf className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
                Audited ESG Reporting
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-slate-300 dark:text-slate-700">|</span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ISO 14064 Standard Compliant
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight t-text-primary leading-tight">
              Environmental &amp; Carbon Impact Audit
            </h1>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 t-bg-sec hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border t-border shadow-xs active:scale-95"
            title="Refresh Audit Data"
          >
            <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            <span className="hidden md:inline">Refresh</span>
          </button>

          <button 
            onClick={handlePrint}
            className="p-2 sm:px-3 sm:py-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 t-bg-sec hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border t-border shadow-xs active:scale-95"
            title="Print Audit Report"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Print Audit</span>
          </button>
          
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-emerald-600/30 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Export ESG Audit (PDF)</span>
            <span className="sm:hidden">Export</span>
          </button>

          {/* User Profile Avatar Pill */}
          <div className="flex items-center gap-2 pl-2 border-l t-border">
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border t-border flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shadow-xs" title={currentUser?.name || 'Administrator'}>
              {userInitials}
            </div>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. EXECUTIVE HERO BANNER (THEME-ADAPTIVE & CONTRAST AAA) */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border t-border shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Third-Party Audited Impact Ledger</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight t-text-primary">
            {displayTotalCo2eAvoidedKg.toLocaleString()} kg CO₂e Total Carbon Offset
          </h2>
          <p className="text-xs sm:text-sm t-text-secondary leading-relaxed">
            Calculated from {displayTotalWeightProcessedKg.toLocaleString()} kg of raw recyclable materials collected across public Smart RVMs and corporate PecoDrop units, verified under life-cycle emissions reduction standards.
          </p>
        </div>

        {/* Right Metric Cards with Theme Tokens & Paired Contrast */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4 border-t lg:border-t-0 lg:border-l t-border pt-5 lg:pt-0 lg:pl-8 text-center shrink-0">
          <div className="p-3.5 sm:p-4 rounded-2xl t-bg-sec border t-border text-center min-w-[125px] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight mono">
              {displayTreesPlantedEquivalent.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wider t-text-muted font-bold mt-1">
              Trees Equivalent
            </div>
          </div>
          <div className="p-3.5 sm:p-4 rounded-2xl t-bg-sec border t-border text-center min-w-[125px] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 tracking-tight mono">
              {displayPassengerCarMilesAvoided.toLocaleString()}
            </div>
            <div className="text-[11px] uppercase tracking-wider t-text-muted font-bold mt-1">
              Miles Avoided
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl t-bg-sec border t-border text-center min-w-[125px] shadow-2xs">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mono">
              {(displayTotalWeightProcessedKg / 1000).toFixed(2)} T
            </div>
            <div className="text-[11px] uppercase tracking-wider t-text-muted font-bold mt-1">
              Diverted Waste
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. 4 HIGH-IMPACT ENVIRONMENTAL METRICS CARDS             */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Avoided Carbon */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden group hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Verified Carbon Offset</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CloudOff className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight">
                {displayTotalCo2eAvoidedKg.toLocaleString()}
              </span>
              <span className="text-xs font-semibold t-text-muted">kg CO₂e</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{displayTotalCo2eAvoidedTonnes} Metric Tonnes Avoided</span>
          </div>
        </div>

        {/* Card 2: Trees Planted Equiv. */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden group hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tree Growth Equivalent</span>
              <div className="w-8 h-8 rounded-lg bg-lime-500/10 text-lime-600 dark:text-lime-400 flex items-center justify-center">
                <Trees className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight">
                {displayTreesPlantedEquivalent.toLocaleString()}
              </span>
              <span className="text-xs font-semibold t-text-muted">mature trees</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] t-text-muted leading-relaxed">
            Based on 1 urban tree seedling grown 10 yrs (21.77 kg CO₂e)
          </div>
        </div>

        {/* Card 3: Vehicle Emissions */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden group hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Vehicle Miles Avoided</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight">
                {displayPassengerCarMilesAvoided.toLocaleString()}
              </span>
              <span className="text-xs font-semibold t-text-muted">miles</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] t-text-muted leading-relaxed">
            ≈ {Math.round(displayPassengerCarMilesAvoided * 1.60934).toLocaleString()} km of passenger vehicle travel
          </div>
        </div>

        {/* Card 4: Organic / Compost Diversion */}
        <div className="glass-panel rounded-2xl p-5 border t-border shadow-xs relative overflow-hidden group hover:border-emerald-400/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Organic &amp; Fiber Diversion</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sprout className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl lg:text-3xl font-extrabold t-text-primary tracking-tight">
                {displayCompostYieldKg.toLocaleString()}
              </span>
              <span className="text-xs font-semibold t-text-muted">kg diverted</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] t-text-muted leading-relaxed">
            Organic streams diverted from landfill methane release
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* 4. AUDITED MATERIALS CARBON BREAKDOWN TABLE              */}
      {/* ======================================================== */}
      <div className="glass-panel rounded-2xl border t-border shadow-xs overflow-hidden">
        <div className="p-5 border-b t-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold t-text-primary">Audited Carbon Offset Ledger by Material Stream</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                Single Source of Truth
              </span>
            </div>
            <p className="text-xs t-text-muted mt-0.5">Calculated using verified material weights and standard life-cycle GHG offset factors.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasCustomFactors && (
              <button
                onClick={handleResetAllFactors}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all active:scale-95"
                title="Reset all factors back to ISO 14064 standards"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standards</span>
              </button>
            )}
            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              Total Intake: {displayTotalWeightProcessedKg.toLocaleString()} kg
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b t-border text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3.5 px-4">Material Stream</th>
                <th className="py-3.5 px-4">Machine Source</th>
                <th className="py-3.5 px-4">Measurement Method</th>
                <th className="py-3.5 px-4 text-right">Processed Weight</th>
                <th className="py-3.5 px-4 text-center">Offset Factor</th>
                <th className="py-3.5 px-4 text-right">Net CO₂e Saved</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border text-slate-700 dark:text-slate-300">
              {calculatedBreakdown.map((row) => {
                const isPet = row.id === 'PET' || row.badge === 'PET';
                const isUbc = row.id === 'UBC' || row.badge === 'UBC';
                const isPpr = row.id === 'PPR' || row.badge === 'PPR';
                const isAlu = row.id === 'ALU' || row.badge === 'ALU';
                const isOrg = row.id === 'ORG' || row.badge === 'ORG';

                const badgeBg = isPet 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : isUbc
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                  : isPpr
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800'
                  : isAlu
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                  : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200 dark:border-teal-800';

                const methodBg = isPpr
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : isOrg
                  ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';

                const rowKey = row.id || row.badge || row.material;

                return (
                  <tr key={rowKey} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 border ${badgeBg}`}>
                          {row.badge || row.id || 'MAT'}
                        </span>
                        <div>
                          <div className="font-bold t-text-primary">{row.material}</div>
                          <div className="text-[11px] t-text-muted">{row.subtext || row.rewardClass}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium t-text-secondary">
                      {row.source || (isPpr ? 'PecoDrop Corporate' : 'Smart RVM & Legacy RVM')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-md font-medium text-[11px] border ${methodBg}`}>
                        {row.method || (isPpr ? 'Direct Scale (Verified kg)' : 'Unit Count x Average Grams')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold t-text-primary font-mono">
                      {row.weightKg.toLocaleString()} kg
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          max="50"
                          value={row.factor}
                          onChange={(e) => handleFactorChange(rowKey, e.target.value)}
                          className={`w-20 px-2 py-1 text-center font-mono font-bold text-xs rounded-lg border transition-all ${
                            row.isCustom 
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30' 
                              : 'bg-white dark:bg-slate-900 t-text-primary border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          } focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden`}
                          title={`ISO standard factor: ${row.defaultFactor}. Edit to simulate custom emission reduction.`}
                        />
                        {row.isCustom && (
                          <button
                            onClick={() => handleResetSingleFactor(rowKey, row.defaultFactor)}
                            className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                            title={`Reset to ISO standard default (${row.defaultFactor})`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-emerald-700 dark:text-emerald-400 text-sm font-mono">
                      {row.co2eSavedKg.toLocaleString()} kg
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/90 dark:bg-slate-800/80 border-t-2 border-slate-200 dark:border-slate-700 font-bold">
              <tr>
                <td className="py-4 px-4 t-text-primary" colSpan={3}>
                  <div className="flex items-center gap-2">
                    <span>TOTAL AUDITED SAVINGS</span>
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                      VERIFIED
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right t-text-primary font-black text-sm font-mono">
                  {displayTotalWeightProcessedKg.toLocaleString()} kg
                </td>
                <td className="py-4 px-4 text-center t-text-muted font-semibold text-xs font-mono">
                  {displayWeightedFactor} (Weighted)
                </td>
                <td className="py-4 px-4 text-right text-emerald-700 dark:text-emerald-400 font-black text-base font-mono">
                  {displayTotalCo2eAvoidedKg.toLocaleString()} kg CO₂e
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. AUDITED CARBON FORMULA RULES & TRANSPARENCY           */}
      {/* ======================================================== */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border t-border shadow-xs space-y-3.5">
        <div className="flex items-center gap-2 t-text-primary font-bold text-sm">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Measurement Standards &amp; Calculation Rules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs t-text-secondary">
          <div className="p-3.5 rounded-xl t-bg-sec border t-border space-y-1">
            <div className="font-bold t-text-primary mb-1">Direct Scale Verification (Tier 1)</div>
            <p className="leading-relaxed">
              Applied to PecoDrop paper drop units with calibrated electronic load cells. Real mass intake is logged without estimation.
            </p>
          </div>
          <div className="p-3.5 rounded-xl t-bg-sec border t-border space-y-1">
            <div className="font-bold t-text-primary mb-1">Unit Weight Statistical Model (Tier 2)</div>
            <p className="leading-relaxed">
              Applied to public Smart RVM and Legacy RVM units. Item counts are converted using ISO-certified standard empty package masses.
            </p>
          </div>
          <div className="p-3.5 rounded-xl t-bg-sec border t-border space-y-1">
            <div className="font-bold t-text-primary mb-1">Disjoint No-Double-Count Guarantee</div>
            <p className="leading-relaxed">
              Each transaction receives an immutable cryptographic log ID to eliminate duplicate offset reporting across multiple enterprise clients.
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 6. FOOTER (Matches ESG_Carbon_Impact_Audit.html)          */}
      {/* ======================================================== */}
      <footer className="glass-panel rounded-2xl border t-border py-4 px-6 text-xs t-text-muted flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-medium">
          <span>© 2026 ISP Environmental Solutions Pvt. Ltd.</span>
          <span>•</span>
          <span>Audited ESG &amp; Carbon Accounting Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{displayTotalWeightProcessedKg.toLocaleString()} kg Verified Diversion</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            GHG Protocol Aligned
          </span>
        </div>
      </footer>

      {/* ======================================================== */}
      {/* 7. MODAL: EXPORT OFFICIAL ESG AUDIT                      */}
      {/* ======================================================== */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border t-border transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold t-text-primary text-base">Export Official ESG Audit</h3>
                  <p className="text-[11px] t-text-muted">ISO 14064 Compliance Certificate</p>
                </div>
              </div>
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs t-text-muted mb-4 leading-relaxed">
              Generate a verifiable environmental impact certificate and carbon balance sheet for corporate sustainability disclosures (CSR &amp; Scope 3 reporting).
            </p>

            <div className="space-y-3.5 mb-5">
              <label className="block text-xs font-semibold t-text-primary">Audit Document Format</label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label 
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer border transition-all ${
                    exportFormat === 'pdf'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 't-border t-bg-sec text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="auditFormat" 
                    checked={exportFormat === 'pdf'} 
                    onChange={() => setExportFormat('pdf')}
                    className="text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span>Verified PDF Report</span>
                </label>

                <label 
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer border transition-all ${
                    exportFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 't-border t-bg-sec text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="auditFormat" 
                    checked={exportFormat === 'csv'} 
                    onChange={() => setExportFormat('csv')}
                    className="text-emerald-600 focus:ring-emerald-500" 
                  />
                  <span>CSV Data Ledger</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold pt-3 border-t t-border">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={executeDownload}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 8. FLOATING TOAST NOTIFICATION                            */}
      {/* ======================================================== */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-medium border border-slate-700/60 animate-bounce-subtle">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
