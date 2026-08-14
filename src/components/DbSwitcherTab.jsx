import React, { useState, useEffect } from 'react';
import { 
  Server, HardDrive, Lock, ShieldCheck, KeyRound, 
  RotateCcw, ArrowRightLeft, CheckCircle2, AlertTriangle, RefreshCw, MapPin, Database, Zap, RefreshCcw
} from 'lucide-react';

export default function DbSwitcherTab({ onRefreshHealth }) {
  const [username, setUsername] = useState('onenet');
  const [password, setPassword] = useState('Admin&86');
  const [targetPreset, setTargetPreset] = useState('ONS-RVM');
  const [healthInfo, setHealthInfo] = useState(null);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMode, setSyncMode] = useState('upsert'); // 'upsert' | 'replace'
  const [message, setMessage] = useState(null);

  const fetchPresetsAndHealth = async () => {
    try {
      setLoading(true);
      const [hRes, pRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/admin/presets')
      ]);

      if (hRes.ok) {
        const hData = await hRes.json();
        setHealthInfo(hData);
        if (hData.database) {
          setTargetPreset(hData.database);
        }
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        setPresets(pData.presets || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresetsAndHealth();
  }, []);

  const handleSwitchDb = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch('/api/admin/switch-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          targetPreset
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({
          type: 'success',
          text: json.message
        });
        fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        throw new Error(json.error || json.details || 'Failed to switch database connection');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestartServer = async () => {
    try {
      setRestarting(true);
      setMessage(null);

      const res = await fetch('/api/admin/restart-server', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({
          type: 'success',
          text: json.message
        });
        fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        throw new Error(json.error || json.details || 'Failed to restart server connection');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setRestarting(false);
    }
  };

  const handleSyncDatabases = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      const res = await fetch('/api/admin/sync-databases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          syncMode
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setMessage({
          type: 'success',
          text: json.message
        });
        fetchPresetsAndHealth();
        if (onRefreshHealth) onRefreshHealth();
      } else {
        throw new Error(json.error || json.details || 'One-way sync failed');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const activeDb = healthInfo?.database || 'ONS-RVM';
  const activeHost = healthInfo?.serverHost || 'cluster0.ktted0m.mongodb.net';
  const activeLocation = healthInfo?.serverLocation?.display || 'Paris, France (AWS EU_WEST_3)';

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Master Developer Controls</span>
          </div>
          <h2 className="text-2xl font-extrabold t-text-primary">Database Connection & One-Way Sync Manager</h2>
          <p className="text-xs t-text-secondary mt-1">Switch cluster URIs, sync live data from rvmapp to ONS-RVM, or restart API connections.</p>
        </div>

        <button
          onClick={fetchPresetsAndHealth}
          className="p-2.5 t-text-secondary hover:t-text-primary t-bg-sec border t-border rounded-xl self-start md:self-auto"
          title="Refresh Connection Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Active Connection Banner */}
      <div className="p-5 rounded-3xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Currently Connected Cluster</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-glow"></span>
            </div>
            <h3 className="text-xl font-extrabold t-text-primary mono mt-0.5">{activeDb}</h3>
            <p className="text-xs t-text-muted mono">{activeHost} • {activeLocation}</p>
          </div>
        </div>
      </div>

      {/* Alert Message Banner */}
      {message && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
        }`}>
          <div className="flex items-center gap-2 font-bold">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="t-text-muted hover:t-text-primary font-bold">Dismiss</button>
        </div>
      )}

      {/* Master Developer Credentials Authentication */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-cyan-500/20">
        <div className="flex items-center gap-2 border-b t-border pb-3">
          <Lock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold t-text-primary">Master Developer Credentials Authentication</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider t-text-muted block mb-1">Master Username</label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="onenet"
                className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-cyan-500 focus:outline-none"
              />
              <KeyRound className="w-4 h-4 text-cyan-400 absolute right-3 top-3" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider t-text-muted block mb-1">Master Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin&86"
                className="w-full t-bg-sec border t-border rounded-xl px-3.5 py-2.5 t-text-primary font-mono focus:border-cyan-500 focus:outline-none"
              />
              <ShieldCheck className="w-4 h-4 text-cyan-400 absolute right-3 top-3" />
            </div>
          </div>
        </div>
      </div>

      {/* One-Way Database Sync Card (rvmapp -> ONS-RVM) */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 border border-purple-500/30">
        <div className="flex items-center justify-between border-b t-border pb-3">
          <div className="flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold t-text-primary">One-Way Database Sync (rvmapp ➔ ONS-RVM)</h3>
              <p className="text-xs t-text-secondary mt-0.5">Copy live production documents from rvmapp directly into target database ONS-RVM.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            ONE-WAY SYNC
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 t-bg-sec rounded-2xl border t-border text-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase t-text-muted block">Source Database (Read-Only)</span>
            <div className="flex items-center gap-2 font-mono font-bold text-amber-400 text-sm">
              <Database className="w-4 h-4" />
              rvmapp (cluster0.fuycg6c.mongodb.net)
            </div>
            <p className="text-[10px] t-text-muted">Production database. Unmodified during sync.</p>
          </div>

          <div className="space-y-1 border-t md:border-t-0 md:border-l t-border pt-3 md:pt-0 md:pl-4">
            <span className="text-[10px] font-bold uppercase t-text-muted block">Target Database (Destination)</span>
            <div className="flex items-center gap-2 font-mono font-bold text-emerald-400 text-sm">
              <Database className="w-4 h-4" />
              ONS-RVM (cluster0.ktted0m.mongodb.net)
            </div>
            <p className="text-[10px] t-text-muted">Master database. Receives synced documents.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-4 text-xs font-bold">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="syncMode"
                value="upsert"
                checked={syncMode === 'upsert'}
                onChange={() => setSyncMode('upsert')}
                className="text-purple-500 focus:ring-purple-500"
              />
              <span className="t-text-primary">Upsert / Merge Mode (Safe - Preserve existing ONS-RVM data)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="syncMode"
                value="replace"
                checked={syncMode === 'replace'}
                onChange={() => setSyncMode('replace')}
                className="text-purple-500 focus:ring-purple-500"
              />
              <span className="t-text-secondary">Full Mirror Replace Mode</span>
            </label>
          </div>

          <button
            onClick={handleSyncDatabases}
            disabled={syncing}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <RefreshCcw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing rvmapp ➔ ONS-RVM...' : 'Execute One-Way Sync (rvmapp ➔ ONS-RVM)'}
          </button>
        </div>
      </div>

      {/* Preset Switcher Selection Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold t-text-primary">Configured Database Cluster Presets</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {presets.map((p) => {
            const isCurrent = p.dbName === activeDb;
            const isSelected = p.id === targetPreset;

            return (
              <div
                key={p.id}
                onClick={() => setTargetPreset(p.id)}
                className={`p-5 rounded-3xl border cursor-pointer transition-all space-y-3 relative ${
                  isSelected
                    ? 'border-emerald-500 t-bg-sec shadow-lg shadow-emerald-950/30'
                    : 't-border t-bg-surface hover:t-bg-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm t-text-primary">{p.label}</span>
                  {isCurrent ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active Connected
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase t-bg-sec t-text-muted border t-border">
                      Standby
                    </span>
                  )}
                </div>

                <p className="text-xs t-text-secondary">{p.description}</p>

                <div className="space-y-1 text-xs mono">
                  <div className="text-cyan-400 font-semibold">{p.host}</div>
                  <div className="t-text-muted text-[11px]">Database: <span className="text-emerald-400 font-bold">{p.dbName}</span></div>
                </div>

                <div className="pt-2 border-t t-border flex items-center justify-between">
                  <span className="text-[11px] t-text-muted font-bold">Select Preset</span>
                  <input
                    type="radio"
                    name="presetSelect"
                    checked={isSelected}
                    onChange={() => setTargetPreset(p.id)}
                    className="text-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t t-border">
        <button
          onClick={handleRestartServer}
          disabled={restarting}
          className="w-full sm:w-auto px-4 py-2.5 t-bg-sec hover:t-bg-hover text-cyan-400 font-bold text-xs rounded-xl border t-border flex items-center justify-center gap-2 transition-all"
        >
          <RotateCcw className={`w-4 h-4 ${restarting ? 'animate-spin' : ''}`} />
          {restarting ? 'Re-initializing Server...' : 'Restart API Server Connection'}
        </button>

        <button
          onClick={handleSwitchDb}
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          <ArrowRightLeft className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
          {submitting ? 'Connecting to Cluster...' : `Switch to "${targetPreset}" & Reconnect Server`}
        </button>
      </div>

    </div>
  );
}
