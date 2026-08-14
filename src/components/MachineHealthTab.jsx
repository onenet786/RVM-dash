import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, Clock, Activity, RefreshCw, Server } from 'lucide-react';
import DataTable from './DataTable';

export default function MachineHealthTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        setMachines(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Hardware Fleet Monitoring</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Reverse Vending Machine Status</h2>
          <p className="text-xs text-slate-400 mt-1">Operational health, bin level sensors, and machine activity diagnostics.</p>
        </div>

        <button
          onClick={fetchMachines}
          className="p-2 text-slate-300 hover:text-white bg-slate-800 border border-slate-700 rounded-xl transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Machine Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : machines.length === 0 ? (
          <div className="col-span-full glass-panel p-8 text-center text-slate-500 rounded-2xl">
            No registered machines currently reporting data.
          </div>
        ) : (
          machines.map(m => {
            const hasAlerts = m.alertCount > 0;
            return (
              <div 
                key={m.machineId} 
                className={`glass-panel p-5 rounded-2xl space-y-4 border transition-all ${
                  hasAlerts ? 'border-rose-500/40 bg-rose-950/10' : 'border-emerald-500/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      hasAlerts ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm mono">{m.machineId}</h4>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {m.lastActive ? new Date(m.lastActive).toLocaleTimeString() : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full ${
                    hasAlerts ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {hasAlerts ? 'Alert Triggered' : 'Operational'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Sessions</span>
                    <span className="font-bold text-white mono">{m.sessionCount}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Points Issued</span>
                    <span className="font-bold text-cyan-300 mono">{m.totalPoints}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Bottles</span>
                    <span className="font-bold text-emerald-400 mono">{m.totalBottles}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Cups</span>
                    <span className="font-bold text-amber-400 mono">{m.totalCups}</span>
                  </div>
                </div>

                {hasAlerts && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-between text-xs text-rose-300">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      {m.alertCount} Bin Full Alert(s)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {m.lastAlert ? new Date(m.lastAlert).toLocaleDateString() : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bin Notifications Full Table */}
      <div className="pt-4">
        <DataTable collectionName="binfullnotifications" displayName="Bin Full Alert Notifications Log" />
      </div>
    </div>
  );
}
