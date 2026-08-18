import React, { useState, useEffect } from 'react';
import { Cpu, Plus, RefreshCw, Edit3, MapPin, CheckCircle2, Server, X } from 'lucide-react';
import DataTable from './DataTable';

export default function RvmManagementTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);

  // Form State for Add / Edit
  const [machineId, setMachineId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('ONLINE');

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        const data = await res.json();
        setMachines(data || []);
      }
    } catch (err) {
      console.error('Error fetching machines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMachine(null);
    setMachineId(`RVM-00${machines.length + 1}`);
    setName('');
    setLocation('');
    setStatus('ONLINE');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingMachine(m);
    setMachineId(m.machineId);
    setName(m.name || '');
    setLocation(m.location || '');
    setStatus(m.status || 'ONLINE');
    setShowAddModal(true);
  };

  const handleSaveMachine = async (e) => {
    e.preventDefault();
    if (!machineId) return;

    try {
      setSaving(true);
      const res = await fetch('/api/machines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId,
          name: name || `RVM Machine ${machineId}`,
          location: location || 'Main Campus',
          status
        })
      });

      if (res.ok) {
        setMessage(`✅ RVM Machine '${machineId}' saved successfully!`);
        setShowAddModal(false);
        fetchMachines();
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error saving machine:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Banner */}
      {message && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">RVM Management & Fleet Setup</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">RVM Fleet Registration & Editor</h2>
          <p className="text-xs t-text-secondary mt-1">
            Add new RVM units, update machine display names, assign installation locations, and manage fleet configuration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-cyan-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register New RVM Machine</span>
          </button>

          <button
            onClick={fetchMachines}
            className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Registered RVM Cards with Edit Action */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {machines.map(m => (
          <div 
            key={m.machineId} 
            className="glass-panel p-5 rounded-2xl space-y-4 border border-slate-800 hover:border-cyan-500/40 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold t-text-primary text-base flex items-center gap-2">
                    {m.name || `RVM ${m.machineId}`}
                  </h3>
                  <span className="text-xs font-mono t-text-muted">ID: {m.machineId}</span>
                </div>
              </div>

              <button
                onClick={() => handleOpenEditModal(m)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-400 border border-slate-700/80 rounded-xl text-xs font-bold transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit RVM</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="t-text-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {m.location || 'Location Not Set'}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                m.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {m.status || 'ONLINE'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Machine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full border border-cyan-500/40 space-y-4">
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold t-text-primary">
                  {editingMachine ? `Edit RVM Machine (${machineId})` : 'Register New RVM Machine'}
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
                  value={machineId}
                  disabled={!!editingMachine}
                  onChange={e => setMachineId(e.target.value)}
                  placeholder="e.g. RVM-001, RVM-RWP"
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Machine Display Name
                </label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. ISP Main Entrance Unit #1"
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Installation Location / Address
                </label>
                <input 
                  type="text" 
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Sector H-8/4, Islamabad Campus"
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm t-text-primary focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold t-text-muted mb-1 uppercase tracking-wider">
                  Operational Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/80 border t-border rounded-xl text-sm font-bold text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="ONLINE">ONLINE (Active)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Under Repair)</option>
                  <option value="OFFLINE">OFFLINE (Inactive)</option>
                </select>
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
                  className="px-5 py-2 text-xs font-extrabold bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                  <span>{saving ? 'Saving...' : 'Save RVM Machine'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Relational Database Machines Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
          All Registered Fleet Machines (Relational Master Table)
        </h3>
        <DataTable collectionName="machines" displayName="RVM Relational Database Table" />
      </div>

    </div>
  );
}
