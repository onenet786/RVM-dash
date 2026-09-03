import React, { useState } from 'react';
import { Scale, Cpu, AlertTriangle, CheckCircle2, RefreshCw, Layers, Sliders, HardDrive, Bell } from 'lucide-react';

export default function CapacitiesTab() {
  const [capacities, setCapacities] = useState([
    {
      device: 'RVM-01',
      type: 'rvm',
      location: 'Central Metro Hub',
      binType: 'Single Hopper Main Bin',
      measurement: 'Unit Volume',
      current: '980 units',
      max: '1,000 units',
      percent: 98,
      status: 'CRITICAL_FULL',
      alert: 'Material Bin Capacity Reached (100%)'
    },
    {
      device: 'RVM-02',
      type: 'rvm',
      location: 'North Terminal Plaza',
      binType: 'Single Hopper Main Bin',
      measurement: 'Unit Volume',
      current: '420 units',
      max: '1,000 units',
      percent: 42,
      status: 'OPTIMAL',
      alert: null
    },
    {
      device: 'RVM-04',
      type: 'rvm',
      location: 'South Interchange',
      binType: 'Single Hopper Main Bin',
      measurement: 'Unit Volume',
      current: '780 units',
      max: '1,000 units',
      percent: 78,
      status: 'ELEVATED',
      alert: null
    },
    {
      device: 'PicoDrop-01',
      type: 'picodrop',
      location: 'Green Campus Center',
      binType: 'PET & Metal Count Chutes',
      measurement: 'Unit Count',
      current: '180 / 500 items',
      max: '500 items',
      percent: 36,
      status: 'OPTIMAL',
      alert: null
    },
    {
      device: 'PicoDrop-01',
      type: 'picodrop',
      location: 'Green Campus Center',
      binType: 'Paper Load Cell Bin',
      measurement: 'Strain Gauge Weight',
      current: '4.8 kg',
      max: '15.0 kg',
      percent: 32,
      status: 'OPTIMAL',
      alert: null
    },
    {
      device: 'PicoDrop-03',
      type: 'picodrop',
      location: 'Central Library',
      binType: 'Paper Load Cell Bin',
      measurement: 'Strain Gauge Weight',
      current: '15.2 kg',
      max: '15.0 kg',
      percent: 101,
      status: 'OVERLIMIT',
      alert: 'Paper Bin Weight Limit Exceeded (> 15.0 kg)'
    },
    {
      device: 'PicoDrop-05',
      type: 'picodrop',
      location: 'West Eco District',
      binType: 'Paper Load Cell Bin',
      measurement: 'Strain Gauge Weight',
      current: '8.4 kg',
      max: '15.0 kg',
      percent: 56,
      status: 'OPTIMAL',
      alert: 'Scale Tare Drift Detected (Recalibration Needed)'
    }
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-black uppercase tracking-wider text-purple-400">
              Collection & Weight Analytics
            </span>
          </div>
          <h2 className="text-2xl font-black t-text-primary tracking-tight">
            Load & Bin Capacities
          </h2>
          <p className="text-xs t-text-secondary mt-0.5">
            Live monitoring of RVM unit capacity thresholds and PicoDrop load-scale weight limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold mono">
            Auto-Polling: Active
          </span>
        </div>
      </div>

      {/* Grid of Capacities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {capacities.map((item, idx) => {
          const isOver = item.percent >= 95;
          const isWarning = item.percent >= 75 && item.percent < 95;

          return (
            <div 
              key={idx} 
              className={`glass-panel p-5 rounded-2xl border transition-all ${
                isOver ? 'border-rose-500/50 bg-rose-950/10' : 
                isWarning ? 'border-amber-500/40 bg-amber-950/10' : 
                'border t-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${item.type === 'rvm' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {item.type === 'rvm' ? <Cpu className="w-4 h-4" /> : <Scale className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white">{item.device}</h3>
                    <p className="text-[10px] t-text-muted">{item.location}</p>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                  isOver ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' :
                  isWarning ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}>
                  {item.percent}%
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="t-text-muted">{item.binType}:</span>
                  <span className="font-mono font-bold text-white">{item.current}</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' :
                      isWarning ? 'bg-amber-400' :
                      item.type === 'rvm' ? 'bg-cyan-400' : 'bg-purple-400'
                    }`}
                    style={{ width: `${Math.min(item.percent, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] t-text-muted">
                  <span>Threshold: {item.max}</span>
                  <span className="font-mono text-gray-400">{item.measurement}</span>
                </div>

                {item.alert && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-[10px] text-rose-300 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.alert}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
