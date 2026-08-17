import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, Clock, Activity, RefreshCw, Server, Plus, MapPin, Edit3, X } from 'lucide-react';
import DataTable from './DataTable';

export default function MachineHealthTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineId, setNewMachineId] = useState('RVM-001');
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const getMachinesQuery = () => {
    try {
      const u = JSON.parse(localStorage.getItem('rvm_auth_user') || '{}');
      if (!u.assignedMachines) return '';
      const arr = Array.isArray(u.assignedMachines) ? u.assignedMachines : [u.assignedMachines];
      if (arr.includes('*')) return '';
      return `?assignedMachines=${encodeURIComponent(arr.join(','))}`;
    } catch (e) {
      return '';
    }
  };

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/machines${getMachinesQuery()}`);
      if (res.ok) {
        setMachines(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    if (!newMachineId.trim()) return;
    try {
      setSaving(true);
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: newMachineId.trim(),
          name: newMachineName.trim(),
          location: newMachineLocation.trim()
        })
      });
      if (res.ok) {
        setShowAddModal(false);
        const savedId = newMachineId.trim();
        const savedName = newMachineName.trim() || savedId;
        setSuccessMessage(`Machine "${savedId}" (${savedName}) saved successfully!`);
        setNewMachineName('');
        setNewMachineLocation('');
        fetchMachines();
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (m) => {
    setNewMachineId(m.machineId);
    setNewMachineName(m.name || '');
    setNewMachineLocation(m.location || '');
    setShowAddModal(true);
  };

  useEffect(() => {
    fetchMachines();
    const interval = setInterval(fetchMachines, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Hardware Fleet Monitoring</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Reverse Vending Machine Status</h2>
          <p className="text-xs t-text-secondary mt-1">Real-time operational health, live heartbeat pings, and machine location tags.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setNewMachineId(`RVM-00${machines.length + 1}`);
              setNewMachineName('');
              setNewMachineLocation('');
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl font-bold text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register RVM Machine</span>
          </button>

          <button
            onClick={fetchMachines}
            className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Fleet Summary Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-cyan-500/20">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Configured RVMs</span>
            <span className="text-xl font-extrabold t-text-primary mono">{machines.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-emerald-500/20">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Online Fleet</span>
            <span className="text-xl font-extrabold text-emerald-400 mono">
              {machines.filter(m => m.status === 'ONLINE' || m.isOnline).length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-rose-500/20">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Offline Fleet</span>
            <span className="text-xl font-extrabold text-rose-400 mono">
              {machines.filter(m => m.status !== 'ONLINE' && !m.isOnline).length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl flex items-center gap-3 border border-amber-500/20">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Active Alerts</span>
            <span className="text-xl font-extrabold text-amber-400 mono">
              {machines.reduce((acc, m) => acc + (m.alertCount || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Machine Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center t-text-muted">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
          </div>
        ) : machines.length === 0 ? (
          <div className="col-span-full glass-panel p-8 text-center t-text-muted rounded-2xl">
            No registered machines currently reporting data.
          </div>
        ) : (
          machines.map(m => {
            const hasAlerts = m.alertCount > 0;
            const isOnline = m.status === 'ONLINE' || m.isOnline;
            return (
              <div 
                key={m.machineId} 
                className={`glass-panel p-5 rounded-2xl space-y-4 border transition-all ${
                  isOnline ? 'border-emerald-500/30' : 'border-rose-500/30 bg-rose-950/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold t-text-primary text-sm mono">{m.machineId}</h4>
                        <button onClick={() => openEditModal(m)} className="t-text-muted hover:text-cyan-400">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-cyan-300">{m.name || `RVM Unit ${m.machineId}`}</div>
                      <span className="text-[11px] t-text-muted flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-400" />
                        {m.location || 'Islamabad Main Campus'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-full flex items-center gap-1.5 ${
                      isOnline
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
                      {isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>

                    {hasAlerts && (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                        Bin Alert
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs t-bg-sec p-3 rounded-xl border t-border">
                  <div>
                    <span className="t-text-muted block text-[10px] font-bold">Total Sessions</span>
                    <span className="font-bold t-text-primary mono">{m.sessionCount}</span>
                  </div>
                  <div>
                    <span className="t-text-muted block text-[10px] font-bold">Total Bottles</span>
                    <span className="font-bold t-text-primary mono">{m.totalBottles}</span>
                  </div>
                  <div>
                    <span className="t-text-muted block text-[10px] font-bold">Points Issued</span>
                    <span className="font-bold text-amber-400 mono">{m.totalPoints}</span>
                  </div>
                  <div>
                    <span className="t-text-muted block text-[10px] font-bold">Bin Alerts</span>
                    <span className={`font-bold mono ${m.alertCount > 0 ? 'text-rose-400' : 't-text-secondary'}`}>
                      {m.alertCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] t-text-muted border-t t-border pt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    Last Ping: {m.lastPingAt || m.lastActive ? new Date(m.lastPingAt || m.lastActive).toLocaleTimeString() : 'Never'}
                  </span>
                  <span className={`font-bold text-[11px] ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {isOnline ? 'Live Ping Active' : 'Offline'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold t-text-primary">
                  Register RVM Machine & Location
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1 t-text-muted hover:t-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMachine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Machine ID Code
                </label>
                <input 
                  type="text" 
                  value={newMachineId}
                  onChange={e => setNewMachineId(e.target.value)}
                  placeholder="e.g. RVM-001"
                  required
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl font-mono text-sm t-text-primary focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Machine Display Name
                </label>
                <input 
                  type="text" 
                  value={newMachineName}
                  onChange={e => setNewMachineName(e.target.value)}
                  placeholder="e.g. ISP Main Entrance Unit #1"
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Installation Location / Address
                </label>
                <input 
                  type="text" 
                  value={newMachineLocation}
                  onChange={e => setNewMachineLocation(e.target.value)}
                  placeholder="e.g. Sector H-8/4, Islamabad Campus"
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold t-text-secondary hover:t-text-primary rounded-xl border t-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  {saving ? 'Saving...' : 'Save Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relational Database Machines Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
          All Registered Fleet Machines (Relational Table)
        </h3>
        <DataTable collectionName="machines" />
      </div>

      {/* Bin Notifications Full Table */}
      <div className="pt-4">
        <DataTable collectionName="binfullnotifications" displayName="Bin Full Alert Notifications Log" />
      </div>
    </div>
  );
}
