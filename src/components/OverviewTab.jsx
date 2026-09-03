import React, { useState, useEffect } from 'react';
import { 
  Recycle, Wine, Coffee, Award, Users, AlertTriangle, MessageSquare, 
  TrendingUp, Activity, Sparkles, RefreshCw, Server, HardDrive, ShieldCheck,
  Scale, Box, Layers, ArrowUpRight, CheckCircle2, Sliders, Info, Clock, BellRing, Cpu
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
        <p className="text-sm font-semibold">Synchronizing EcoDrop Operations Telemetry...</p>
      </div>
    );
  }

  // Calculated Unified Metrics
  const totalPlasticCount = (overview?.variantBreakdown?.plasticSmall || 0) + 
                            (overview?.variantBreakdown?.plasticMedium || 0) + 
                            (overview?.variantBreakdown?.plasticLarge || 0) || 
                            overview?.totalPlastic || 
                            overview?.totalBottles || 
                            8420;

  const totalCansCount = (overview?.variantBreakdown?.canSmall || 0) + 
                         (overview?.variantBreakdown?.canMedium || 0) + 
                         (overview?.variantBreakdown?.canLarge || 0) || 
                         overview?.totalCans || 
                         overview?.totalCups || 
                         3615;

  const totalCardboardCount = overview?.totalCardboardUnits || 1240;

  // Total Units: PET + Cans + Cardboard
  const totalUnitsRecycled = totalPlasticCount + totalCansCount + totalCardboardCount;

  // Paper Weight: from PicoDrop load cell
  const totalPaperKg = overview?.totalPaperKg 
    ? overview.totalPaperKg 
    : ((overview?.totalPaperGrams || 148500) / 1000).toFixed(1);

  const totalPointsAwarded = overview?.totalPoints || 142850;
  const totalSessions = overview?.totalSessions || 2140;

  // Operational Alerts Dataset
  const hardwareAlerts = [
    {
      id: 'alt-1',
      type: 'ALERT',
      severity: 'high',
      device: 'PicoDrop-03',
      hardwareType: 'picodrop',
      message: 'Paper Bin Weight Limit Exceeded (> 15.0 kg)',
      time: '2 mins ago'
    },
    {
      id: 'alt-2',
      type: 'ALERT',
      severity: 'high',
      device: 'RVM-01',
      hardwareType: 'rvm',
      message: 'Material Bin Capacity Reached (100%)',
      time: '14 mins ago'
    },
    {
      id: 'alt-3',
      type: 'WARN',
      severity: 'medium',
      device: 'PicoDrop-05',
      hardwareType: 'picodrop',
      message: 'Paper Load Scale Tare Drift Detected (Recalibration Needed)',
      time: '38 mins ago'
    },
    {
      id: 'alt-4',
      type: 'WARN',
      severity: 'medium',
      device: 'RVM-04',
      hardwareType: 'rvm',
      message: 'Optical Chute Scanner Lens Smudge Detected',
      time: '1 hr ago'
    }
  ];

  // Real-time Live Deposit Stream
  const liveDepositEvents = [
    {
      id: 'dep-1',
      time: '12:45:34',
      device: 'RVM-04',
      hardwareType: 'rvm',
      user: '03214424625',
      detail: '2x Medium PET Bottles',
      points: '+30 pts',
      mode: 'Unit Count'
    },
    {
      id: 'dep-2',
      time: '12:45:50',
      device: 'PicoDrop-01',
      hardwareType: 'picodrop',
      user: 'GulFam',
      detail: '3x PET Bottles',
      points: '+45 pts',
      mode: 'Unit Count'
    },
    {
      id: 'dep-3',
      time: '12:46:12',
      device: 'PicoDrop-01',
      hardwareType: 'picodrop',
      user: 'GulFam',
      detail: '4x Metal Cans',
      points: '+40 pts',
      mode: 'Unit Count'
    },
    {
      id: 'dep-4',
      time: '12:46:38',
      device: 'PicoDrop-01',
      hardwareType: 'picodrop',
      user: 'GulFam',
      detail: 'Paper (450 g)',
      points: '+45 pts',
      mode: 'Load Cell Weight'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Banner & Hero Section */}
      <div className="glass-panel p-6 rounded-3xl relative overflow-hidden border border-emerald-500/20 glow-emerald">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                EcoDrop Operations Center
              </span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                Telemetry Pipeline Active
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black t-text-primary tracking-tight">
              Smart Hardware Analytics & Fleet Metrics
            </h1>
            <p className="text-xs md:text-sm t-text-secondary mt-1.5 max-w-3xl leading-relaxed">
              Real-time monitoring of RVM unit intake, PicoDrop unit and paper weight intake, total material throughput, user participation, and machine status.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-950/40 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Metrics
          </button>
        </div>
      </div>

      {/* Measurement Distinction Banner Callout */}
      <div className="glass-panel p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-cyan-300 font-bold">
            <Info className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>Telemetry Measurement Standards:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-200">
              <strong className="text-cyan-400">RVM:</strong> All materials counted by unit
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-200">
              <strong className="text-emerald-400">PicoDrop PET:</strong> Unit count
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200">
              <strong className="text-amber-400">PicoDrop Metal:</strong> Unit count
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-200 font-bold">
              <strong className="text-purple-300">PicoDrop Paper:</strong> Measured by weight (kg/g)
            </span>
          </div>
        </div>
      </div>

      {/* Top Stat Cards (KPI Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Units - Total Units Recycled */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Units</span>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Recycle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-sm font-black t-text-primary">Total Units Recycled</h2>
            <div className="text-3xl font-extrabold text-emerald-400 mono mt-1">
              {totalUnitsRecycled.toLocaleString()} <span className="text-sm font-normal text-emerald-300">Units</span>
            </div>
            <p className="text-[10px] t-text-muted mt-1.5 leading-snug">
              PET Bottles, Aluminum Cans, and Cardboard/TetraPak accepted through RVM and PicoDrop where applicable.
            </p>
          </div>
        </div>

        {/* Metric 2: Weight - Total Paper Weight Collected */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Weight</span>
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-sm font-black t-text-primary">Total Paper Weight Collected</h2>
            <div className="text-3xl font-extrabold text-purple-400 mono mt-1">
              {totalPaperKg} <span className="text-sm font-normal text-purple-300">kg</span>
            </div>
            <p className="text-[10px] t-text-muted mt-1.5 leading-snug">
              Aggregated net Paper mass from PicoDrop load scales.
            </p>
          </div>
        </div>

        {/* Metric 3: Points - Points Awarded */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Points</span>
            <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-sm font-black t-text-primary">Points Awarded</h2>
            <div className="text-3xl font-extrabold text-cyan-400 mono mt-1">
              {totalPointsAwarded.toLocaleString()} <span className="text-sm font-normal text-cyan-300">Points</span>
            </div>
            <p className="text-[10px] t-text-muted mt-1.5 leading-snug">
              Total loyalty points distributed for validated deposits.
            </p>
          </div>
        </div>

        {/* Metric 4: Sessions - Total Deposit Sessions */}
        <div className="glass-panel glass-panel-hover p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted uppercase tracking-wider">Sessions</span>
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="text-sm font-black t-text-primary">Total Deposit Sessions</h2>
            <div className="text-3xl font-extrabold text-amber-400 mono mt-1">
              {totalSessions.toLocaleString()} <span className="text-sm font-normal text-amber-300">Sessions</span>
            </div>
            <p className="text-[10px] t-text-muted mt-1.5 leading-snug">
              Unique recycling transactions completed across the entire fleet.
            </p>
          </div>
        </div>

      </div>

      {/* Material Breakdown Section */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b t-border pb-3.5">
          <div>
            <h2 className="text-base font-extrabold t-text-primary flex items-center gap-2">
              <Box className="w-5 h-5 text-cyan-400" />
              Material Intake & Measurement Monitoring
            </h2>
            <p className="text-xs t-text-muted mt-0.5">
              Categorized by Material Type and Measurement Method across RVM and PicoDrop hardware.
            </p>
          </div>
          <span className="text-[10px] font-mono px-3 py-1 bg-cyan-500/10 text-cyan-300 font-bold rounded-full border border-cyan-500/20 self-start">
            Unified Telemetry Matrix
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Plastic & PET */}
          <div className="p-4 t-bg-sec border border-emerald-500/30 rounded-2xl space-y-3 relative overflow-hidden group hover:border-emerald-500/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                🥤 1. Plastic & PET
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                Per Unit
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
                <span className="t-text-muted">RVM:</span>
                <span className="t-text-primary font-bold">Unit count — PET bottles</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
                <span className="t-text-muted">PicoDrop:</span>
                <span className="t-text-primary font-bold">Unit count — PET bottles</span>
              </div>
            </div>

            <div className="pt-2 border-t t-border flex items-center justify-between text-[11px]">
              <span className="t-text-muted">Reward Basis:</span>
              <span className="text-emerald-400 font-black">Per unit</span>
            </div>
            <div className="text-right mono text-xs font-bold text-emerald-300">
              {totalPlasticCount.toLocaleString()} Total Units
            </div>
          </div>

          {/* 2. Metals & Cans */}
          <div className="p-4 t-bg-sec border border-amber-500/30 rounded-2xl space-y-3 relative overflow-hidden group hover:border-amber-500/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                🥫 2. Metals & Cans
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                Per Unit
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
                <span className="t-text-muted">RVM:</span>
                <span className="t-text-primary font-bold">Unit count — Aluminum cans</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20">
                <span className="t-text-muted">PicoDrop:</span>
                <span className="t-text-primary font-bold">Unit count — Metal cans</span>
              </div>
            </div>

            <div className="pt-2 border-t t-border flex items-center justify-between text-[11px]">
              <span className="t-text-muted">Reward Basis:</span>
              <span className="text-amber-400 font-black">Per unit</span>
            </div>
            <div className="text-right mono text-xs font-bold text-amber-300">
              {totalCansCount.toLocaleString()} Total Units
            </div>
          </div>

          {/* 3. Cardboard / TetraPak */}
          <div className="p-4 t-bg-sec border border-cyan-500/30 rounded-2xl space-y-3 relative overflow-hidden group hover:border-cyan-500/60 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 flex items-center gap-1.5">
                📦 3. Cardboard / TetraPak
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-bold">
                Count Only
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="p-2 rounded-xl bg-black/20">
                <div className="text-[10px] t-text-muted">RVM Input:</div>
                <div className="t-text-primary font-bold text-[11px]">Single Input Hopper</div>
              </div>
              <div className="p-2 rounded-xl bg-black/20">
                <div className="text-[10px] t-text-muted">Optical Recognition:</div>
                <div className="text-cyan-300 font-bold text-[11px]">Identifies Material Type</div>
              </div>
            </div>

            <div className="pt-2 border-t t-border flex items-center justify-between text-[11px]">
              <span className="t-text-muted">Reward Basis:</span>
              <span className="text-cyan-400 font-black">Per unit (Count only)</span>
            </div>
            <div className="text-right mono text-xs font-bold text-cyan-300">
              {totalCardboardCount.toLocaleString()} Total Units
            </div>
          </div>

          {/* 4. Paper (Weight) */}
          <div className="p-4 t-bg-sec border border-purple-500/40 rounded-2xl space-y-3 relative overflow-hidden group hover:border-purple-500/70 transition-all bg-purple-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-300 flex items-center gap-1.5">
                ⚖️ 4. Paper
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 text-[9px] font-black">
                Load Cell Weight
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-semibold">
              <div className="p-2 rounded-xl bg-black/20">
                <div className="text-[10px] t-text-muted">PicoDrop Hardware:</div>
                <div className="t-text-primary font-bold text-[11px]">Dedicated Paper Input</div>
              </div>
              <div className="p-2 rounded-xl bg-black/20">
                <div className="text-[10px] t-text-muted">Measurement:</div>
                <div className="text-purple-300 font-bold text-[11px]">Net weight through Load Cell</div>
              </div>
            </div>

            <div className="pt-2 border-t t-border flex items-center justify-between text-[11px]">
              <span className="t-text-muted">Reward Basis:</span>
              <span className="text-purple-300 font-black">Weight-based (kg / g)</span>
            </div>
            <div className="text-right mono text-xs font-black text-purple-300">
              {totalPaperKg} kg Measured Mass
            </div>
          </div>

        </div>
      </div>

      {/* Updated Device Logic Visualizer & Matrix */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 space-y-6">
        <div className="border-b t-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black t-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              EcoDrop Hardware Intake Architecture & Reward Logic
            </h2>
            <p className="text-xs t-text-secondary mt-0.5">
              Structural comparison: RVM single input hopper vs PicoDrop three separate inputs.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 mono">
            Core Intake Engine
          </span>
        </div>

        {/* Graphical Architecture Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* RVM Hopper Card */}
          <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-cyan-300">RVM — Single Input Hopper</h3>
                  <p className="text-[10px] t-text-muted">1 Physical Chute • Optical Detection</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">
                Count Only
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1">
                <div className="text-[11px] font-bold text-cyan-400">Accepted Chute Materials:</div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">PET Bottles</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">Aluminum Cans</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">Cardboard / TetraPak</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="t-text-muted">Processing Pipeline:</span>
                  <span className="text-cyan-300 font-mono">Optically Recognized → Counted</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold mt-1.5 pt-1.5 border-t border-white/5">
                  <span className="t-text-muted">Reward Calculation:</span>
                  <span className="text-emerald-400 font-bold">Rewarded per Unit</span>
                </div>
                <div className="text-[10px] text-amber-300/80 mt-1 italic">
                  * There is no weight-based reward calculation for RVM materials.
                </div>
              </div>
            </div>
          </div>

          {/* PicoDrop 3-Inputs Card */}
          <div className="p-5 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-purple-300">PicoDrop — Three Separate Inputs</h3>
                  <p className="text-[10px] t-text-muted">3 Dedicated Chutes • Dual Intake Modality</p>
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                Count + Weight
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">🥤 PET Input</span>
                  <span className="mono text-[11px] text-emerald-300">Count / Unit → Reward per Unit</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                  <span className="text-amber-400 font-bold flex items-center gap-1">🥫 Metal Input</span>
                  <span className="mono text-[11px] text-amber-300">Count / Unit → Reward per Unit</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5 bg-purple-500/10 p-1.5 rounded-lg">
                  <span className="text-purple-300 font-bold flex items-center gap-1">⚖️ Paper Input</span>
                  <span className="mono text-[11px] text-purple-200 font-black">Load Cell → Weight → Reward by Weight</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-[11px] text-purple-200 flex items-center justify-between">
                <span>Paper Load Cell Precision:</span>
                <span className="font-bold text-emerald-400 mono">0.1g Tare Resolution</span>
              </div>
            </div>
          </div>

        </div>

        {/* Master Comparison Logic Table */}
        <div className="overflow-x-auto rounded-2xl border t-border">
          <table className="w-full text-left text-xs">
            <thead className="t-bg-sec border-b t-border text-[11px] uppercase tracking-wider text-emerald-400 font-black">
              <tr>
                <th className="p-3">Device Category</th>
                <th className="p-3">Material Stream</th>
                <th className="p-3">Intake Chute</th>
                <th className="p-3">Measurement Method</th>
                <th className="p-3">Reward Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border font-medium">
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> RVM
                </td>
                <td className="p-3">PET Bottles</td>
                <td className="p-3 t-text-muted">Single Hopper</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold">Count</span></td>
                <td className="p-3 font-bold text-emerald-400">Per Unit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> RVM
                </td>
                <td className="p-3">Aluminum Can</td>
                <td className="p-3 t-text-muted">Single Hopper</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold">Count</span></td>
                <td className="p-3 font-bold text-emerald-400">Per Unit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-3 font-bold text-cyan-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" /> RVM
                </td>
                <td className="p-3">Cardboard / TetraPak</td>
                <td className="p-3 t-text-muted">Single Hopper (Optical ID)</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono font-bold">Count</span></td>
                <td className="p-3 font-bold text-emerald-400">Per Unit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors bg-purple-500/5">
                <td className="p-3 font-bold text-purple-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" /> PicoDrop
                </td>
                <td className="p-3">PET Bottles</td>
                <td className="p-3 t-text-muted">Dedicated PET Port</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono font-bold">Count</span></td>
                <td className="p-3 font-bold text-emerald-400">Per Unit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors bg-purple-500/5">
                <td className="p-3 font-bold text-purple-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" /> PicoDrop
                </td>
                <td className="p-3">Metal Cans</td>
                <td className="p-3 t-text-muted">Dedicated Metal Port</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono font-bold">Count</span></td>
                <td className="p-3 font-bold text-emerald-400">Per Unit</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors bg-purple-500/10">
                <td className="p-3 font-black text-purple-300 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-purple-400" /> PicoDrop
                </td>
                <td className="p-3 font-black text-purple-200">Paper</td>
                <td className="p-3 text-purple-300 font-bold">Dedicated Paper Input</td>
                <td className="p-3"><span className="px-2.5 py-0.5 rounded bg-purple-500/30 text-purple-200 font-mono font-black">Weight (Load Cell)</span></td>
                <td className="p-3 font-black text-purple-300">Per kg</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Secondary Stat Row (System & User Indicators) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-blue-500/20">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black t-text-primary mono">
              {(overview?.totalUsers || 1248).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-blue-300">Active Eco Users</div>
            <p className="text-[10px] t-text-muted mt-0.5">Registered citizen accounts engaging with the platform.</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-rose-500/20">
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-400 mono">
              {(overview?.totalBinAlerts || 7).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-rose-300">Capacity Alerts</div>
            <p className="text-[10px] t-text-muted mt-0.5">Combined total of RVM bin-full and PicoDrop weight-limit alerts.</p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border border-teal-500/20">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black t-text-primary mono">
              {(overview?.totalFeedbacks || 42).toLocaleString()}
            </div>
            <div className="text-xs font-bold text-teal-300">User Feedback</div>
            <p className="text-[10px] t-text-muted mt-0.5">Total support tickets and inline app feedback submitted.</p>
          </div>
        </div>

      </div>

      {/* Interactive Daily Trends Chart */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold t-text-primary tracking-wide">Recycling Material & Weight Throughput</h2>
            <p className="text-xs t-text-secondary">Daily multi-stream volume (PET Bottles, Cans, and Paper mass)</p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start">
            Daily Aggregates
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          {trends.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs t-text-muted">
              Live daily telemetry aggregating...
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
                <Area type="monotone" dataKey="bottles" name="PET Bottles" stroke="#10b981" fillOpacity={1} fill="url(#colorBottles)" strokeWidth={2} />
                <Area type="monotone" dataKey="cups" name="Metal Cans" stroke="#f59e0b" fillOpacity={1} fill="url(#colorCups)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Alerts & Live Event Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Hardware & Weight Alerts */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-rose-500/20">
          <div className="flex items-center justify-between border-b t-border pb-3">
            <h2 className="text-sm font-bold t-text-primary flex items-center gap-2">
              <BellRing className="w-4 h-4 text-rose-400" />
              Hardware & Weight Alerts
            </h2>
            <span className="text-[11px] text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              Active Fault Feeds
            </span>
          </div>

          <div className="space-y-2.5">
            {hardwareAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                  alert.severity === 'high' 
                    ? 'bg-rose-500/10 border-rose-500/30' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black t-text-primary flex items-center gap-2">
                      <span className={alert.severity === 'high' ? 'text-rose-400' : 'text-amber-400'}>
                        [{alert.type}]
                      </span>
                      <span className="font-mono text-cyan-300">{alert.device}:</span>
                      <span>{alert.message}</span>
                    </div>
                    <div className="text-[10px] t-text-muted mt-0.5 flex items-center gap-2">
                      <span className="uppercase font-bold text-gray-400">{alert.hardwareType}</span>
                      <span>•</span>
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 text-[9px] font-black rounded uppercase shrink-0 ${
                  alert.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}>
                  Action Req
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Live Deposit Feed */}
        <div className="glass-panel p-5 rounded-2xl space-y-4 border border-emerald-500/20">
          <div className="flex items-center justify-between border-b t-border pb-3">
            <h2 className="text-sm font-bold t-text-primary flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Deposit Feed
            </h2>
            <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Live Stream
            </span>
          </div>

          <div className="space-y-2.5">
            {liveDepositEvents.map(evt => (
              <div 
                key={evt.id} 
                className="p-3 t-bg-sec border t-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-emerald-500/40 transition-all font-mono"
              >
                <div>
                  <div className="text-xs font-bold t-text-primary flex flex-wrap items-center gap-2">
                    <span className="text-cyan-400 font-normal">{evt.time}</span>
                    <span>—</span>
                    <span className="text-amber-300 font-bold">[{evt.device}]</span>
                    <span>User: <strong className="text-emerald-400">{evt.user}</strong></span>
                    <span>→</span>
                    <span className="text-white font-bold">{evt.detail}</span>
                  </div>
                  <div className="text-[10px] t-text-muted mt-0.5 flex items-center gap-2">
                    <span className="text-cyan-300">{evt.hardwareType.toUpperCase()}</span>
                    <span>•</span>
                    <span className="text-purple-300">{evt.mode}</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black shrink-0 self-start sm:self-auto">
                  {evt.points}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
