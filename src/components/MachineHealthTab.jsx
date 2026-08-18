import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, CheckCircle2, Clock, Activity, RefreshCw, Server, Plus, MapPin, Edit3, X, Settings } from 'lucide-react';
import DataTable from './DataTable';

export default function MachineHealthTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Register/Edit Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMachineId, setNewMachineId] = useState('RVM-001');
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineLocation, setNewMachineLocation] = useState('');

  // Points & Unit Configuration Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [targetMachine, setTargetMachine] = useState('ALL');
  
  // Plastic Variants
  const [pointsPlastic, setPointsPlastic] = useState(10);
  const [pointsPlasticSmall, setPointsPlasticSmall] = useState(5);
  const [pointsPlasticMedium, setPointsPlasticMedium] = useState(10);
  const [pointsPlasticLarge, setPointsPlasticLarge] = useState(15);
  const [plasticUnit, setPlasticUnit] = useState('per_piece');

  // Can / Aluminium Variants
  const [pointsAluminium, setPointsAluminium] = useState(20);
  const [pointsCanSmall, setPointsCanSmall] = useState(10);
  const [pointsCanMedium, setPointsCanMedium] = useState(15);
  const [pointsCanLarge, setPointsCanLarge] = useState(20);
  const [aluminiumUnit, setAluminiumUnit] = useState('per_piece');

  // Glass Variants
  const [pointsGlass, setPointsGlass] = useState(15);
  const [pointsGlassSmall, setPointsGlassSmall] = useState(10);
  const [pointsGlassMedium, setPointsGlassMedium] = useState(15);
  const [pointsGlassLarge, setPointsGlassLarge] = useState(20);
  const [glassUnit, setGlassUnit] = useState('per_piece');

  // Paper Variant
  const [pointsPaper, setPointsPaper] = useState(15);
  const [paperUnit, setPaperUnit] = useState('per_kg');

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
          location: newMachineLocation.trim(),
          pointsPerPlasticBottle: parseInt(pointsPlastic) || 10,
          plasticUnit,
          pointsPerAluminiumCan: parseInt(pointsAluminium) || 20,
          aluminiumUnit,
          pointsPerPaperKg: parseInt(pointsPaper) || 15,
          paperUnit,
          pointsPerGlass: parseInt(pointsGlass) || 15,
          glassUnit
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

  const handleSyncPointsConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/machine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMachine,
          pointsPerPlasticBottle: parseInt(pointsPlastic) || 10,
          pointsPlasticSmall: parseInt(pointsPlasticSmall) || 5,
          pointsPlasticMedium: parseInt(pointsPlasticMedium) || 10,
          pointsPlasticLarge: parseInt(pointsPlasticLarge) || 15,
          plasticUnit,
          pointsPerAluminiumCan: parseInt(pointsAluminium) || 20,
          pointsCanSmall: parseInt(pointsCanSmall) || 10,
          pointsCanMedium: parseInt(pointsCanMedium) || 15,
          pointsCanLarge: parseInt(pointsCanLarge) || 20,
          aluminiumUnit,
          pointsPerPaperKg: parseInt(pointsPaper) || 15,
          paperUnit,
          pointsPerGlass: parseInt(pointsGlass) || 15,
          pointsGlassSmall: parseInt(pointsGlassSmall) || 10,
          pointsGlassMedium: parseInt(pointsGlassMedium) || 15,
          pointsGlassLarge: parseInt(pointsGlassLarge) || 20,
          glassUnit
        })
      });
      if (res.ok) {
        setShowConfigModal(false);
        const data = await res.json();
        setSuccessMessage(data.message || 'Points rules successfully synced to RVMs!');
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
    setPointsPlastic(m.pointsPerPlasticBottle ?? 10);
    setPointsPlasticSmall(m.pointsPlasticSmall ?? 5);
    setPointsPlasticMedium(m.pointsPlasticMedium ?? 10);
    setPointsPlasticLarge(m.pointsPlasticLarge ?? 15);
    setPlasticUnit(m.plasticUnit || 'per_piece');

    setPointsAluminium(m.pointsPerAluminiumCan ?? 20);
    setPointsCanSmall(m.pointsCanSmall ?? 10);
    setPointsCanMedium(m.pointsCanMedium ?? 15);
    setPointsCanLarge(m.pointsCanLarge ?? 20);
    setAluminiumUnit(m.aluminiumUnit || 'per_piece');

    setPointsPaper(m.pointsPerPaperKg ?? 15);
    setPaperUnit(m.paperUnit || 'per_kg');

    setPointsGlass(m.pointsPerGlass ?? 15);
    setPointsGlassSmall(m.pointsGlassSmall ?? 10);
    setPointsGlassMedium(m.pointsGlassMedium ?? 15);
    setPointsGlassLarge(m.pointsGlassLarge ?? 20);
    setGlassUnit(m.glassUnit || 'per_piece');
    setShowAddModal(true);
  };

  const openConfigModalForMachine = (m) => {
    setTargetMachine(m ? m.machineId : 'ALL');
    if (m) {
      setPointsPlastic(m.pointsPerPlasticBottle ?? 10);
      setPointsPlasticSmall(m.pointsPlasticSmall ?? 5);
      setPointsPlasticMedium(m.pointsPlasticMedium ?? 10);
      setPointsPlasticLarge(m.pointsPlasticLarge ?? 15);
      setPlasticUnit(m.plasticUnit || 'per_piece');

      setPointsAluminium(m.pointsPerAluminiumCan ?? 20);
      setPointsCanSmall(m.pointsCanSmall ?? 10);
      setPointsCanMedium(m.pointsCanMedium ?? 15);
      setPointsCanLarge(m.pointsCanLarge ?? 20);
      setAluminiumUnit(m.aluminiumUnit || 'per_piece');

      setPointsPaper(m.pointsPerPaperKg ?? 15);
      setPaperUnit(m.paperUnit || 'per_kg');

      setPointsGlass(m.pointsPerGlass ?? 15);
      setPointsGlassSmall(m.pointsGlassSmall ?? 10);
      setPointsGlassMedium(m.pointsGlassMedium ?? 15);
      setPointsGlassLarge(m.pointsGlassLarge ?? 20);
      setGlassUnit(m.glassUnit || 'per_piece');
    }
    setShowConfigModal(true);
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
            onClick={() => openConfigModalForMachine(null)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl font-bold text-xs transition-all"
          >
            <Settings className="w-4 h-4 text-emerald-400" />
            <span>⚙️ Sync Points Rules (`machine_configs`)</span>
          </button>

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

                {/* machine_configs Points Summary Bar */}
                <div className="text-[11px] font-medium text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-400 text-[10px] uppercase">Reward Rates:</span>
                  <span className="text-cyan-300 font-mono text-[11px]">
                    🥤 {m.pointsPerPlasticBottle ?? 10} pts | 🥫 {m.pointsPerAluminiumCan ?? 20} pts | 📦 {m.pointsPerPaperKg ?? 15} pts/kg
                  </span>
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

              {/* machine_configs Points Rules */}
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <span className="block text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  ⚙️ Reward Points Rates (machine_configs)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      🥤 Plastic (pts)
                    </label>
                    <input 
                      type="number" 
                      value={pointsPlastic}
                      onChange={e => setPointsPlastic(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900/80 border t-border rounded-xl font-mono text-xs text-emerald-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      🥫 Can (pts)
                    </label>
                    <input 
                      type="number" 
                      value={pointsAluminium}
                      onChange={e => setPointsAluminium(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900/80 border t-border rounded-xl font-mono text-xs text-amber-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">
                      📦 Paper/Kg (pts)
                    </label>
                    <input 
                      type="number" 
                      value={pointsPaper}
                      onChange={e => setPointsPaper(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900/80 border t-border rounded-xl font-mono text-xs text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
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
                  {saving ? 'Saving...' : 'Save Machine & Rates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Points & Calculation Unit Sync Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full border border-emerald-500/40 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold t-text-primary">
                    Points & Calculation Unit Rules (`machine_configs`)
                  </h3>
                  <p className="text-[11px] t-text-muted">Configure reward rates & calculation units (per piece, per gram, or per kg) for RVM Kiosks.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="p-1 t-text-muted hover:t-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSyncPointsConfig} className="space-y-4">
              
              {/* Target RVM Selection */}
              <div>
                <label className="block text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">
                  Target Machine(s)
                </label>
                <select 
                  value={targetMachine}
                  onChange={e => setTargetMachine(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">🌟 ALL MACHINES (Global Bulk Fleet Sync)</option>
                  {machines.map(m => (
                    <option key={m.machineId} value={m.machineId}>
                      🖥️ {m.machineId} — {m.name || 'RVM Kiosk'} ({m.location || 'Location'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1. Plastic Bottle Rules & Size Variants */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    🥤 Plastic Bottle Rules & Size Variants
                  </span>
                  <div className="w-1/2">
                    <select
                      value={plasticUnit}
                      onChange={e => setPlasticUnit(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-bold text-slate-200"
                    >
                      <option value="per_piece">Per Piece (Per Item)</option>
                      <option value="per_gram">Per Gram (g)</option>
                      <option value="per_kg">Per Kilogram (Kg)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                    <input 
                      type="number"
                      value={pointsPlasticSmall}
                      onChange={e => setPointsPlasticSmall(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                    <input 
                      type="number"
                      value={pointsPlasticMedium}
                      onChange={e => setPointsPlasticMedium(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                    <input 
                      type="number"
                      value={pointsPlasticLarge}
                      onChange={e => setPointsPlasticLarge(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Aluminium Can Rules & Size Variants */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    🥫 Aluminium Can Rules & Size Variants
                  </span>
                  <div className="w-1/2">
                    <select
                      value={aluminiumUnit}
                      onChange={e => setAluminiumUnit(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-bold text-slate-200"
                    >
                      <option value="per_piece">Per Piece (Per Item)</option>
                      <option value="per_gram">Per Gram (g)</option>
                      <option value="per_kg">Per Kilogram (Kg)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                    <input 
                      type="number"
                      value={pointsCanSmall}
                      onChange={e => setPointsCanSmall(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                    <input 
                      type="number"
                      value={pointsCanMedium}
                      onChange={e => setPointsCanMedium(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                    <input 
                      type="number"
                      value={pointsCanLarge}
                      onChange={e => setPointsCanLarge(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-amber-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Paper / Cardboard Rules */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    📦 Paper / Cardboard Recycling Rule
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Point Rate</label>
                    <input 
                      type="number"
                      value={pointsPaper}
                      onChange={e => setPointsPaper(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-cyan-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Calculation Unit</label>
                    <select
                      value={paperUnit}
                      onChange={e => setPaperUnit(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-bold text-slate-200"
                    >
                      <option value="per_kg">Per Kilogram (Kg)</option>
                      <option value="per_gram">Per Gram (g)</option>
                      <option value="per_piece">Per Piece (Per Item)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Glass Bottle Rules & Size Variants */}
              <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                    🍾 Glass Bottle Rules & Size Variants
                  </span>
                  <div className="w-1/2">
                    <select
                      value={glassUnit}
                      onChange={e => setGlassUnit(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-bold text-slate-200"
                    >
                      <option value="per_piece">Per Piece (Per Item)</option>
                      <option value="per_gram">Per Gram (g)</option>
                      <option value="per_kg">Per Kilogram (Kg)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                    <input 
                      type="number"
                      value={pointsGlassSmall}
                      onChange={e => setPointsGlassSmall(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-purple-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                    <input 
                      type="number"
                      value={pointsGlassMedium}
                      onChange={e => setPointsGlassMedium(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-purple-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                    <input 
                      type="number"
                      value={pointsGlassLarge}
                      onChange={e => setPointsGlassLarge(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-950 border t-border rounded-lg text-xs font-mono text-purple-400 font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-xs font-bold t-text-secondary hover:t-text-primary rounded-xl border t-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Syncing...' : '🚀 Save & Push Point Rules to Kiosks'}</span>
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
