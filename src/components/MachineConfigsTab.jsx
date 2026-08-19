import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle2, X, Plus, Trash2, Server, Sliders, Layers, Sparkles } from 'lucide-react';
import DataTable from './DataTable';

const DEFAULT_SETTINGS = [
  { id: 1, materialType: 'PLASTIC', bottleSize: 'SMALL', points: 5, unit: 'per_piece', isActive: true },
  { id: 2, materialType: 'PLASTIC', bottleSize: 'MEDIUM', points: 10, unit: 'per_piece', isActive: true },
  { id: 3, materialType: 'PLASTIC', bottleSize: 'LARGE', points: 15, unit: 'per_piece', isActive: true },
  { id: 4, materialType: 'CAN', bottleSize: 'SMALL', points: 10, unit: 'per_piece', isActive: true },
  { id: 5, materialType: 'CAN', bottleSize: 'MEDIUM', points: 15, unit: 'per_piece', isActive: true },
  { id: 6, materialType: 'CAN', bottleSize: 'LARGE', points: 20, unit: 'per_piece', isActive: true },
  { id: 7, materialType: 'TETRA PAK', bottleSize: 'SMALL', points: 5, unit: 'per_piece', isActive: true },
  { id: 8, materialType: 'TETRA PAK', bottleSize: 'MEDIUM', points: 10, unit: 'per_piece', isActive: true },
  { id: 9, materialType: 'TETRA PAK', bottleSize: 'LARGE', points: 15, unit: 'per_piece', isActive: true },
  { id: 10, materialType: 'GLASS', bottleSize: 'SMALL', points: 10, unit: 'per_piece', isActive: true },
  { id: 11, materialType: 'GLASS', bottleSize: 'MEDIUM', points: 15, unit: 'per_piece', isActive: true },
  { id: 12, materialType: 'GLASS', bottleSize: 'LARGE', points: 20, unit: 'per_piece', isActive: true },
];

export default function MachineConfigsTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetMachine, setTargetMachine] = useState('ALL');

  // Dynamic Point Settings List
  const [settingsList, setSettingsList] = useState(DEFAULT_SETTINGS);

  // New Item Variant Modal/Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState('PLASTIC');
  const [customMaterial, setCustomMaterial] = useState('');
  const [newSize, setNewSize] = useState('MEDIUM');
  const [customSize, setCustomSize] = useState('');
  const [newPoints, setNewPoints] = useState(10);
  const [newUnit, setNewUnit] = useState('per_piece');

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/machines');
      if (res.ok) {
        const data = await res.json();
        setMachines(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointSettings = async (mId) => {
    try {
      const res = await fetch(`/api/machine/point-settings?machineId=${encodeURIComponent(mId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.settings && Array.isArray(data.settings) && data.settings.length > 0) {
          setSettingsList(data.settings);
        } else {
          setSettingsList(DEFAULT_SETTINGS);
        }
      }
    } catch (err) {
      console.error('[Point Settings Fetch Warning]:', err);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    fetchPointSettings(targetMachine);
  }, [targetMachine]);

  const handleUpdateItemField = (id, field, value) => {
    setSettingsList(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteItem = (id) => {
    setSettingsList(prev => prev.filter(item => item.id !== id));
  };

  const handleAddNewVariant = (e) => {
    e.preventDefault();
    const finalMaterial = (newMaterial === 'CUSTOM' ? customMaterial : newMaterial).trim().toUpperCase() || 'PLASTIC';
    const finalSize = (newSize === 'CUSTOM' ? customSize : newSize).trim().toUpperCase() || 'MEDIUM';

    const newItem = {
      id: Date.now(),
      materialType: finalMaterial,
      bottleSize: finalSize,
      points: parseInt(newPoints) || 10,
      unit: newUnit,
      isActive: true
    };

    setSettingsList(prev => [...prev, newItem]);
    setShowAddModal(false);
    setCustomMaterial('');
    setCustomSize('');
    setNewPoints(10);
  };

  const handleSyncPointsConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const pSmall = settingsList.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'SMALL')?.points || 5;
      const pMed = settingsList.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'MEDIUM')?.points || 10;
      const pLg = settingsList.find(s => s.materialType === 'PLASTIC' && s.bottleSize === 'LARGE')?.points || 15;
      const cSmall = settingsList.find(s => s.materialType === 'CAN' && s.bottleSize === 'SMALL')?.points || 10;
      const cMed = settingsList.find(s => s.materialType === 'CAN' && s.bottleSize === 'MEDIUM')?.points || 15;
      const cLg = settingsList.find(s => s.materialType === 'CAN' && s.bottleSize === 'LARGE')?.points || 20;

      // 1. Post to dynamic point-settings endpoint
      const res = await fetch('/api/machine/point-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMachine,
          settings: settingsList
        })
      });

      // 2. Also post to legacy config endpoint for dual compatibility
      try {
        await fetch('/api/machine/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetMachine,
            pointsPerPlasticBottle: pMed,
            pointsPlasticSmall: pSmall,
            pointsPlasticMedium: pMed,
            pointsPlasticLarge: pLg,
            pointsPerAluminiumCan: cMed,
            pointsCanSmall: cSmall,
            pointsCanMedium: cMed,
            pointsCanLarge: cLg
          })
        });
      } catch (legacyErr) {}

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message || `Point Settings table updated & synced for ${targetMachine === 'ALL' ? 'ALL RVM Machines' : targetMachine}!`);
        setTimeout(() => setSuccessMessage(''), 7000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getMaterialColor = (mat) => {
    const m = String(mat).toUpperCase();
    if (m.includes('PLASTIC')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (m.includes('CAN') || m.includes('ALUMINIUM') || m.includes('METAL')) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (m.includes('TETRA') || m.includes('CARTON') || m.includes('PAPER')) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    if (m.includes('GLASS')) return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Success Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-bold animate-fade-in shadow-lg shadow-emerald-500/10">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border border-cyan-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Master Point Settings Control Panel</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Dynamic RVM Point Settings Table</h2>
          <p className="text-xs t-text-secondary mt-1">
            Manage, edit, and dynamically add new item variants & point values. Sync rules instantly across ALL RVMs or target a selected RVM kiosk.
          </p>
        </div>

        <button
          onClick={() => { fetchMachines(); fetchPointSettings(targetMachine); }}
          className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Table & Controls Card */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-6 shadow-2xl">
        
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b t-border pb-5">
          <div className="w-full sm:w-80">
            <label className="block text-xs font-bold text-cyan-400 mb-1.5 uppercase tracking-wider">
              🎯 Target RVM Machine / Fleet Scope
            </label>
            <select
              value={targetMachine}
              onChange={e => setTargetMachine(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-inner"
            >
              <option value="ALL">🌟 ALL MACHINES (Fleet Global Rule Sync)</option>
              {machines.map(m => (
                <option key={m.machineId} value={m.machineId}>
                  🖥️ {m.machineId} — {m.name || 'RVM Kiosk'} ({m.location || 'Location'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>+ Add New Item Variant</span>
            </button>

            <button
              type="button"
              onClick={handleSyncPointsConfig}
              disabled={saving}
              className="px-6 py-2.5 text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Pushing Rules...' : '🚀 Save & Push Point Settings to RVMs'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Point Settings Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border t-border bg-slate-950/60">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 border-b t-border">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Material Category</th>
                <th className="py-3.5 px-4">Size / Variant</th>
                <th className="py-3.5 px-4">Points Awarded (pts)</th>
                <th className="py-3.5 px-4">Calculation Unit</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y t-border text-xs font-medium">
              {settingsList.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 font-bold">{idx + 1}</td>
                  
                  {/* Material Type Badge */}
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getMaterialColor(item.materialType)}`}>
                      {item.materialType}
                    </span>
                  </td>

                  {/* Bottle Size / Variant */}
                  <td className="py-3 px-4 font-mono font-bold text-slate-200">
                    <input
                      type="text"
                      value={item.bottleSize}
                      onChange={e => handleUpdateItemField(item.id, 'bottleSize', e.target.value.toUpperCase())}
                      className="w-32 px-2.5 py-1 bg-slate-900 border t-border rounded-lg text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
                    />
                  </td>

                  {/* Points Input */}
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={item.points}
                      onChange={e => handleUpdateItemField(item.id, 'points', parseInt(e.target.value) || 0)}
                      className="w-24 px-3 py-1 bg-slate-900 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                    />
                  </td>

                  {/* Calculation Unit */}
                  <td className="py-3 px-4">
                    <select
                      value={item.unit || 'per_piece'}
                      onChange={e => handleUpdateItemField(item.id, 'unit', e.target.value)}
                      className="px-2.5 py-1 bg-slate-900 border t-border rounded-lg text-xs font-bold text-slate-300 focus:outline-none"
                    >
                      <option value="per_piece">Per Piece (Per Item)</option>
                      <option value="per_gram">Per Gram (g)</option>
                      <option value="per_kg">Per Kilogram (Kg)</option>
                    </select>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleUpdateItemField(item.id, 'isActive', !item.isActive)}
                      className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase border transition-all ${
                        item.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {item.isActive ? 'ACTIVE 🟢' : 'DISABLED 🔴'}
                    </button>
                  </td>

                  {/* Delete Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg transition-all"
                      title="Remove Variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add New Item Variant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-fade-in">
            
            <div className="flex items-center justify-between border-b t-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-extrabold text-slate-100">Add New Item & Size Variant</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewVariant} className="space-y-4 text-xs font-bold">
              
              {/* Material Type */}
              <div>
                <label className="block text-slate-400 mb-1">Material Category</label>
                <select
                  value={newMaterial}
                  onChange={e => setNewMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border t-border rounded-xl text-slate-200"
                >
                  <option value="PLASTIC">🥤 PLASTIC (PET Bottles)</option>
                  <option value="CAN">🥫 CAN (Aluminium / Metal)</option>
                  <option value="TETRA PAK">📦 TETRA PAK (Juice Pack / Carton)</option>
                  <option value="GLASS">🍾 GLASS (Glass Bottles)</option>
                  <option value="PAPER">📄 PAPER (Paper & Cardboard)</option>
                  <option value="CUSTOM">+ CUSTOM MATERIAL TYPE...</option>
                </select>
                {newMaterial === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter Custom Material (e.g. EWASTE, TIN)"
                    value={customMaterial}
                    onChange={e => setCustomMaterial(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-xl text-cyan-300 mt-2"
                    required
                  />
                )}
              </div>

              {/* Bottle Size / Variant */}
              <div>
                <label className="block text-slate-400 mb-1">Size / Variant Name</label>
                <select
                  value={newSize}
                  onChange={e => setNewSize(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border t-border rounded-xl text-slate-200"
                >
                  <option value="SMALL">SMALL (Standard Small)</option>
                  <option value="MEDIUM">MEDIUM (Standard Medium)</option>
                  <option value="LARGE">LARGE (Standard Large)</option>
                  <option value="CUSTOM">+ CUSTOM SIZE / VARIANT NAME...</option>
                </select>
                {newSize === 'CUSTOM' && (
                  <input
                    type="text"
                    placeholder="Enter Custom Size (e.g. 500ML, 1.5L, JUMBO)"
                    value={customSize}
                    onChange={e => setCustomSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-cyan-500/40 rounded-xl text-cyan-300 mt-2"
                    required
                  />
                )}
              </div>

              {/* Points & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Points Awarded</label>
                  <input
                    type="number"
                    value={newPoints}
                    onChange={e => setNewPoints(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-emerald-400 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Calculation Unit</label>
                  <select
                    value={newUnit}
                    onChange={e => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border t-border rounded-xl text-slate-200"
                  >
                    <option value="per_piece">Per Piece</option>
                    <option value="per_gram">Per Gram</option>
                    <option value="per_kg">Per Kg</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 text-slate-950 font-extrabold rounded-xl hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                >
                  + Add Variant to Matrix
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Relational Table View */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border t-border">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
            Raw Relational Table View: machine_variant_settings
          </h3>
        </div>
        <DataTable collectionName="machine_configs" displayName="RVM Relational Table" />
      </div>

    </div>
  );
}
