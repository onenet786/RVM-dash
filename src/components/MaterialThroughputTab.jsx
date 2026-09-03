import React, { useState } from 'react';
import { Recycle, Scale, Cpu, Box, Sparkles, TrendingUp, RefreshCw, BarChart2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';

export default function MaterialThroughputTab() {
  const [streamFilter, setStreamFilter] = useState('all'); // all | rvm | picodrop

  const dailyThroughputData = [
    { day: 'Mon', rvmUnits: 1420, picoUnits: 890, picoPaperKg: 24.5 },
    { day: 'Tue', rvmUnits: 1680, picoUnits: 940, picoPaperKg: 28.2 },
    { day: 'Wed', rvmUnits: 1550, picoUnits: 1020, picoPaperKg: 31.0 },
    { day: 'Thu', rvmUnits: 1820, picoUnits: 1150, picoPaperKg: 34.8 },
    { day: 'Fri', rvmUnits: 2100, picoUnits: 1380, picoPaperKg: 42.1 },
    { day: 'Sat', rvmUnits: 2450, picoUnits: 1620, picoPaperKg: 48.6 },
    { day: 'Sun', rvmUnits: 1980, picoUnits: 1240, picoPaperKg: 36.4 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Recycle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              Collection & Weight Analytics
            </span>
          </div>
          <h2 className="text-2xl font-black t-text-primary tracking-tight">
            Material Throughput Telemetry
          </h2>
          <p className="text-xs t-text-secondary mt-0.5">
            Unified telemetry combining count-based materials (RVM & PicoDrop) and weight-based Paper (PicoDrop load scales).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold mono">
            Real-Time Telemetry Pipeline
          </span>
        </div>
      </div>

      {/* 4 Stream Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PET Bottles */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted">Plastic & PET</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Unit Count
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mono mt-2">8,420 Units</div>
          <div className="mt-2 text-[11px] t-text-muted space-y-0.5">
            <div className="flex justify-between"><span>RVM Hopper:</span><strong className="text-white">5,140</strong></div>
            <div className="flex justify-between"><span>PicoDrop Chute:</span><strong className="text-white">3,280</strong></div>
          </div>
        </div>

        {/* Metal Cans */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted">Metals & Cans</span>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              Unit Count
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400 mono mt-2">3,615 Units</div>
          <div className="mt-2 text-[11px] t-text-muted space-y-0.5">
            <div className="flex justify-between"><span>RVM Hopper:</span><strong className="text-white">2,115</strong></div>
            <div className="flex justify-between"><span>PicoDrop Chute:</span><strong className="text-white">1,500</strong></div>
          </div>
        </div>

        {/* Cardboard / TetraPak */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold t-text-muted">Cardboard / TetraPak</span>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
              RVM Chute Only
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-400 mono mt-2">1,240 Units</div>
          <div className="mt-2 text-[11px] t-text-muted space-y-0.5">
            <div className="flex justify-between"><span>Optical Recognition:</span><strong className="text-white">Active</strong></div>
            <div className="flex justify-between"><span>Reward:</span><strong className="text-emerald-400">Per Unit</strong></div>
          </div>
        </div>

        {/* Paper Weight */}
        <div className="glass-panel p-5 rounded-2xl border-l-4 border-l-purple-500 bg-purple-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-300">Paper Mass (PicoDrop)</span>
            <span className="text-[10px] font-black text-purple-200 bg-purple-500/30 px-2 py-0.5 rounded">
              Load Cell
            </span>
          </div>
          <div className="text-2xl font-black text-purple-300 mono mt-2">148.5 kg</div>
          <div className="mt-2 text-[11px] t-text-muted space-y-0.5">
            <div className="flex justify-between"><span>Strain Gauge:</span><strong className="text-purple-200">0.1g Res</strong></div>
            <div className="flex justify-between"><span>Reward:</span><strong className="text-purple-300 font-bold">Per kg</strong></div>
          </div>
        </div>

      </div>

      {/* Dual Axis Chart */}
      <div className="glass-panel p-6 rounded-3xl border t-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black t-text-primary uppercase tracking-wide">
              Weekly Multi-Stream Throughput: Unit Intake vs Paper Mass (kg)
            </h3>
            <p className="text-xs t-text-muted">Tracking RVM and PicoDrop item volumes alongside load-scale kilograms.</p>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Telemetry Feed
          </span>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyThroughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <YAxis yAxisId="left" stroke="var(--text-muted)" fontSize={11} />
              <YAxis yAxisId="right" orientation="right" stroke="#c084fc" fontSize={11} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '12px' }} 
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar yAxisId="left" dataKey="rvmUnits" name="RVM Hopper Units" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="left" dataKey="picoUnits" name="PicoDrop Count Units" fill="#10b981" radius={[6, 6, 0, 0]} />
              <Bar yAxisId="right" dataKey="picoPaperKg" name="PicoDrop Paper (kg)" fill="#a855f7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
