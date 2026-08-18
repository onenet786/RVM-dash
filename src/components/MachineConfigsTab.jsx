import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, CheckCircle2, X, Cpu, Table, Server } from 'lucide-react';
import DataTable from './DataTable';

export default function MachineConfigsTab() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Target Machine
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

  useEffect(() => {
    fetchMachines();
  }, []);

  // When target machine changes, load its existing config
  useEffect(() => {
    if (targetMachine !== 'ALL' && machines.length > 0) {
      const selected = machines.find(m => m.machineId === targetMachine);
      if (selected) {
        setPointsPlasticSmall(selected.pointsPlasticSmall ?? 5);
        setPointsPlasticMedium(selected.pointsPlasticMedium ?? 10);
        setPointsPlasticLarge(selected.pointsPlasticLarge ?? 15);
        setPlasticUnit(selected.plasticUnit || 'per_piece');

        setPointsCanSmall(selected.pointsCanSmall ?? 10);
        setPointsCanMedium(selected.pointsCanMedium ?? 15);
        setPointsCanLarge(selected.pointsCanLarge ?? 20);
        setAluminiumUnit(selected.aluminiumUnit || 'per_piece');

        setPointsPaper(selected.pointsPerPaperKg ?? 15);
        setPaperUnit(selected.paperUnit || 'per_kg');

        setPointsGlassSmall(selected.pointsGlassSmall ?? 10);
        setPointsGlassMedium(selected.pointsGlassMedium ?? 15);
        setPointsGlassLarge(selected.pointsGlassLarge ?? 20);
        setGlassUnit(selected.glassUnit || 'per_piece');
      }
    }
  }, [targetMachine, machines]);

  const handleSyncPointsConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/machine/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetMachine,
          pointsPerPlasticBottle: parseInt(pointsPlasticMedium) || 10,
          pointsPlasticSmall: parseInt(pointsPlasticSmall) || 5,
          pointsPlasticMedium: parseInt(pointsPlasticMedium) || 10,
          pointsPlasticLarge: parseInt(pointsPlasticLarge) || 15,
          plasticUnit,

          pointsPerAluminiumCan: parseInt(pointsCanMedium) || 20,
          pointsCanSmall: parseInt(pointsCanSmall) || 10,
          pointsCanMedium: parseInt(pointsCanMedium) || 15,
          pointsCanLarge: parseInt(pointsCanLarge) || 20,
          aluminiumUnit,

          pointsPerPaperKg: parseInt(pointsPaper) || 15,
          paperUnit,

          pointsPerGlass: parseInt(pointsGlassMedium) || 15,
          pointsGlassSmall: parseInt(pointsGlassSmall) || 10,
          pointsGlassMedium: parseInt(pointsGlassMedium) || 15,
          pointsGlassLarge: parseInt(pointsGlassLarge) || 20,
          glassUnit
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(data.message || `Points & unit rules synced for ${targetMachine === 'ALL' ? 'ALL machines' : targetMachine}!`);
        fetchMachines();
        setTimeout(() => setSuccessMessage(''), 6000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Success Banner */}
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
      <div className="glass-panel p-6 rounded-3xl flex items-center justify-between border border-cyan-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">System Database Table</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">RVM Configurations</h2>
          <p className="text-xs t-text-secondary mt-1">
            Configure material point rates, bottle size variants (Small, Medium, Large), and calculation units (per piece, per gram, or per kg) for RVM Kiosks.
          </p>
        </div>

        <button
          onClick={fetchMachines}
          className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Form Card */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-5">
        <div className="flex items-center justify-between border-b t-border pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-extrabold t-text-primary">
              ⚙️ Configure Reward Rates & Kiosk Sync Rules
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            PostgreSQL Relational Sync
          </span>
        </div>

        <form onSubmit={handleSyncPointsConfig} className="space-y-4">

          {/* Target RVM Selection */}
          <div className="max-w-md">
            <label className="block text-xs font-bold text-cyan-400 mb-1 uppercase tracking-wider">
              Target RVM Machine(s)
            </label>
            <select
              value={targetMachine}
              onChange={e => setTargetMachine(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900/90 border border-cyan-500/40 rounded-xl text-sm font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">🌟 ALL MACHINES (Global Bulk Fleet Sync)</option>
              {machines.map(m => (
                <option key={m.machineId} value={m.machineId}>
                  🖥️ {m.machineId} — {m.name || 'RVM Kiosk'} ({m.location || 'Location'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

            {/* 1. Plastic Bottle Rules */}
            <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                  <input
                    type="number"
                    value={pointsPlasticSmall}
                    onChange={e => setPointsPlasticSmall(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                  <input
                    type="number"
                    value={pointsPlasticMedium}
                    onChange={e => setPointsPlasticMedium(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                  <input
                    type="number"
                    value={pointsPlasticLarge}
                    onChange={e => setPointsPlasticLarge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 2. Aluminium Can Rules */}
            <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                  <input
                    type="number"
                    value={pointsCanSmall}
                    onChange={e => setPointsCanSmall(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                  <input
                    type="number"
                    value={pointsCanMedium}
                    onChange={e => setPointsCanMedium(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-amber-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                  <input
                    type="number"
                    value={pointsCanLarge}
                    onChange={e => setPointsCanLarge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-amber-400 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 3. Paper / Cardboard Rules */}
            <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cyan-400 flex items-center gap-1.5">
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

            {/* 4. Glass Bottle Rules */}
            <div className="p-4 bg-slate-900/70 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-purple-400 flex items-center gap-1.5">
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
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Small (pts)</label>
                  <input
                    type="number"
                    value={pointsGlassSmall}
                    onChange={e => setPointsGlassSmall(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-purple-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Medium (pts)</label>
                  <input
                    type="number"
                    value={pointsGlassMedium}
                    onChange={e => setPointsGlassMedium(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-purple-400 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Large (pts)</label>
                  <input
                    type="number"
                    value={pointsGlassLarge}
                    onChange={e => setPointsGlassLarge(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border t-border rounded-xl text-xs font-mono text-purple-400 font-bold"
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-xs font-extrabold bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              <span>{saving ? 'Syncing Rules...' : '🚀 Save & Push Point Rules to Kiosks'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Relational Table View */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border t-border">
        <div className="flex items-center gap-2">
          <Table className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-extrabold t-text-primary uppercase tracking-wide">
            Raw PostgreSQL Relational Table: machine_configs
          </h3>
        </div>
        <DataTable collectionName="machine_configs" displayName="machine_configs Relational Table" />
      </div>

    </div>
  );
}
